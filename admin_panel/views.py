from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.exceptions import PermissionDenied
from django.views.decorators.csrf import csrf_exempt  # Add this import
from .forms import AdminLoginForm
from .models import AdminUser
from employee.models import Employee
from employer.models import Employer
from django.contrib.auth.decorators import login_required
from django.utils import timezone
import json
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST
from django.conf import settings


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
        employees = Employee.objects.all().order_by('-date_joined')
        employers = Employer.objects.all().order_by('-date_joined')
        
        context = {
            'employees': employees,
            'employers': employers,
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
        data = {
            'company_name': employer.company_name,
            'email': employer.email,
            'company_description': employer.company_description,
            'company_website': employer.company_website,
            'company_location': employer.company_location,
            'industry': employer.industry,
            'registration_type': employer.registration_type,
            'registration_number': employer.registration_number,
            'registration_date': employer.registration_date.strftime('%Y-%m-%d') if employer.registration_date else None,
            'date_joined': employer.date_joined.strftime('%Y-%m-%d')
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
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [employer.email],
                fail_silently=True,
            )
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
        registration_type = employer.registration_type
        
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
                'registration_type': registration_type
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
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [employer.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Email error: {str(e)}")  # Log the error but continue processing
        
        return JsonResponse({
            'success': True,
            'message': f'Employer {employer.company_name} has been moved back to pending',
            'employer': {
                'id': employer.id,
                'company_name': employer.company_name,
                'registration_type': employer.registration_type,
                'business_permit_url': employer.business_permit.url if employer.business_permit else None,
                'registration_document_url': employer.registration_document.url if employer.registration_document else None,
            }
        })
        
    except Employer.DoesNotExist:
        return JsonResponse({'error': 'Employer not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
        
@login_required
@user_passes_test(is_admin)
@require_http_methods(["GET"])
def get_employer_details(request, employer_id):
    try:
        employer = Employer.objects.get(id=employer_id)
        data = {
            'company_name': employer.company_name,
            'email': employer.email,
            'company_description': employer.company_description,
            'company_website': employer.company_website,
            'company_location': employer.company_location,
            'industry': employer.industry,
            'registration_type': employer.registration_type,
            'registration_number': employer.registration_number,
            'registration_date': employer.registration_date.strftime('%Y-%m-%d') if employer.registration_date else None,
            'date_joined': employer.date_joined.strftime('%Y-%m-%d'),
            # Add document URLs
            'business_permit_url': employer.business_permit.url if employer.business_permit else None,
            'registration_document_url': employer.registration_document.url if employer.registration_document else None,
        }
        return JsonResponse(data)
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
def get_user_details(request, user_type, user_id):
    try:
        if user_type == 'employee':
            user = Employee.objects.get(id=user_id)
            data = {
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'location': user.location,
                'job_title': user.job_title,
                'years_of_experience': user.years_of_experience,
                'document': user.document.url if user.document else None,
                'is_active': user.is_active,
                'date_joined': user.date_joined.strftime('%Y-%m-%d')
            }
        else:  # employer
            user = Employer.objects.get(id=user_id)
            data = {
                'company_name': user.company_name,
                'username': user.username,
                'email': user.email,
                'company_description': user.company_description,
                'company_website': user.company_website,
                'company_location': user.company_location,
                'industry': user.industry,
                'registration_type': user.registration_type,
                'registration_number': user.registration_number,
                'registration_date': user.registration_date.strftime('%Y-%m-%d') if user.registration_date else None,
                'is_verified': user.is_verified,
                'is_active': user.is_active,
                'date_joined': user.date_joined.strftime('%Y-%m-%d')
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

@login_required
@user_passes_test(is_admin)
@require_http_methods(["DELETE"])
def delete_user(request, user_type, user_id):
    try:
        if user_type == 'employee':
            user = Employee.objects.get(id=user_id)
        else:
            user = Employer.objects.get(id=user_id)
        
        user.delete()
        return JsonResponse({
            'success': True,
            'message': f'{user_type.capitalize()} deleted successfully'
        })
    except (Employee.DoesNotExist, Employer.DoesNotExist):
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# Add these new employee approval functions
@login_required
@user_passes_test(is_admin)
@require_http_methods(["GET"])
def get_employee_details(request, employee_id):
    try:
        employee = Employee.objects.get(id=employee_id)
        data = {
            'username': employee.username,
            'email': employee.email,
            'first_name': employee.first_name,
            'last_name': employee.last_name,
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
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [employee.email],
                fail_silently=True,
            )
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
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [employee.email],
                fail_silently=True,
            )
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
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [employee.email],
                fail_silently=True,
            )
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

