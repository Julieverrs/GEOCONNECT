from django.contrib.auth.hashers import make_password, check_password
from django.db import models
from django.utils import timezone

class Employee(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    skills = models.TextField(blank=True)  # Store as comma-separated values
    years_of_experience = models.PositiveIntegerField(default=0)
    education = models.TextField(blank=True)
    certifications = models.TextField(blank=True)  # Store as comma-separated values
    preferred_job_type = models.CharField(max_length=50, blank=True)
    expected_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    remote_work_preference = models.BooleanField(default=False)
    willing_to_relocate = models.BooleanField(default=False)
     # Add these fields for Django auth compatibility
    last_login = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    document = models.FileField(upload_to='employee_documents/', blank=True, null=True)
    document_name = models.CharField(max_length=100, blank=True)

    def save(self, *args, **kwargs):
        if not self.password.startswith('pbkdf2_sha256$'):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.username
    # Add these methods for token generator compatibility
    def get_username(self):
        return self.username

    @property
    def is_anonymous(self):
        return False

    @property
    def is_authenticated(self):
        return True

