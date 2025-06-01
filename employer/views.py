from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.hashers import make_password, check_password
from django.http import JsonResponse
from django.contrib import messages
from .models import Employer, Job, JobApplication # Import JobApplication model
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
from datetime import datetime # Import datetime for interview_date
from django.views.decorators.http import require_http_methods

# Add these imports at the top of the file
from django.views.decorators.http import require_POST
from .candidate_recommender import CandidateRecommender
import json

# Update the candidate_recommendations view to handle both GET and POST requests
def candidate_recommendations(request):
    """
    View for the candidate recommendations page.
    """
    # Check if user is logged in using session
    employer_username = request.session.get('employer_username')
    if not employer_username:
        messages.error(request, "Please login to access this page.")
        return redirect('employer_login')
    
    # Get the employer object
    employer = Employer.objects.filter(username=employer_username).first()
    if not employer:
        messages.error(request, "User not found.")
        return redirect('employer_login')
    
    # Check if this is a form submission
    if request.method == 'POST':
        try:
            # Debug: Print form data
            print("Form submitted with data:", request.POST)
            
            # Process the form data
            form_data = request.POST
            
            # Extract job requirements
            job_requirements = {
                'industry': form_data.get('industry'),
                'job_type': form_data.get('job_type'),
                'work_arrangement': form_data.get('work_arrangement'),
                'skills': form_data.getlist('skills'),
                'experience': form_data.get('experience', '0'),
                'current_role_years': form_data.get('current_role_years'),
                'education': form_data.get('education'),
                'certifications': form_data.getlist('certifications'),
                'languages': form_data.getlist('languages'),
                'salary_range': form_data.get('salary_range', '25000'),
                'availability': form_data.get('availability')
            }
            
            print("Processed job requirements:", job_requirements)
            
            # Check if we have any employees in the database
            from employee.models import Employee, JobPreferences
            total_employees = Employee.objects.count()
            active_employees = Employee.objects.filter(is_active=True, is_approved=True).count()
            
            print(f"Total employees in database: {total_employees}")
            print(f"Active/approved employees: {active_employees}")
            
            if total_employees == 0:
                messages.warning(request, "No employees found in the database.")
                context = {
                    'employer': employer,
                    'username': employer_username,
                    'candidates': [],
                    'job_requirements': job_requirements,
                    'show_results': True
                }
                return render(request, 'employer/candidate_recommendations.html', context)
            
            # Use the recommender to find candidates
            recommender = CandidateRecommender()
            recommendations = recommender.recommend_candidates(job_requirements, max_candidates=20)  # Increased max candidates
            
            print(f"Found {len(recommendations)} recommendations")
            
            # Prepare data for the template
            candidates = []
            for employee, score, details in recommendations:
                # Get job preferences from the JobPreferences model
                try:
                    job_prefs = JobPreferences.objects.get(employee=employee)
                    
                    # Parse JSON fields safely
                    try:
                        skills = json.loads(job_prefs.skills) if job_prefs.skills else []
                    except (json.JSONDecodeError, TypeError):
                        skills = []
                        
                    try:
                        certifications = json.loads(job_prefs.certifications) if job_prefs.certifications else []
                    except (json.JSONDecodeError, TypeError):
                        certifications = []
                        
                    try:
                        languages = json.loads(job_prefs.languages) if job_prefs.languages else []
                    except (json.JSONDecodeError, TypeError):
                        languages = []
                    
                    job_preferences = {
                        'preferred_job_type': job_prefs.job_type or "Not specified",
                        'preferred_work_setup': job_prefs.work_arrangement or "Not specified",
                        'preferred_industry': job_prefs.industry or "Not specified",
                        'preferred_salary': f"₱{job_prefs.salary_min:,} - ₱{job_prefs.salary_max:,}" if job_prefs.salary_min and job_prefs.salary_max else "Not specified",
                        'preferred_location': "Not specified",  # This field might not exist in JobPreferences
                        'skills': skills,
                        'certifications': certifications,
                        'languages': languages,
                        'availability': job_prefs.availability or "Not specified",
                        'experience': job_prefs.experience if job_prefs.experience is not None else "Not specified",
                        'current_role_years': job_prefs.current_role_years or "Not specified",
                        'education_level': job_prefs.education_level or "Not specified",
                    }
                except JobPreferences.DoesNotExist:
                    # If no job preferences found, use default values
                    job_preferences = {
                        'preferred_job_type': "Not specified",
                        'preferred_work_setup': "Not specified",
                        'preferred_industry': "Not specified",
                        'preferred_salary': "Not specified",
                        'preferred_location': "Not specified",
                        'skills': [],
                        'certifications': [],
                        'languages': [],
                        'availability': "Not specified",
                        'experience': "Not specified",
                        'current_role_years': "Not specified",
                        'education_level': "Not specified",
                    }
                
                # Format the candidate data
                candidate = {
                    'id': employee.id,
                    'name': employee.full_name or employee.username,
                    'job_title': employee.job_title or 'Not specified',
                    'location': employee.location or 'Not specified',
                    'years_experience': employee.years_of_experience or 0,
                    'skills': employee.skills.split(',') if employee.skills else [],
                    'education': employee.education or 'Not specified',
                    'match_percentage': max(10, int(score * 100)),  # Minimum 10% match
                    'match_details': details,
                    'job_preferences': job_preferences  # Add job preferences to the candidate data
                }
                candidates.append(candidate)
                print(f"Added candidate: {candidate['name']} with {candidate['match_percentage']}% match")
                print(f"Job preferences: {job_preferences}")
            
            # If no candidates found, try to get some employees anyway
            if not candidates:
                print("No candidates from recommender, getting fallback candidates")
                fallback_employees = Employee.objects.all()[:10]
                for employee in fallback_employees:
                    # Get job preferences for fallback candidates too
                    try:
                        job_prefs = JobPreferences.objects.get(employee=employee)
                        
                        # Parse JSON fields safely
                        try:
                            skills = json.loads(job_prefs.skills) if job_prefs.skills else []
                        except (json.JSONDecodeError, TypeError):
                            skills = []
                            
                        try:
                            certifications = json.loads(job_prefs.certifications) if job_prefs.certifications else []
                        except (json.JSONDecodeError, TypeError):
                            certifications = []
                            
                        try:
                            languages = json.loads(job_prefs.languages) if job_prefs.languages else []
                        except (json.JSONDecodeError, TypeError):
                            languages = []
                        
                        job_preferences = {
                            'preferred_job_type': job_prefs.job_type or "Not specified",
                            'preferred_work_setup': job_prefs.work_arrangement or "Not specified",
                            'preferred_industry': job_prefs.industry or "Not specified",
                            'preferred_salary': f"₱{job_prefs.salary_min:,} - ₱{job_prefs.salary_max:,}" if job_prefs.salary_min and job_prefs.salary_max else "Not specified",
                            'preferred_location': "Not specified",  # This field might not exist in JobPreferences
                            'skills': skills,
                            'certifications': certifications,
                            'languages': languages,
                            'availability': job_prefs.availability or "Not specified",
                            'experience': job_prefs.experience if job_prefs.experience is not None else "Not specified",
                            'current_role_years': job_prefs.current_role_years or "Not specified",
                            'education_level': job_prefs.education_level or "Not specified",
                        }
                    except JobPreferences.DoesNotExist:
                        # If no job preferences found, use default values
                        job_preferences = {
                            'preferred_job_type': "Not specified",
                            'preferred_work_setup': "Not specified",
                            'preferred_industry': "Not specified",
                            'preferred_salary': "Not specified",
                            'preferred_location': "Not specified",
                            'skills': [],
                            'certifications': [],
                            'languages': [],
                            'availability': "Not specified",
                            'experience': "Not specified",
                            'current_role_years': "Not specified",
                            'education_level': "Not specified",
                        }
                    
                    candidate = {
                        'id': employee.id,
                        'name': employee.full_name or employee.username,
                        'job_title': employee.job_title or 'Not specified',
                        'location': employee.location or 'Not specified',
                        'years_experience': employee.years_of_experience or 0,
                        'skills': employee.skills.split(',') if employee.skills else [],
                        'education': employee.education or 'Not specified',
                        'match_percentage': 25,  # Default 25% match
                        'match_details': {
                            'nlp_score': 25,
                            'experience_score': 50,
                            'education_score': 50,
                            'salary_score': 50,
                            'skill_matches': [],
                            'matched_skills_count': 0,
                            'total_skills_count': len(job_requirements.get('skills', []))
                        },
                        'job_preferences': job_preferences  # Add job preferences to fallback candidates too
                    }
                    candidates.append(candidate)
            
            print(f"Final candidate count: {len(candidates)}")
            
            # Render the template with recommendations
            context = {
                'employer': employer,
                'username': employer_username,
                'candidates': candidates,
                'job_requirements': job_requirements,
                'show_results': True
            }
            return render(request, 'employer/candidate_recommendations.html', context)
            
        except Exception as e:
            import traceback
            print(f"Error processing recommendation form: {str(e)}")
            print(traceback.format_exc())
            messages.error(request, f"An error occurred while processing your request. Please try again.")
            
            # Still try to show some basic results
            from employee.models import Employee, JobPreferences
            fallback_employees = Employee.objects.all()[:5]
            candidates = []
            for employee in fallback_employees:
                # Get job preferences for error fallback candidates too
                try:
                    job_prefs = JobPreferences.objects.get(employee=employee)
                    
                    # Parse JSON fields safely
                    try:
                        skills = json.loads(job_prefs.skills) if job_prefs.skills else []
                    except (json.JSONDecodeError, TypeError):
                        skills = []
                        
                    try:
                        certifications = json.loads(job_prefs.certifications) if job_prefs.certifications else []
                    except (json.JSONDecodeError, TypeError):
                        certifications = []
                        
                    try:
                        languages = json.loads(job_prefs.languages) if job_prefs.languages else []
                    except (json.JSONDecodeError, TypeError):
                        languages = []
                    
                    job_preferences = {
                        'preferred_job_type': job_prefs.job_type or "Not specified",
                        'preferred_work_setup': job_prefs.work_arrangement or "Not specified",
                        'preferred_industry': job_prefs.industry or "Not specified",
                        'preferred_salary': f"₱{job_prefs.salary_min:,} - ₱{job_prefs.salary_max:,}" if job_prefs.salary_min and job_prefs.salary_max else "Not specified",
                        'preferred_location': "Not specified",  # This field might not exist in JobPreferences
                        'skills': skills,
                        'certifications': certifications,
                        'languages': languages,
                        'availability': job_prefs.availability or "Not specified",
                        'experience': job_prefs.experience if job_prefs.experience is not None else "Not specified",
                        'current_role_years': job_prefs.current_role_years or "Not specified",
                        'education_level': job_prefs.education_level or "Not specified",
                    }
                except JobPreferences.DoesNotExist:
                    # If no job preferences found, use default values
                    job_preferences = {
                        'preferred_job_type': "Not specified",
                        'preferred_work_setup': "Not specified",
                        'preferred_industry': "Not specified",
                        'preferred_salary': "Not specified",
                        'preferred_location': "Not specified",
                        'skills': [],
                        'certifications': [],
                        'languages': [],
                        'availability': "Not specified",
                        'experience': "Not specified",
                        'current_role_years': "Not specified",
                        'education_level': "Not specified",
                    }
                
                candidate = {
                    'id': employee.id,
                    'name': employee.full_name or employee.username,
                    'job_title': employee.job_title or 'Not specified',
                    'location': employee.location or 'Not specified',
                    'years_experience': employee.years_of_experience or 0,
                    'skills': employee.skills.split(',') if employee.skills else [],
                    'education': employee.education or 'Not specified',
                    'match_percentage': 20,
                    'match_details': {
                        'nlp_score': 20,
                        'experience_score': 50,
                        'education_score': 50,
                        'salary_score': 50,
                        'skill_matches': [],
                        'matched_skills_count': 0,
                        'total_skills_count': 0
                    },
                    'job_preferences': job_preferences  # Add job preferences to error fallback candidates too
                }
                candidates.append(candidate)
            
            context = {
                'employer': employer,
                'username': employer_username,
                'candidates': candidates,
                'job_requirements': {},
                'show_results': True
            }
            return render(request, 'employer/candidate_recommendations.html', context)
    
    # For GET requests, just show the form
    context = {
        'employer': employer,
        'username': employer_username,
        'show_results': False
    }
    return render(request, 'employer/candidate_recommendations.html', context)

# Add a new API endpoint for AJAX requests if needed
@require_POST
def api_candidate_recommendations(request):
    """API endpoint for candidate recommendations"""
    if not request.session.get('employer_username'):
        return JsonResponse({'error': 'Not authenticated'}, status=403)
    
    try:
        # Parse JSON data
        data = json.loads(request.body)
        
        # Use the recommender
        recommender = CandidateRecommender()
        recommendations = recommender.recommend_candidates(data)
        
        # Format the response
        candidates = []
        for employee, score, details in recommendations:
            candidate = {
                'id': employee.id,
                'name': employee.full_name or employee.username,
                'job_title': employee.job_title or 'Not specified',
                'location': employee.location or 'Not specified',
                'years_experience': employee.years_of_experience,
                'skills': employee.skills.split(',') if employee.skills else [],
                'education': employee.education or 'Not specified',
                'match_percentage': int(score * 100),
                'match_details': details
            }
            candidates.append(candidate)
        
        return JsonResponse({
            'success': True,
            'candidates': candidates
        })
    except Exception as e:
        import traceback
        print(f"Error in API recommendation: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)



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
                messages.success(request, "Company account created successfully! Please wait for admin approval before logging in.")
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

# Update the employer_login view to check approval status
def employer_login(request):
    if request.method == "POST":
        form = EmployerLoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data["username"]
            password = form.cleaned_data["password"]
            user = Employer.objects.filter(username=username).first()
            
            if not user:
                # Remove toast prefix
                messages.error(request, "Username not found. Please check your username or sign up.")
                return render(request, 'employer/employer_login.html', {'form': form})
            
            if not user.is_active:
                # Remove toast prefix
                messages.error(request, "Your account has been deactivated. Please contact support.")
                return render(request, 'employer/employer_login.html', {'form': form})
            
            if not user.is_approved:
                # Remove toast prefix
                messages.error(request, "Your account is pending approval. Please wait for admin approval.")
                return render(request, 'employer/employer_login.html', {'form': form})
            
            if check_password(password, user.password):
                request.session['employer_id'] = user.id
                request.session['employer_username'] = username
                
                # Check if the user is coming from logout
                if request.session.get('from_logout'):
                    # Clear the flag
                    request.session.pop('from_logout', None)
                    # Don't show welcome back message
                    return redirect('employer_home')
                else:
                    # Remove toast message completely
                    return redirect('employer_home')
            else:
                # Remove toast prefix
                messages.error(request, "Incorrect password. Please try again.")
        else:
            messages.error(request, "Invalid form submission. Please check your input.")
    else:
        form = EmployerLoginForm()
    return render(request, 'employer/employer_login.html', {'form': form})

def employer_logout(request):
    try:
        # Get the username before clearing the session
        username = request.session.get('employer_username', 'User')
        
        # Clear specific session data
        request.session.pop('employer_username', None)
        request.session.pop('employer_id', None)
        
        # Set a flag to indicate coming from logout
        request.session['from_logout'] = True
        
        # Add a message that will be displayed on the employee login page
        messages.success(request, f"Employer {username} has been successfully logged out.")
        
        # Redirect to employee login instead of employer login
        return redirect('employee_login')
    except Exception as e:
        # Remove toast prefix
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
    
    # Calculate statistics
    total_jobs = jobs.count()
    total_applications = JobApplication.objects.filter(job__employer=employer).count()
    
    context = {
        'employer': employer,
        'username': employer_username,
        'jobs': jobs,
        'total_jobs': total_jobs,
        'total_applications': total_applications,
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
                latitude=data.get('latitude'),
                longitude=data.get('longitude'),
                job_type=data['jobType'],
                work_setup=data['workSetup'],
                description=data['description'],
                salary_range=data['salary'],
                experience_level=data['experience'],
                requirements=data['requirements']
            )
            
            return JsonResponse({
                'success': True,
                'job': {
                    'id': job.id,
                    'title': job.title,
                    'location': job.location,
                    'latitude': job.latitude,
                    'longitude': job.longitude,
                    'job_type': job.get_job_type_display(),
                    'work_setup': job.get_work_setup_display(),
                    'description': job.description,
                    'salary_range': job.salary_range,
                    'experience_level': job.get_experience_level_display(),
                    'requirements': job.requirements,
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
            'work_setup': job.get_work_setup_display(),
            'description': job.description,
            'requirements': job.requirements,
            'salary_range': job.salary_range,
            'experience_level': job.get_experience_level_display(),
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

# Update the get_job view to include latitude and longitude
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
            'latitude': job.latitude,
            'longitude': job.longitude,
            'job_type': job.job_type,
            'work_setup': job.work_setup,
            'description': job.description,
            'salary_range': job.salary_range,
            'experience_level': job.experience_level,
            'status': job.status,
            'requirements': job.requirements,
            'applications_count': job.applications_count
        }
        return JsonResponse({'job': job_data})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

# Update the edit_job view to handle latitude and longitude
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
        job.latitude = data.get('latitude')
        job.longitude = data.get('longitude')
        job.job_type = data['jobType']
        job.description = data['description']
        job.salary_range = data['salary']
        job.experience_level = data['experience']
        job.status = data['status']
        job.requirements = data['requirements']
        job.save()
        
        return JsonResponse({
            'success': True,
            'job': {
                'id': job.id,
                'title': job.title,
                'location': job.location,
                'latitude': job.latitude,
                'longitude': job.longitude,
                'job_type': job.get_job_type_display(),
                'description': job.description,
                'salary_range': job.salary_range,
                'experience_level': job.get_experience_level_display(),
                'status': job.status,
                'requirements': job.requirements,
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
            'work_setup': job.get_work_setup_display(),
            'description': job.description,
            'requirements': job.requirements,
            'salary_range': job.salary_range,
            'experience_level': job.get_experience_level_display(),
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

# Add these new views while keeping existing ones

def view_applications(request):
    if not request.session.get('employer_username'):
        messages.error(request, "Please login to access this page.")
        return redirect('employer_login')
    
    employer = Employer.objects.get(username=request.session['employer_username'])
    
    # Get all jobs for this employer
    jobs = Job.objects.filter(employer=employer)
    
    # Get filter parameters
    job_id = request.GET.get('job')
    status = request.GET.get('status')
    
    # Base queryset
    applications = JobApplication.objects.filter(job__employer=employer)
    
    # Apply filters
    if job_id:
        applications = applications.filter(job_id=job_id)
    if status:
        applications = applications.filter(status=status)
    
    context = {
        'applications': applications,
        'jobs': jobs,
        'status_choices': JobApplication.STATUS_CHOICES,
        'selected_job': job_id,
        'selected_status': status
    }
    
    return render(request, 'employer/view_applications.html', context)

def application_detail(request, application_id):
    if not request.session.get('employer_username'):
        return JsonResponse({'error': 'Not authenticated'}, status=403)
    
    try:
        employer = Employer.objects.get(username=request.session['employer_username'])
        application = get_object_or_404(JobApplication, id=application_id, job__employer=employer)
        
        # Debug information
        print(f"Found application: {application.id} for job: {application.job.title}")
        
        # Get employee data safely
        employee = application.employee
        employee_name = employee.username  # Default to username
        if hasattr(employee, 'first_name') and hasattr(employee, 'last_name'):
            if employee.first_name and employee.last_name:
                employee_name = f"{employee.first_name} {employee.last_name}"
        
        # Check if full_name exists and use it if available
        if hasattr(employee, 'full_name') and employee.full_name:
            employee_name = employee.full_name
            
        # Format application data
        application_data = {
            'id': application.id,
            'job_title': application.job.title,
            'job_location': application.job.location,
            'employee_name': employee_name,
            'employee_email': employee.email,
            'status': application.status,
            'application_date': application.application_date.strftime('%B %d, %Y'),
            'cover_letter': application.cover_letter or "No cover letter provided",
            'employer_notes': application.employer_notes or "",
        }
        
        # Add resume URL if available
        if application.resume:
            try:
                application_data['resume_url'] = application.resume.url
            except:
                application_data['resume_url'] = None
        else:
            application_data['resume_url'] = None
            
        # Add interview date if available
        if application.interview_date:
            application_data['interview_date'] = application.interview_date.strftime('%B %d, %Y at %I:%M %p')
        
        return JsonResponse({'application': application_data})
    except Exception as e:
        # Log the error for debugging
        import traceback
        print(f"Error in application_detail: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)

@require_POST
def update_application_status(request, application_id):
    if not request.session.get('employer_username'):
        return JsonResponse({'error': 'Not authenticated'}, status=403)
    
    try:
        # Debug log
        print(f"Updating application {application_id}")
        print(f"Request body: {request.body.decode('utf-8')}")
        
        employer = Employer.objects.get(username=request.session['employer_username'])
        application = JobApplication.objects.get(
            id=application_id,
            job__employer=employer
        )
        
        data = json.loads(request.body)
        new_status = data.get('status')
        notes = data.get('notes', '')
        interview_date = data.get('interview_date')
        interview_location = data.get('interview_location', '')
        
        print(f"Parsed data: status={new_status}, notes={notes}, interview_date={interview_date}")
        
        # Validate status
        valid_statuses = [status[0] for status in JobApplication.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return JsonResponse({
                'error': f'Invalid status. Valid statuses are: {", ".join(valid_statuses)}'
            }, status=400)
        
        # Update application
        application.status = new_status
        application.employer_notes = notes
        
        # Handle interview date if provided
        if interview_date and new_status == 'interview':
            try:
                # Try different date formats
                try:
                    application.interview_date = datetime.strptime(interview_date, '%Y-%m-%dT%H:%M')
                except ValueError:
                    try:
                        application.interview_date = datetime.fromisoformat(interview_date)
                    except ValueError:
                        # If all else fails, just use the current date/time
                        application.interview_date = timezone.now()
                        return JsonResponse({
                            'error': 'Could not parse interview date. Using current date instead.'
                        }, status=400)
                
                # Set interview location if provided
                if hasattr(application, 'interview_location') and interview_location:
                    application.interview_location = interview_location
            except Exception as e:
                print(f"Error parsing interview date: {str(e)}")
                return JsonResponse({'error': f'Invalid interview date format: {str(e)}'}, status=400)
        
        application.save()
        
        # Send email notification to the applicant
        try:
            # Get the employee and job information
            employee = application.employee
            job = application.job
            
            # Get status display name
            status_display = dict(JobApplication.STATUS_CHOICES).get(new_status, new_status)
            
            # For simplified UI, map hired to Accept and rejected to Decline
            if new_status == 'hired':
                status_display = 'Accept'
            elif new_status == 'rejected':
                status_display = 'Decline'
            
            # Prepare email context
            context = {
                'employee_name': employee.username,
                'job_title': job.title,
                'company_name': employer.company_name,
                'status': status_display,
                'notes': notes,
                'application_date': application.application_date.strftime('%B %d, %Y'),
            }
            
            # Prepare email subject based on status
            if new_status == 'hired':
                subject = f"Congratulations! Your application for {job.title} has been accepted"
                template_name = 'application_accepted'
            elif new_status == 'rejected':
                subject = f"Update on your application for {job.title}"
                template_name = 'application_declined'
            else:
                subject = f"Update on your application for {job.title}"
                template_name = 'application_status_update'
            
            # Render email templates
            email_html = render_to_string(f'employer/email/{template_name}.html', context)
            email_text = render_to_string(f'employer/email/{template_name}.txt', context)
            
            # Send the email
            send_mail(
                subject,
                email_text,
                settings.DEFAULT_FROM_EMAIL,
                [employee.email],
                html_message=email_html,
                fail_silently=False,
            )
            
            print(f"Email notification sent to {employee.email}")
            
        except Exception as e:
            # Log the error but don't fail the status update
            import traceback
            print(f"Error sending email notification: {str(e)}")
            print(traceback.format_exc())
        
        return JsonResponse({
            'success': True,
            'message': f'Application status updated to {new_status}'
        })
    except JobApplication.DoesNotExist:
        return JsonResponse({'error': 'Application not found'}, status=404)
    except Exception as e:
        import traceback
        print(f"Error in update_application_status: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)

# Add new view function to handle the contact form submission for employers
@require_http_methods(["POST"])
def send_contact_message(request):
    """Send contact message from employer to admin"""
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
                    'message': 'All fields are required'
                })
            
            # Get employer info if logged in
            employer_username = request.session.get('employer_username', 'Anonymous')
            
            # Prepare email content
            from_email = settings.DEFAULT_FROM_EMAIL
            recipient = settings.EMAIL_HOST_USER  # Send to the host email from settings.py
            email_subject = f"Employer Contact Form: {subject}"
            
            email_message = f"""
            Contact Form Submission from GeoConnect (Employer Portal)
            
            Name: {name}
            Email: {email}
            Employer Username: {employer_username}
            Subject: {subject}
            
            Message:
            {message}
            
            This message was sent from the GeoConnect employer contact form.
            """
            
            # Send email
            send_mail(
                email_subject,
                email_message,
                from_email,
                [recipient],
                fail_silently=False,
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Your message has been sent successfully! We will get back to you soon.'
            })
            
        except Exception as e:
            print(f"Error sending employer contact email: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': 'An error occurred while sending your message. Please try again later.'
            })
    
    return JsonResponse({
        'success': False,
        'message': 'Invalid request method'
    })

# Add this view function
def employee_profile(request, employee_id):
    """View an employee's profile"""
    # Check if user is logged in
    employer_username = request.session.get('employer_username')
    if not employer_username:
        messages.error(request, "Please login to access this page.")
        return redirect('employer_login')
    
    try:
        # Get the employee
        from employee.models import Employee
        employee = get_object_or_404(Employee, id=employee_id)
        
        context = {
            'employee': employee,
            'username': employer_username,
        }
        return render(request, 'employer/employee_profile.html', context)
    except Exception as e:
        messages.error(request, f"Error viewing profile: {str(e)}")
        return redirect('candidate_recommendations')
