#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'capstoneforever.settings')
django.setup()

from employer.models import Job

def check_jobs():
    print("=== Checking Jobs Database ===")
    
    # Check total jobs
    total_jobs = Job.objects.count()
    print(f"Total jobs: {total_jobs}")
    
    if total_jobs == 0:
        print("No jobs found in database!")
        return
    
    # Check jobs by status
    active_jobs = Job.objects.filter(status='active').count()
    closed_jobs = Job.objects.filter(status='closed').count()
    print(f"Active jobs: {active_jobs}")
    print(f"Closed jobs: {closed_jobs}")
    
    # Check all unique status values
    all_statuses = Job.objects.values_list('status', flat=True).distinct()
    print(f"All status values: {list(all_statuses)}")
    
    # Show sample jobs
    print("\n=== Sample Jobs ===")
    sample_jobs = Job.objects.all()[:5]
    for job in sample_jobs:
        print(f"ID: {job.id}, Title: {job.title}, Status: '{job.status}', Employer: {job.employer.username}")
    
    # Check if there are any jobs with uppercase status
    uppercase_jobs = Job.objects.filter(status__in=['Active', 'Closed'])
    if uppercase_jobs.exists():
        print(f"\nWARNING: Found {uppercase_jobs.count()} jobs with uppercase status!")
        for job in uppercase_jobs:
            print(f"ID: {job.id}, Title: {job.title}, Status: '{job.status}'")

if __name__ == '__main__':
    check_jobs()
