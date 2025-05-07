#!/usr/bin/env python
import os
import django
import csv
import time
import logging
from datetime import datetime

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'capstoneforever.settings')
django.setup()

from employer.models import Job
from django.conf import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('job_listings_updater.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('job_listings_updater')

def update_job_listings():
    """Update the job listings CSV file from the database"""
    try:
        # Create the directory if it doesn't exist
        csv_dir = os.path.join(settings.BASE_DIR, 'static', 'data')
        os.makedirs(csv_dir, exist_ok=True)
        
        # Path to the CSV file
        csv_path = os.path.join(csv_dir, 'job_listings.csv')
        
        # Get all active jobs
        jobs = Job.objects.filter(status='active').select_related('employer')
        
        # Create the CSV file
        with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['id', 'title', 'company', 'location', 'description', 'required_skills']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            
            for job in jobs:
                # Extract skills from job description and title
                skills = []
                for skill in ['python', 'javascript', 'java', 'c++', 'c#', 'ruby', 'php', 'html', 'css', 
                             'react', 'angular', 'vue', 'node.js', 'django', 'flask', 'express', 
                             'mysql', 'postgresql', 'mongodb', 'sql', 'nosql', 'git', 'github', 
                             'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'linux', 'windows', 
                             'networking', 'cybersecurity', 'machine learning', 'data science',
                             'project management', 'agile', 'scrum']:
                    if skill.lower() in job.description.lower() or skill.lower() in job.title.lower():
                        skills.append(skill)
                
                writer.writerow({
                    'id': job.id,
                    'title': job.title,
                    'company': job.employer.company_name,
                    'location': job.location,
                    'description': job.description,
                    'required_skills': ';'.join(skills)
                })
        
        logger.info(f'Successfully updated job listings CSV at {csv_path}')
        return True
    except Exception as e:
        logger.error(f'Error updating job listings CSV: {e}')
        return False

if __name__ == '__main__':
    logger.info('Job listings updater started')
    
    while True:
        logger.info('Updating job listings...')
        success = update_job_listings()
        
        if success:
            logger.info('Job listings updated successfully')
        else:
            logger.error('Failed to update job listings')
        
        # Wait for 1 hour before updating again
        logger.info('Waiting for 1 hour before next update...')
        time.sleep(3600)  # 3600 seconds = 1 hour
