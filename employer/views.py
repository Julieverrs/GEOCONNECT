from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.hashers import make_password, check_password
from django.http import JsonResponse
from django.contrib import messages
from .models import Employer, Job
from .forms import EmployerSignupForm, EmployerLoginForm, JobPostForm
from django.http import HttpResponse
from django.core.paginator import Paginator
import json
from django.db.models import Q
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
# Add these imports to your existing views.py
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.utils import timezone
from .forms import EmployerPasswordResetForm, EmployerSetPasswordForm
from .tokens import employer_password_reset_token

def employer_signup(request):
    if request.method == "POST":
        form = EmployerSignupForm(request.POST, request.FILES)  # Add request.FILES here
        if form.is_valid():
            try:
                # Check if username already exists
                if Employer.objects.filter(username=form.cleaned_data["username"]).exists():
                    messages.error(request, "Username already exists. Please choose another one.")
                    return render(request, 'employer/employer_signup.html', {'form': form})
                
                # Check if email already exists
                if Employer.objects.filter(email=form.cleaned_data["email"]).exists():
                    messages.error(request, "Email already registered. Please use another email.")
                    return render(request, 'employer/employer_signup.html', {'form': form})

                employer = form.save(commit=False)
                employer.password = make_password(form.cleaned_data["password"])
                
                # Handle file uploads
                if 'business_permit' in request.FILES:
                    employer.business_permit = request.FILES['business_permit']
                if 'registration_document' in request.FILES:
                    employer.registration_document = request.FILES['registration_document']
                
                employer.save()
                messages.success(request, "Company account created successfully! Please wait for verification before logging in.")
                return redirect('employer_login')
            except Exception as e:
                print(f"Error during signup: {str(e)}")  # For debugging
                messages.error(request, f"An error occurred during signup: {str(e)}")
        else:
            # Print form errors for debugging
            print("Form errors:", form.errors)
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"{field}: {error}")
    else:
        form = EmployerSignupForm()
    return render(request, 'employer/employer_signup.html', {'form': form})

def employer_login(request):
    if request.method == "POST":
        form = EmployerLoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data["username"]
            password = form.cleaned_data["password"]
            user = Employer.objects.filter(username=username).first()
            
            if not user:
                messages.error(request, "Username not found. Please check your username or sign up.")
                return render(request, 'employer/employer_login.html', {'form': form})
            
            if not check_password(password, user.password):
                messages.error(request, "Incorrect password. Please try again.")
                return render(request, 'employer/employer_login.html', {'form': form})
            
            request.session['employer_id'] = user.id
            request.session['employer_username'] = username
            messages.success(request, f"Welcome back, {username}!")
            return redirect('employer_home')
    else:
        form = EmployerLoginForm()
    return render(request, 'employer/employer_login.html', {'form': form})

def employer_logout(request):
    try:
        # Clear specific session data
        request.session.pop('employer_username', None)
        request.session.pop('employer_id', None)
        messages.success(request, "You have been successfully logged out.")
        return redirect('employer_login')
    except Exception as e:
        messages.error(request, "An error occurred during logout.")
        return redirect('employer_login')

def employer_home(request):
    # Check if user is logged in
    employer_username = request.session.get('employer_username')
    if not employer_username:
        messages.error(request, "Please login to access this page.")
        return redirect('employer_login')
    
    # Get the employer object
    employer = Employer.objects.filter(username=employer_username).first()
    if not employer:
        messages.error(request, "User not found.")
        return redirect('employer_login')
    
    # Get jobs for this employer
    jobs = Job.objects.filter(employer=employer)
    
    context = {
        'employer': employer,
        'username': employer_username,
        'jobs': jobs,
    }
    return render(request, 'employer/employer_home.html', context)

from django.views.decorators.csrf import ensure_csrf_cookie

# Update the create_job view to handle work_setup
@ensure_csrf_cookie
def create_job(request):
    if not request.session.get('employer_username'):
        return JsonResponse({'error': 'Not authenticated'}, status=403)
    
    if request.method == 'POST':
        try:
            employer = Employer.objects.get(username=request.session['employer_username'])
            data = json.loads(request.body)
            
            job = Job.objects.create(
                employer=employer,
                title=data['jobTitle'],
                location=data['location'],
                job_type=data['jobType'],
                work_setup=data['workSetup'],  # Add this line
                description=data['description'],
                salary_range=data['salary'],
                experience_level=data['experience']
            )
            
            return JsonResponse({
                'success': True,
                'job': {
                    'id': job.id,
                    'title': job.title,
                    'location': job.location,
                    'job_type': job.get_job_type_display(),
                    'work_setup': job.get_work_setup_display(),  # Add this line
                    'description': job.description,
                    'salary_range': job.salary_range,
                    'experience_level': job.get_experience_level_display(),
                    'status': 'Active',
                    'applications_count': 0
                }
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)



@ensure_csrf_cookie
def search_jobs(request):
    if not request.session.get('employer_username'):
        return JsonResponse({'error': 'Not authenticated'}, status=403)
    
    query = request.GET.get('q', '')
    status_filter = request.GET.get('status', 'all')
    sort_by = request.GET.get('sort', 'newest')
    
    try:
        employer = Employer.objects.get(username=request.session['employer_username'])
        jobs = Job.objects.filter(employer=employer)
        
        # Apply search filters
        if query:
            jobs = jobs.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(location__icontains=query)
            )
        
        if status_filter != 'all':
            jobs = jobs.filter(status=status_filter)
        
        # Apply sorting
        if sort_by == 'newest':
            jobs = jobs.order_by('-created_at')
        elif sort_by == 'oldest':
            jobs = jobs.order_by('created_at')
        elif sort_by == 'title':
            jobs = jobs.order_by('title')
        
        jobs_data = [{
            'id': job.id,
            'title': job.title,
            'location': job.location,
            'job_type': job.get_job_type_display(),
            'description': job.description,
            'status': job.status,
            'applications_count': job.applications_count,
            'created_at': job.created_at.strftime('%Y-%m-%d')
        } for job in jobs]
        
        return JsonResponse({
            'jobs': jobs_data,
            'total': len(jobs_data)
        })
    except Employer.DoesNotExist:
        return JsonResponse({'error': 'Employer not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_job(request, job_id):
    if not request.session.get('employer_username'):
        return JsonResponse({'error': 'Not authenticated'}, status=403)
    
    try:
        employer = Employer.objects.get(username=request.session['employer_username'])
        job = get_object_or_404(Job, id=job_id, employer=employer)
        
        job_data = {
            'id': job.id,
            'title': job.title,
            'location': job.location,
            'job_type': job.job_type,
            'description': job.description,
            'salary_range': job.salary_range,
            'experience_level': job.experience_level,
            'status': job.status,
            'applications_count': job.applications_count
        }
        return JsonResponse({'job': job_data})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@require_POST
def edit_job(request, job_id):
    if not request.session.get('employer_username'):
        return JsonResponse({'error': 'Not authenticated'}, status=403)
    
    try:
        employer = Employer.objects.get(username=request.session['employer_username'])
        job = Job.objects.get(id=job_id, employer=employer)
        data = json.loads(request.body)
        
        # Update job fields
        job.title = data['jobTitle']
        job.location = data['location']
        job.job_type = data['jobType']
        job.description = data['description']
        job.salary_range = data['salary']
        job.experience_level = data['experience']
        job.status = data['status']
        job.save()
        
        return JsonResponse({
            'success': True,
            'job': {
                'id': job.id,
                'title': job.title,
                'location': job.location,
                'job_type': job.get_job_type_display(),
                'description': job.description,
                'salary_range': job.salary_range,
                'experience_level': job.get_experience_level_display(),
                'status': job.get_status_display(),
                'applications_count': job.applications_count
            }
        })
    except Job.DoesNotExist:
        return JsonResponse({'error': 'Job not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@ensure_csrf_cookie
def get_profile(request):
    if not request.session.get('employer_username'):
        return JsonResponse({'error': 'Not authenticated'}, status=403)
    
    try:
        employer = Employer.objects.get(username=request.session['employer_username'])
        return JsonResponse({
            'profile': {
                'username': employer.username,
                'email': employer.email,
                'company_name': employer.company_name,
                'company_description': employer.company_description,
                'company_website': employer.company_website,
                'company_location': employer.company_location,
                'latitude': employer.latitude,
                'longitude': employer.longitude,
                'industry': employer.industry
            }
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@ensure_csrf_cookie
def update_profile(request):
    if not request.session.get('employer_username'):
        return JsonResponse({'error': 'Not authenticated'}, status=403)
    
    if request.method == 'POST':
        try:
            employer = Employer.objects.get(username=request.session['employer_username'])
            data = json.loads(request.body)
            
            # Update fields
            employer.company_name = data.get('company_name', employer.company_name)
            employer.company_description = data.get('company_description', employer.company_description)
            employer.company_website = data.get('company_website', employer.company_website)
            employer.company_location = data.get('company_location', employer.company_location)
            employer.latitude = data.get('latitude', employer.latitude)
            employer.longitude = data.get('longitude', employer.longitude)
            employer.industry = data.get('industry', employer.industry)
            employer.email = data.get('email', employer.email)
            
            employer.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Profile updated successfully'
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@ensure_csrf_cookie
def change_password(request):
    if not request.session.get('employer_username'):
        return JsonResponse({'error': 'Not authenticated'}, status=403)
    
    if request.method == 'POST':
        try:
            employer = Employer.objects.get(username=request.session['employer_username'])
            data = json.loads(request.body)
            
            # Verify current password
            if not check_password(data['current_password'], employer.password):
                return JsonResponse({'error': 'Current password is incorrect'}, status=400)
            
            # Update password
            employer.password = make_password(data['new_password'])
            employer.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Password changed successfully'
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@ensure_csrf_cookie
def search_jobs(request):
    if not request.session.get('employer_username'):
        return JsonResponse({'error': 'Not authenticated'}, status=403)
    
    query = request.GET.get('q', '')
    status_filter = request.GET.get('status', 'all')
    sort_by = request.GET.get('sort', 'newest')
    
    try:
        employer = Employer.objects.get(username=request.session['employer_username'])
        jobs = Job.objects.filter(employer=employer)
        
        # Apply search filters
        if query:
            jobs = jobs.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(location__icontains=query)
            )
        
        if status_filter != 'all':
            jobs = jobs.filter(status=status_filter)
        
        # Apply sorting
        if sort_by == 'newest':
            jobs = jobs.order_by('-created_at')
        elif sort_by == 'oldest':
            jobs = jobs.order_by('created_at')
        elif sort_by == 'title':
            jobs = jobs.order_by('title')
        
        jobs_data = [{
            'id': job.id,
            'title': job.title,
            'location': job.location,
            'job_type': job.get_job_type_display(),
            'description': job.description,
            'status': job.status,
            'applications_count': job.applications_count,
            'created_at': job.created_at.strftime('%Y-%m-%d')
        } for job in jobs]
        
        return JsonResponse({
            'jobs': jobs_data,
            'total': len(jobs_data)
        })
    except Employer.DoesNotExist:
        return JsonResponse({'error': 'Employer not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
    # Add these new views
def employer_password_reset(request):
    if request.method == "POST":
        form = EmployerPasswordResetForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data["email"]
            employer = Employer.objects.filter(email=email).first()
            
            if employer:
                # Update last_login
                employer.last_login = timezone.now()
                employer.save()
                
                # Generate token
                token = employer_password_reset_token.make_token(employer)
                uid = urlsafe_base64_encode(force_bytes(employer.pk))
                
                # Build reset URL
                reset_url = request.build_absolute_uri(
                    f'/employer/reset/{uid}/{token}/'
                )
                
                # Prepare email
                context = {
                    'user': employer,
                    'reset_url': reset_url,
                    'company_name': employer.company_name
                }
                email_html = render_to_string('employer/email/password_reset_email.html', context)
                email_text = render_to_string('employer/email/password_reset_email.txt', context)
                
                # Send email
                try:
                    send_mail(
                        'Reset your GEOCONNECT Employer password',
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
                return redirect('employer_login')
            else:
                # Use a vague message for security
                messages.info(request, "If an account exists with this email address, you will receive password reset instructions.")
                return redirect('employer_login')
    else:
        form = EmployerPasswordResetForm()
    
    return render(request, 'employer/password_reset.html', {'form': form})

def employer_password_reset_confirm(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        employer = Employer.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, Employer.DoesNotExist):
        employer = None
    
    if employer is not None and employer_password_reset_token.check_token(employer, token):
        validlink = True
        if request.method == "POST":
            form = EmployerSetPasswordForm(request.POST)
            if form.is_valid():
                new_password = form.cleaned_data["new_password1"]
                employer.password = make_password(new_password)
                employer.last_login = timezone.now()
                employer.save()
                messages.success(request, "Your password has been successfully reset. Please login with your new password.")
                return redirect('employer_login')
        else:
            form = EmployerSetPasswordForm()
    else:
        validlink = False
        form = None
    
    return render(request, 'employer/password_reset_confirm.html', {
        'form': form,
        'validlink': validlink,
    })

