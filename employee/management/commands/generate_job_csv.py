import csv
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from employer.models import Job

class Command(BaseCommand):
    help = 'Generate a CSV file of job listings from the database'

    def handle(self, *args, **options):
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
                # This is a simple approach - you might want to use a more sophisticated method
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
        
        self.stdout.write(self.style.SUCCESS(f'Successfully generated job listings CSV at {csv_path}'))
