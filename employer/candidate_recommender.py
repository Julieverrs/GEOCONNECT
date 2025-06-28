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

logger = logging.getLogger(__name__)


class CandidateRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            analyzer='word',
            ngram_range=(1, 2),
            stop_words='english',
            max_features=5000
        )

    def preprocess_text(self, text):
        if not text:
            return ""
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        return re.sub(r'\s+', ' ', text).strip()

    def string_similarity(self, a, b):
        if not a or not b:
            return 0
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()

    def create_employee_profile(self, employee):
        profile_parts = []
        if employee.skills:
            profile_parts.append(employee.skills)
        if employee.job_title:
            profile_parts.append(employee.job_title)
        if employee.education:
            profile_parts.append(employee.education)
        if employee.certifications:
            profile_parts.append(employee.certifications)
        if employee.bio:
            profile_parts.append(employee.bio)

        try:
            job_prefs = JobPreferences.objects.get(employee=employee)
            if job_prefs.industry:
                profile_parts.append(job_prefs.industry)
            if job_prefs.skills:
                skills = json.loads(job_prefs.skills) if isinstance(job_prefs.skills, str) else job_prefs.skills
                if isinstance(skills, list):
                    profile_parts.extend(skills)
        except JobPreferences.DoesNotExist:
            pass

        return self.preprocess_text(" ".join(profile_parts))

    def calculate_profile_completeness(self, job_prefs):
        fields_to_check = [
            job_prefs.industry,
            job_prefs.job_type,
            job_prefs.work_arrangement,
            job_prefs.skills,
            job_prefs.experience,
            job_prefs.education_level,
            job_prefs.certifications,
            job_prefs.languages
        ]
        completed = sum(1 for field in fields_to_check if field)
        return completed / len(fields_to_check) if fields_to_check else 0

    def get_skill_matches(self, employee, job_requirements):
        if not job_requirements.get('skills'):
            return []

        employee_skills = set()
        if employee.skills:
            employee_skills.update(s.strip().lower() for s in employee.skills.split(','))
        try:
            job_prefs = JobPreferences.objects.get(employee=employee)
            if job_prefs.skills:
                skills = json.loads(job_prefs.skills) if isinstance(job_prefs.skills, str) else job_prefs.skills
                if isinstance(skills, list):
                    employee_skills.update(s.strip().lower() for s in skills)
        except JobPreferences.DoesNotExist:
            pass

        job_skills = [s.strip().lower() for s in job_requirements['skills']]
        matches = []

        for j_skill in job_skills:
            best_match = None
            best_score = 0
            for e_skill in employee_skills:
                score = self.string_similarity(j_skill, e_skill)
                if score >= 0.6 and score > best_score:
                    best_score = score
                    best_match = e_skill
            if best_match:
                matches.append(best_match)

        return matches

    def calculate_job_preferences_match(self, employee, job_requirements):
        try:
            job_prefs = JobPreferences.objects.get(employee=employee)
        except JobPreferences.DoesNotExist:
            return 0.05

        scores = {}
        weights = {}

        # Industry
        if job_requirements.get('industry') and job_requirements['industry'] != 'any':
            weights['industry'] = 0.20
            req = self.normalize_string(job_requirements['industry'])
            emp = self.normalize_string(job_prefs.industry)
            scores['industry'] = self._calculate_category_score(req, emp, 0.9, 0.7, 0.5)
        else:
            scores['industry'] = 0.7
            weights['industry'] = 0.05

        # Job Type
        if job_requirements.get('job_type') and job_requirements['job_type'] != 'any':
            weights['job_type'] = 0.15
            req = self.normalize_string(job_requirements['job_type'])
            emp = self.normalize_string(job_prefs.job_type)
            scores['job_type'] = self._calculate_category_score(req, emp, 0.9, 0.7, 0.5)
        else:
            scores['job_type'] = 0.7
            weights['job_type'] = 0.05

        # Work Arrangement
        if job_requirements.get('work_arrangement') and job_requirements['work_arrangement'] != 'any':
            weights['work_arrangement'] = 0.15
            req = self.normalize_string(job_requirements['work_arrangement'])
            emp = self.normalize_string(job_prefs.work_arrangement)
            scores['work_arrangement'] = self._calculate_category_score(req, emp, 0.9, 0.7, 0.5)
        else:
            scores['work_arrangement'] = 0.7
            weights['work_arrangement'] = 0.05

        # Skills
        if job_requirements.get('skills'):
            weights['skills'] = 0.20
            job_skills = [self.normalize_string(skill) for skill in job_requirements['skills']]
            employee_skills = []
            if job_prefs.skills:
                try:
                    skills = json.loads(job_prefs.skills) if isinstance(job_prefs.skills, str) else job_prefs.skills
                    if isinstance(skills, list):
                        employee_skills = [self.normalize_string(skill) for skill in skills]
                except Exception:
                    pass
            matched = 0
            total = len(job_skills)
            for req_skill in job_skills:
                for emp_skill in employee_skills:
                    if self.string_similarity(req_skill, emp_skill) >= 0.6:
                        matched += 1
                        break
            scores['skills'] = min(1.0, matched / total * 1.2) if total else 0.7
        else:
            scores['skills'] = 0.7
            weights['skills'] = 0.05

        # Experience
        if job_requirements.get('experience'):
            weights['experience'] = 0.10
            req_exp = int(job_requirements['experience'])
            emp_exp = int(job_prefs.experience) if job_prefs.experience else 0
            if emp_exp >= req_exp:
                scores['experience'] = min(1.0, 1.0 + min(0.2, (emp_exp - req_exp) / 5))
            elif emp_exp >= req_exp * 0.8:
                scores['experience'] = 0.8
            else:
                scores['experience'] = max(0.3, emp_exp / req_exp if req_exp else 0.7)
        else:
            scores['experience'] = 0.7
            weights['experience'] = 0.05

        # Education
        if job_requirements.get('education') and job_requirements['education'] != 'any':
            weights['education'] = 0.05
            req_edu = self.normalize_string(job_requirements['education'])
            emp_edu = self.normalize_string(job_prefs.education_level)
            scores['education'] = self._calculate_category_score(req_edu, emp_edu, 0.9, 0.7, 0.5)
        else:
            scores['education'] = 0.7
            weights['education'] = 0.05

        # Certifications
        if job_requirements.get('certifications'):
            weights['certifications'] = 0.05
            req_certs = [self.normalize_string(cert) for cert in job_requirements['certifications']]
            emp_certs = []
            if job_prefs.certifications:
                try:
                    certs = json.loads(job_prefs.certifications) if isinstance(job_prefs.certifications, str) else job_prefs.certifications
                    if isinstance(certs, list):
                        emp_certs = [self.normalize_string(cert) for cert in certs]
                except Exception:
                    pass
            matched = sum(1 for r in req_certs if any(self.string_similarity(r, e) >= 0.6 for e in emp_certs))
            scores['certifications'] = min(1.0, matched / len(req_certs)) if req_certs else 0.7
        else:
            scores['certifications'] = 0.7
            weights['certifications'] = 0.05

        weighted_score = sum(scores[k] * weights.get(k, 0) for k in scores)
        completeness_bonus = self.calculate_profile_completeness(job_prefs)
        final_score = weighted_score * (0.85 + 0.15 * completeness_bonus)
        return min(1.0, final_score)

    def _calculate_category_score(self, req, emp, exact=0.9, high=0.7, partial=0.5):
        if not req or not emp:
            return 0.1
        sim = self.string_similarity(req, emp)
        if sim >= 0.9:
            return 1.0
        elif sim >= 0.7:
            return 0.9
        elif req in emp or emp in req:
            return 0.8
        else:
            return 0.3

    def normalize_string(self, s):
        if not s:
            return ""
        s = s.lower()
        s = s.replace('-', ' ').replace('_', ' ').replace('/', ' ')
        s = re.sub(r'[^\w\s]', '', s)
        return re.sub(r'\s+', ' ', s).strip()

    def recommend_candidates(self, job_requirements, max_candidates=10):
        try:
            # Only include employees with JobPreferences
            employees = Employee.objects.filter(
                is_active=True,
                is_approved=True,
                job_preferences__isnull=False
            ).distinct()

            if not employees.exists():
                logger.warning("No active employees with JobPreferences found")
                return []

            results = []

            for employee in employees:
                try:
                    job_prefs = JobPreferences.objects.get(employee=employee)
                except JobPreferences.DoesNotExist:
                    continue  # Skip employees without job preferences

                job_prefs_score = self.calculate_job_preferences_match(employee, job_requirements)

                exp_score = 0.3
                if job_prefs.experience:
                    req_exp = int(job_requirements.get('experience', 0))
                    emp_exp = int(job_prefs.experience)
                    if emp_exp >= req_exp:
                        exp_score = min(1.0, 1.0 + min(0.2, (emp_exp - req_exp) / 5))
                    else:
                        exp_score = max(0.3, emp_exp / req_exp if req_exp else 0.7)

                edu_score = 0.3
                if job_prefs.education_level:
                    req_edu = job_requirements.get('education')
                    emp_edu = job_prefs.education_level
                    edu_score = self.string_similarity(req_edu, emp_edu)

                skill_matches = self.get_skill_matches(employee, job_requirements)
                total_skills = len(job_requirements.get('skills', []))
                skills_score = len(skill_matches) / max(total_skills, 1)

                if total_skills > 0:
                    skills_score = min(1.0, math.log(len(skill_matches) + 1) / math.log(total_skills + 1))

                final_score = (
                    job_prefs_score * 0.40 +
                    exp_score * 0.25 +
                    edu_score * 0.15 +
                    skills_score * 0.20
                )

                final_score = max(0.05, min(1.0, final_score))
                percentage = round(final_score * 100, 2)

                match_details = {
                    'nlp_score': round(job_prefs_score * 100),
                    'experience_score': round(exp_score * 100),
                    'education_score': round(edu_score * 100),
                    'skill_matches': skill_matches,
                    'matched_skills_count': len(skill_matches),
                    'total_skills_count': total_skills
                }

                # ✅ Return tuple: (employee, score, match_details)
                results.append((employee, percentage / 100, match_details))

            # Sort by score descending
            results.sort(key=lambda x: x[1], reverse=True)
            return results[:max_candidates]

        except Exception as e:
            logger.error(f"Error in recommend_candidates: {str(e)}")
            return []