// Resume Builder JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the resume builder
    initializeResumeBuilder();
    
    // Add event listeners for live preview
    addFormEventListeners();
    
    // Add initial experience and education entries
    addExperience();
    addEducation();
    addSkill();
});

function initializeResumeBuilder() {
    console.log('Resume Builder initialized');
}

function addFormEventListeners() {
    // Add event listeners to all form inputs for live preview
    const formInputs = document.querySelectorAll('#resumeForm input, #resumeForm textarea');
    formInputs.forEach(input => {
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    });
}

// Experience Section Functions
function addExperience() {
    const container = document.getElementById('experienceContainer');
    const experienceId = 'experience_' + Date.now();
    
    const experienceHTML = `
        <div class="dynamic-entry" id="${experienceId}">
            <div class="entry-header">
                <h5 class="entry-title">Work Experience</h5>
                <button type="button" class="remove-entry-btn" onclick="removeEntry('${experienceId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label for="jobTitle_${experienceId}">Job Title</label>
                        <input type="text" id="jobTitle_${experienceId}" name="job_title[]" class="form-control" placeholder="e.g., High School English Teacher">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label for="company_${experienceId}">Company</label>
                        <input type="text" id="company_${experienceId}" name="company[]" class="form-control" placeholder="e.g., John Hopkins High School">
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label for="startDate_${experienceId}">Start Date</label>
                        <input type="text" id="startDate_${experienceId}" name="start_date[]" class="form-control" placeholder="e.g., Feb 2017">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label for="endDate_${experienceId}">End Date</label>
                        <input type="text" id="endDate_${experienceId}" name="end_date[]" class="form-control" placeholder="e.g., Present">
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="location_${experienceId}">Location</label>
                <input type="text" id="location_${experienceId}" name="location[]" class="form-control" placeholder="e.g., Seattle">
            </div>
            <div class="form-group">
                <label for="intro_${experienceId}">Introduction/Summary</label>
                <textarea id="intro_${experienceId}" name="intro[]" class="form-control" rows="2" placeholder="Brief description of your role and achievements..."></textarea>
            </div>
            <div class="form-group">
                <label for="responsibilities_${experienceId}">Responsibilities (one per line)</label>
                <textarea id="responsibilities_${experienceId}" name="responsibilities[]" class="form-control" rows="4" placeholder="• Plan lectures and assignments&#10;• Assess students&#10;• Teach students (class/groups/individual)"></textarea>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', experienceHTML);
    
    // Add event listeners to new inputs
    const newInputs = document.getElementById(experienceId).querySelectorAll('input, textarea');
    newInputs.forEach(input => {
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    });
}

// Education Section Functions
function addEducation() {
    const container = document.getElementById('educationContainer');
    const educationId = 'education_' + Date.now();
    
    const educationHTML = `
        <div class="dynamic-entry" id="${educationId}">
            <div class="entry-header">
                <h5 class="entry-title">Education</h5>
                <button type="button" class="remove-entry-btn" onclick="removeEntry('${educationId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label for="degree_${educationId}">Degree</label>
                        <input type="text" id="degree_${educationId}" name="degree[]" class="form-control" placeholder="e.g., Bachelor's Degree in Child Psychology">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label for="school_${educationId}">School/University</label>
                        <input type="text" id="school_${educationId}" name="school[]" class="form-control" placeholder="e.g., University of California">
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label for="eduStartDate_${educationId}">Start Date</label>
                        <input type="text" id="eduStartDate_${educationId}" name="edu_start_date[]" class="form-control" placeholder="e.g., 2009">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label for="eduEndDate_${educationId}">End Date</label>
                        <input type="text" id="eduEndDate_${educationId}" name="edu_end_date[]" class="form-control" placeholder="e.g., 2013">
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', educationHTML);
    
    // Add event listeners to new inputs
    const newInputs = document.getElementById(educationId).querySelectorAll('input');
    newInputs.forEach(input => {
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    });
}

// Skills Section Functions
function addSkill() {
    const container = document.getElementById('skillsContainer');
    const skillId = 'skill_' + Date.now();
    
    const skillHTML = `
        <div class="dynamic-entry" id="${skillId}">
            <div class="entry-header">
                <h5 class="entry-title">Skill</h5>
                <button type="button" class="remove-entry-btn" onclick="removeEntry('${skillId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="form-group">
                <label for="skillName_${skillId}">Skill Name</label>
                <input type="text" id="skillName_${skillId}" name="skill_name[]" class="form-control" placeholder="e.g., Classroom Management">
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', skillHTML);
    
    // Add event listeners to new inputs
    const newInputs = document.getElementById(skillId).querySelectorAll('input');
    newInputs.forEach(input => {
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    });
}

// Remove Entry Function
function removeEntry(entryId) {
    const entry = document.getElementById(entryId);
    if (entry) {
        entry.remove();
        updatePreview();
    }
}

// Update Preview Function
function updatePreview() {
    const previewContainer = document.getElementById('resumePreview');
    
    // Get form data
    const formData = getFormData();
    
    if (formData.fullName) {
        const previewHTML = generateResumePreview(formData);
        previewContainer.innerHTML = previewHTML;
        previewContainer.classList.add('has-preview');
    } else {
        previewContainer.innerHTML = `
            <div class="preview-placeholder">
                <i class="fas fa-file-alt"></i>
                <p>Fill out the form to see a live preview of your resume</p>
            </div>
        `;
        previewContainer.classList.remove('has-preview');
    }
}

// Get Form Data Function
function getFormData() {
    const form = document.getElementById('resumeForm');
    const formData = new FormData(form);
    const data = {};
    
    // Get basic information
    data.fullName = formData.get('full_name') || '';
    data.jobTitle = formData.get('job_title') || '';
    data.email = formData.get('email') || '';
    data.phone = formData.get('phone') || '';
    data.address = formData.get('address') || '';
    data.placeOfBirth = formData.get('place_of_birth') || '';
    data.nationality = formData.get('nationality') || '';
    data.links = formData.get('links') || '';
    data.summary = formData.get('summary') || '';
    
    // Get experience data
    data.experiences = [];
    const jobTitles = formData.getAll('job_title[]');
    const companies = formData.getAll('company[]');
    const startDates = formData.getAll('start_date[]');
    const endDates = formData.getAll('end_date[]');
    const locations = formData.getAll('location[]');
    const intros = formData.getAll('intro[]');
    const responsibilities = formData.getAll('responsibilities[]');
    
    for (let i = 0; i < jobTitles.length; i++) {
        if (jobTitles[i]) {
            data.experiences.push({
                jobTitle: jobTitles[i],
                company: companies[i] || '',
                startDate: startDates[i] || '',
                endDate: endDates[i] || '',
                location: locations[i] || '',
                intro: intros[i] || '',
                responsibilities: responsibilities[i] || ''
            });
        }
    }
    
    // Get education data
    data.educations = [];
    const degrees = formData.getAll('degree[]');
    const schools = formData.getAll('school[]');
    const eduStartDates = formData.getAll('edu_start_date[]');
    const eduEndDates = formData.getAll('edu_end_date[]');
    
    for (let i = 0; i < degrees.length; i++) {
        if (degrees[i]) {
            data.educations.push({
                degree: degrees[i],
                school: schools[i] || '',
                startDate: eduStartDates[i] || '',
                endDate: eduEndDates[i] || ''
            });
        }
    }
    
    // Get skills data
    data.skills = [];
    const skillNames = formData.getAll('skill_name[]');
    
    for (let i = 0; i < skillNames.length; i++) {
        if (skillNames[i]) {
            data.skills.push(skillNames[i]);
        }
    }
    
    return data;
}

// Generate Resume Preview Function
function generateResumePreview(data) {
    let html = '<div class="resume-preview">';
    
    // Header Section
    html += `<div class="preview-name">${data.fullName.toUpperCase()}</div>`;
    if (data.jobTitle) {
        html += `<div class="preview-job-title">${data.jobTitle}</div>`;
    }
    
    // Contact Information
    if (data.address || data.email) {
        html += '<div class="preview-contact">';
        if (data.address) html += `<div>${data.address}</div>`;
        if (data.email) html += `<div>${data.email}</div>`;
        html += '</div>';
    }
    
    // Double line divider
    html += '<div class="preview-divider"></div>';
    
    // Personal Details Section
    if (data.placeOfBirth || data.nationality) {
        html += '<div class="preview-section">';
        html += '<div class="preview-personal-details">';
        
        // Left column
        html += '<div class="preview-personal-left">';
        if (data.placeOfBirth) {
            html += '<div class="preview-personal-item">';
            html += '<span>Place of birth</span>';
            html += '<span class="dotted-line"></span>';
            html += `<span>${data.placeOfBirth}</span>`;
            html += '</div>';
        }
        html += '</div>';
        
        // Right column
        html += '<div class="preview-personal-right">';
        if (data.nationality) {
            html += '<div class="preview-personal-item">';
            html += '<span>Nationality</span>';
            html += '<span class="dotted-line"></span>';
            html += `<span>${data.nationality}</span>`;
            html += '</div>';
        }
        html += '</div>';
        
        html += '</div>';
        html += '</div>';
    }
    
    // Single line divider
    html += '<div class="preview-divider-single"></div>';
    
    // Links Section
    if (data.links) {
        html += '<div class="preview-section">';
        html += '<div class="preview-section-title">LINKS</div>';
        html += `<div class="preview-links">${data.links}</div>`;
        html += '</div>';
        html += '<div class="preview-divider-single"></div>';
    }
    
    // Profile Section
    if (data.summary) {
        html += '<div class="preview-section">';
        html += '<div class="preview-section-title">PROFILE</div>';
        html += `<div class="preview-profile">${data.summary}</div>`;
        html += '</div>';
        html += '<div class="preview-divider"></div>';
    }
    
    // Experience Section
    if (data.experiences.length > 0) {
        html += '<div class="preview-section">';
        html += '<div class="preview-section-title">EXPERIENCE</div>';
        
        data.experiences.forEach(exp => {
            html += '<div class="preview-experience-item">';
            html += '<div class="preview-experience-header">';
            html += '<div>';
            html += `<div class="preview-experience-title">♦ ${exp.jobTitle}</div>`;
            if (exp.company) {
                html += `<div class="preview-experience-company">, ${exp.company}</div>`;
            }
            html += '</div>';
            html += '<div>';
            if (exp.startDate || exp.endDate) {
                const dateRange = exp.startDate && exp.endDate ? `${exp.startDate} – ${exp.endDate}` : (exp.startDate || exp.endDate);
                html += `<div class="preview-experience-dates">${dateRange}</div>`;
            }
            if (exp.location) {
                html += `<div class="preview-experience-location">${exp.location}</div>`;
            }
            html += '</div>';
            html += '</div>';
            
            if (exp.intro) {
                html += `<div class="preview-experience-intro">${exp.intro}</div>`;
            }
            
            if (exp.responsibilities) {
                const responsibilities = exp.responsibilities.split('\n').filter(item => item.trim());
                if (responsibilities.length > 0) {
                    html += '<ul class="preview-experience-bullets">';
                    responsibilities.forEach(resp => {
                        if (resp.trim()) {
                            html += `<li>${resp.trim()}</li>`;
                        }
                    });
                    html += '</ul>';
                }
            }
            
            html += '</div>';
        });
        
        html += '</div>';
    }
    
    // Education Section
    if (data.educations.length > 0) {
        html += '<div class="preview-section">';
        html += '<div class="preview-section-title">EDUCATION</div>';
        
        data.educations.forEach(edu => {
            html += '<div class="preview-education-item">';
            html += '<div class="preview-education-header">';
            html += '<div>';
            html += `<div class="preview-education-degree">♦ ${edu.degree}</div>`;
            if (edu.school) {
                html += `<div class="preview-education-school">, ${edu.school}</div>`;
            }
            html += '</div>';
            html += '<div>';
            if (edu.startDate || edu.endDate) {
                const dateRange = edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : (edu.startDate || edu.endDate);
                html += `<div class="preview-education-dates">${dateRange}</div>`;
            }
            html += '</div>';
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>';
    }
    
    // Skills Section
    if (data.skills.length > 0) {
        html += '<div class="preview-section">';
        html += '<div class="preview-section-title">SKILLS</div>';
        html += '<div class="preview-skills">';
        data.skills.forEach(skill => {
            html += `<span class="preview-skill">${skill}</span>`;
        });
        html += '</div>';
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

// Generate PDF Function
function generatePDF() {
    // Get the resume preview content
    const previewContent = document.querySelector('.resume-preview');
    if (!previewContent) {
        alert('Please fill out the form first to generate a PDF');
        return;
    }
    
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Resume - ${document.getElementById('fullName').value || 'Professional Resume'}</title>
            <style>
                body {
                    font-family: 'Times New Roman', serif;
                    margin: 0;
                    padding: 2rem;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #000;
                }
                .resume-preview {
                    font-family: 'Times New Roman', serif;
                    padding: 0;
                    background: white;
                    color: #000;
                    line-height: 1.4;
                    font-size: 12px;
                }
                .preview-name {
                    text-align: center;
                    font-size: 24px;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin-bottom: 0.5rem;
                    letter-spacing: 1px;
                }
                .preview-job-title {
                    text-align: center;
                    font-size: 16px;
                    margin-bottom: 0.5rem;
                }
                .preview-contact {
                    text-align: center;
                    font-size: 12px;
                    margin-bottom: 1rem;
                }
                .preview-contact div {
                    margin-bottom: 0.25rem;
                }
                .preview-divider {
                    border-top: 3px double #000;
                    margin: 1rem 0;
                }
                .preview-divider-single {
                    border-top: 1px solid #000;
                    margin: 1rem 0;
                }
                .preview-section {
                    margin-bottom: 1.5rem;
                }
                .preview-section-title {
                    text-align: center;
                    font-size: 14px;
                    font-weight: bold;
                    text-transform: uppercase;
                    text-decoration: underline;
                    margin-bottom: 1rem;
                    letter-spacing: 1px;
                }
                .preview-personal-details {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }
                .preview-personal-left, .preview-personal-right {
                    flex: 1;
                }
                .preview-personal-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                }
                .preview-personal-item .dotted-line {
                    border-bottom: 1px dotted #000;
                    flex: 1;
                    margin: 0 0.5rem;
                }
                .preview-links {
                    text-align: center;
                    margin-bottom: 1rem;
                }
                .preview-profile {
                    text-align: justify;
                    margin-bottom: 1rem;
                    line-height: 1.6;
                }
                .preview-experience-item {
                    margin-bottom: 1.5rem;
                }
                .preview-experience-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.5rem;
                }
                .preview-experience-title {
                    font-weight: bold;
                    font-size: 13px;
                }
                .preview-experience-company {
                    font-weight: bold;
                    font-size: 13px;
                }
                .preview-experience-dates {
                    text-align: right;
                    font-size: 12px;
                }
                .preview-experience-location {
                    text-align: right;
                    font-size: 12px;
                    margin-top: 0.25rem;
                }
                .preview-experience-intro {
                    font-style: italic;
                    margin-bottom: 0.5rem;
                    font-size: 12px;
                }
                .preview-experience-bullets {
                    margin-left: 1rem;
                }
                .preview-experience-bullets li {
                    margin-bottom: 0.25rem;
                    font-size: 11px;
                }
                .preview-education-item {
                    margin-bottom: 1rem;
                }
                .preview-education-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.5rem;
                }
                .preview-education-degree {
                    font-weight: bold;
                    font-size: 13px;
                }
                .preview-education-school {
                    font-weight: bold;
                    font-size: 13px;
                }
                .preview-education-dates {
                    text-align: right;
                    font-size: 12px;
                }
                .preview-skills {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }
                .preview-skill {
                    background: #f0f0f0;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 11px;
                    border: 1px solid #ddd;
                }
                @media print {
                    body {
                        margin: 0;
                        padding: 1rem;
                    }
                }
            </style>
        </head>
        <body>
            ${previewContent.outerHTML}
            <script>
                window.onload = function() {
                    window.print();
                    window.close();
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
} 