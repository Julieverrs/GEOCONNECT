from django.contrib.auth.hashers import make_password, check_password
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
import os

def validate_file_extension(value):
    valid_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
    ext = os.path.splitext(value.name)[1]
    if ext.lower() not in valid_extensions:
        raise ValidationError('Unsupported file extension. Please upload PDF, JPG, JPEG, or PNG files.')

def validate_file_size(value):
    filesize = value.size
    if filesize > 10 * 1024 * 1024:  # 10MB limit
        raise ValidationError('Maximum file size is 10MB')

class Employer(models.Model):
    REGISTRATION_TYPE_CHOICES = [
        ('SEC', 'SEC Registration'),
        ('DTI', 'DTI Registration'),
        ('BRGY', 'Barangay Clearance'),
        ('MAYOR', 'Mayor\'s Permit / Business Permit'),
        ('BIR', 'BIR Certificate of Registration (Form 2303)'),
        ('SANITARY', 'Sanitary Permit / Health Permit'),
        ('FDA', 'BFAD / FDA Permit'),
        ('LABEL', 'DTI or FDA Labeling Compliance'),
    ]

    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    company_name = models.CharField(max_length=255, blank=True)
    company_description = models.TextField(blank=True)
    company_website = models.URLField(blank=True)
    company_location = models.CharField(max_length=255, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    
    # Updated field for multiple registration types
    registration_types = models.CharField(
        max_length=255, 
        blank=True,
        help_text='Selected registration types'
    )
    
    # Document fields
    business_permit = models.FileField(
        upload_to='business_permits/',
        validators=[validate_file_extension, validate_file_size],
        blank=True,
        null=True,
        help_text='Upload your business permit (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    registration_document = models.FileField(
        upload_to='registration_documents/',
        validators=[validate_file_extension, validate_file_size],
        blank=True,
        null=True,
        help_text='Upload your SEC/DTI registration document (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    registration_number = models.CharField(
        max_length=50,
        blank=True,
        help_text='Your SEC/DTI registration number'
    )
    registration_date = models.DateField(
        null=True,
        blank=True,
        help_text='Date of SEC/DTI registration'
    )
    
    # New document fields
    barangay_clearance = models.FileField(
        upload_to='barangay_clearances/',
        validators=[validate_file_extension, validate_file_size],
        blank=True,
        null=True,
        help_text='Upload your Barangay Clearance (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    mayors_permit = models.FileField(
        upload_to='mayors_permits/',
        validators=[validate_file_extension, validate_file_size],
        blank=True,
        null=True,
        help_text='Upload your Mayor\'s Permit (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    bir_certificate = models.FileField(
        upload_to='bir_certificates/',
        validators=[validate_file_extension, validate_file_size],
        blank=True,
        null=True,
        help_text='Upload your BIR Certificate (Form 2303) (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    sanitary_permit = models.FileField(
        upload_to='sanitary_permits/',
        validators=[validate_file_extension, validate_file_size],
        blank=True,
        null=True,
        help_text='Upload your Sanitary Permit (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    fda_permit = models.FileField(
        upload_to='fda_permits/',
        validators=[validate_file_extension, validate_file_size],
        blank=True,
        null=True,
        help_text='Upload your FDA Permit (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    labeling_compliance = models.FileField(
        upload_to='labeling_compliance/',
        validators=[validate_file_extension, validate_file_size],
        blank=True,
        null=True,
        help_text='Upload your DTI or FDA Labeling Compliance (PDF, JPG, JPEG, or PNG, max 10MB)'
    )
    
    # Password reset fields
    last_login = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    approval_date = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.password.startswith('pbkdf2_sha256$'):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.username

class Job(models.Model):
    WORK_SETUP_CHOICES = [
        ('on-site', 'On-site'),
        ('hybrid', 'Hybrid'),
        ('remote', 'Remote'),
    ]
    
    JOB_TYPES = [
        ('full-time', 'Full-time'),
        ('part-time', 'Part-time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
        ('freelance', 'Freelance'),
    ]
    
    EXPERIENCE_LEVELS = [
        ('Entry Level', 'Entry Level'),
        ('Junior', 'Junior'),
        ('Mid Level', 'Mid Level'),
        ('Senior', 'Senior'),
        ('Lead', 'Lead'),
        ('Expert', 'Expert'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
    ]

    employer = models.ForeignKey('Employer', on_delete=models.CASCADE, related_name='jobs')
    title = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    job_type = models.CharField(max_length=20, choices=JOB_TYPES)
    work_setup = models.CharField(max_length=20, choices=WORK_SETUP_CHOICES)
    description = models.TextField()
    salary_range = models.CharField(max_length=100)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVELS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    requirements = models.TextField(blank=True, help_text='List the job requirements')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('shortlisted', 'Shortlisted'),
        ('rejected', 'Rejected'),
        ('scheduled_interview', 'Interview Scheduled'),
        ('interviewed', 'Interviewed'),
        ('offered', 'Job Offered'),
        ('hired', 'Hired'),
        ('declined', 'Declined')
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    employee = models.ForeignKey('employee.Employee', on_delete=models.CASCADE, related_name='employer_applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    application_date = models.DateTimeField(auto_now_add=True)
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)
    cover_letter = models.TextField(blank=True)
    employer_notes = models.TextField(blank=True)
    interview_date = models.DateTimeField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.username}'s application for {self.job.title}"

    class Meta:
        ordering = ['-application_date']
