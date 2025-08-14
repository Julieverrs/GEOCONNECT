#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'capstoneforever.settings')
django.setup()

from employer.models import Job
from employer.models import Employer

print("=== Job Database Check ===")
print(f"Total jobs: {Job.objects.count()}")
print(f"Active jobs: {Job.objects.filter(status='active').count()}")
print(f"Closed jobs: {Job.objects.filter(status='closed').count()}")

print("\n=== Sample Jobs ===")
jobs = Job.objects.select_related('employer').all()[:5]
for job in jobs:
    print(f"- {job.title} (Status: {job.status}) by {job.employer.username}")
    print(f"  Company: {job.employer.company_name or 'N/A'}")
    print(f"  Location: {job.location}")
    print(f"  Created: {job.created_at}")

print("\n=== Employer Check ===")
employers = Employer.objects.all()[:3]
for emp in employers:
    print(f"- {emp.username} (Company: {emp.company_name or 'N/A'})")
    print(f"  Jobs posted: {emp.jobs.count()}")

print("\n=== Database Query Debug ===")
try:
    # Test the exact query from the view
    from django.db.models import Count, Value
    from django.db.models.functions import Coalesce
    
    jobs_with_apps = Job.objects.select_related('employer').annotate(
        applications_count=Coalesce(Count('applications'), Value(0))
    ).order_by('-created_at')
    
    print(f"Jobs with applications count: {jobs_with_apps.count()}")
    
    if jobs_with_apps.exists():
        sample_job = jobs_with_apps.first()
        print(f"Sample job with apps: {sample_job.title}")
        print(f"Applications count: {sample_job.applications_count}")
        print(f"Employer: {sample_job.employer.username}")
        
except Exception as e:
    print(f"Error in query: {e}")
