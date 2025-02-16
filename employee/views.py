from django.shortcuts import render, redirect
from django.contrib.auth.hashers import make_password, check_password
from django.contrib import messages
from .forms import EmployeeSignupForm, EmployeeLoginForm
from .models import Employee
# Update imports
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.utils import timezone
from .forms import PasswordResetForm, SetPasswordForm
from .tokens import password_reset_token  # Import our custom token generator


def employee_signup(request):
    if request.method == "POST":
        form = EmployeeSignupForm(request.POST)
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
            employee.save()
            messages.success(request, "Account created successfully! Please login.")
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
                messages.error(request, "Username not found. Please check your username or sign up.")
                return render(request, 'employee/employee_login.html', {'form': form})
            
            if not check_password(password, user.password):
                messages.error(request, "Incorrect password. Please try again.")
                return render(request, 'employee/employee_login.html', {'form': form})
            
            request.session['employee_id'] = user.id
            request.session['employee_username'] = username
            request.session['employee_email'] = user.email  # Add this line to store email in session
            messages.success(request, f"Welcome back, {username}!")
            return redirect('employee_home')
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
    
    context = {
        'employee': employee,
        'username': employee_username,
    }
    return render(request, 'employee/employee_home.html', context)

# Other views remain the same...

def employee_logout(request):
    try:
        # Clear specific session data
        request.session.pop('employee_username', None)
        request.session.pop('employee_id', None)
        messages.success(request, "You have been successfully logged out.")
        return redirect('employee_login')
    except Exception as e:
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

