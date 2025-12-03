from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import user_passes_test, login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods, require_POST
from django.core.exceptions import PermissionDenied
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
import json
from django.core.mail import send_mail
from django.conf import settings
from django.db import models
from utils.email_utils import send_email_with_timeout

# Update these imports to use the correct model locations
from employer.models import Employer  # Changed from .models
from employee.models import Employee  # Changed from .models
from .forms import AdminLoginForm
from .models import AdminUser


def is_admin(user):
    return user.is_authenticated and user.is_admin

def admin_login(request):
    if request.user.is_authenticated and request.user.is_admin:
        return redirect('admin_panel:dashboard')
        
    if request.method == 'POST':
        form = AdminLoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(request, username=username, password=password)
            if user is not None and user.is_admin:
                login(request, user)
                messages.success(request, 'Login successful!')
                return redirect('admin_panel:dashboard')
            else:
                messages.error(request, 'Invalid username or password')
    else:
        form = AdminLoginForm()
    return render(request, 'admin_panel/login.html', {'form': form})

@login_required
@user_passes_test(is_admin)
def admin_dashboard(request):
    try:
        search_query = request.GET.get('search', '')
        status_filter = request.GET.get('status', 'all')
        
        employees = Employee.objects.all()
        employers = Employer.objects.all()
        
        # Apply search filter
        if search_query:
            employees = employees.filter(
                models.Q(username__icontains=search_query) |
                models.Q(email__icontains=search_query) |
                models.Q(first_name__icontains=search_query) |
                models.Q(last_name__icontains=search_query)
            )
            employers = employers.filter(
                models.Q(username__icontains=search_query) |
                models.Q(email__icontains=search_query) |
                models.Q(company_name__icontains=search_query)
            )
        
        # Apply status filter
        if status_filter == 'active':
            employees = employees.filter(is_active=True)
            employers = employers.filter(is_active=True)
        elif status_filter == 'inactive':
            employees = employees.filter(is_active=False)
            employers = employers.filter(is_active=False)
        elif status_filter == 'pending':
            employees = employees.filter(is_approved__isnull=True)
            employers = employers.filter(is_approved__isnull=True)
        elif status_filter == 'approved':
            employees = employees.filter(is_approved=True)
            employers = employers.filter(is_approved=True)
        elif status_filter == 'rejected':
            employees = employees.filter(is_approved=False, rejection_reason__isnull=False)
            employers = employers.filter(is_approved=False, rejection_reason__isnull=False)
        
        # Order by date joined
        employees = employees.order_by('-date_joined')
        employers = employers.order_by('-date_joined')
        
        context = {
            'employees': employees,
            'employers': employers,
            'search_query': search_query,
            'status_filter': status_filter,
        }
        return render(request, 'admin_panel/dashboard.html', context)
    except Exception as e:
        messages.error(request, f'Error loading dashboard: {str(e)}')
        return render(request, 'admin_panel/dashboard.html', {'employees': [], 'employers': []})

# Update the approval_dashboard view to properly filter employers
@login_required
@user_passes_test(is_admin)
def approval_dashboard(request):
    # Pending employees
    pending_employees = Employee.objects.filter(
        is_approved=False,
        rejection_reason__isnull=True
    ).order_by('-date_joined')
    
    # Pending employers
    pending_employers = Employer.objects.filter(
        is_approved=False,
        rejection_reason__isnull=True
    ).order_by('-date_joined')
    
    # Approved employees
    approved_employees = Employee.objects.filter(
        is_approved=True
    ).order_by('-approval_date')
    
    # Approved employers
    approved_employers = Employer.objects.filter(
        is_approved=True
    ).order_by('-approval_date')
    
    # Rejected employees
    rejected_employees = Employee.objects.filter(
        is_approved=False,
        rejection_reason__isnull=False
    ).order_by('-date_joined')
    
    # Rejected employers
    rejected_employers = Employer.objects.filter(
        is_approved=False,
        rejection_reason__isnull=False
    ).order_by('-date_joined')
    
    context = {
        'pending_employees': pending_employees,
        'pending_employers': pending_employers,
        'approved_employees': approved_employees,
        'approved_employers': approved_employers,
        'rejected_employees': rejected_employees,
        'rejected_employers': rejected_employers,
    }
    
    return render(request, 'admin_panel/approval_dashboard.html', context)

@login_required
@user_passes_test(is_admin)
@require_http_methods(["GET"])
def get_employer_details(request, employer_id):
    try:
        employer = Employer.objects.get(id=employer_id)
        
        # Handle the registration_types field (which is now a list)
        registration_types = employer.registration_types.split(',') if employer.registration_types else []
        
        # Create a dictionary for all document URLs
        document_urls = {
            'business_permit': employer.business_permit.url if employer.business_permit else None,
            'registration_document': employer.registration_document.url if employer.registration_document else None,
            'barangay_clearance': employer.barangay_clearance.url if hasattr(employer, 'barangay_clearance') and employer.barangay_clearance else None,
            'mayors_permit': employer.mayors_permit.url if hasattr(employer, 'mayors_permit') and employer.mayors_permit else None,
            'bir_certificate': employer.bir_certificate.url if hasattr(employer, 'bir_certificate') and employer.bir_certificate else None,
            'sanitary_permit': employer.sanitary_permit.url if hasattr(employer, 'sanitary_permit') and employer.sanitary_permit else None,
            'fda_permit': employer.fda_permit.url if hasattr(employer, 'fda_permit') and employer.fda_permit else None,
            'labeling_compliance': employer.labeling_compliance.url if hasattr(employer, 'labeling_compliance') and employer.labeling_compliance else None,
        }
        
        data = {
            'company_name': employer.company_name,
            'email': employer.email,
            'company_description': employer.company_description,
            'company_website': employer.company_website,
            'company_location': employer.company_location,
            'industry': employer.industry,
            'registration_types': registration_types,
            'registration_number': employer.registration_number,
            'registration_date': employer.registration_date.strftime('%Y-%m-%d') if employer.registration_date else None,
            'date_joined': employer.date_joined.strftime('%Y-%m-%d'),
            'is_active': employer.is_active,
            'is_verified': employer.is_verified,
            'document_urls': document_urls
        }
        return JsonResponse(data)
    except Employer.DoesNotExist:
        return JsonResponse({'error': 'Employer not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# Update the approve_employer and reject_employer views
@login_required
@user_passes_test(is_admin)
@require_http_methods(["POST"])
def approve_employer(request, employer_id):
    try:
        employer = Employer.objects.get(id=employer_id)
        
        # Update employer status
        employer.is_approved = True
        employer.approval_date = timezone.now()
        employer.rejection_reason = None
        employer.save()
        
        # Send email notification
        try:
            subject = 'Your GEOCONNECT Account has been approved'
            message = f'''Dear {employer.company_name},

Your employer account has been approved. You can now log in to GEOCONNECT and start posting jobs.

Best regards,
The GEOCONNECT Team'''
            
            success, error = send_email_with_timeout(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [employer.email],
                timeout=12
            )
            if not success:
                print(f"Email error: {error}")  # Log email errors but don't fail the request
        except Exception as e:
            print(f"Email error: {str(e)}")  # Log email errors but don't fail the request
        
        return JsonResponse({
            'success': True,
            'message': f'Employer {employer.company_name} has been approved'
        })
    except Employer.DoesNotExist:
        return JsonResponse({'error': 'Employer not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@user_passes_test(is_admin)
@require_http_methods(["POST"])
def reject_employer(request, employer_id):
    try:
        data = json.loads(request.body)
        rejection_reason = data.get('rejection_reason', '').strip()
        
        if not rejection_reason:
            return JsonResponse({
                'error': 'Rejection reason is required'
            }, status=400)
        
        employer = Employer.objects.get(id=employer_id)
        
        # Store the original values before updating
        company_name = employer.company_name
        registration_types = employer.registration_types
        
        # Update employer status
        employer.is_approved = False
        employer.rejection_reason = rejection_reason
        employer.save()
        
        # Try to send email, but don't fail if it doesn't work
        try:
            subject = 'Your GEOCONNECT Account application was not approved'
            message = f'''Dear {employer.company_name},

Your employer account application was not approved.

Reason: {rejection_reason}

Please address the issues mentioned and try again.

Best regards,
The GEOCONNECT Team'''
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [employer.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Email error: {str(e)}")  # Log the error but continue processing
        
        # Return success response with employer details
        return JsonResponse({
            'success': True,
            'message': f'Employer {employer.company_name} has been rejected',
            'employer': {
                'id': employer.id,
                'company_name': company_name,
                'registration_types': registration_types
            }
        })
        
    except Employer.DoesNotExist:
        return JsonResponse({
            'error': 'Employer not found'
        }, status=404)
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)

# Add this new view for reconsidering rejected applications
@login_required
@user_passes_test(is_admin)
@require_http_methods(["POST"])
def reconsider_employer(request, employer_id):
    try:
        employer = Employer.objects.get(id=employer_id)
        
        # Set is_approved to False (pending) instead of None
        employer.is_approved = False
        employer.rejection_reason = None  # Clear the rejection reason
        employer.is_verified = True  # Ensure the employer is marked as verified
        employer.save()
        
        # Try to send email notification
        try:
            subject = 'Your GEOCONNECT Account application is being reconsidered'
            message = f'''Dear {employer.company_name},

Your employer account application has been moved back to pending review.

We will review your application again and notify you of our decision.

Best regards,
The GEOCONNECT Team'''
            
            success, error = send_email_with_timeout(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [employer.email],
                timeout=12
            )
            if not success:
                print(f"Email error: {error}")  # Log the error but continue processing
        except Exception as e:
            print(f"Email error: {str(e)}")  # Log the error but continue processing
        
        return JsonResponse({
            'success': True,
            'message': f'Employer {employer.company_name} has been moved back to pending',
            'employer': {
                'id': employer.id,
                'company_name': employer.company_name,
                'registration_types': employer.registration_types,
                'business_permit_url': employer.business_permit.url if employer.business_permit else None,
                'registration_document_url': employer.registration_document.url if employer.registration_document else None,
            }
        })
        
    except Employer.DoesNotExist:
        return JsonResponse({'error': 'Employer not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def admin_logout(request):
    logout(request)
    messages.success(request, 'Logged out successfully!')
    return redirect('admin_panel:login')

# API endpoints
@login_required
@user_passes_test(is_admin)
@require_http_methods(["GET"])
def get_user_details(request, user_id, user_type):
    try:
        if user_type == 'employee':
            user = Employee.objects.get(id=user_id)
            data = {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'phone': user.phone,
                'location': user.location,
                'job_title': user.job_title,
                'years_of_experience': user.years_of_experience,
                'document': user.document.url if user.document else None,
                'date_joined': user.date_joined.strftime('%Y-%m-%d'),
                'is_active': user.is_active,
                'skills': user.skills,
                'education': user.education,
                'certifications': user.certifications,
                'preferred_job_type': user.preferred_job_type,
                'expected_salary': str(user.expected_salary) if user.expected_salary else None,
                'remote_work_preference': user.remote_work_preference,
                'willing_to_relocate': user.willing_to_relocate,
            }
        else:  # employer
            user = Employer.objects.get(id=user_id)
            data = {
                'company_name': user.company_name,
                'email': user.email,
                'company_description': user.company_description,
                'company_website': user.company_website,
                'company_location': user.company_location,
                'industry': user.industry,
                'registration_types': user.registration_types.split(',') if user.registration_types else [],
                'registration_number': user.registration_number,
                'registration_date': user.registration_date.strftime('%Y-%m-%d') if user.registration_date else None,
                'date_joined': user.date_joined.strftime('%Y-%m-%d'),
                'is_active': user.is_active,
                'is_verified': user.is_verified,
            }
        return JsonResponse(data)
    except (Employee.DoesNotExist, Employer.DoesNotExist):
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@user_passes_test(is_admin)
@require_http_methods(["POST"])
def toggle_user_status(request, user_type, user_id):
    try:
        if user_type == 'employee':
            user = Employee.objects.get(id=user_id)
        else:
            user = Employer.objects.get(id=user_id)
        
        user.is_active = not user.is_active
        user.save()
        
        return JsonResponse({
            'success': True,
            'message': f'User status updated successfully',
            'new_status': user.is_active
        })
    except (Employee.DoesNotExist, Employer.DoesNotExist):
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@user_passes_test(is_admin)
@require_http_methods(["POST"])
def toggle_employer_verification(request, employer_id):
    try:
        employer = Employer.objects.get(id=employer_id)
        employer.is_verified = not employer.is_verified
        employer.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Employer verification status updated successfully',
            'new_status': employer.is_verified
        })
    except Employer.DoesNotExist:
        return JsonResponse({'error': 'Employer not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["POST"])
def delete_user(request, type, id):
    try:
        if type == 'employer':
            user = get_object_or_404(Employer, id=id)
        elif type == 'employee':
            user = get_object_or_404(Employee, id=id)
        else:
            return JsonResponse({'error': 'Invalid user type'}, status=400)
        
        # Delete the user
        user.delete()
        
        return JsonResponse({
            'message': f'{type.capitalize()} deleted successfully',
            'status': 'success'
        })
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'status': 'error'
        }, status=500)

# Add these new employee approval functions
@login_required
@user_passes_test(is_admin)
@require_http_methods(["GET"])
def get_employee_details(request, employee_id):
    try:
        employee = Employee.objects.get(id=employee_id)
        full_name = employee.full_name or employee.username
        data = {
            'username': employee.username,
            'email': employee.email,
            'full_name': full_name,
            'phone': employee.phone,
            'location': employee.location,
            'job_title': employee.job_title,
            'years_of_experience': employee.years_of_experience,
            'document': employee.document.url if employee.document else None,
            'date_joined': employee.date_joined.strftime('%Y-%m-%d'),
            'skills': employee.skills,
            'education': employee.education,
            'certifications': employee.certifications,
            'preferred_job_type': employee.preferred_job_type,
            'expected_salary': str(employee.expected_salary) if employee.expected_salary else None,
            'remote_work_preference': employee.remote_work_preference,
            'willing_to_relocate': employee.willing_to_relocate,
        }
        return JsonResponse(data)
    except Employee.DoesNotExist:
        return JsonResponse({'error': 'Employee not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@user_passes_test(is_admin)
@require_http_methods(["POST"])
def approve_employee(request, employee_id):
    try:
        employee = Employee.objects.get(id=employee_id)
        
        # Update employee status
        employee.is_approved = True
        employee.approval_date = timezone.now()
        employee.rejection_reason = None
        employee.save()
        
        # Send email notification
        try:
            subject = 'Your GEOCONNECT Account has been approved'
            message = f'''Dear {employee.first_name} {employee.last_name},

Your GEOCONNECT account has been approved. You can now log in and start applying for jobs.

Best regards,
The GEOCONNECT Team'''
            
            success, error = send_email_with_timeout(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [employee.email],
                timeout=12
            )
            if not success:
                print(f"Email error: {error}")
        except Exception as e:
            print(f"Email error: {str(e)}")
        
        return JsonResponse({
            'success': True,
            'message': f'Employee {employee.first_name} {employee.last_name} has been approved',
            'employee': {
                'id': employee.id,
                'first_name': employee.first_name,
                'last_name': employee.last_name,
                'job_title': employee.job_title,
                'approval_date': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        })
    except Employee.DoesNotExist:
        return JsonResponse({'error': 'Employee not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@user_passes_test(is_admin)
@require_http_methods(["POST"])
def reject_employee(request, employee_id):
    try:
        data = json.loads(request.body)
        rejection_reason = data.get('rejection_reason', '').strip()
        
        if not rejection_reason:
            return JsonResponse({
                'error': 'Rejection reason is required'
            }, status=400)
        
        employee = Employee.objects.get(id=employee_id)
        
        # Update employee status
        employee.is_approved = False
        employee.rejection_reason = rejection_reason
        employee.save()
        
        # Send email notification
        try:
            subject = 'Your GEOCONNECT Account application was not approved'
            message = f'''Dear {employee.first_name} {employee.last_name},

Your GEOCONNECT account application was not approved.

Reason: {rejection_reason}

Please address the issues mentioned and try again.

Best regards,
The GEOCONNECT Team'''
            
            success, error = send_email_with_timeout(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [employee.email],
                timeout=12
            )
            if not success:
                print(f"Email error: {error}")
        except Exception as e:
            print(f"Email error: {str(e)}")
        
        return JsonResponse({
            'success': True,
            'message': f'Employee application rejected',
            'employee': {
                'id': employee.id,
                'first_name': employee.first_name,
                'last_name': employee.last_name,
                'job_title': employee.job_title,
                'rejection_reason': rejection_reason
            }
        })
        
    except Employee.DoesNotExist:
        return JsonResponse({'error': 'Employee not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@user_passes_test(is_admin)
@require_http_methods(["POST"])
def reconsider_employee(request, employee_id):
    try:
        employee = Employee.objects.get(id=employee_id)
        
        # Reset approval status
        employee.is_approved = False  # Set back to pending
        employee.rejection_reason = None
        employee.approval_date = None
        employee.save()
        
        # Send email notification
        try:
            subject = 'Your GEOCONNECT Account application is being reconsidered'
            message = f'''Dear {employee.first_name} {employee.last_name},

Your GEOCONNECT account application has been moved back to pending review.

We will review your application again and notify you of our decision.

Best regards,
The GEOCONNECT Team'''
            
            success, error = send_email_with_timeout(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [employee.email],
                timeout=12
            )
            if not success:
                print(f"Email error: {error}")
        except Exception as e:
            print(f"Email error: {str(e)}")
        
        return JsonResponse({
            'success': True,
            'message': f'Employee application moved back to pending review',
            'employee': {
                'id': employee.id,
                'first_name': employee.first_name,
                'last_name': employee.last_name,
                'job_title': employee.job_title,
                'document_url': employee.document.url if employee.document else None,
            }
        })
        
    except Employee.DoesNotExist:
        return JsonResponse({'error': 'Employee not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@user_passes_test(is_admin)
def employee_approval_dashboard(request):
    # Pending employees
    pending_employees = Employee.objects.filter(
        is_approved=False,
        rejection_reason__isnull=True
    ).order_by('-date_joined')
    
    # Approved employees
    approved_employees = Employee.objects.filter(
        is_approved=True
    ).order_by('-approval_date')
    
    # Rejected employees
    rejected_employees = Employee.objects.filter(
        is_approved=False,
        rejection_reason__isnull=False
    ).order_by('-date_joined')
    
    context = {
        'pending_employees': pending_employees,
        'approved_employees': approved_employees,
        'rejected_employees': rejected_employees,
    }
    
    return render(request, 'admin_panel/employee_approval_dashboard.html', context)

@login_required
@user_passes_test(is_admin)
def user_monitoring_dashboard(request):
    """Dashboard for monitoring all users and their activities"""
    try:
        # Get all users with their counts
        total_employees = Employee.objects.count()
        total_employers = Employer.objects.count()
        active_employees = Employee.objects.filter(is_active=True).count()
        active_employers = Employer.objects.filter(is_active=True).count()
        pending_employees = Employee.objects.filter(is_approved__isnull=True).count()
        pending_employers = Employer.objects.filter(is_approved__isnull=True).count()
        
        # Get recent activities
        recent_employees = Employee.objects.all().order_by('-date_joined')[:10]
        recent_employers = Employer.objects.all().order_by('-date_joined')[:10]
        
        # Get job statistics
        from employer.models import Job
        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(status__iexact='active').count()
        
        # Get application statistics
        from employer.models import JobApplication
        total_applications = JobApplication.objects.count()
        
        context = {
            'total_employees': total_employees,
            'total_employers': total_employers,
            'active_employees': active_employees,
            'active_employers': active_employers,
            'pending_employees': pending_employees,
            'pending_employers': pending_employers,
            'recent_employees': recent_employees,
            'recent_employers': recent_employers,
            'total_jobs': total_jobs,
            'active_jobs': active_jobs,
            'total_applications': total_applications,
        }
        return render(request, 'admin_panel/user_monitoring.html', context)
    except Exception as e:
        messages.error(request, f'Error loading monitoring dashboard: {str(e)}')
        return render(request, 'admin_panel/user_monitoring.html', {})



@login_required
@user_passes_test(is_admin)
def jobs_monitoring(request):
    """Monitor all jobs posted by employers"""
    try:
        # Import at the top level to avoid import issues
        from employer.models import Job
        from django.db import models
        
        search_query = request.GET.get('search', '')
        status_filter = request.GET.get('status', 'all')
        job_type_filter = request.GET.get('job_type', 'all')
        work_setup_filter = request.GET.get('work_setup', 'all')
        experience_level_filter = request.GET.get('experience_level', 'all')
        employer_filter = request.GET.get('employer', '')
        
        # Start with base query - first get all jobs without select_related to debug
        all_jobs = Job.objects.all()
        print(f"DEBUG: All jobs count: {all_jobs.count()}")
        
        # Check if there are any jobs without employers
        jobs_without_employers = all_jobs.filter(employer__isnull=True)
        print(f"DEBUG: Jobs without employers: {jobs_without_employers.count()}")
        
        # Now get jobs with select_related
        jobs = all_jobs.select_related('employer')
        
        # Apply search filter
        if search_query:
            jobs = jobs.filter(
                models.Q(title__icontains=search_query) |
                models.Q(description__icontains=search_query) |
                models.Q(location__icontains=search_query) |
                models.Q(employer__company_name__icontains=search_query)
            )
        
        # Apply status filter
        if status_filter != 'all':
            if status_filter == 'active':
                jobs = jobs.filter(status__iexact='active')
            elif status_filter == 'closed':
                jobs = jobs.filter(status__iexact='closed')
        
        # Apply job type filter
        if job_type_filter != 'all':
            jobs = jobs.filter(job_type=job_type_filter)
        
        # Apply work setup filter
        if work_setup_filter != 'all':
            jobs = jobs.filter(work_setup=work_setup_filter)
        
        # Apply experience level filter
        if experience_level_filter != 'all':
            jobs = jobs.filter(experience_level=experience_level_filter)
        
        # Apply employer filter
        if employer_filter:
            jobs = jobs.filter(employer__company_name__icontains=employer_filter)
        
        # Annotate with applications count using the correct related name
        from django.db.models import Count, Value
        from django.db.models.functions import Coalesce
        
        # Use the correct related_name from JobApplication model
        try:
            jobs = jobs.annotate(
                applications_count=Coalesce(Count('jobapplication'), Value(0))
            ).order_by('-created_at')
            print(f"DEBUG: After annotation, jobs count: {jobs.count()}")
        except Exception as e:
            print(f"DEBUG: Error in annotation: {e}")
            # Fallback to basic query without annotation
            jobs = jobs.order_by('-created_at')
            print(f"DEBUG: Fallback jobs count: {jobs.count()}")
        
        # Get statistics
        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(status__iexact='active').count()
        closed_jobs = Job.objects.filter(status__iexact='closed').count()
        
        # Debug information
        print(f"DEBUG: Total jobs found: {jobs.count()}")
        print(f"DEBUG: Jobs data: {list(jobs.values('id', 'title', 'status', 'employer__company_name'))}")
        print(f"DEBUG: Raw Job.objects.all() count: {Job.objects.all().count()}")
        print(f"DEBUG: Raw Job.objects.filter(status__iexact='active').count(): {Job.objects.filter(status__iexact='active').count()}")
        
        # Convert to list to ensure it's evaluated
        jobs_list = list(jobs)
        print(f"DEBUG: Final jobs list length: {len(jobs_list)}")
        
        context = {
            'jobs': jobs_list,
            'search_query': search_query,
            'status_filter': status_filter,
            'job_type_filter': job_type_filter,
            'work_setup_filter': work_setup_filter,
            'experience_level_filter': experience_level_filter,
            'employer_filter': employer_filter,
            'total_jobs': total_jobs,
            'active_jobs': active_jobs,
            'closed_jobs': closed_jobs,
        }
        
        return render(request, 'admin_panel/jobs_monitoring.html', context)
    except Exception as e:
        print(f"DEBUG: Error in jobs_monitoring: {str(e)}")
        messages.error(request, f'Error loading jobs monitoring: {str(e)}')
        return render(request, 'admin_panel/jobs_monitoring.html', {
            'jobs': [],
            'total_jobs': 0,
            'active_jobs': 0,
            'closed_jobs': 0,
            'search_query': '',
            'status_filter': 'all',
            'job_type_filter': 'all',
            'work_setup_filter': 'all',
            'experience_level_filter': 'all',
            'employer_filter': ''
        })

@login_required
@user_passes_test(is_admin)
def get_job_details(request, job_id):
    """Get detailed information about a specific job"""
    try:
        from employer.models import Job
        from django.db.models import Count, Value
        from django.db.models.functions import Coalesce
        
        job = Job.objects.select_related('employer').annotate(
            applications_count=Coalesce(Count('jobapplication'), Value(0))
        ).get(id=job_id)
        
        # Serialize job data
        job_data = {
            'id': job.id,
            'title': job.title,
            'location': job.location,
            'job_type': job.job_type,
            'work_setup': job.work_setup,
            'description': job.description,
            'salary_range': job.salary_range,
            'experience_level': job.experience_level,
            'status': job.status,
            'created_at': job.created_at.isoformat(),
            'updated_at': job.updated_at.isoformat(),
            'applications_count': job.applications_count,
            'requirements': job.requirements,
            'employer': {
                'id': job.employer.id,
                'username': job.employer.username,
                'email': job.employer.email,
                'company_name': job.employer.company_name,
                'company_description': job.employer.company_description,
                'company_website': job.employer.company_website,
                'company_location': job.employer.company_location,
                'industry': job.employer.industry,
            }
        }
        
        return JsonResponse({
            'success': True,
            'job': job_data
        })
        
    except Job.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Job not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@user_passes_test(is_admin)
def get_application_details(request, application_id):
    """Get detailed information about a specific job application"""
    try:
        from employer.models import JobApplication
        
        application = JobApplication.objects.select_related(
            'employee', 'job', 'job__employer'
        ).get(id=application_id)
        
        # Serialize application data
        application_data = {
            'id': application.id,
            'employee_name': f"{application.employee.first_name} {application.employee.last_name}".strip() or application.employee.username,
            'employee_email': application.employee.email,
            'employee_username': application.employee.username,
            'job_title': application.job.title,
            'job_location': application.job.location,
            'job_type': application.job.job_type,
            'work_setup': application.job.work_setup,
            'experience_level': application.job.experience_level,
            'employer_company': application.job.employer.company_name or application.job.employer.username,
            'employer_email': application.job.employer.email,
            'status': application.status,
            'status_display': application.status.title(),
            'applied_date': application.application_date.strftime('%B %d, %Y') if application.application_date else 'N/A',
            'cover_letter': getattr(application, 'cover_letter', None),
        }
        
        return JsonResponse({
            'success': True,
            'application': application_data
        })
        
    except JobApplication.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Application not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@user_passes_test(is_admin)
def applications_monitoring(request):
    """Monitor all job applications"""
    try:
        from employee.models import JobApplication as EmployeeJobApplication
        from employer.models import JobApplication as EmployerJobApplication
        
        search_query = request.GET.get('search', '')
        status_filter = request.GET.get('status', 'all')
        job_filter = request.GET.get('job', '')
        
        # Get applications from the employer JobApplication model (which is the main one)
        from employer.models import JobApplication
        
        applications = JobApplication.objects.select_related('employee', 'job', 'job__employer').all()
        
        # Apply search filter
        if search_query:
            applications = applications.filter(
                models.Q(employee__username__icontains=search_query) |
                models.Q(employee__email__icontains=search_query) |
                models.Q(job__title__icontains=search_query) |
                models.Q(job__employer__company_name__icontains=search_query)
            )
        
        # Apply status filter
        if status_filter != 'all':
            applications = applications.filter(status=status_filter)
        
        # Apply job filter
        if job_filter:
            applications = applications.filter(job__title__icontains=job_filter)
        
        # Order by application date
        applications = applications.order_by('-application_date')
        
        # Get statistics
        total_applications = applications.count()
        pending_applications = applications.filter(status='pending').count()
        accepted_applications = applications.filter(status='hired').count()
        rejected_applications = applications.filter(status='rejected').count()
        
        context = {
            'applications': applications,
            'search_query': search_query,
            'status_filter': status_filter,
            'job_filter': job_filter,
            'total_applications': total_applications,
            'pending_applications': pending_applications,
            'accepted_applications': accepted_applications,
            'rejected_applications': rejected_applications,
        }
        return render(request, 'admin_panel/applications_monitoring.html', context)
    except Exception as e:
        messages.error(request, f'Error loading applications monitoring: {str(e)}')
        return render(request, 'admin_panel/applications_monitoring.html', {})

@login_required
@user_passes_test(is_admin)
def system_reports(request):
    """Generate system reports for administrative analysis"""
    try:
        from django.db.models import Count, Q
        from django.utils import timezone
        from datetime import timedelta
        
        # Get date range for reports
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)  # Last 30 days
        
        # User registration statistics
        new_employees = Employee.objects.filter(date_joined__gte=start_date).count()
        new_employers = Employer.objects.filter(date_joined__gte=start_date).count()
        
        # Approval statistics
        pending_employees = Employee.objects.filter(is_approved__isnull=True).count()
        pending_employers = Employer.objects.filter(is_approved__isnull=True).count()
        approved_employees = Employee.objects.filter(is_approved=True).count()
        approved_employers = Employer.objects.filter(is_approved=True).count()
        rejected_employees = Employee.objects.filter(is_approved=False, rejection_reason__isnull=False).count()
        rejected_employers = Employer.objects.filter(is_approved=False, rejection_reason__isnull=False).count()
        
        # Job statistics
        from employer.models import Job
        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(status__iexact='active').count()
        jobs_this_month = Job.objects.filter(created_at__gte=start_date).count()
        
        # Application statistics
        from employer.models import JobApplication
        
        total_applications = JobApplication.objects.count()
        applications_this_month = JobApplication.objects.filter(application_date__gte=start_date).count()
        
        # Status breakdown
        application_statuses = JobApplication.objects.values('status').annotate(count=Count('status'))
        
        # Top employers by job count
        top_employers = Employer.objects.annotate(job_count=Count('jobs')).order_by('-job_count')[:10]
        
        # Top employees by application count
        top_employees = Employee.objects.annotate(application_count=Count('employee_applications')).order_by('-application_count')[:10]
        
        context = {
            'start_date': start_date,
            'end_date': end_date,
            'new_employees': new_employees,
            'new_employers': new_employers,
            'pending_employees': pending_employees,
            'pending_employers': pending_employers,
            'approved_employees': approved_employees,
            'approved_employers': approved_employers,
            'rejected_employees': rejected_employees,
            'rejected_employers': rejected_employers,
            'total_jobs': total_jobs,
            'active_jobs': active_jobs,
            'jobs_this_month': jobs_this_month,
            'total_applications': total_applications,
            'applications_this_month': applications_this_month,
            'application_statuses': application_statuses,
            'top_employers': top_employers,
            'top_employees': top_employees,
        }
        return render(request, 'admin_panel/system_reports.html', context)
    except Exception as e:
        messages.error(request, f'Error generating reports: {str(e)}')
        return render(request, 'admin_panel/system_reports.html', {})

@login_required
@user_passes_test(is_admin)
def export_report(request):
    """Export report data as CSV"""
    try:
        import csv
        from django.http import HttpResponse
        from django.utils import timezone
        
        report_type = request.GET.get('type', 'users')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        
        if report_type == 'users':
            writer.writerow(['Username', 'Email', 'Type', 'Status', 'Date Joined', 'Approval Status'])
            
            for employee in Employee.objects.all():
                status = 'Active' if employee.is_active else 'Inactive'
                approval_status = 'Approved' if employee.is_approved else 'Rejected' if employee.rejection_reason else 'Pending'
                writer.writerow([
                    employee.username,
                    employee.email,
                    'Employee',
                    status,
                    employee.date_joined.strftime('%Y-%m-%d'),
                    approval_status
                ])
            
            for employer in Employer.objects.all():
                status = 'Active' if employer.is_active else 'Inactive'
                approval_status = 'Approved' if employer.is_approved else 'Rejected' if employer.rejection_reason else 'Pending'
                writer.writerow([
                    employer.username,
                    employer.email,
                    'Employer',
                    status,
                    employer.date_joined.strftime('%Y-%m-%d'),
                    approval_status
                ])
        
        elif report_type == 'jobs':
            from employer.models import Job
            writer.writerow(['Job Title', 'Employer', 'Location', 'Status', 'Created Date', 'Applications'])
            
            for job in Job.objects.select_related('employer').annotate(
                applications_count=Coalesce(Count('jobapplication'), Value(0))
            ).all():
                writer.writerow([
                    job.title,
                    job.employer.company_name,
                    job.location,
                    job.status,
                    job.created_at.strftime('%Y-%m-%d'),
                    job.applications_count
                ])
        
        elif report_type == 'applications':
            from employer.models import JobApplication
            
            writer.writerow(['Employee', 'Job Title', 'Employer', 'Status', 'Application Date'])
            
            for app in JobApplication.objects.select_related('employee', 'job', 'job__employer').all():
                writer.writerow([
                    app.employee.username,
                    app.job.title,
                    app.job.employer.company_name,
                    app.status,
                    app.application_date.strftime('%Y-%m-%d')
                ])
        
        return response
    except Exception as e:
        messages.error(request, f'Error exporting report: {str(e)}')
        return redirect('admin_panel:system_reports')

def test_jobs_data(request):
    """Test view to check if jobs data is accessible without authentication"""
    try:
        from employer.models import Job
        from django.db.models import Count, Value
        from django.db.models.functions import Coalesce
        from django.http import HttpResponse
        
        # Get basic job counts
        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(status__iexact='active').count()
        closed_jobs = Job.objects.filter(status__iexact='closed').count()
        
        # Get sample jobs
        sample_jobs = Job.objects.select_related('employer').all()[:5]
        
        # Test the complex query
        jobs_with_apps = Job.objects.select_related('employer').annotate(
            applications_count=Coalesce(Count('jobapplication'), Value(0))
        ).order_by('-created_at')
        
        # Test the exact query from jobs_monitoring
        test_jobs = Job.objects.select_related('employer').all()
        test_jobs = test_jobs.annotate(
            applications_count=Coalesce(Count('jobapplication'), Value(0))
        ).order_by('-created_at')
        
        # Debug output
        debug_info = f"""
        <h2>Jobs Debug Information</h2>
        <p><strong>Total Jobs:</strong> {total_jobs}</p>
        <p><strong>Active Jobs:</strong> {active_jobs}</p>
        <p><strong>Closed Jobs:</strong> {closed_jobs}</p>
        <p><strong>Sample Jobs Count:</strong> {len(sample_jobs)}</p>
        <p><strong>Jobs with Apps Count:</strong> {jobs_with_apps.count()}</p>
        <p><strong>Test Jobs Count (from jobs_monitoring query):</strong> {test_jobs.count()}</p>
        
        <h3>Sample Jobs:</h3>
        <ul>
        """
        
        for job in sample_jobs:
            debug_info += f"<li>ID: {job.id}, Title: {job.title}, Status: {job.status}, Employer: {job.employer.company_name if job.employer.company_name else job.employer.username}</li>"
        
        debug_info += "</ul>"
        
        debug_info += "<h3>Test Jobs (from jobs_monitoring query):</h3><ul>"
        
        for job in test_jobs[:5]:
            debug_info += f"<li>ID: {job.id}, Title: {job.title}, Status: {job.status}, Applications: {job.applications_count}</li>"
        
        debug_info += "</ul>"
        
        return HttpResponse(debug_info, content_type="text/html")
        
    except Exception as e:
        return HttpResponse(f"Error: {str(e)}", content_type="text/plain")
