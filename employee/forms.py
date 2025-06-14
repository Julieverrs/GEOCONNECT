from django import forms
from .models import Employee
import re

class EmployeeSignupForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    confirm_password = forms.CharField(widget=forms.PasswordInput)
    document = forms.FileField(required=False, help_text="Attach NBI clearance or other relevant permits")
    document_name = forms.CharField(max_length=100, required=False, help_text="Name of the attached document")

    class Meta:
        model = Employee
        fields = ['username', 'email', 'password', 'document', 'document_name']

    def clean_password(self):
        password = self.cleaned_data.get("password")
        
        # Check minimum length
        if len(password) < 8:
            raise forms.ValidationError("Password must be at least 8 characters long.")
        
        # Check for uppercase letter
        if not re.search(r'[A-Z]', password):
            raise forms.ValidationError("Password must contain at least one uppercase letter.")
        
        # Check for lowercase letter
        if not re.search(r'[a-z]', password):
            raise forms.ValidationError("Password must contain at least one lowercase letter.")
        
        # Check for digit
        if not re.search(r'[0-9]', password):
            raise forms.ValidationError("Password must contain at least one number.")
        
        # Check for special character
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>/?]', password):
            raise forms.ValidationError("Password must contain at least one special character.")
        
        # Check for common passwords
        common_passwords = ['password', '123456', 'qwerty', 'admin', 'welcome', 'password123']
        if password.lower() in common_passwords:
            raise forms.ValidationError("This password is too common. Please choose a stronger password.")
            
        return password

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")
        if password and confirm_password and password != confirm_password:
            raise forms.ValidationError("Passwords do not match.")
        return cleaned_data

class EmployeeLoginForm(forms.Form):
    username = forms.CharField(max_length=150)
    password = forms.CharField(widget=forms.PasswordInput)
    
class PasswordResetForm(forms.Form):
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter your email address'
        })
    )

class SetPasswordForm(forms.Form):
    new_password1 = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter new password'
        })
    )
    new_password2 = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Confirm new password'
        })
    )

    def clean_new_password1(self):
        password = self.cleaned_data.get("new_password1")
        
        # Check minimum length
        if len(password) < 8:
            raise forms.ValidationError("Password must be at least 8 characters long.")
        
        # Check for uppercase letter
        if not re.search(r'[A-Z]', password):
            raise forms.ValidationError("Password must contain at least one uppercase letter.")
        
        # Check for lowercase letter
        if not re.search(r'[a-z]', password):
            raise forms.ValidationError("Password must contain at least one lowercase letter.")
        
        # Check for digit
        if not re.search(r'[0-9]', password):
            raise forms.ValidationError("Password must contain at least one number.")
        
        # Check for special character
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>/?]', password):
            raise forms.ValidationError("Password must contain at least one special character.")
        
        # Check for common passwords
        common_passwords = ['password', '123456', 'qwerty', 'admin', 'welcome', 'password123']
        if password.lower() in common_passwords:
            raise forms.ValidationError("This password is too common. Please choose a stronger password.")
            
        return password

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get('new_password1')
        password2 = cleaned_data.get('new_password2')

        if password1 and password2:
            if password1 != password2:
                raise forms.ValidationError("The passwords don't match")
        return cleaned_data
