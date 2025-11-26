from django.shortcuts import render, redirect
from django.contrib.auth.hashers import make_password, check_password
from django.contrib import messages
from .forms import EmployeeSignupForm, EmployeeLoginForm, PasswordResetForm, SetPasswordForm
from .models import Employee, Notification, SavedJob, EmployeeFeedback, EmployerFeedback
from employer.models import Job, Employer, JobApplication
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.utils import timezone
from .tokens import password_reset_token
from django.http import JsonResponse
from django.db.models import Q
from django.views.decorators.http import require_http_methods
import json
import threading
from django.core.files.storage import default_storage
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
import os
import uuid
from django.views.decorators.http import require_POST
from .resume_analyzer import ResumeAnalyzer
import logging
import re
from django.db import models

# Messaging System Views
from .models import Conversation, Message

def employee_signup(request):
    if request.method == "POST":
        form = EmployeeSignupForm(request.POST, request.FILES)
        if form.is_valid():
            # Check if username already exists
            if Employee.objects.filter(username=form.cleaned_data["username"]).exists():
                messages.error(request, "Username already exists. Please choose another one.")
                return render(request, 'employee/employee_signup.html', {'form': form})
            
            # Check if email already exists
            if Employee.objects.filter(email=form.cleaned_data["email"]).exists():
                messages.error(request, "Email already registered. Please use another email.")
                return render(request, 'employee/employee_signup.html', {'form': form})

            employee = form.save(commit=False)
            employee.password = make_password(form.cleaned_data["password"])
            employee.is_approved = False  # Set initial approval status to False
            if form.cleaned_data['document']:
                employee.document = form.cleaned_data['document']
                employee.document_name = form.cleaned_data['document_name']
            employee.save()
            messages.success(request, "Account created successfully! Please wait for admin approval before logging in.")
            return redirect('employee_login')
    else:
        form = EmployeeSignupForm()
    return render(request, 'employee/employee_signup.html', {'form': form})

def employee_login(request):
    if request.method == "POST":
        form = EmployeeLoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data["username"]
            password = form.cleaned_data["password"]
            user = Employee.objects.filter(username=username).first()
            
            if not user:
                # Remove toast prefix
                messages.error(request, "Username not found. Please check your username or sign up.")
                return render(request, 'employee/employee_login.html', {'form': form})
            
            if not user.is_active:
                # Remove toast prefix
                messages.error(request, "Your account has been deactivated. Please contact support.")
                return render(request, 'employee/employee_login.html', {'form': form})
            
            # Check approval status
            if not user.is_approved:
                # Remove toast prefix
                messages.error(request, "Your account is pending approval. Please wait for admin approval.")
                return render(request, 'employee/employee_login.html', {'form': form})
            
            if check_password(password, user.password):
                request.session['employee_id'] = user.id
                request.session['employee_username'] = username
                request.session['employee_email'] = user.email
                # Check if the user is coming from logout
                if request.session.get('from_logout'):
                    # Clear the flag
                    request.session.pop('from_logout', None)
                    # Don't show welcome back message
                    return redirect('employee_home')
                else:
                    return redirect('employee_home')
            else:
                # Remove toast prefix
                messages.error(request, "Incorrect password. Please try again.")
                return render(request, 'employee/employee_login.html', {'form': form})
    else:
        form = EmployeeLoginForm()
    return render(request, 'employee/employee_login.html', {'form': form})

def employee_login_required(view_func):
    def wrapper(request, *args, **kwargs):
        if not request.session.get('employee_username'):
            messages.error(request, "Please login to access this page.")
            return redirect('employee_login')
        return view_func(request, *args, **kwargs)
    return wrapper

# Replace @login_required with our custom decorator
@employee_login_required
def employee_home(request):
    employee_username = request.session.get('employee_username')
    
    # Get the employee object
    employee = Employee.objects.filter(username=employee_username).first()
    if not employee:
        messages.error(request, "User not found.")
        return redirect('employee_login')
    
    # Get active jobs from employers
    jobs = Job.objects.filter(status='active').select_related('employer').order_by('-created_at')

    # Serialize jobs for JavaScript
    jobs_list = []
    for job in jobs:
        jobs_list.append({
            'id': job.id,
            'title': job.title,
            'company': job.employer.company_name if job.employer else '',
            'location': job.location,
            'job_type': job.job_type,
            'work_setup': job.work_setup,
            'salary_range': job.salary_range,
            'experience_level': job.experience_level,
            'posted_date': job.created_at.strftime('%Y-%m-%d'),
            'lat': job.latitude if hasattr(job, 'latitude') and job.latitude is not None else None,
            'lng': job.longitude if hasattr(job, 'longitude') and job.longitude is not None else None,
        })
    jobs_json = json.dumps(jobs_list)
    
    # Count unread notifications for the employee
    notification_count = Notification.objects.filter(employee=employee, is_read=False).count()
    
    context = {
        'employee': employee,
        'username': employee_username,
        'jobs': jobs,
        'jobs_json': jobs_json,
        'notification_count': notification_count,
    }
    return render(request, 'employee/employee_home.html', context)

# Other views remain the same...

def employee_logout(request):
    try:
        # Get the username before clearing the session
        username = request.session.get('employee_username', 'User')
        
        # Clear specific session data
        request.session.pop('employee_username', None)
        request.session.pop('employee_id', None)
        
        # Set a flag to indicate coming from logout
        request.session['from_logout'] = True
        
        # Remove toast prefix
        messages.success(request, f"Employee {username} has been successfully logged out.")
        return redirect('employee_login')
    except Exception as e:
        # Remove toast prefix
        messages.error(request, "An error occurred during logout.")
        return redirect('employee_login')

# Helper function to send email asynchronously to prevent blocking
def send_email_async(subject, message, from_email, recipient_list, html_message=None):
    """Send email in a separate thread to prevent blocking the request"""
    def send():
        try:
            send_mail(
                subject,
                message,
                from_email,
                recipient_list,
                html_message=html_message,
                fail_silently=True,  # Don't crash if email fails
            )
        except Exception as e:
            print(f"Email sending error: {str(e)}")
    
    thread = threading.Thread(target=send)
    thread.daemon = True
    thread.start()
        
# Add these new views
def password_reset(request):
    if request.method == "POST":
        form = PasswordResetForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data["email"]
            employee = Employee.objects.filter(email=email).first()
            
            if employee:
                # Update last_login
                employee.last_login = timezone.now()
                employee.save()
                
                # Generate token using our custom token generator
                token = password_reset_token.make_token(employee)
                uid = urlsafe_base64_encode(force_bytes(employee.pk))
                
                # Build reset URL
                reset_url = request.build_absolute_uri(
                    f'/employee/reset/{uid}/{token}/'
                )
                
                # Prepare email
                context = {
                    'user': employee,
                    'reset_url': reset_url,
                }
                email_html = render_to_string('employee/email/password_reset_email.html', context)
                email_text = render_to_string('employee/email/password_reset_email.txt', context)
                
                # Send email asynchronously to prevent blocking/timeout
                send_email_async(
                    'Reset your GEOCONNECT password',
                    email_text,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    html_message=email_html
                )
                messages.success(request, "Password reset instructions have been sent to your email.")
                return redirect('employee_login')
            else:
                # Use a vague message for security
                messages.info(request, "If an account exists with this email address, you will receive password reset instructions.")
                return redirect('employee_login')
    else:
        form = PasswordResetForm()
    
    return render(request, 'employee/password_reset.html', {'form': form})

def password_reset_confirm(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        employee = Employee.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, Employee.DoesNotExist):
        employee = None
    
    if employee is not None and password_reset_token.check_token(employee, token):
        validlink = True
        if request.method == "POST":
            form = SetPasswordForm(request.POST)
            if form.is_valid():
                new_password = form.cleaned_data["new_password1"]
                employee.password = make_password(new_password)
                employee.last_login = timezone.now()
                employee.save()
                messages.success(request, "Your password has been successfully reset. Please login with your new password.")
                return redirect('employee_login')
        else:
            form = SetPasswordForm()
    else:
        validlink = False
        form = None
    
    return render(request, 'employee/password_reset_confirm.html', {
        'form': form,
        'validlink': validlink,
    })

# Add a new view for job filtering
def filter_jobs(request):
    search_query = request.GET.get('search', '')
    category = request.GET.get('category', '')
    location = request.GET.get('location', '')
    show_all = request.GET.get('show_all', 'false') == 'true'

    # Get active jobs only
    jobs = Job.objects.filter(status='active').select_related('employer').order_by('-created_at')

    if search_query:
        jobs = jobs.filter(
            Q(title__icontains=search_query) |
            Q(description__icontains=search_query)
        )

    if category:
        jobs = jobs.filter(job_type=category)

    if location:
        jobs = jobs.filter(work_setup=location)

    # Get total count before slicing
    total_count = jobs.count()

    # If not showing all, limit to 6 jobs
    if not show_all:
        jobs = jobs[:6]

    jobs_data = [{
        'id': job.id,
        'title': job.title,
        'company': job.employer.company_name,
        'company_description': job.employer.company_description,
        'company_location': job.employer.company_location,
        'location': job.location,
        'job_type': job.job_type,
        'work_setup': job.work_setup,
        'salary_range': job.salary_range,
        'experience_level': job.experience_level,
        'description': job.description,
        'created_at': job.created_at.strftime('%B %d, %Y')
    } for job in jobs]

    return JsonResponse({
        'jobs': jobs_data,
        'total_count': total_count
    })

@employee_login_required
def get_applied_jobs(request):
    """Return a list of job IDs that the current user has applied for"""
    try:
        employee = Employee.objects.get(username=request.session.get('employee_username'))
        applied_job_ids = JobApplication.objects.filter(employee=employee).values_list('job_id', flat=True)
        return JsonResponse({'success': True, 'applied_jobs': list(applied_job_ids)})
    except Exception as e:
        print(f"Error fetching applied jobs: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)})

@employee_login_required
@require_http_methods(["GET"])
def get_profile(request):
    try:
        employee = Employee.objects.get(username=request.session.get('employee_username'))
        profile_data = {
            'full_name': employee.full_name,
            'bio': employee.bio,
            'skills': employee.skills,
            'experience': employee.experience,
            'education': employee.education,
            'phone': employee.phone,
        }
        return JsonResponse({'success': True, 'profile': profile_data})
    except Employee.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Employee not found'}, status=404)

@employee_login_required
@require_http_methods(["POST"])
def update_profile(request):
    try:
        employee = Employee.objects.get(username=request.session.get('employee_username'))
        
        # Update basic information
        employee.full_name = request.POST.get('full_name', employee.full_name)
        employee.phone = request.POST.get('phone', employee.phone)
        employee.location = request.POST.get('location', employee.location)
        employee.bio = request.POST.get('bio', employee.bio)
        employee.work_experience = request.POST.get('work_experience', employee.work_experience)
        
        # Handle avatar upload
        if 'avatar' in request.FILES:
            # Delete old avatar if it exists
            if employee.avatar:
                try:
                    default_storage.delete(employee.avatar.path)
                except:
                    pass  # If deletion fails, continue anyway
            
            # Save new avatar
            employee.avatar = request.FILES['avatar']
        
        # Handle resume upload
        if 'resume' in request.FILES:
            # Delete old resume if it exists
            if hasattr(employee, 'resume') and employee.resume:
                try:
                    default_storage.delete(employee.resume.path)
                except:
                    pass  # If deletion fails, continue anyway
            
            # Save new resume
            employee.resume = request.FILES['resume']
        
        employee.save()
        
        response_data = {
            'success': True,
            'message': 'Profile updated successfully'
        }
        
        # Include avatar URL if it was updated
        if 'avatar' in request.FILES:
            response_data['avatar_url'] = employee.avatar.url
            
        # Include resume URL if it was updated
        if 'resume' in request.FILES and hasattr(employee, 'resume') and employee.resume:
            response_data['resume_url'] = employee.resume.url
        
        return JsonResponse(response_data)
    
    except Employee.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Employee not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


# New view for job application submission
@require_http_methods(["POST"])
@csrf_exempt # Add csrf_exempt decorator
def apply_job(request):
    # Check if user is logged in
    if not request.session.get('employee_username'):
        return JsonResponse({
            'success': False,
            'error': 'You must be logged in to apply for jobs'
        }, status=401)
        
    try:
        # Get the employee
        employee = get_object_or_404(Employee, username=request.session.get('employee_username'))
        
        # Get the job
        job_id = request.POST.get('job_id')
        job = get_object_or_404(Job, id=job_id)
        
        # Check if the employee has already applied for this job
        existing_application = JobApplication.objects.filter(job=job, employee=employee).exists()
        if existing_application:
            return JsonResponse({
                'success': False,
                'error': 'You have already applied for this job'
            })
        
        # Handle resume upload
        resume = request.FILES.get('resume')
        if not resume:
            return JsonResponse({
                'success': False,
                'error': 'Resume is required'
            })
        
        # Generate a unique filename for the resume
        filename, ext = os.path.splitext(resume.name)
        unique_filename = f"{filename}_{uuid.uuid4().hex}{ext}"
        resume.name = unique_filename

        # Create the job application
        application = JobApplication(
            job=job,
            employee=employee,
            status='pending',
            cover_letter=request.POST.get('cover_letter', ''),
            resume=resume
        )
        application.save()
        
        # Update job application count
        job.applications_count = JobApplication.objects.filter(job=job).count()
        job.save()
        
        # Send notification email to employer (optional)
        try:
            employer_email = job.employer.email
            if employer_email:
                subject = f'New Job Application: {job.title}'
                message = f'A new application has been submitted for your job posting "{job.title}" by {employee.full_name}.'
                html_message = f'''
                <h3>New Job Application</h3>
                <p>A new application has been submitted for your job posting "<strong>{job.title}</strong>".</p>
                <p><strong>Applicant:</strong> {employee.full_name}</p>
                <p><strong>Application Date:</strong> {timezone.now().strftime('%B %d, %Y')}</p>
                <p>You can view this application in your employer dashboard.</p>
                '''
                
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [employer_email],
                    html_message=html_message,
                    fail_silently=True
                )
        except Exception as e:
            # Log the error but don't fail the application
            print(f"Error sending notification email: {str(e)}")
        
        return JsonResponse({
            'success': True,
            'message': 'Your application has been submitted successfully',
            'application_id': application.id
        })
        
    except Employee.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Employee not found'
        }, status=404)
    except Job.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Job not found'
        }, status=404)
    except Exception as e:
        print(f"Error in apply_job: {str(e)}")  # Add detailed logging
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)

# Add a new view function to handle the resume removal

@employee_login_required
@require_http_methods(["POST"])
def remove_resume(request):
    """Remove the resume file for the logged-in employee."""
    try:
        employee = Employee.objects.get(username=request.session.get('employee_username'))
        
        # Check if employee has a resume
        if employee.resume:
            # Delete the file from storage
            try:
                employee.resume.delete(save=False)
            except Exception as e:
                print(f"Error deleting resume file: {str(e)}")
            
            # Update the employee record
            employee.resume = None
            employee.save()
            
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': 'No resume found'})
    except Employee.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Employee not found'})
    except Exception as e:
        print(f"Error in remove_resume: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)})

@employee_login_required
def resume_analyzer(request):
    """
    View for the resume analyzer page.
    """
    employee_username = request.session.get('employee_username')
    
    # Get the employee object
    employee = Employee.objects.filter(username=employee_username).first()
    if not employee:
        messages.error(request, "User not found.")
        return redirect('employee_login')
    
    context = {
        'employee': employee,
        'username': employee_username,
    }
    return render(request, 'employee/resume-analyzer.html', context)

# Add this new view function after the existing resume_analyzer view
@employee_login_required
def resume_analyzer_view(request):
    """View for the resume analyzer page"""
    return render(request, 'employee/resume-analyzer.html')

@employee_login_required
def analyze_resume(request):
    """API endpoint to analyze a resume"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests are allowed'}, status=405)
    
    if 'resume' not in request.FILES:
        return JsonResponse({'error': 'No file was uploaded'}, status=400)
    
    resume_file = request.FILES['resume']
    
    # Check file size (limit to 5MB)
    if resume_file.size > 5 * 1024 * 1024:
        return JsonResponse({'error': 'File size exceeds 5MB limit'}, status=400)
    
    # Check file extension
    allowed_extensions = ['.pdf', '.docx', '.txt']
    file_extension = os.path.splitext(resume_file.name)[1].lower()
    
    if file_extension not in allowed_extensions:
        return JsonResponse({
            'error': f'Invalid file format. Allowed formats: {", ".join(allowed_extensions)}'
        }, status=400)
    
    try:
        # Initialize the resume analyzer
        analyzer = ResumeAnalyzer()
        
        # Get job listings for matching (if available)
        from employer.models import JobListing
        job_listings = JobListing.objects.filter(is_active=True)
        
        # Analyze the resume
        analysis_results = analyzer.analyze(resume_file, job_listings)
        
        # Format job matches for JSON response
        if 'job_matches' in analysis_results:
            job_matches = []
            for job, score in analysis_results['job_matches']:
                job_matches.append({
                    'job': {
                        'id': job.id,
                        'title': job.title,
                        'description': job.description[:200] + '...' if len(job.description) > 200 else job.description,
                        'company': job.company.name if hasattr(job, 'company') and job.company else 'Unknown'
                    },
                    'score': float(score)
                })
            analysis_results['job_matches'] = job_matches
        
        return JsonResponse(analysis_results)
    
    except Exception as e:
        logging.error(f"Error analyzing resume: {str(e)}")
        return JsonResponse({'error': 'An error occurred while analyzing the resume'}, status=500)

@require_http_methods(["POST"])
def analyze_resume(request):
    """
    Process the uploaded resume and return analysis results.
    """
    if 'resume' not in request.FILES:
        return JsonResponse({
            'success': False,
            'error': 'No resume file provided'
        })
    
    resume_file = request.FILES['resume']
    
    try:
        # Initialize the resume analyzer
        from .resume_analyzer import ResumeAnalyzer
        analyzer = ResumeAnalyzer()
        
        # Load job listings from CSV
        job_listings = analyzer.load_jobs_from_csv()
        print(f"Loaded {len(job_listings)} job listings")
        
        # Analyze the resume with the CSV job listings
        result = analyzer.analyze(resume_file, job_listings)
        
        # Debug output
        print(f"Extracted {len(result.get('skills', []))} skills")
        print(f"Found {len(result.get('job_matches', []))} job matches")
        
        # Format the result for JSON response
        response_data = {
            'success': True,
            'skills': result.get('skills', []),
            'categorized_skills': result.get('categorized_skills', {}),
            'education': result.get('education', []),
            'experience': result.get('experience', []),
            'job_matches': []
        }
        
        # Format job matches with realistic percentages
        if 'job_matches' in result and result['job_matches']:
            for job, score in result['job_matches']:
                # Convert score to percentage and round to nearest integer
                percentage = round(score * 100)
                
                response_data['job_matches'].append({
                    'job': {
                        'id': job['id'],
                        'title': job['title'],
                        'information': job['information']
                    },
                    'score': percentage  # Already as percentage (0-100)
                })
        else:
            print("No job matches found or job_matches key missing")
        
        return JsonResponse(response_data)
    
    except Exception as e:
        import traceback
        print(f"Error analyzing resume: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': f'An error occurred while analyzing the resume: {str(e)}'
        })

# Add this new view function at the end of the file, after all existing functions

@require_http_methods(["POST"])
def send_contact_message(request):
    """Send contact message from employee to admin"""
    if request.method == "POST":
        try:
            # Get form data
            name = request.POST.get('name', '')
            email = request.POST.get('email', '')
            subject = request.POST.get('subject', '')
            message = request.POST.get('message', '')
            
            # Validate required fields
            if not all([name, email, subject, message]):
                return JsonResponse({
                    'success': False,
                    'error': 'All fields are required'
                })
            
            # Prepare email content
            from_email = settings.DEFAULT_FROM_EMAIL
            recipient = settings.EMAIL_HOST_USER  # Send to the host email from settings.py
            email_subject = f"Contact Form: {subject}"
            
            email_message = f"""
            Contact Form Submission from GeoConnect
            
            Name: {name}
            Email: {email}
            Subject: {subject}
            
            Message:
            {message}
            
            This message was sent from the GeoConnect contact form.
            """
            
            # Send email
            send_mail(
                email_subject,
                email_message,
                from_email,
                [recipient],
                fail_silently=True,  # Don't crash if email fails
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Your message has been sent successfully!'
            })
            
        except Exception as e:
            print(f"Error sending contact email: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            })
    
    return JsonResponse({
        'success': False,
        'error': 'Invalid request method'
    })

# Add new view for application status page
@employee_login_required
def application_status(request):
    """
    View for the application status page where employees can track their job applications.
    Only shows hired and rejected applications.
    """
    employee_username = request.session.get('employee_username')
    
    # Get the employee object
    employee = Employee.objects.filter(username=employee_username).first()
    if not employee:
        messages.error(request, "User not found.")
        return redirect('employee_login')
    
    # Get only hired and rejected applications for this employee
    applications = JobApplication.objects.filter(
        employee=employee,
        status__in=['hired', 'rejected','pending']
    ).select_related('job', 'job__employer').order_by('-application_date')

    # Count applications by status (only hired and rejected)
    total_applications = applications.count()
    hired_applications = applications.filter(status='hired').count()
    rejected_applications = applications.filter(status='rejected').count()

    context = {
        'employee': employee,
        'username': employee_username,
        'applications': applications,
        'total_applications': total_applications,
        'hired_applications': hired_applications,
        'rejected_applications': rejected_applications,
    }
    return render(request, 'employee/application_status.html', context)

# Add this to your existing employee/views.py file

@employee_login_required
def job_preferences(request):
    """
    View for handling job preferences form for employees
    """
    employee_username = request.session.get('employee_username')
    
    # Get the employee object
    employee = Employee.objects.filter(username=employee_username).first()
    if not employee:
        messages.error(request, "User not found.")
        return redirect('employee_login')
    
    # Get current employee's job preferences if they exist
    try:
        current_employee = Employee.objects.get(username=employee_username)
        from .models import JobPreferences
        preferences = JobPreferences.objects.get(employee=current_employee)
    except (Employee.DoesNotExist, JobPreferences.DoesNotExist):
        preferences = None
    
    if request.method == 'POST':
        # Process form submission
        industry = request.POST.get('industry')
        job_type = request.POST.get('job_type')
        work_arrangement = request.POST.get('work_arrangement')
        skills = request.POST.getlist('skills[]')
        experience = request.POST.get('experience')
        current_role_years = request.POST.get('current_role_years')
        education_level = request.POST.get('education_level')
        certifications = request.POST.getlist('certifications[]')
        languages = request.POST.getlist('languages[]')
        salary_min = request.POST.get('salary_min')
        salary_max = request.POST.get('salary_max')
        availability = request.POST.get('availability')
        
        # Get the current logged-in employee
        try:
            current_employee = Employee.objects.get(username=employee_username)
        except Employee.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Employee not found'})
        
        # Save to database (create or update)
        if preferences:
            # Update existing preferences
            preferences.industry = industry
            preferences.job_type = job_type
            preferences.work_arrangement = work_arrangement
            preferences.skills = json.dumps(skills) if skills else '[]'
            preferences.experience = experience
            preferences.current_role_years = current_role_years
            preferences.education_level = education_level
            preferences.certifications = json.dumps(certifications) if certifications else '[]'
            preferences.languages = json.dumps(languages) if languages else '[]'
            preferences.salary_min = salary_min
            preferences.salary_max = salary_max
            preferences.availability = availability
            preferences.save()
        else:
            # Create new preferences - Make sure to link to the actual employee object
            from .models import JobPreferences
            preferences = JobPreferences.objects.create(
                employee=current_employee,  # Use the actual employee object, not just the ID
                industry=industry,
                job_type=job_type,
                work_arrangement=work_arrangement,
                skills=json.dumps(skills) if skills else '[]',
                experience=experience,
                current_role_years=current_role_years,
                education_level=education_level,
                certifications=json.dumps(certifications) if certifications else '[]',
                languages=json.dumps(languages) if languages else '[]',
                salary_min=salary_min,
                salary_max=salary_max,
                availability=availability
            )
        
        return JsonResponse({'status': 'success', 'message': 'Your job preferences have been saved successfully!'})
    
    # For GET requests, render the form
    context = {
        'employee': employee,
        'username': employee_username,
        'preferences': preferences
    }
    return render(request, 'employee/job_preferences.html', context)

# Add this new view to get job preferences
@employee_login_required
def get_job_preferences(request):
    """API endpoint to get the current employee's job preferences"""
    try:
        employee_username = request.session.get('employee_username')
        employee = Employee.objects.get(username=employee_username)
        
        try:
            from .models import JobPreferences
            preferences = JobPreferences.objects.get(employee=employee)
            
            # Parse JSON fields safely
            try:
                skills = json.loads(preferences.skills) if preferences.skills else []
            except (json.JSONDecodeError, TypeError):
                skills = []
                
            try:
                certifications = json.loads(preferences.certifications) if preferences.certifications else []
            except (json.JSONDecodeError, TypeError):
                certifications = []
                
            try:
                languages = json.loads(preferences.languages) if preferences.languages else []
            except (json.JSONDecodeError, TypeError):
                languages = []
            
            preferences_data = {
                'industry': preferences.industry,
                'job_type': preferences.job_type,
                'work_arrangement': preferences.work_arrangement,
                'skills': skills,
                'experience': preferences.experience,
                'current_role_years': preferences.current_role_years,
                'education_level': preferences.education_level,
                'certifications': certifications,
                'languages': languages,
                'salary_min': preferences.salary_min,
                'salary_max': preferences.salary_max,
                'availability': preferences.availability
            }
            
            return JsonResponse({
                'success': True,
                'preferences': preferences_data
            })
            
        except JobPreferences.DoesNotExist:
            return JsonResponse({
                'success': True,
                'preferences': None
            })
            
    except Employee.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Employee not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@employee_login_required
def job_mapping(request):
    employee_username = request.session.get('employee_username')
    
    # Get the employee object
    employee = Employee.objects.filter(username=employee_username).first()
    if not employee:
        messages.error(request, "User not found.")
        return redirect('employee_login')
    
    # Get active jobs from employers
    jobs = Job.objects.filter(status='active').select_related('employer').order_by('-created_at')
    
    context = {
        'employee': employee,
        'username': employee_username,
        'jobs': jobs,
    }
    return render(request, 'employee/job_mapping.html', context)

@employee_login_required
def resume_builder(request):
    employee_username = request.session.get('employee_username')
    employee = Employee.objects.filter(username=employee_username).first()
    
    if not employee:
        messages.error(request, "User not found.")
        return redirect('employee_login')
    
    context = {
        'employee': employee,
        'username': employee_username,
    }
    return render(request, 'employee/resume_builder.html', context)

@employee_login_required
@require_http_methods(["POST"])
def generate_resume_pdf(request):
    try:
        print("PDF generation request received")
        print("Request method:", request.method)
        print("Request headers:", dict(request.headers))
        
        data = json.loads(request.body)
        print("Received data:", data)
        
        # Extract resume data
        personal_info = data.get('personal_info', {})
        experience = data.get('experience', [])
        education = data.get('education', [])
        skills = data.get('skills', [])
        projects = data.get('projects', [])
        certifications = data.get('certifications', [])
        
        print("Personal info:", personal_info)
        
        try:
            # Generate PDF using reportlab
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.lib import colors
            from io import BytesIO
            import os
            
            print("ReportLab imports successful")
            
            # Create PDF buffer with smaller margins for more content
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, 
                                  leftMargin=0.5*inch, rightMargin=0.5*inch,
                                  topMargin=0.5*inch, bottomMargin=0.5*inch)
            story = []
            
            # Get styles - more compact for single page
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=20,
                spaceAfter=8,
                textColor=colors.HexColor('#1a237e'),
                alignment=1  # Center alignment
            )
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=12,
                spaceAfter=6,
                spaceBefore=8,
                textColor=colors.HexColor('#3949ab'),
                fontName='Helvetica-Bold'
            )
            normal_style = ParagraphStyle(
                'CustomNormal',
                parent=styles['Normal'],
                fontSize=9,
                spaceAfter=3,
                leading=11
            )
            contact_style = ParagraphStyle(
                'ContactStyle',
                parent=styles['Normal'],
                fontSize=9,
                spaceAfter=8,
                alignment=1,  # Center alignment
                textColor=colors.HexColor('#666666')
            )
            item_title_style = ParagraphStyle(
                'ItemTitle',
                parent=styles['Normal'],
                fontSize=10,
                fontName='Helvetica-Bold',
                spaceAfter=2
            )
            item_subtitle_style = ParagraphStyle(
                'ItemSubtitle',
                parent=styles['Normal'],
                fontSize=9,
                fontName='Helvetica-Oblique',
                textColor=colors.HexColor('#666666'),
                spaceAfter=3
            )
            item_description_style = ParagraphStyle(
                'ItemDescription',
                parent=styles['Normal'],
                fontSize=8,
                spaceAfter=6,
                leading=10
            )
            
            # Add title
            story.append(Paragraph(f"{personal_info.get('full_name', 'Resume')}", title_style))
            
            # Add contact info in a compact format
            contact_info = []
            if personal_info.get('email'):
                contact_info.append(personal_info['email'])
            if personal_info.get('phone'):
                contact_info.append(personal_info['phone'])
            if personal_info.get('location'):
                contact_info.append(personal_info['location'])
            if personal_info.get('linkedin'):
                contact_info.append(personal_info['linkedin'])
            
            if contact_info:
                story.append(Paragraph(" • ".join(contact_info), contact_style))
            
            story.append(Spacer(1, 8))
            
            # Add summary (shorter version)
            if personal_info.get('summary'):
                story.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
                # Truncate summary if too long
                summary = personal_info['summary']
                if len(summary) > 200:
                    summary = summary[:200] + "..."
                story.append(Paragraph(summary, normal_style))
            
            # Add experience (limit to 2-3 most recent)
            if experience:
                story.append(Paragraph("PROFESSIONAL EXPERIENCE", heading_style))
                for i, exp in enumerate(experience[:3]):  # Limit to 3 experiences
                    exp_text = f"<b>{exp.get('title', '')}</b>"
                    story.append(Paragraph(exp_text, item_title_style))
                    
                    subtitle = f"{exp.get('company', '')}"
                    if exp.get('duration'):
                        subtitle += f" | {exp.get('duration', '')}"
                    story.append(Paragraph(subtitle, item_subtitle_style))
                    
                    # Truncate description if too long
                    description = exp.get('description', '')
                    if len(description) > 150:
                        description = description[:150] + "..."
                    if description:
                        story.append(Paragraph(description, item_description_style))
            
            # Add education (limit to 2 most recent)
            if education:
                story.append(Paragraph("EDUCATION", heading_style))
                for i, edu in enumerate(education[:2]):  # Limit to 2 education entries
                    edu_text = f"<b>{edu.get('degree', '')}</b>"
                    story.append(Paragraph(edu_text, item_title_style))
                    
                    subtitle = f"{edu.get('institution', '')}"
                    if edu.get('year'):
                        subtitle += f" | {edu.get('year', '')}"
                    story.append(Paragraph(subtitle, item_subtitle_style))
                    
                    if edu.get('gpa'):
                        story.append(Paragraph(f"GPA: {edu['gpa']}", item_description_style))
            
            # Add skills (compact format)
            if skills:
                story.append(Paragraph("SKILLS", heading_style))
                skills_text = " • ".join([skill.get('name', '') for skill in skills[:10]])  # Limit to 10 skills
                story.append(Paragraph(skills_text, normal_style))
            
            # Add projects (limit to 2 most important)
            if projects:
                story.append(Paragraph("PROJECTS", heading_style))
                for i, project in enumerate(projects[:2]):  # Limit to 2 projects
                    proj_text = f"<b>{project.get('title', '')}</b>"
                    story.append(Paragraph(proj_text, item_title_style))
                    
                    if project.get('technologies'):
                        story.append(Paragraph(project['technologies'], item_subtitle_style))
                    
                    # Truncate description if too long
                    description = project.get('description', '')
                    if len(description) > 120:
                        description = description[:120] + "..."
                    if description:
                        story.append(Paragraph(description, item_description_style))
            
            # Add certifications (limit to 3 most recent)
            if certifications:
                story.append(Paragraph("CERTIFICATIONS", heading_style))
                for i, cert in enumerate(certifications[:3]):  # Limit to 3 certifications
                    cert_text = f"<b>{cert.get('name', '')}</b>"
                    story.append(Paragraph(cert_text, item_title_style))
                    
                    subtitle = f"{cert.get('issuer', '')}"
                    if cert.get('year'):
                        subtitle += f" | {cert.get('year', '')}"
                    story.append(Paragraph(subtitle, item_subtitle_style))
            
            print("Building PDF...")
            # Build PDF
            doc.build(story)
            buffer.seek(0)
            
            print("PDF built successfully, size:", len(buffer.getvalue()))
            
            # Return PDF as response
            from django.http import HttpResponse
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{personal_info.get("full_name", "resume")}_resume.pdf"'
            return response
            
        except ImportError as e:
            print("Import error:", str(e))
            return JsonResponse({'error': f'PDF library not available: {str(e)}'}, status=500)
        except Exception as e:
            print("PDF generation error:", str(e))
            return JsonResponse({'error': f'PDF generation failed: {str(e)}'}, status=500)
        
    except json.JSONDecodeError as e:
        print("JSON decode error:", str(e))
        return JsonResponse({'error': f'Invalid JSON data: {str(e)}'}, status=400)
    except Exception as e:
        print("General error:", str(e))
        return JsonResponse({'error': str(e)}, status=500)

@employee_login_required
def test_pdf(request):
    """Simple test endpoint to verify PDF generation works"""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph
        from reportlab.lib.styles import getSampleStyleSheet
        from io import BytesIO
        
        # Create a simple test PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        
        styles = getSampleStyleSheet()
        story.append(Paragraph("Test PDF Generation", styles['Heading1']))
        story.append(Paragraph("This is a test PDF to verify that ReportLab is working correctly.", styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        
        from django.http import HttpResponse
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="test.pdf"'
        return response
        
    except Exception as e:
        return JsonResponse({'error': f'Test PDF failed: {str(e)}'}, status=500)

def employee_notifications(request):
    employee_id = request.session.get('employee_id')
    filter_type = request.GET.get('filter', 'all')
    search_query = request.GET.get('search', '').strip()
    
    if employee_id:
        notifications_qs = Notification.objects.filter(employee_id=employee_id)
    else:
        notifications_qs = Notification.objects.all()
    
    if search_query:
        notifications_qs = notifications_qs.filter(message__icontains=search_query)
    
    notifications_qs = notifications_qs.order_by('-created_at')
    
    if filter_type == 'unread':
        unread_notifications = notifications_qs.filter(is_read=False)
        read_notifications = Notification.objects.none()
    elif filter_type == 'read':
        unread_notifications = Notification.objects.none()
        read_notifications = notifications_qs.filter(is_read=True)
    else:
        unread_notifications = notifications_qs.filter(is_read=False)
        read_notifications = notifications_qs.filter(is_read=True)
    
    return render(request, 'employee/notifications.html', {
        'unread_notifications': unread_notifications,
        'read_notifications': read_notifications,
        'filter_type': filter_type,
        'search_query': search_query,
    })

@require_POST
@csrf_exempt
def mark_notification_read(request):
    from django.http import JsonResponse
    notif_id = request.POST.get('id')
    mark_read = request.POST.get('read') == 'true'
    employee_id = request.session.get('employee_id')
    try:
        notif = Notification.objects.get(id=notif_id, employee_id=employee_id)
        notif.is_read = mark_read
        notif.save()
        return JsonResponse({'success': True, 'is_read': notif.is_read})
    except Notification.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Notification not found.'}, status=404)

@require_POST
@csrf_exempt
def delete_notification(request):
    from django.http import JsonResponse
    notif_id = request.POST.get('id')
    employee_id = request.session.get('employee_id')
    try:
        notif = Notification.objects.get(id=notif_id, employee_id=employee_id)
        notif.delete()
        return JsonResponse({'success': True})
    except Notification.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Notification not found.'}, status=404)

@employee_login_required
@require_http_methods(["POST"])
def save_job(request):
    """Save a job for the current employee."""
    try:
        employee = Employee.objects.get(username=request.session.get('employee_username'))
        job_id = request.POST.get('job_id')
        if not job_id:
            return JsonResponse({'success': False, 'error': 'Job ID is required.'}, status=400)
        from employer.models import Job
        job = Job.objects.get(id=job_id)
        SavedJob.objects.get_or_create(employee=employee, job=job)
        return JsonResponse({'success': True, 'message': 'Job saved.'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@employee_login_required
@require_http_methods(["POST"])
def unsave_job(request):
    """Unsave a job for the current employee."""
    try:
        employee = Employee.objects.get(username=request.session.get('employee_username'))
        job_id = request.POST.get('job_id')
        if not job_id:
            return JsonResponse({'success': False, 'error': 'Job ID is required.'}, status=400)
        from employer.models import Job
        job = Job.objects.get(id=job_id)
        SavedJob.objects.filter(employee=employee, job=job).delete()
        return JsonResponse({'success': True, 'message': 'Job unsaved.'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@employee_login_required
@require_http_methods(["GET"])
def get_saved_jobs(request):
    """Return a list of job IDs that the current user has saved."""
    try:
        employee = Employee.objects.get(username=request.session.get('employee_username'))
        saved_job_ids = SavedJob.objects.filter(employee=employee).values_list('job_id', flat=True)
        return JsonResponse({'success': True, 'saved_jobs': list(saved_job_ids)})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

def profile_settings_view(request):
    # Assume user is authenticated and employee is available
    employee = Employee.objects.get(username=request.session.get('employee_username'))
    if request.method == 'POST':
        employee.full_name = request.POST.get('full_name', employee.full_name)
        employee.bio = request.POST.get('bio', employee.bio)
        employee.education = request.POST.get('education', employee.education)
        employee.work_experience = request.POST.get('work_experience', employee.work_experience)
        employee.skills = request.POST.get('skills', employee.skills)
        employee.certifications = request.POST.get('certifications', employee.certifications)
        employee.preferred_job_type = request.POST.get('preferred_job_type', employee.preferred_job_type)
        employee.location = request.POST.get('location', employee.location)
        employee.linkedin_url = request.POST.get('linkedin_url', getattr(employee, 'linkedin_url', ''))
        employee.github_url = request.POST.get('github_url', getattr(employee, 'github_url', ''))
        employee.portfolio_url = request.POST.get('portfolio_url', getattr(employee, 'portfolio_url', ''))
        if 'avatar' in request.FILES:
            employee.avatar = request.FILES['avatar']
        employee.save()
        messages.success(request, 'Profile updated successfully!')
        return redirect('employee_profile_settings')
    return render(request, 'employee/profile_settings.html', {'employee': employee})

@employee_login_required
def job_details(request, job_id):
    """
    Display detailed information about a specific job
    """
    # Get the job object or return 404
    job = get_object_or_404(Job, id=job_id)
    
    # Get employee information
    employee_id = request.session['employee_id']
    employee = get_object_or_404(Employee, id=employee_id)
    
    # Check if user has already applied for this job
    has_applied = JobApplication.objects.filter(
        job=job,
        employee=employee
    ).exists()
    
    # Check if job is saved
    is_saved = SavedJob.objects.filter(
        employee=employee,
        job=job
    ).exists()
    
    # Get feedback statistics
    feedback_list = EmployeeFeedback.objects.filter(job=job)
    total_reviews = feedback_list.count()
    
    if total_reviews > 0:
        average_rating_result = feedback_list.aggregate(avg=models.Avg('rating'))
        average_rating = average_rating_result.get('avg__avg', 0) or 0
        positive_reviews = feedback_list.filter(rating__gte=4).count()
        
        # Recent reviews (last 30 days)
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_reviews = feedback_list.filter(created_at__gte=thirty_days_ago).count()
    else:
        average_rating = 0
        positive_reviews = 0
        recent_reviews = 0
    
    context = {
        'job': job,
        'employee': employee,
        'username': employee.username,
        'has_applied': has_applied,
        'is_saved': is_saved,
        'average_rating': round(average_rating, 1) if average_rating else 0,
        'total_reviews': total_reviews,
        'positive_reviews': positive_reviews,
        'recent_reviews': recent_reviews,
    }
    
    return render(request, 'employee/job_details.html', context)

@employee_login_required
@require_http_methods(["GET"])
def check_saved_job(request, job_id):
    """Check if a job is saved by the current employee."""
    try:
        employee = Employee.objects.get(username=request.session.get('employee_username'))
        job = Job.objects.get(id=job_id)
        is_saved = SavedJob.objects.filter(employee=employee, job=job).exists()
        return JsonResponse({'success': True, 'is_saved': is_saved})
    except (Employee.DoesNotExist, Job.DoesNotExist):
        return JsonResponse({'success': False, 'error': 'Employee or job not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@employee_login_required
@require_http_methods(["POST"])
def submit_feedback(request):
    """Submit employee feedback for a job/employer."""
    try:
        employee = Employee.objects.get(username=request.session.get('employee_username'))
        job_id = request.POST.get('job_id')
        
        if not job_id:
            return JsonResponse({'success': False, 'message': 'Job ID is required.'}, status=400)
        
        job = Job.objects.get(id=job_id)
        
        # Check if employee has already submitted feedback for this job
        existing_feedback = EmployeeFeedback.objects.filter(employee=employee, job=job).first()
        if existing_feedback:
            return JsonResponse({'success': False, 'message': 'You have already submitted feedback for this job.'}, status=400)
        
        # Get form data - use the fields that match your model
        rating = int(request.POST.get('overall_rating', 5))  # Use overall_rating as the main rating
        work_environment = int(request.POST.get('work_environment', 5))
        management = int(request.POST.get('management', 5))
        compensation = int(request.POST.get('compensation', 5))
        work_life_balance = int(request.POST.get('work_life_balance', 5))
        comment = request.POST.get('comment', '').strip()
        recommend_employer = request.POST.get('recommend') == 'yes'
        
        # If no overall rating is provided, calculate average from categories
        if not rating or rating == 0:
            rating = round((work_environment + management + compensation + work_life_balance) / 4)
        
        # Validate required fields
        if not comment:
            return JsonResponse({'success': False, 'message': 'Comment is required.'}, status=400)
        
        if rating < 1 or rating > 5:
            return JsonResponse({'success': False, 'message': 'Invalid rating value.'}, status=400)
        
        # Create feedback with all the category fields
        feedback = EmployeeFeedback.objects.create(
            employee=employee,
            job=job,
            rating=rating,
            work_environment=work_environment,
            management=management,
            compensation=compensation,
            work_life_balance=work_life_balance,
            comment=comment,
            recommend_employer=recommend_employer
        )
        
        return JsonResponse({
            'success': True, 
            'message': 'Thank you for your feedback!'
        })
        
    except Employee.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Employee not found.'}, status=404)
    except Job.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Job not found.'}, status=404)
    except ValueError:
        return JsonResponse({'success': False, 'message': 'Invalid rating values.'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'An error occurred: {str(e)}'}, status=500)


@employee_login_required
@require_http_methods(["GET"])
def get_reviews(request, job_id):
    """Get all reviews for a specific job."""
    try:
        job = Job.objects.get(id=job_id)
        
        # Get all feedback for this job
        feedback_list = EmployeeFeedback.objects.filter(job=job).order_by('-created_at')
        
        reviews = []
        for feedback in feedback_list:
            # Calculate overall rating if missing
            overall_rating = feedback.rating
            if not overall_rating:
                category_ratings = [
                    feedback.work_environment or 0,
                    feedback.management or 0,
                    feedback.compensation or 0,
                    feedback.work_life_balance or 0
                ]
                if any(category_ratings):
                    overall_rating = round(sum(category_ratings) / len(category_ratings))
                else:
                    overall_rating = 0
            
            reviews.append({
                'id': feedback.id,
                'reviewer_name': feedback.employee.username,  # Use employee username
                'rating': overall_rating,  # Use calculated or existing rating
                'work_environment': feedback.work_environment or 0,
                'management': feedback.management or 0,
                'compensation': feedback.compensation or 0,
                'work_life_balance': feedback.work_life_balance or 0,
                'comment': feedback.comment,
                'recommend_employer': feedback.recommend_employer,
                'created_at': feedback.created_at.isoformat(),
            })
        
        return JsonResponse({
            'success': True,
            'reviews': reviews,
            'total_reviews': len(reviews)
        })
        
    except Job.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Job not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'An error occurred: {str(e)}'}, status=500)


@employee_login_required
@require_http_methods(["GET"])
def get_job_feedback_stats(request, job_id):
    """Get feedback statistics for a specific job."""
    try:
        job = Job.objects.get(id=job_id)
        
        # Get all feedback for this job
        feedback_list = EmployeeFeedback.objects.filter(job=job)
        
        if not feedback_list.exists():
            return JsonResponse({
                'success': True,
                'stats': {
                    'average_rating': 0,
                    'total_reviews': 0,
                    'positive_reviews': 0,
                    'recent_reviews': 0
                }
            })
        
        # Calculate statistics
        total_reviews = feedback_list.count()
        average_rating_result = feedback_list.aggregate(avg=models.Avg('rating'))
        average_rating = average_rating_result.get('avg__avg', 0) or 0
        positive_reviews = feedback_list.filter(rating__gte=4).count()
        
        # Recent reviews (last 30 days)
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_reviews = feedback_list.filter(created_at__gte=thirty_days_ago).count()
        
        return JsonResponse({
            'success': True,
            'stats': {
                'average_rating': round(average_rating, 1) if average_rating else 0,
                'total_reviews': total_reviews,
                'positive_reviews': positive_reviews,
                'recent_reviews': recent_reviews
            }
        })
        
    except Job.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Job not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'An error occurred: {str(e)}'}, status=500)

# Messaging System Views
@employee_login_required
def messages_list(request):
    """Display list of conversations for employee"""
    employee_username = request.session.get('employee_username')
    employee = get_object_or_404(Employee, username=employee_username)
    conversations = Conversation.objects.filter(employee=employee, is_active=True)
    
    # Get unread counts for each conversation
    for conversation in conversations:
        conversation.unread_count = conversation.unread_count_employee
    
    context = {
        'conversations': conversations,
        'employee': employee,
    }
    return render(request, 'employee/messages_list.html', context)

@employee_login_required
def conversation_detail(request, conversation_id):
    """Display conversation detail and messages"""
    employee_username = request.session.get('employee_username')
    employee = get_object_or_404(Employee, username=employee_username)
    conversation = get_object_or_404(Conversation, id=conversation_id, employee=employee)
    
    # Mark messages as read
    conversation.messages.filter(sender_type='employer', is_read=False).update(is_read=True)
    
    if request.method == 'POST':
        content = request.POST.get('message_content')
        if content:
            Message.objects.create(
                conversation=conversation,
                sender_type='employee',
                content=content
            )
            # Update conversation timestamp
            conversation.save()
            return redirect('conversation_detail', conversation_id=conversation_id)
    
    messages = conversation.messages.all()
    
    context = {
        'conversation': conversation,
        'messages': messages,
        'employee': employee,
    }
    return render(request, 'employee/conversation_detail.html', context)

@employee_login_required
def send_message(request, conversation_id):
    """Send a message via AJAX"""
    if request.method == 'POST':
        employee_username = request.session.get('employee_username')
        employee = get_object_or_404(Employee, username=employee_username)
        conversation = get_object_or_404(Conversation, id=conversation_id, employee=employee)
        
        content = request.POST.get('content')
        if content:
            message = Message.objects.create(
                conversation=conversation,
                sender_type='employee',
                content=content
            )
            # Update conversation timestamp
            conversation.save()
            
            return JsonResponse({
                'success': True,
                'message': {
                    'id': message.id,
                    'content': message.content,
                    'created_at': message.created_at.strftime('%Y-%m-%d %H:%M'),
                    'sender_type': message.sender_type
                }
            })
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@employee_login_required
def get_unread_count(request):
    """Get unread message count for employee"""
    employee_username = request.session.get('employee_username')
    employee = get_object_or_404(Employee, username=employee_username)
    conversations = Conversation.objects.filter(employee=employee, is_active=True)
    
    total_unread = 0
    for conversation in conversations:
        total_unread += conversation.unread_count_employee
    
    return JsonResponse({'unread_count': total_unread})

@employee_login_required
def mark_messages_read(request, conversation_id):
    """Mark messages as read"""
    if request.method == 'POST':
        employee_username = request.session.get('employee_username')
        employee = get_object_or_404(Employee, username=employee_username)
        conversation = get_object_or_404(Conversation, id=conversation_id, employee=employee)
        
        conversation.messages.filter(sender_type='employer', is_read=False).update(is_read=True)
        
        return JsonResponse({'success': True})
    
    return JsonResponse({'success': False})


# ===== EMPLOYER REVIEW VIEWS =====

@employee_login_required
@require_http_methods(["POST"])
def submit_employer_review(request):
    """Submit employee review for an employer/company."""
    try:
        employee = Employee.objects.get(username=request.session.get('employee_username'))
        job_id = request.POST.get('job_id')
        employer_id = request.POST.get('employer_id')
        
        if not job_id or not employer_id:
            return JsonResponse({'success': False, 'message': 'Job ID and Employer ID are required.'}, status=400)
        
        job = Job.objects.get(id=job_id)
        employer = Employer.objects.get(id=employer_id)
        
        # Check if employee has already submitted a review for this employer/job combination
        existing_review = EmployerFeedback.objects.filter(
            employee=employee, 
            employer=employer, 
            job=job
        ).first()
        
        if existing_review:
            return JsonResponse({
                'success': False, 
                'message': 'You have already submitted a review for this company/job combination.'
            }, status=400)
        
        # Get form data
        overall_rating = int(request.POST.get('overall_rating', 5))
        work_environment = int(request.POST.get('work_environment', 5))
        communication = int(request.POST.get('communication', 5))
        work_life_balance = int(request.POST.get('work_life_balance', 5))
        comment = request.POST.get('comment', '').strip()
        recommend_employer = request.POST.get('recommend_employer') == 'true'
        
        # Validate required fields
        if not comment:
            return JsonResponse({'success': False, 'message': 'Comment is required.'}, status=400)
        
        if overall_rating < 1 or overall_rating > 5:
            return JsonResponse({'success': False, 'message': 'Invalid overall rating value.'}, status=400)
        
        # Create employer review
        employer_review = EmployerFeedback.objects.create(
            employee=employee,
            employer=employer,
            job=job,
            overall_rating=overall_rating,
            work_environment=work_environment,
            communication=communication,
            work_life_balance=work_life_balance,
            comment=comment,
            recommend_employer=recommend_employer
        )
        
        return JsonResponse({
            'success': True, 
            'message': 'Thank you for your company review!'
        })
        
    except Employee.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Employee not found.'}, status=404)
    except Job.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Job not found.'}, status=404)
    except Employer.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Employer not found.'}, status=404)
    except ValueError:
        return JsonResponse({'success': False, 'message': 'Invalid rating values.'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'An error occurred: {str(e)}'}, status=500)


@employee_login_required
@require_http_methods(["GET"])
def get_employer_reviews(request, job_id):
    """Get all employer reviews for a specific job."""
    try:
        job = Job.objects.get(id=job_id)
        
        # Get all employer reviews for this job
        employer_reviews = EmployerFeedback.objects.filter(job=job).order_by('-created_at')
        
        reviews = []
        for review in employer_reviews:
            reviews.append({
                'id': review.id,
                'employee_name': review.employee.username,
                'overall_rating': review.overall_rating,
                'work_environment': review.work_environment,
                'communication': review.communication,
                'work_life_balance': review.work_life_balance,
                'comment': review.comment,
                'recommend_employer': review.recommend_employer,
                'created_at': review.created_at.isoformat(),
            })
        
        return JsonResponse({
            'success': True,
            'reviews': reviews,
            'total_reviews': len(reviews)
        })
        
    except Job.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Job not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'An error occurred: {str(e)}'}, status=500)
