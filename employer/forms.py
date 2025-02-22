from django import forms
from .models import Employer, Job

class EmployerSignupForm(forms.ModelForm):
    company_name = forms.CharField(max_length=255)
    password = forms.CharField(widget=forms.PasswordInput)
    confirm_password = forms.CharField(widget=forms.PasswordInput)
    
    # New fields for business registration
    registration_type = forms.ChoiceField(
        choices=Employer.REGISTRATION_TYPE_CHOICES,
        required=True,
        widget=forms.RadioSelect
    )
    business_permit = forms.FileField(
        required=True,
        help_text='Upload your business permit (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    registration_document = forms.FileField(
        required=True,
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

    class Meta:
        model = Employer
        fields = [
            'company_name', 'username', 'email', 'password',
            'registration_type', 'business_permit', 'registration_document',
            'registration_number', 'registration_date'
        ]

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")
        if password != confirm_password:
            raise forms.ValidationError("Passwords do not match.")
        return cleaned_data

class EmployerLoginForm(forms.Form):
    username = forms.CharField(max_length=150)
    password = forms.CharField(widget=forms.PasswordInput)
    
class JobPostForm(forms.ModelForm):
    class Meta:
        model = Job
        fields = ['title', 'location', 'job_type', 'description', 'salary_range', 'experience_level']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 5}),
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

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get('new_password1')
        password2 = cleaned_data.get('new_password2')

        if password1 and password2:
            if password1 != password2:
                raise forms.ValidationError("The passwords don't match")
        return cleaned_data

