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
    
    # New fields for business registration
    registration_type = models.CharField(
        max_length=3, 
        choices=REGISTRATION_TYPE_CHOICES,
        blank=True
    )
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
    
    # Password reset fields
    last_login = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)

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
    
    JOB_TYPE_CHOICES = [
        ('full-time', 'Full-time'),
        ('part-time', 'Part-time'),
        ('contract', 'Contract'),
    ]
    
    EXPERIENCE_CHOICES = [
        ('entry', 'Entry Level'),
        ('mid', 'Mid Level'),
        ('senior', 'Senior Level'),
    ]

    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Closed', 'Closed'),
    ]

    employer = models.ForeignKey('Employer', on_delete=models.CASCADE, related_name='jobs')
    title = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES)
    work_setup = models.CharField(max_length=20, choices=WORK_SETUP_CHOICES)
    description = models.TextField()
    salary_range = models.CharField(max_length=100)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    applications_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

