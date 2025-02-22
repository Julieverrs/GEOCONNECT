from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.exceptions import PermissionDenied
from .forms import AdminLoginForm, AdminSignupForm
from .models import AdminUser
from employee.models import Employee
from employer.models import Employer
from django.contrib.auth.decorators import login_required

def is_admin(user):
    return user.is_authenticated and user.is_admin

def admin_login(request):
    if request.user.is_authenticated and request.user.is_admin:
        return redirect('admin_dashboard')
        
    if request.method == 'POST':
        form = AdminLoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(request, username=username, password=password)
            if user is not None and user.is_admin:
                login(request, user)
                messages.success(request, 'Login successful!')
                return redirect('admin_dashboard')
            else:
                messages.error(request, 'Invalid username or password')
    else:
        form = AdminLoginForm()
    return render(request, 'admin_panel/login.html', {'form': form})

@login_required
@user_passes_test(is_admin)
def admin_dashboard(request):
    try:
        # Fetch all employees and employers
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

def admin_logout(request):
    logout(request)
    messages.success(request, 'Logged out successfully!')
    return redirect('admin_login')

