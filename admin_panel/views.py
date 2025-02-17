from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import user_passes_test
from django.contrib import messages
from .forms import AdminLoginForm, AdminSignupForm
from .models import AdminUser

def is_admin(user):
    return user.is_authenticated and user.is_admin

def admin_login(request):
    if request.method == 'POST':
        form = AdminLoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(request, username=username, password=password)
            if user is not None and user.is_admin:
                login(request, user)
                return redirect('admin_dashboard')
            else:
                messages.error(request, 'Invalid username or password')
    else:
        form = AdminLoginForm()
    return render(request, 'admin_panel/login.html', {'form': form})

def admin_signup(request):
    if request.method == 'POST':
        form = AdminSignupForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.is_admin = True
            user.save()
            messages.success(request, 'Account created successfully. You can now log in.')
            return redirect('admin_login')
    else:
        form = AdminSignupForm()
    return render(request, 'admin_panel/signup.html', {'form': form})

@user_passes_test(is_admin)
def admin_dashboard(request):
    return render(request, 'admin_panel/dashboard.html')

def admin_logout(request):
    logout(request)
    return redirect('admin_login')

