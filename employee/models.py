from django.contrib.auth.hashers import make_password, check_password
from django.db import models
from django.utils import timezone
from django.conf import settings
from employer.models import Job

class Employee(models.Model):
    # Make the user field nullable and remove primary_key=True temporarily
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        null=True,  # Allow null temporarily
        blank=True  # Allow blank temporarily
    )
    # Add an explicit id field since we're removing primary_key from user
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    first_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    job_title = models.CharField(max_length=100, blank=True, null=True)
    skills = models.TextField(blank=True, null=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    education = models.TextField(blank=True, null=True)
    certifications = models.TextField(blank=True, null=True)
    preferred_job_type = models.CharField(max_length=50, blank=True, null=True)
    expected_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    remote_work_preference = models.BooleanField(default=False)
    willing_to_relocate = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    document = models.FileField(upload_to='employee_documents/', blank=True, null=True)
    document_name = models.CharField(max_length=100, blank=True, null=True)
    avatar = models.ImageField(upload_to='employee_avatars/', null=True, blank=True)
    full_name = models.CharField(max_length=255, null=True, blank=True)
    
    # Approval fields
    is_approved = models.BooleanField(null=True, default=None)
    approval_date = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.password.startswith('pbkdf2_sha256$'):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.username

    def get_username(self):
        return self.username

    @property
    def is_anonymous(self):
        return False

    @property
    def is_authenticated(self):
        return True


class JobApplication(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('shortlisted', 'Shortlisted'),
        ('rejected', 'Rejected'),
        ('interview', 'Interview'),
        ('hired', 'Hired'),
    )
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='employee_applications')
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    resume = models.FileField(upload_to='resumes/')
    cover_letter = models.TextField(blank=True, null=True)
    portfolio_link = models.URLField(blank=True, null=True)
    linkedin_profile = models.URLField(blank=True, null=True)
    additional_info = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('employee', 'job')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee.username} - {self.job.title}"  # Updated to use employee.username directly

