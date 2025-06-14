from django import forms
from .models import Employer, Job
import re
import json

class EmployerSignupForm(forms.ModelForm):
    company_name = forms.CharField(max_length=255)
    password = forms.CharField(widget=forms.PasswordInput)
    confirm_password = forms.CharField(widget=forms.PasswordInput)
    
    # Updated field for multiple registration types
    registration_types = forms.MultipleChoiceField(
        choices=Employer.REGISTRATION_TYPE_CHOICES,
        required=True,
        widget=forms.CheckboxSelectMultiple,
        help_text='Select at least one registration type'
    )
    
    # Document fields
    business_permit = forms.FileField(
        required=False,
        help_text='Upload your business permit (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    registration_document = forms.FileField(
        required=False,
        help_text='Upload your SEC/DTI registration document (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    registration_number = forms.CharField(
        max_length=50,
        required=True,
        help_text='Your SEC/DTI registration number'
    )
    registration_date = forms.DateField(
        required=True,
        widget=forms.DateInput(attrs={'type': 'date'}),
        help_text='Date of SEC/DTI registration'
    )
    
    # New document fields
    barangay_clearance = forms.FileField(
        required=False,
        help_text='Upload your Barangay Clearance (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    mayors_permit = forms.FileField(
        required=False,
        help_text='Upload your Mayor\'s Permit (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    bir_certificate = forms.FileField(
        required=False,
        help_text='Upload your BIR Certificate (Form 2303) (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    sanitary_permit = forms.FileField(
        required=False,
        help_text='Upload your Sanitary Permit (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    fda_permit = forms.FileField(
        required=False,
        help_text='Upload your FDA Permit (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    labeling_compliance = forms.FileField(
        required=False,
        help_text='Upload your DTI or FDA Labeling Compliance (PDF, JPG, JPEG, or PNG, max 10MB)'
    )

    class Meta:
        model = Employer
        fields = [
            'company_name', 'username', 'email', 'password',
            'registration_types', 'business_permit', 'registration_document',
            'registration_number', 'registration_date', 'barangay_clearance',
            'mayors_permit', 'bir_certificate', 'sanitary_permit',
            'fda_permit', 'labeling_compliance'
        ]

    def clean_registration_types(self):
        registration_types = self.cleaned_data.get('registration_types')
        if not registration_types:
            raise forms.ValidationError("Please select at least one registration type.")
        return json.dumps(list(registration_types))  # Store as JSON string

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
        
        # Check if passwords match
        if password and confirm_password and password != confirm_password:
            raise forms.ValidationError("Passwords do not match.")
        
        # Check if required documents are uploaded based on selected registration types
        registration_types = cleaned_data.get('registration_types', [])
        
        if isinstance(registration_types, str):
            try:
                registration_types = json.loads(registration_types)
            except:
                registration_types = []
        
        # Validate required documents based on selected types
        if 'SEC' in registration_types or 'DTI' in registration_types:
            if not cleaned_data.get('registration_document'):
                self.add_error('registration_document', 'Registration document is required for SEC/DTI registration.')
        
        if 'MAYOR' in registration_types:
            if not cleaned_data.get('mayors_permit'):
                self.add_error('mayors_permit', 'Mayor\'s Permit is required when selected.')
        
        if 'BRGY' in registration_types:
            if not cleaned_data.get('barangay_clearance'):
                self.add_error('barangay_clearance', 'Barangay Clearance is required when selected.')
        
        if 'BIR' in registration_types:
            if not cleaned_data.get('bir_certificate'):
                self.add_error('bir_certificate', 'BIR Certificate is required when selected.')
        
        if 'SANITARY' in registration_types:
            if not cleaned_data.get('sanitary_permit'):
                self.add_error('sanitary_permit', 'Sanitary Permit is required when selected.')
        
        if 'FDA' in registration_types:
            if not cleaned_data.get('fda_permit'):
                self.add_error('fda_permit', 'FDA Permit is required when selected.')
        
        if 'LABEL' in registration_types:
            if not cleaned_data.get('labeling_compliance'):
                self.add_error('labeling_compliance', 'Labeling Compliance document is required when selected.')
        
        return cleaned_data

class EmployerLoginForm(forms.Form):
    username = forms.CharField(max_length=150)
    password = forms.CharField(widget=forms.PasswordInput)
    
class JobPostForm(forms.ModelForm):
    class Meta:
        model = Job
        fields = [
            'title', 'location', 'job_type', 'description', 
            'salary_range', 'experience_level', 'requirements'  # Added requirements
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 5}),
            'requirements': forms.Textarea(attrs={'rows': 5}),
        }

class EmployerPasswordResetForm(forms.Form):
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter your email address'
        })
    )

class EmployerSetPasswordForm(forms.Form):
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
