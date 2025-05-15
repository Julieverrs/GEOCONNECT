from django.shortcuts import render, redirect
from django.contrib.auth.hashers import make_password, check_password
from django.contrib import messages
from .forms import EmployeeSignupForm, EmployeeLoginForm, PasswordResetForm, SetPasswordForm
from .models import Employee
from employer.models import Job, Employer, JobApplication  # Add JobApplication import
# Update imports
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.utils import timezone
from .tokens import password_reset_token  # Import our custom token generator
from django.http import JsonResponse
from django.db.models import Q
from django.views.decorators.http import require_http_methods
import json
from django.core.files.storage import default_storage
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
import os
import uuid
from django.http import JsonResponse
from django.views.decorators.http import require_POST
# Add these imports at the top of the file
from .resume_analyzer import ResumeAnalyzer
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from employer.models import Job
import json
import logging
import re

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
    
    context = {
        'employee': employee,
        'username': employee_username,
        'jobs': jobs,
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
                
                # Send email
                try:
                    send_mail(
                        'Reset your GEOCONNECT password',
                        email_text,
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        html_message=email_html,
                        fail_silently=False,
                    )
                    messages.success(request, "Password reset instructions have been sent to your email.")
                except Exception as e:
                    messages.error(request, "There was an error sending the password reset email. Please try again later.")
                    print(f"Email error: {str(e)}")  # Log the error
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
@login_required
def resume_analyzer_view(request):
    """View for the resume analyzer page"""
    return render(request, 'employee/resume-analyzer.html')

@login_required
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
                        'company': job['company'],
                        'location': job['location'],
                        'description': job['description']
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
