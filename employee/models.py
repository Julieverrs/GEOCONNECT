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
    work_experience = models.TextField(blank=True, null=True)
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
    resume = models.FileField(upload_to='employee_resumes/', null=True, blank=True)
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

class JobPreferences(models.Model):
    """
    Model to store employee job preferences for job matching
    """
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='job_preferences')
    industry = models.CharField(max_length=100)
    job_type = models.CharField(max_length=50, default='Any Job Type')
    work_arrangement = models.CharField(max_length=50, default='Any Arrangement')
    skills = models.JSONField()  # Store as JSON array
    experience = models.IntegerField(default=0)
    current_role_years = models.CharField(max_length=50, default='Any Duration')
    education_level = models.CharField(max_length=50, default='Any Education Level')
    certifications = models.JSONField(null=True, blank=True)  # Store as JSON array
    languages = models.JSONField(null=True, blank=True)  # Store as JSON array
    salary_min = models.IntegerField(default=15000)
    salary_max = models.IntegerField(default=150000)
    availability = models.CharField(max_length=50, default='Any Availability')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.employee.username}'s Job Preferences"

class Notification(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')

    def __str__(self):
        return f"Notification for {self.employee.username}: {self.message[:30]}..."

class SavedJob(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='saved_jobs')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saved_by_employees')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('employee', 'job')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee.username} saved {self.job.title}"


class EmployeeFeedback(models.Model):
    """
    Model to store employee feedback and ratings for employers/jobs
    """
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='feedbacks')
    job = models.ForeignKey('employer.Job', on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('employee', 'job')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee.username} - {self.job.title} - {self.rating} stars"

# Messaging System Models
class Conversation(models.Model):
    """Represents a conversation between an employer and employee"""
    job = models.ForeignKey('employer.Job', on_delete=models.CASCADE, related_name='conversations')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='conversations')
    employer = models.ForeignKey('employer.Employer', on_delete=models.CASCADE, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('job', 'employee', 'employer')
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Conversation: {self.employee.username} - {self.employer.company_name} - {self.job.title}"
    
    @property
    def last_message(self):
        return self.messages.order_by('-created_at').first()
    
    @property
    def unread_count_employee(self):
        return self.messages.filter(is_read=False, sender_type='employer').count()
    
    @property
    def unread_count_employer(self):
        return self.messages.filter(is_read=False, sender_type='employee').count()

class Message(models.Model):
    """Individual messages within a conversation"""
    SENDER_CHOICES = [
        ('employee', 'Employee'),
        ('employer', 'Employer'),
    ]
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender_type = models.CharField(max_length=10, choices=SENDER_CHOICES)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message from {self.sender_type} at {self.created_at}"
    
    @property
    def sender_name(self):
        if self.sender_type == 'employee':
            return self.conversation.employee.username
        else:
            return self.conversation.employer.company_name
