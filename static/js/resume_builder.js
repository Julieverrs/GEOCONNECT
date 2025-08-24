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
    addCertification();
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

// Profile Picture Functions
function previewProfilePicture(input) {
    const preview = document.getElementById('profilePicturePreview');
    const file = input.files[0];
    
    if (file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Profile Picture" class="profile-picture-img">`;
                preview.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid image file.');
            input.value = '';
        }
    } else {
        preview.innerHTML = '<i class="fas fa-user-circle"></i><span>No image selected</span>';
        preview.classList.remove('has-image');
    }
    
    // Update preview after image change
    updatePreview();
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

// Certification Section Functions
function addCertification() {
    const container = document.getElementById('certificationContainer');
    const certificationId = 'certification_' + Date.now();
    
    const certificationHTML = `
        <div class="dynamic-entry" id="${certificationId}">
            <div class="entry-header">
                <h5 class="entry-title">Certification</h5>
                <button type="button" class="remove-entry-btn" onclick="removeEntry('${certificationId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="form-group">
                <label for="certificationName_${certificationId}">Certification Name</label>
                <input type="text" id="certificationName_${certificationId}" name="certification_name[]" class="form-control" placeholder="e.g., TESDA PROGRAMMING (JAVA) NC III">
            </div>
            <div class="form-group">
                <label for="certificationLocation_${certificationId}">Location/Institution</label>
                <input type="text" id="certificationLocation_${certificationId}" name="certification_location[]" class="form-control" placeholder="e.g., JB Serrano Bldg., Elbo St., San Vicente Central, Calapan City">
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', certificationHTML);
    
    // Add event listeners to new inputs
    const newInputs = document.getElementById(certificationId).querySelectorAll('input');
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
    data.birthDate = formData.get('birth_date') || '';
    data.email = formData.get('email') || '';
    data.phone = formData.get('phone') || '';
    data.address = formData.get('address') || '';
    data.linkedin = formData.get('linkedin') || '';
    data.objective = formData.get('objective') || '';
    
    // Get profile picture data (synchronous for now)
    data.profilePicture = null;
    const profilePictureInput = document.getElementById('profilePicture');
    if (profilePictureInput && profilePictureInput.files && profilePictureInput.files.length > 0) {
        const file = profilePictureInput.files[0];
        if (file.type.startsWith('image/')) {
            // Store the file for later use
            data.profilePictureFile = file;
        }
    }
    
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
    
    // Get certification data
    data.certifications = [];
    const certificationNames = formData.getAll('certification_name[]');
    const certificationLocations = formData.getAll('certification_location[]');
    
    for (let i = 0; i < certificationNames.length; i++) {
        if (certificationNames[i]) {
            data.certifications.push({
                name: certificationNames[i],
                location: certificationLocations[i] || ''
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
    let html = '<div class="resume-preview resume-preview-modern">';

    // Header: Left (name + contacts), Right (photo)
    html += '<div class="rp-header">';

    // Left side
    html += '<div class="rp-header-left">';
    html += `<div class="rp-name">${data.fullName.toUpperCase()}</div>`;
    if (data.birthDate) {
        html += `<div class="rp-birthdate">${data.birthDate}</div>`;
    }

    // Contacts list with icons
    const contacts = [];
    if (data.phone) contacts.push(`<li><i class="fas fa-phone"></i><span>${data.phone}</span></li>`);
    if (data.email) contacts.push(`<li><i class="fas fa-envelope"></i><span>${data.email}</span></li>`);
    if (data.address) contacts.push(`<li><i class="fas fa-map-marker-alt"></i><span>${data.address}</span></li>`);
    if (data.linkedin) contacts.push(`<li><i class="fab fa-linkedin-in"></i><span>${data.linkedin}</span></li>`);
    if (contacts.length) {
        html += '<ul class="rp-contact-list">' + contacts.join('') + '</ul>';
    }
    html += '</div>';

    // Right side (photo)
    html += '<div class="rp-header-right">';
    if (data.profilePictureFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewContainer = document.getElementById('resumePreview');
            const imgHolder = previewContainer.querySelector('.rp-photo');
            if (imgHolder) {
                imgHolder.innerHTML = `<img src="${e.target.result}" alt="Profile Picture">`;
                imgHolder.classList.add('has-image');
            }
        };
        reader.readAsDataURL(data.profilePictureFile);
        html += '<div class="rp-photo"><i class="fas fa-spinner fa-spin"></i></div>';
    } else {
        html += '<div class="rp-photo"><i class="fas fa-user"></i></div>';
    }
    html += '</div>';

    html += '</div>'; // end header

    // Objective
    if (data.objective) {
        html += '<div class="rp-section">';
        html += '<div class="rp-section-title">OBJECTIVE</div>';
        html += `<div class="rp-paragraph">${data.objective}</div>`;
        html += '</div>';
    }

    // Experience
    if (data.experiences.length > 0) {
        html += '<div class="rp-section">';
        html += '<div class="rp-section-title">EXPERIENCE</div>';
        data.experiences.forEach(exp => {
            const dateRange = exp.startDate && exp.endDate ? `${exp.startDate} – ${exp.endDate}` : (exp.startDate || exp.endDate || '');
            html += '<div class="rp-exp-row">';
            html += `<div class="rp-exp-dates">${dateRange}</div>`;
            html += '<div class="rp-exp-content">';
            const companyJob = [
                exp.company ? `<span class="rp-company">${exp.company}</span>` : '',
                exp.jobTitle ? `<span class="rp-sep"> – </span><em class="rp-job">${exp.jobTitle}</em>` : ''
            ].join('');
            if (companyJob) {
                html += `<div class="rp-exp-head">${companyJob}</div>`;
            }
            if (exp.intro) {
                html += `<div class="rp-exp-intro">${exp.intro}</div>`;
            }
            if (exp.responsibilities) {
                const responsibilities = exp.responsibilities.split('\n').filter(item => item.trim());
                if (responsibilities.length > 0) {
                    html += '<ul class="rp-bullets">';
                    responsibilities.forEach(item => {
                        html += `<li>${item.trim()}</li>`;
                    });
                    html += '</ul>';
                }
            }
            if (exp.location) {
                html += `<div class="rp-exp-location">${exp.location}</div>`;
            }
            html += '</div>'; // exp-content
            html += '</div>'; // exp-row
        });
        html += '</div>';
    }

    // Certification
    if (data.certifications.length > 0) {
        html += '<div class="rp-section">';
        html += '<div class="rp-section-title">CERTIFICATION</div>';
        data.certifications.forEach(cert => {
            html += '<div class="rp-cert-line">';
            html += `<span class="rp-cert-name">${cert.name}</span>`;
            if (cert.location) html += `<span class="rp-cert-loc"> — ${cert.location}</span>`;
            html += '</div>';
        });
        html += '</div>';
    }

    // Two-column bottom: Education and Additional Skills
    html += '<div class="rp-two-col">';

    // Left: Education
    html += '<div class="rp-col">';
    html += '<div class="rp-section-title">EDUCATION</div>';
    if (data.educations.length > 0) {
        html += '<ul class="rp-edu-list">';
        data.educations.forEach(edu => {
            const dateRange = edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : (edu.startDate || edu.endDate || '');
            let line = '';
            if (edu.school) line += `<strong>${edu.school}</strong>`;
            if (edu.degree) line += (line ? ' — ' : '') + `${edu.degree}`;
            if (dateRange) line += `<div class="rp-edu-dates">${dateRange}</div>`;
            html += `<li>${line}</li>`;
        });
        html += '</ul>';
    }
    html += '</div>';

    // Right: Additional Skills
    html += '<div class="rp-col">';
    html += '<div class="rp-section-title">ADDITIONAL SKILLS</div>';
    if (data.skills.length > 0) {
        html += '<ul class="rp-bullets">';
        data.skills.forEach(skill => {
            if (skill && skill.trim()) html += `<li>${skill}</li>`;
        });
        html += '</ul>';
    }
    html += '</div>';

    html += '</div>'; // end two-col

    html += '</div>';
    return html;
}

// Generate PDF Function
function generatePDF() {
    const previewContent = document.querySelector('.resume-preview');
    if (!previewContent) {
        alert('Please fill out the form first to generate a PDF');
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Resume - ${document.getElementById('fullName').value || 'Professional Resume'}</title>
            <style>
                body { font-family: 'Arial', sans-serif; margin: 0; padding: 24px; color: #000; font-size: 12px; }
                .resume-preview-modern { font-family: 'Arial', sans-serif; }
                .rp-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
                .rp-header-left { flex: 1; }
                .rp-name { font-size: 22px; font-weight: 800; text-transform: uppercase; margin: 0 0 4px; }
                .rp-birthdate { font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; }
                .rp-contact-list { list-style: none; padding: 0; margin: 8px 0 0; }
                .rp-contact-list li { display: flex; align-items: center; gap: 8px; margin: 6px 0; }
                .rp-contact-list i { width: 16px; text-align: center; }
                .rp-header-right { width: 120px; }
                .rp-photo { width: 100%; aspect-ratio: 1 / 1; border: 3px solid #ccc; border-radius: 6px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                .rp-photo img { width: 100%; height: 100%; object-fit: cover; }

                .rp-section { margin-top: 16px; }
                .rp-section-title { font-weight: 800; text-transform: uppercase; margin: 0 0 8px; }
                .rp-paragraph { text-align: justify; }

                .rp-exp-row { display: grid; grid-template-columns: 160px 1fr; gap: 16px; margin: 10px 0; }
                .rp-exp-dates { color: #000; }
                .rp-exp-head { font-weight: 700; }
                .rp-company { font-weight: 700; }
                .rp-job { font-style: italic; }
                .rp-bullets { padding-left: 18px; margin: 6px 0; }
                .rp-bullets li { margin-bottom: 4px; }
                .rp-exp-intro { font-style: italic; margin: 6px 0; }
                .rp-exp-location { margin-top: 4px; }

                .rp-cert-line { margin: 6px 0; }
                .rp-cert-name { font-weight: 700; }

                .rp-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 8px; }
                .rp-edu-list { padding-left: 18px; }
                .rp-edu-list li { margin-bottom: 4px; }
                .rp-edu-dates { font-size: 11px; }

                @media print { body { padding: 16px; } }
            </style>
        </head>
        <body>
            ${previewContent.outerHTML}
            <script>window.onload = function() { window.print(); window.close(); };</script>
        </body>
        </html>
    `);
    printWindow.document.close();
} 