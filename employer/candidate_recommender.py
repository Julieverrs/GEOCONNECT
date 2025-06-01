import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from employee.models import Employee, JobPreferences
import logging
import re
import json
from collections import defaultdict
from difflib import SequenceMatcher
import math

# Configure logging
logger = logging.getLogger(__name__)

class CandidateRecommender:
    """
    A class that uses NLP and ML techniques to recommend candidates based on job requirements
    """
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            analyzer='word',
            ngram_range=(1, 2),
            stop_words='english',
            max_features=5000
        )
        
    def preprocess_text(self, text):
        """Preprocess text by converting to lowercase and removing special characters"""
        if not text:
            return ""
        # Convert to lowercase
        text = text.lower()
        # Remove special characters
        text = re.sub(r'[^\w\s]', ' ', text)
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def string_similarity(self, a, b):
        """Calculate string similarity using SequenceMatcher"""
        if not a or not b:
            return 0
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()
    
    def create_employee_profile(self, employee):
        """Create a text profile for an employee based on their skills and other attributes"""
        profile_parts = []
        
        # Add skills (most important)
        if employee.skills:
            profile_parts.append(employee.skills)
        
        # Add job title
        if employee.job_title:
            profile_parts.append(employee.job_title)
        
        # Add education
        if employee.education:
            profile_parts.append(employee.education)
        
        # Add certifications
        if employee.certifications:
            profile_parts.append(employee.certifications)
        
        # Add bio
        if employee.bio:
            profile_parts.append(employee.bio)
        
        # Add job preferences if available
        try:
            job_prefs = JobPreferences.objects.get(employee=employee)
            if job_prefs:
                if job_prefs.industry:
                    profile_parts.append(job_prefs.industry)
                if job_prefs.skills:
                    try:
                        skills = json.loads(job_prefs.skills) if isinstance(job_prefs.skills, str) else job_prefs.skills
                        if isinstance(skills, list):
                            profile_parts.append(" ".join(skills))
                    except (json.JSONDecodeError, TypeError):
                        pass
        except JobPreferences.DoesNotExist:
            pass  # No job preferences available
        
        # Join all parts and preprocess
        return self.preprocess_text(" ".join(profile_parts))
    
    def create_job_profile(self, job_requirements):
        """Create a text profile for a job based on requirements"""
        profile_parts = []
        
        # Add industry
        if 'industry' in job_requirements and job_requirements['industry']:
            profile_parts.append(job_requirements['industry'])
        
        # Add skills (most important)
        if 'skills' in job_requirements and job_requirements['skills']:
            if isinstance(job_requirements['skills'], list):
                profile_parts.append(" ".join(job_requirements['skills']))
            else:
                profile_parts.append(job_requirements['skills'])
        
        # Add job type
        if 'job_type' in job_requirements and job_requirements['job_type']:
            profile_parts.append(job_requirements['job_type'])
        
        # Add work arrangement
        if 'work_arrangement' in job_requirements and job_requirements['work_arrangement']:
            profile_parts.append(job_requirements['work_arrangement'])
        
        # Add education
        if 'education' in job_requirements and job_requirements['education']:
            profile_parts.append(job_requirements['education'])
        
        # Add certifications
        if 'certifications' in job_requirements and job_requirements['certifications']:
            if isinstance(job_requirements['certifications'], list):
                profile_parts.append(" ".join(job_requirements['certifications']))
            else:
                profile_parts.append(job_requirements['certifications'])
        
        # Add languages
        if 'languages' in job_requirements and job_requirements['languages']:
            if isinstance(job_requirements['languages'], list):
                profile_parts.append(" ".join(job_requirements['languages']))
            else:
                profile_parts.append(job_requirements['languages'])
        
        # Join all parts and preprocess
        return self.preprocess_text(" ".join(profile_parts))
    
    def normalize_string(self, s):
        """Normalize strings for better comparison"""
        if not s:
            return ""
        # Convert to lowercase
        s = s.lower()
        # Replace common separators with spaces
        s = s.replace('-', ' ').replace('_', ' ').replace('/', ' ')
        # Remove special characters
        s = re.sub(r'[^\w\s]', '', s)
        # Replace multiple spaces with single space
        s = re.sub(r'\s+', ' ', s).strip()
        return s
    
    def calculate_job_preferences_match(self, employee, job_requirements):
        """Calculate how well employee's job preferences match the job requirements with improved logic"""
        try:
            job_prefs = JobPreferences.objects.get(employee=employee)
        except JobPreferences.DoesNotExist:
            # If no job preferences, give a very low score
            return 0.05
        
        # Initialize scores dictionary for detailed logging
        scores = {}
        weights = {}
        
        # Industry match (20% weight)
        weights['industry'] = 0.20
        if job_requirements.get('industry') and job_requirements['industry'] != 'any':
            if job_prefs.industry:
                req_industry = self.normalize_string(job_requirements['industry'])
                emp_industry = self.normalize_string(job_prefs.industry)
                
                # Calculate similarity score
                similarity = self.string_similarity(req_industry, emp_industry)
                
                if similarity > 0.9:  # Almost exact match
                    scores['industry'] = 1.0
                elif similarity > 0.7:  # Very similar
                    scores['industry'] = 0.9
                elif similarity > 0.5:  # Somewhat similar
                    scores['industry'] = 0.7
                elif req_industry in emp_industry or emp_industry in req_industry:
                    scores['industry'] = 0.6  # Partial match
                else:
                    scores['industry'] = 0.2  # No match but has preference
            else:
                scores['industry'] = 0.1  # No industry preference
        else:
            scores['industry'] = 0.7  # No specific industry required
        
        # Job type match (15% weight)
        weights['job_type'] = 0.15
        if job_requirements.get('job_type') and job_requirements['job_type'] != 'any':
            if job_prefs.job_type:
                req_type = self.normalize_string(job_requirements['job_type'])
                emp_type = self.normalize_string(job_prefs.job_type)
                
                similarity = self.string_similarity(req_type, emp_type)
                
                if similarity > 0.9:  # Almost exact match
                    scores['job_type'] = 1.0
                elif similarity > 0.7:  # Very similar
                    scores['job_type'] = 0.9
                elif 'full' in req_type and 'full' in emp_type:
                    scores['job_type'] = 0.8  # Full-time variations
                elif 'part' in req_type and 'part' in emp_type:
                    scores['job_type'] = 0.8  # Part-time variations
                else:
                    scores['job_type'] = 0.2  # Different job types
            else:
                scores['job_type'] = 0.1  # No job type preference
        else:
            scores['job_type'] = 0.7  # No specific job type required
        
        # Work arrangement match (15% weight)
        weights['work_arrangement'] = 0.15
        if job_requirements.get('work_arrangement') and job_requirements['work_arrangement'] != 'any':
            if job_prefs.work_arrangement:
                req_arrangement = self.normalize_string(job_requirements['work_arrangement'])
                emp_arrangement = self.normalize_string(job_prefs.work_arrangement)
                
                similarity = self.string_similarity(req_arrangement, emp_arrangement)
                
                if similarity > 0.9:  # Almost exact match
                    scores['work_arrangement'] = 1.0
                elif similarity > 0.7:  # Very similar
                    scores['work_arrangement'] = 0.9
                elif ('remote' in req_arrangement and 'remote' in emp_arrangement) or \
                     ('onsite' in req_arrangement and 'onsite' in emp_arrangement) or \
                     ('on site' in req_arrangement and 'on site' in emp_arrangement):
                    scores['work_arrangement'] = 0.9  # Similar arrangements
                elif 'hybrid' in req_arrangement or 'hybrid' in emp_arrangement:
                    scores['work_arrangement'] = 0.6  # Hybrid is somewhat flexible
                else:
                    scores['work_arrangement'] = 0.2  # Different arrangements
            else:
                scores['work_arrangement'] = 0.1  # No work arrangement preference
        else:
            scores['work_arrangement'] = 0.7  # No specific work arrangement required
        
        # Skills match (20% weight)
        weights['skills'] = 0.20
        if job_requirements.get('skills'):
            job_skills = []
            if isinstance(job_requirements['skills'], list):
                job_skills = [self.normalize_string(skill) for skill in job_requirements['skills']]
            else:
                job_skills = [self.normalize_string(job_requirements['skills'])]
            
            # Get employee skills from both job preferences and employee profile
            employee_skills = []
            
            # From job preferences
            if job_prefs.skills:
                try:
                    skills = json.loads(job_prefs.skills) if isinstance(job_prefs.skills, str) else job_prefs.skills
                    if isinstance(skills, list):
                        employee_skills.extend([self.normalize_string(skill) for skill in skills])
                except (json.JSONDecodeError, TypeError):
                    pass
            
            # From employee profile (as backup)
            if employee.skills:
                profile_skills = [self.normalize_string(skill.strip()) for skill in employee.skills.split(',')]
                for skill in profile_skills:
                    if skill and skill not in employee_skills:
                        employee_skills.append(skill)
            
            if job_skills and employee_skills:
                # Calculate skill matches with improved similarity scoring
                matched_skills = []
                match_scores = []
                
                for job_skill in job_skills:
                    best_match = 0
                    best_skill = None
                    
                    for emp_skill in employee_skills:
                        # Try different normalization approaches
                        job_skill_norm = job_skill.replace(' ', '')
                        emp_skill_norm = emp_skill.replace(' ', '')
                        
                        # Check for exact match first
                        if job_skill == emp_skill or job_skill_norm == emp_skill_norm:
                            best_match = 1.0
                            best_skill = emp_skill
                            break
                        
                        # Check for substring match
                        elif job_skill in emp_skill or emp_skill in job_skill:
                            match = 0.9
                            if match > best_match:
                                best_match = match
                                best_skill = emp_skill
                        
                        # Check for similarity
                        else:
                            similarity = self.string_similarity(job_skill, emp_skill)
                            if similarity > best_match:
                                best_match = similarity
                                best_skill = emp_skill
                    
                    if best_match >= 0.6:  # Reasonable threshold
                        matched_skills.append(best_skill)
                        match_scores.append(best_match)
                
                # Calculate weighted average of match scores
                if match_scores:
                    avg_match = sum(match_scores) / len(job_skills)
                    # Bonus for matching more skills
                    coverage = len(matched_skills) / len(job_skills)
                    skill_score = avg_match * (0.7 + 0.3 * coverage)
                    scores['skills'] = skill_score
                else:
                    scores['skills'] = 0.1
                
                # Log matched skills for debugging
                logger.debug(f"Matched skills for {employee.username}: {matched_skills}")
                logger.debug(f"Match scores: {match_scores}")
                logger.debug(f"Final skill score: {skill_score:.2f}")
            elif not job_skills:
                scores['skills'] = 0.7  # No specific skills required
            else:
                scores['skills'] = 0.1  # Has job skills but employee has none
        else:
            scores['skills'] = 0.7  # No specific skills required
        
        # Experience match (10% weight)
        weights['experience'] = 0.10
        if job_requirements.get('experience'):
            required_exp = int(job_requirements['experience'])
            if job_prefs.experience is not None:
                emp_exp = int(job_prefs.experience)
                if emp_exp >= required_exp:
                    # Bonus for exceeding requirements
                    bonus = min(0.2, (emp_exp - required_exp) / 5)
                    scores['experience'] = min(1.0, 1.0 + bonus)
                elif emp_exp >= required_exp * 0.8:  # Within 80% of requirement
                    scores['experience'] = 0.8
                elif emp_exp >= required_exp * 0.6:  # Within 60% of requirement
                    scores['experience'] = 0.6
                else:
                    scores['experience'] = 0.3  # Less than 60% of requirement
            else:
                # Check employee profile as backup
                if employee.years_of_experience:
                    emp_exp = employee.years_of_experience
                    if emp_exp >= required_exp:
                        # Bonus for exceeding requirements
                        bonus = min(0.2, (emp_exp - required_exp) / 5)
                        scores['experience'] = min(1.0, 1.0 + bonus)
                    elif emp_exp >= required_exp * 0.8:
                        scores['experience'] = 0.8
                    else:
                        scores['experience'] = 0.5
                else:
                    scores['experience'] = 0.2  # No experience specified
        else:
            scores['experience'] = 0.7  # No specific experience required
        
        # Education match (5% weight)
        weights['education'] = 0.05
        if job_requirements.get('education') and job_requirements['education'] != 'any':
            if job_prefs.education_level:
                req_edu = self.normalize_string(job_requirements['education'])
                emp_edu = self.normalize_string(job_prefs.education_level)
                
                # Map education levels to numeric values
                edu_levels = {
                    'high school': 1,
                    'vocational': 2,
                    'associate': 3,
                    'bachelor': 4,
                    'master': 5,
                    'phd': 6,
                    'doctorate': 6
                }
                
                # Get education level values
                req_level = 1
                emp_level = 1
                
                for level_name, level_value in edu_levels.items():
                    if level_name in req_edu:
                        req_level = level_value
                    if level_name in emp_edu:
                        emp_level = level_value
                
                if emp_level >= req_level:
                    # Bonus for exceeding requirements
                    bonus = min(0.2, (emp_level - req_level) / 5)
                    scores['education'] = min(1.0, 1.0 + bonus)
                else:
                    # Score based on how close they are
                    scores['education'] = max(0.3, emp_level / req_level)
            else:
                # Check employee profile as backup
                if employee.education:
                    emp_edu = self.normalize_string(employee.education)
                    req_edu = self.normalize_string(job_requirements['education'])
                    
                    # Simple check for bachelor's degree
                    if 'bachelor' in req_edu and ('bachelor' in emp_edu or 'bs' in emp_edu or 'ba' in emp_edu):
                        scores['education'] = 1.0
                    # Simple check for master's degree
                    elif 'master' in req_edu and 'master' in emp_edu:
                        scores['education'] = 1.0
                    # Simple check for PhD
                    elif ('phd' in req_edu or 'doctorate' in req_edu) and ('phd' in emp_edu or 'doctorate' in emp_edu):
                        scores['education'] = 1.0
                    else:
                        # Use string similarity as fallback
                        similarity = self.string_similarity(req_edu, emp_edu)
                        scores['education'] = max(0.3, similarity)
                else:
                    scores['education'] = 0.2  # No education level specified
        else:
            scores['education'] = 0.7  # No specific education required
        
        # Certifications match (5% weight)
        weights['certifications'] = 0.05
        if job_requirements.get('certifications'):
            req_certs = []
            if isinstance(job_requirements['certifications'], list):
                req_certs = [self.normalize_string(cert) for cert in job_requirements['certifications']]
            else:
                req_certs = [self.normalize_string(job_requirements['certifications'])]
            
            # Get employee certifications from both job preferences and employee profile
            emp_certs = []
            
            # From job preferences
            if job_prefs.certifications:
                try:
                    certs = json.loads(job_prefs.certifications) if isinstance(job_prefs.certifications, str) else job_prefs.certifications
                    if isinstance(certs, list):
                        emp_certs.extend([self.normalize_string(cert) for cert in certs])
                except (json.JSONDecodeError, TypeError):
                    pass
            
            # From employee profile (as backup)
            if employee.certifications:
                profile_certs = [self.normalize_string(cert.strip()) for cert in employee.certifications.split(',')]
                for cert in profile_certs:
                    if cert and cert not in emp_certs:
                        emp_certs.append(cert)
            
            if req_certs and emp_certs:
                # Calculate certification matches with improved similarity scoring
                matched_certs = []
                match_scores = []
                
                for req_cert in req_certs:
                    best_match = 0
                    best_cert = None
                    
                    for emp_cert in emp_certs:
                        # Check for exact match first
                        if req_cert == emp_cert:
                            best_match = 1.0
                            best_cert = emp_cert
                            break
                        
                        # Check for substring match
                        elif req_cert in emp_cert or emp_cert in req_cert:
                            match = 0.9
                            if match > best_match:
                                best_match = match
                                best_cert = emp_cert
                        
                        # Special case for TESDA
                        elif ('tesda' in req_cert and 'tesda' in emp_cert):
                            best_match = 1.0
                            best_cert = emp_cert
                            break
                        
                        # Check for similarity
                        else:
                            similarity = self.string_similarity(req_cert, emp_cert)
                            if similarity > best_match:
                                best_match = similarity
                                best_cert = emp_cert
                    
                    if best_match >= 0.6:  # Reasonable threshold
                        matched_certs.append(best_cert)
                        match_scores.append(best_match)
                
                # Calculate weighted average of match scores
                if match_scores:
                    avg_match = sum(match_scores) / len(req_certs)
                    # Bonus for matching more certifications
                    coverage = len(matched_certs) / len(req_certs)
                    cert_score = avg_match * (0.7 + 0.3 * coverage)
                    scores['certifications'] = cert_score
                else:
                    scores['certifications'] = 0.1
            elif not req_certs:
                scores['certifications'] = 0.7  # No specific certifications required
            else:
                scores['certifications'] = 0.1  # Has required certs but employee has none
        else:
            scores['certifications'] = 0.7  # No specific certifications required
        
        # Languages match (5% weight)
        weights['languages'] = 0.05
        if job_requirements.get('languages'):
            req_langs = []
            if isinstance(job_requirements['languages'], list):
                req_langs = [self.normalize_string(lang) for lang in job_requirements['languages']]
            else:
                req_langs = [self.normalize_string(job_requirements['languages'])]
            
            # Get employee languages from both job preferences and employee profile
            emp_langs = []
            
            # From job preferences
            if job_prefs.languages:
                try:
                    langs = json.loads(job_prefs.languages) if isinstance(job_prefs.languages, str) else job_prefs.languages
                    if isinstance(langs, list):
                        emp_langs.extend([self.normalize_string(lang) for lang in langs])
                except (json.JSONDecodeError, TypeError):
                    pass
            
            if req_langs and emp_langs:
                # Calculate language matches with improved similarity scoring
                matched_langs = []
                match_scores = []
                
                for req_lang in req_langs:
                    best_match = 0
                    best_lang = None
                    
                    for emp_lang in emp_langs:
                        # Check for exact match first
                        if req_lang == emp_lang:
                            best_match = 1.0
                            best_lang = emp_lang
                            break
                        
                        # Check for substring match (e.g., "filipino" matches "filipino/tagalog")
                        elif req_lang in emp_lang or emp_lang in req_lang:
                            match = 0.9
                            if match > best_match:
                                best_match = match
                                best_lang = emp_lang
                        
                        # Special case for Filipino/Tagalog
                        elif ('filipino' in req_lang and 'tagalog' in emp_lang) or \
                             ('tagalog' in req_lang and 'filipino' in emp_lang):
                            best_match = 1.0
                            best_lang = emp_lang
                            break
                        
                        # Check for similarity
                        else:
                            similarity = self.string_similarity(req_lang, emp_lang)
                            if similarity > best_match:
                                best_match = similarity
                                best_lang = emp_lang
                    
                    if best_match >= 0.6:  # Reasonable threshold
                        matched_langs.append(best_lang)
                        match_scores.append(best_match)
                
                # Calculate weighted average of match scores
                if match_scores:
                    avg_match = sum(match_scores) / len(req_langs)
                    # Bonus for matching more languages
                    coverage = len(matched_langs) / len(req_langs)
                    lang_score = avg_match * (0.7 + 0.3 * coverage)
                    scores['languages'] = lang_score
                else:
                    scores['languages'] = 0.1
            elif not req_langs:
                scores['languages'] = 0.7  # No specific languages required
            else:
                scores['languages'] = 0.1  # Has required langs but employee has none
        else:
            scores['languages'] = 0.7  # No specific languages required
        
        # Availability match (5% weight)
        weights['availability'] = 0.05
        if job_requirements.get('availability') and job_requirements['availability'] != 'any':
            if job_prefs.availability:
                req_avail = self.normalize_string(job_requirements['availability'])
                emp_avail = self.normalize_string(job_prefs.availability)
                
                # Map availability to numeric values (lower is better)
                avail_values = {
                    'immediate': 0,
                    'one week': 1,
                    'two weeks': 2,
                    'within 2 weeks': 2,
                    'one month': 4,
                    'two months': 8
                }
                
                # Get availability values
                req_value = 8  # Default to longest time
                emp_value = 8  # Default to longest time
                
                for avail_name, avail_value in avail_values.items():
                    if avail_name in req_avail:
                        req_value = avail_value
                    if avail_name in emp_avail:
                        emp_value = avail_value
                
                if emp_value <= req_value:
                    scores['availability'] = 1.0  # Can start on time or earlier
                else:
                    # Score based on how much longer they need
                    diff = emp_value - req_value
                    scores['availability'] = max(0.3, 1.0 - (diff / 8))
            else:
                scores['availability'] = 0.5  # No availability specified
        else:
            scores['availability'] = 0.7  # No specific availability required
        
        # Calculate weighted score
        weighted_score = 0
        for category, score in scores.items():
            weighted_score += score * weights.get(category, 0)
        
        # Apply profile completeness bonus
        completeness_bonus = self.calculate_profile_completeness(job_prefs)
        final_score = weighted_score * (0.85 + 0.15 * completeness_bonus)
        
        # Log detailed scoring for debugging
        logger.debug(f"Detailed scoring for {employee.username}:")
        for category, score in scores.items():
            logger.debug(f"  {category}: {score:.2f} (weight: {weights.get(category, 0):.2f})")
        logger.debug(f"  Raw weighted score: {weighted_score:.2f}")
        logger.debug(f"  Completeness bonus: {completeness_bonus:.2f}")
        logger.debug(f"  Final score: {final_score:.2f}")
        
        return min(1.0, final_score)

    def calculate_profile_completeness(self, job_prefs):
        """Calculate how complete an employee's job preferences are"""
        fields_to_check = [
            job_prefs.industry,
            job_prefs.job_type,
            job_prefs.work_arrangement,
            job_prefs.skills,
            job_prefs.availability,
            job_prefs.experience,
            job_prefs.education_level,
            job_prefs.certifications,
            job_prefs.languages
        ]
        
        completed_fields = sum(1 for field in fields_to_check if field)
        return completed_fields / len(fields_to_check)
    
    def calculate_experience_match(self, employee_exp, required_exp):
        """Calculate how well an employee's experience matches the requirements"""
        if not required_exp or required_exp == 0:
            return 1.0  # Perfect match if no experience required
        
        if not employee_exp:
            return 0.3  # Low score if no experience
        
        if employee_exp >= required_exp:
            # Bonus for exceeding requirements (up to 20% bonus)
            bonus = min(0.2, (employee_exp - required_exp) / 5)
            return min(1.0, 1.0 + bonus)
        
        # Partial match based on how close they are
        ratio = employee_exp / required_exp
        # Use sigmoid-like function to make the score curve more realistic
        score = 1 / (1 + math.exp(-10 * (ratio - 0.7)))
        return max(0.3, score)
    
    def calculate_education_match(self, employee_education, required_education):
        """Calculate education match score with improved logic"""
        if not required_education or required_education == 'any':
            return 1.0
        
        if not employee_education:
            return 0.3  # Low score if no education
        
        education_levels = {
            'high_school': 1,
            'vocational': 2,
            'associate': 3,
            'bachelor': 4,
            'master': 5,
            'phd': 6,
            'doctorate': 6
        }
        
        # Extract education level from employee education text
        employee_level = 1  # Default to high school
        education_text = self.normalize_string(employee_education)
        
        for level_name, level_value in education_levels.items():
            if level_name in education_text:
                employee_level = level_value
                break
        
        # Extract required education level
        required_level = 1  # Default to high school
        required_text = self.normalize_string(required_education)
        
        for level_name, level_value in education_levels.items():
            if level_name in required_text:
                required_level = level_value
                break
        
        if employee_level >= required_level:
            # Bonus for exceeding requirements (up to 20% bonus)
            bonus = min(0.2, (employee_level - required_level) / 5)
            return min(1.0, 1.0 + bonus)
        else:
            # Partial match based on how close they are
            ratio = employee_level / required_level
            return max(0.3, ratio)
    
    def recommend_candidates(self, job_requirements, max_candidates=10):
        """
        Recommend candidates based on job requirements using improved matching algorithm
        """
        try:
            # Get all active employees
            employees = Employee.objects.filter(is_active=True, is_approved=True)
            
            if not employees:
                logger.warning("No active employees found in the database")
                employees = Employee.objects.all()
                if not employees:
                    return []
    
        # Filter out employees without job preferences
            employees_with_preferences = []
            for employee in employees:
                try:
                    JobPreferences.objects.get(employee=employee)
                    employees_with_preferences.append(employee)
                except JobPreferences.DoesNotExist:
                # Skip employees without job preferences
                    logger.debug(f"Skipping {employee.username} - no job preferences")
                    continue
        
            if not employees_with_preferences:
                logger.warning("No employees with job preferences found")
                return []
        
            logger.info(f"Processing {len(employees_with_preferences)} employees with job preferences out of {len(employees)} total employees")
    
        # Create result list with detailed scoring
            results = []
            required_exp = int(job_requirements.get('experience', 0))
        
            for employee in employees_with_preferences:
            # Get employee skills for logging
                employee_skills = []
                if employee.skills:
                    employee_skills = [skill.strip() for skill in employee.skills.split(',')]
            
            # Log employee data for debugging
                logger.debug(f"Processing employee: {employee.username}")
                logger.debug(f"  Skills: {employee_skills}")
                logger.debug(f"  Experience: {employee.years_of_experience}")
                logger.debug(f"  Education: {employee.education}")
            
            # Get job preferences (we know it exists since we filtered)
                job_prefs = JobPreferences.objects.get(employee=employee)
            
            # Job preferences match (50% weight) - Most important
                job_prefs_score = self.calculate_job_preferences_match(employee, job_requirements)
            
            # Direct experience match calculation (20% weight)
                if job_prefs.experience is not None:
                    emp_exp = int(job_prefs.experience)
                    if emp_exp >= required_exp:
                    # Perfect match or better
                        exp_score = 1.0
                    # Bonus for exceeding requirements
                        if emp_exp > required_exp:
                            bonus = min(0.2, (emp_exp - required_exp) / 5)
                            exp_score = min(1.0, exp_score + bonus)
                    else:
                    # Partial match
                        exp_score = max(0.6, emp_exp / required_exp)
                elif employee.years_of_experience:
                # Use employee profile if job preferences not available
                    emp_exp = employee.years_of_experience
                    if emp_exp >= required_exp:
                        exp_score = 1.0
                    # Bonus for exceeding requirements
                        if emp_exp > required_exp:
                            bonus = min(0.2, (emp_exp - required_exp) / 5)
                            exp_score = min(1.0, exp_score + bonus)
                    else:
                        exp_score = max(0.6, emp_exp / required_exp)
                else:
                    exp_score = 0.3  # Low score if no experience data
            
            # Direct education match calculation (15% weight)
                if job_prefs.education_level:
                # Check for exact match with education level
                    req_edu = self.normalize_string(job_requirements.get('education', ''))
                    emp_edu = self.normalize_string(job_prefs.education_level)
                
                    if 'bachelor' in req_edu and 'bachelor' in emp_edu:
                        edu_score = 1.0  # Perfect match for bachelor's
                    elif 'master' in req_edu and 'master' in emp_edu:
                        edu_score = 1.0  # Perfect match for master's
                    elif ('phd' in req_edu or 'doctorate' in req_edu) and ('phd' in emp_edu or 'doctorate' in emp_edu):
                        edu_score = 1.0  # Perfect match for PhD
                    else:
                    # Use education level comparison
                        edu_score = self.calculate_education_match(emp_edu, req_edu)
                elif employee.education:
                # Use employee profile if job preferences not available
                    req_edu = self.normalize_string(job_requirements.get('education', ''))
                    emp_edu = self.normalize_string(employee.education)
                
                    if 'bachelor' in req_edu and ('bachelor' in emp_edu or 'bs' in emp_edu or 'ba' in emp_edu):
                        edu_score = 1.0  # Perfect match for bachelor's
                    elif 'master' in req_edu and 'master' in emp_edu:
                        edu_score = 1.0  # Perfect match for master's
                    elif ('phd' in req_edu or 'doctorate' in req_edu) and ('phd' in emp_edu or 'doctorate' in emp_edu):
                        edu_score = 1.0  # Perfect match for PhD
                    else:
                        edu_score = self.calculate_education_match(emp_edu, req_edu)
                else:
                    edu_score = 0.3  # Low score if no education data
            
            # Skills match from employee profile (15% weight)
                skill_matches = self.get_skill_matches(employee, job_requirements)
                skills_score = 0.5  # Default
                if job_requirements.get('skills'):
                    total_required_skills = len(job_requirements['skills']) if isinstance(job_requirements['skills'], list) else 1
                    if total_required_skills > 0:
                        skills_score = min(1.0, len(skill_matches) / total_required_skills)
            
            # Calculate weighted final score
                final_score = (
                    job_prefs_score * 0.50 +  # Job preferences match (increased weight)
                    exp_score * 0.20 +        # Experience match
                    edu_score * 0.15 +        # Education match
                    skills_score * 0.15       # Skills match
                )
            
            # Ensure score is between 0 and 1
                final_score = max(0.05, min(1.0, final_score))
            
            # Convert to percentage and round to nearest 5%
                percentage = round(final_score * 100 / 5) * 5
            
            # Create match details
                match_details = {
                    'job_preferences_score': round(job_prefs_score * 100),
                    'experience_score': round(exp_score * 100),
                    'education_score': round(edu_score * 100),
                    'skills_score': round(skills_score * 100),
                    'skill_matches': skill_matches,
                    'matched_skills_count': len(skill_matches),
                    'total_skills_count': len(job_requirements.get('skills', [])) if isinstance(job_requirements.get('skills', []), list) else 0
                }
            
            # Log detailed scoring
                logger.info(f"Match score for {employee.username}: {percentage}%")
                logger.info(f"  Job preferences: {round(job_prefs_score * 100)}%")
                logger.info(f"  Experience: {round(exp_score * 100)}%")
                logger.info(f"  Education: {round(edu_score * 100)}%")
                logger.info(f"  Skills: {round(skills_score * 100)}%")
                logger.info(f"  Skill matches: {skill_matches}")
            
                results.append((employee, percentage/100, match_details))
        
        # Sort by score in descending order
            results.sort(key=lambda x: x[1], reverse=True)
        
            return results[:max_candidates]
    
        except Exception as e:
            logger.error(f"Error in recommend_candidates: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return self.simple_matching_fallback(job_requirements, Employee.objects.all(), max_candidates)
    
    def get_skill_matches(self, employee, job_requirements):
        """Find matching skills between employee and job requirements with improved fuzzy matching"""
        if not employee.skills and not job_requirements.get('skills'):
            return []
        
        # Get employee skills from profile
        employee_skills = []
        if employee.skills:
            employee_skills = [s.strip().lower() for s in employee.skills.split(',')]
        
        # Get employee skills from job preferences as well
        try:
            job_prefs = JobPreferences.objects.get(employee=employee)
            if job_prefs.skills:
                try:
                    skills = json.loads(job_prefs.skills) if isinstance(job_prefs.skills, str) else job_prefs.skills
                    if isinstance(skills, list):
                        for skill in skills:
                            skill_lower = skill.lower().strip()
                            if skill_lower not in employee_skills:
                                employee_skills.append(skill_lower)
                except (json.JSONDecodeError, TypeError):
                    pass
        except JobPreferences.DoesNotExist:
            pass
        
        # Get job skills
        job_skills = []
        if job_requirements.get('skills'):
            if isinstance(job_requirements['skills'], list):
                job_skills = [s.strip().lower() for s in job_requirements['skills']]
            else:
                job_skills = [s.strip().lower() for s in job_requirements['skills'].split(',')]
        
        # Normalize skills (replace underscores with spaces)
        employee_skills = [s.replace('_', ' ') for s in employee_skills]
        job_skills = [s.replace('_', ' ') for s in job_skills]
        
        # Find matches using string similarity with improved logic
        matches = []
        for j_skill in job_skills:
            best_match = None
            best_score = 0
            
            for e_skill in employee_skills:
                # Check for exact match
                if j_skill == e_skill:
                    best_match = e_skill
                    best_score = 1.0
                    break
                
                # Check for substring match
                elif j_skill in e_skill or e_skill in j_skill:
                    score = 0.9
                    if score > best_score:
                        best_score = score
                        best_match = e_skill
                
                # Check for similarity
                else:
                    similarity = self.string_similarity(j_skill, e_skill)
                    if similarity > best_score:
                        best_score = similarity
                        best_match = e_skill
            
            # Add match if score is high enough
            if best_score >= 0.6 and best_match not in matches:
                matches.append(best_match)
        
        # Log matches for debugging
        logger.debug(f"Employee skills: {employee_skills}")
        logger.debug(f"Job skills: {job_skills}")
        logger.debug(f"Matched skills: {matches}")
        
        return matches
    
    def simple_matching_fallback(self, job_requirements, employees, max_candidates=10):
        """Improved fallback that gives more realistic scores"""
        results = []
    
        for employee in employees[:max_candidates]:
            # Start with a very low base score
            base_score = 0.05
            
            # Check if employee has job preferences
            try:
                job_prefs = JobPreferences.objects.get(employee=employee)
                has_preferences = True
                base_score = 0.1  # Slight boost for having preferences
            except JobPreferences.DoesNotExist:
                has_preferences = False
                # Very low score for no preferences
                base_score = 0.05
            
            # Only give meaningful scores if employee has some data
            if has_preferences:
                # Add points for having relevant data
                if job_prefs.industry:
                    base_score += 0.05
                if job_prefs.job_type:
                    base_score += 0.05
                if job_prefs.skills:
                    base_score += 0.05
                if job_prefs.work_arrangement:
                    base_score += 0.05
                
                # Simple matching for key criteria
                if job_requirements.get('industry') and job_prefs.industry:
                    if self.string_similarity(job_requirements['industry'], job_prefs.industry) > 0.7:
                        base_score += 0.1
                
                if job_requirements.get('skills') and job_prefs.skills:
                    try:
                        emp_skills = json.loads(job_prefs.skills) if isinstance(job_prefs.skills, str) else job_prefs.skills
                        if isinstance(emp_skills, list):
                            req_skills = job_requirements['skills'] if isinstance(job_requirements['skills'], list) else [job_requirements['skills']]
                            for req_skill in req_skills:
                                for emp_skill in emp_skills:
                                    if self.string_similarity(req_skill, emp_skill) > 0.7:
                                        base_score += 0.1
                                        break
                    except:
                        pass
            
            # Cap the score at a reasonable maximum for fallback
            base_score = min(0.3, base_score)
            
            # Convert to percentage and round to nearest 5%
            percentage = round(base_score * 100 / 5) * 5
            
            # Simple skill matching for display
            skill_matches = []
            if employee.skills and 'skills' in job_requirements:
                employee_skills = [s.strip().lower() for s in employee.skills.split(',')]
                if isinstance(job_requirements['skills'], list):
                    job_skills = [s.strip().lower() for s in job_requirements['skills']]
                else:
                    job_skills = [s.strip().lower() for s in str(job_requirements['skills']).split(',')]
                
                for e_skill in employee_skills:
                    for j_skill in job_skills:
                        if self.string_similarity(e_skill, j_skill) > 0.7:
                            skill_matches.append(e_skill)
                            break
            
            match_details = {
                'job_preferences_score': percentage,
                'experience_score': 20 if has_preferences else 5,
                'education_score': 20 if has_preferences else 5,
                'skills_score': 20 if has_preferences else 5,
                'skill_matches': skill_matches,
                'matched_skills_count': len(skill_matches),
                'total_skills_count': len(job_requirements.get('skills', [])) if isinstance(job_requirements['skills'], list) else 0
            }
            
            results.append((employee, base_score, match_details))
        
        # Sort by score
        results.sort(key=lambda x: x[1], reverse=True)
        return results
