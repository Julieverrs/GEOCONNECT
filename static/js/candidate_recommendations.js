document.addEventListener("DOMContentLoaded", () => {
  console.log("Candidate recommendations script loaded")

  // Initialize Select2 if jQuery is available
  if (typeof $ !== "undefined") {
    try {
      // Initialize all select2 dropdowns
      $("#skills").select2({
        placeholder: "Select required skills",
        allowClear: true,
        tags: true,
      })

      $("#certifications").select2({
        placeholder: "Select required certifications",
        allowClear: true,
      })

      $("#languages").select2({
        placeholder: "Select required languages",
        allowClear: true,
      })

      // Update experience value display
      $("#experience").on("input", function () {
        $(".experience-value").text($(this).val())
      })

      // Update salary value display
      $("#salary_range").on("input", function () {
        const value = Number.parseInt($(this).val()).toLocaleString("en-PH", {
          style: "currency",
          currency: "PHP",
          maximumFractionDigits: 0,
        })
        $(".salary-value").text(value)
      })

      // Initialize tooltips if Bootstrap is available
      if (typeof bootstrap !== "undefined" && bootstrap.Tooltip) {
        const tooltips = document.querySelectorAll(".tooltip-icon")
        tooltips.forEach((tooltip) => {
          new bootstrap.Tooltip(tooltip)
        })
      }

      // Toggle sections
      $(".form-section-header").on("click", function () {
        $(this).find("i.fas").toggleClass("fa-chevron-down fa-chevron-up")
        $(this).next(".form-section-content").slideToggle(200)
      })

      // Form submission
      $("#recommendationForm").on("submit", (e) => {
        e.preventDefault()

        // Show loading spinner
        $("#loadingSpinner").show()
        $("#recommendationsContainer").hide()

        // Get form values
        const formData = {
          industry: $("#industry").val(),
          jobType: $("#job_type").val(),
          workArrangement: $("#work_arrangement").val(),
          skills: $("#skills").val() || [],
          experience: $("#experience").val(),
          currentRoleYears: $("#current_role_years").val(),
          education: $("#education").val(),
          certifications: $("#certifications").val() || [],
          languages: $("#languages").val() || [],
          salaryRange: $("#salary_range").val(),
          availability: $("#availability").val(),
        }

        // Simulate API call with timeout
        setTimeout(() => {
          // Hide loading spinner
          $("#loadingSpinner").hide()

          // Generate mock candidates based on criteria
          const candidates = generateMockCandidates(formData)

          // Display candidates
          displayCandidates(candidates, formData)

          // Show recommendations container
          $("#recommendationsContainer").show()

          // Scroll to recommendations
          $("html, body").animate(
            {
              scrollTop: $("#recommendationsContainer").offset().top - 50,
            },
            500,
          )

          // Initialize sorting buttons
          initSortButtons(candidates, formData)
        }, 1500)
      })
    } catch (e) {
      console.error("Error initializing components:", e)
    }
  } else {
    console.error("jQuery is not loaded. Select2 initialization failed.")

    // Fallback for experience slider without jQuery
    const experienceSlider = document.getElementById("experience")
    const experienceValue = document.querySelector(".experience-value")

    if (experienceSlider && experienceValue) {
      experienceSlider.addEventListener("input", function () {
        experienceValue.textContent = this.value
      })
    }

    // Fallback for salary slider without jQuery
    const salarySlider = document.getElementById("salary_range")
    const salaryValue = document.querySelector(".salary-value")

    if (salarySlider && salaryValue) {
      salarySlider.addEventListener("input", function () {
        const value = Number.parseInt(this.value).toLocaleString("en-PH", {
          style: "currency",
          currency: "PHP",
          maximumFractionDigits: 0,
        })
        salaryValue.textContent = value
      })
    }

    // Form submission without jQuery
    const recommendationForm = document.getElementById("recommendationForm")
    const loadingSpinner = document.getElementById("loadingSpinner")
    const recommendationsContainer = document.getElementById("recommendationsContainer")

    if (recommendationForm && loadingSpinner && recommendationsContainer) {
      recommendationForm.addEventListener("submit", (e) => {
        e.preventDefault()

        // Show loading spinner
        loadingSpinner.style.display = "block"
        recommendationsContainer.style.display = "none"

        // Get form values
        const industry = document.getElementById("industry").value
        const jobType = document.getElementById("job_type").value
        const workArrangement = document.getElementById("work_arrangement").value

        // Get skills (handle both Select2 and native select)
        let skills = []
        const skillsElement = document.getElementById("skills")
        if (skillsElement) {
          if (typeof $ !== "undefined" && $.fn.select2) {
            skills = $("#skills").val()
          } else {
            // Fallback for native select
            skills = Array.from(skillsElement.selectedOptions).map((option) => option.value)
          }
        }

        const experience = document.getElementById("experience").value
        const currentRoleYears = document.getElementById("current_role_years").value
        const education = document.getElementById("education").value

        // Get certifications
        let certifications = []
        const certificationsElement = document.getElementById("certifications")
        if (certificationsElement) {
          certifications = Array.from(certificationsElement.selectedOptions).map((option) => option.value)
        }

        // Get languages
        let languages = []
        const languagesElement = document.getElementById("languages")
        if (languagesElement) {
          languages = Array.from(languagesElement.selectedOptions).map((option) => option.value)
        }

        const salaryRange = document.getElementById("salary_range").value
        const availability = document.getElementById("availability").value

        const formData = {
          industry,
          jobType,
          workArrangement,
          skills,
          experience,
          currentRoleYears,
          education,
          certifications,
          languages,
          salaryRange,
          availability,
        }

        // Simulate API call with timeout
        setTimeout(() => {
          // Hide loading spinner
          loadingSpinner.style.display = "none"

          // Generate mock candidates based on criteria
          const candidates = generateMockCandidates(formData)

          // Display candidates
          displayCandidates(candidates, formData)

          // Show recommendations container
          recommendationsContainer.style.display = "block"

          // Scroll to recommendations
          recommendationsContainer.scrollIntoView({ behavior: "smooth", block: "start" })

          // Initialize sorting buttons
          initSortButtons(candidates, formData)
        }, 1500)
      })
    }
  }

  // Function to initialize sort buttons
  function initSortButtons(candidates, formData) {
    const sortMatchBtn = document.getElementById("sortMatchBtn")
    const sortExpBtn = document.getElementById("sortExpBtn")

    if (sortMatchBtn) {
      sortMatchBtn.addEventListener("click", () => {
        const sortedByMatch = [...candidates].sort((a, b) => b.matchPercentage - a.matchPercentage)
        displayCandidates(sortedByMatch, formData)
      })
    }

    if (sortExpBtn) {
      sortExpBtn.addEventListener("click", () => {
        const sortedByExp = [...candidates].sort((a, b) => b.experience - a.experience)
        displayCandidates(sortedByExp, formData)
      })
    }
  }

  // Function to generate mock candidate data
  function generateMockCandidates(formData) {
    const candidates = []
    const names = [
      "John Smith",
      "Emma Johnson",
      "Michael Brown",
      "Sophia Davis",
      "William Wilson",
      "Olivia Martinez",
      "James Taylor",
      "Ava Anderson",
      "Robert Thomas",
      "Isabella Jackson",
      "David White",
      "Mia Harris",
      "Joseph Martin",
      "Charlotte Thompson",
      "Thomas Garcia",
      "Amelia Martinez",
    ]

    const allSkills = [
      "python",
      "java",
      "javascript",
      "react",
      "angular",
      "vue",
      "node",
      "django",
      "flask",
      "sql",
      "nosql",
      "aws",
      "docker",
      "kubernetes",
      "devops",
      "project_management",
      "marketing",
      "sales",
      "customer_service",
      "accounting",
      "hr",
      "communication",
      "leadership",
      "problem_solving",
      "teamwork",
      "time_management",
    ]

    const allCertifications = [
      "prc",
      "tesda",
      "csp",
      "pmp",
      "aws_cert",
      "cisco",
      "microsoft",
      "google",
      "cpa",
      "ncii",
      "nciii",
      "nciv",
    ]

    const allLanguages = [
      "english",
      "filipino",
      "cebuano",
      "ilocano",
      "hiligaynon",
      "bicolano",
      "waray",
      "chinese",
      "japanese",
      "korean",
      "spanish",
    ]

    const jobTypes = ["full_time", "part_time", "contract", "temporary", "internship"]

    const workArrangements = ["onsite", "remote", "hybrid"]

    const availabilityOptions = ["immediate", "two_weeks", "one_month", "three_months"]

    const educationLevels = {
      high_school: 1,
      vocational: 2,
      associate: 3,
      bachelor: 4,
      master: 5,
      phd: 6,
    }

    const minEducationLevel = formData.education === "any" ? 0 : educationLevels[formData.education]

    // Generate 5-10 random candidates
    const numCandidates = Math.floor(Math.random() * 6) + 5

    for (let i = 0; i < numCandidates; i++) {
      // Random name
      const name = names[Math.floor(Math.random() * names.length)]

      // Random experience (weighted towards matching the minimum)
      const expYears = Math.max(Number.parseInt(formData.experience), Math.floor(Math.random() * 15))

      // Random current role years
      const currentRoleYears = Math.min(expYears, Math.floor(Math.random() * 10) + 1)

      // Random education level (at or above minimum)
      const educationKeys = Object.keys(educationLevels)
      let educationIndex = 0

      if (minEducationLevel > 0) {
        // Find index of minimum education level
        educationIndex = educationKeys.findIndex((key) => educationLevels[key] === minEducationLevel)
        // Get random education at or above minimum
        educationIndex = Math.floor(Math.random() * (educationKeys.length - educationIndex)) + educationIndex
      } else {
        educationIndex = Math.floor(Math.random() * educationKeys.length)
      }

      const education = educationKeys[educationIndex]

      // Random job type
      const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)]

      // Random work arrangement
      const workArrangement = workArrangements[Math.floor(Math.random() * workArrangements.length)]

      // Random availability
      const availability = availabilityOptions[Math.floor(Math.random() * availabilityOptions.length)]

      // Random salary expectation
      const salaryMin = Math.max(15000, Number.parseInt(formData.salaryRange) - 10000)
      const salaryMax = Number.parseInt(formData.salaryRange)

      // Generate candidate skills (include some required skills and some random ones)
      const candidateSkills = []

      // Include 70-100% of required skills
      if (formData.skills && formData.skills.length > 0) {
        const numRequiredToInclude = Math.floor(formData.skills.length * (0.7 + Math.random() * 0.3))
        const shuffledRequired = [...formData.skills].sort(() => 0.5 - Math.random())

        for (let j = 0; j < numRequiredToInclude; j++) {
          if (shuffledRequired[j]) {
            candidateSkills.push(shuffledRequired[j])
          }
        }
      }

      // Add some random skills
      const remainingSkills = allSkills.filter((skill) => !candidateSkills.includes(skill))
      const numRandomSkills = Math.floor(Math.random() * 5) + 2 // 2-6 additional skills

      const shuffledRemaining = [...remainingSkills].sort(() => 0.5 - Math.random())
      for (let j = 0; j < Math.min(numRandomSkills, shuffledRemaining.length); j++) {
        candidateSkills.push(shuffledRemaining[j])
      }

      // Generate certifications
      const candidateCertifications = []

      // Include some required certifications if specified
      if (formData.certifications && formData.certifications.length > 0) {
        const numCertsToInclude = Math.floor(formData.certifications.length * (0.5 + Math.random() * 0.5))
        const shuffledCerts = [...formData.certifications].sort(() => 0.5 - Math.random())

        for (let j = 0; j < numCertsToInclude; j++) {
          if (shuffledCerts[j]) {
            candidateCertifications.push(shuffledCerts[j])
          }
        }
      }

      // Add some random certifications
      const numRandomCerts = Math.floor(Math.random() * 3) // 0-2 additional certifications
      const remainingCerts = allCertifications.filter((cert) => !candidateCertifications.includes(cert))
      const shuffledRemainingCerts = [...remainingCerts].sort(() => 0.5 - Math.random())

      for (let j = 0; j < Math.min(numRandomCerts, shuffledRemainingCerts.length); j++) {
        candidateCertifications.push(shuffledRemainingCerts[j])
      }

      // Generate languages
      const candidateLanguages = ["english"] // Everyone speaks English by default

      // Include some required languages if specified
      if (formData.languages && formData.languages.length > 0) {
        const numLangsToInclude = Math.floor(formData.languages.length * (0.5 + Math.random() * 0.5))
        const shuffledLangs = [...formData.languages].sort(() => 0.5 - Math.random())

        for (let j = 0; j < numLangsToInclude; j++) {
          if (shuffledLangs[j] && !candidateLanguages.includes(shuffledLangs[j])) {
            candidateLanguages.push(shuffledLangs[j])
          }
        }
      }

      // Add some random languages
      const numRandomLangs = Math.floor(Math.random() * 2) // 0-1 additional languages
      const remainingLangs = allLanguages.filter((lang) => !candidateLanguages.includes(lang))
      const shuffledRemainingLangs = [...remainingLangs].sort(() => 0.5 - Math.random())

      for (let j = 0; j < Math.min(numRandomLangs, shuffledRemainingLangs.length); j++) {
        candidateLanguages.push(shuffledRemainingLangs[j])
      }

      // Calculate match percentage
      let matchPercentage = 0
      let matchFactors = 0
      let totalFactors = 0

      // Skills match (highest weight)
      if (formData.skills && formData.skills.length > 0) {
        totalFactors += 40
        const skillsMatch = formData.skills.filter((skill) => candidateSkills.includes(skill)).length
        matchFactors += Math.round((skillsMatch / formData.skills.length) * 40)
      }

      // Experience match
      if (formData.experience > 0) {
        totalFactors += 20
        if (expYears >= Number.parseInt(formData.experience)) {
          matchFactors += 20
        } else {
          matchFactors += Math.round((expYears / Number.parseInt(formData.experience)) * 20)
        }
      }

      // Education match
      if (formData.education !== "any") {
        totalFactors += 10
        if (educationLevels[education] >= minEducationLevel) {
          matchFactors += 10
        }
      }

      // Certifications match
      if (formData.certifications && formData.certifications.length > 0) {
        totalFactors += 10
        const certsMatch = formData.certifications.filter((cert) => candidateCertifications.includes(cert)).length
        matchFactors += Math.round((certsMatch / formData.certifications.length) * 10)
      }

      // Languages match
      if (formData.languages && formData.languages.length > 0) {
        totalFactors += 10
        const langsMatch = formData.languages.filter((lang) => candidateLanguages.includes(lang)).length
        matchFactors += Math.round((langsMatch / formData.languages.length) * 10)
      }

      // Job type match
      if (formData.jobType !== "any") {
        totalFactors += 5
        if (jobType === formData.jobType) {
          matchFactors += 5
        }
      }

      // Work arrangement match
      if (formData.workArrangement !== "any") {
        totalFactors += 5
        if (workArrangement === formData.workArrangement) {
          matchFactors += 5
        }
      }

      // Calculate final percentage
      if (totalFactors > 0) {
        matchPercentage = Math.round((matchFactors / totalFactors) * 100)
      } else {
        matchPercentage = Math.floor(Math.random() * 30) + 70 // 70-100% if no criteria specified
      }

      // Cap at 100%
      matchPercentage = Math.min(matchPercentage, 100)

      candidates.push({
        id: i + 1,
        name: name,
        skills: candidateSkills,
        experience: expYears,
        currentRoleYears: currentRoleYears,
        education: education,
        jobType: jobType,
        workArrangement: workArrangement,
        certifications: candidateCertifications,
        languages: candidateLanguages,
        availability: availability,
        salaryExpectation: {
          min: salaryMin,
          max: salaryMax,
        },
        matchPercentage: matchPercentage,
        industry: formData.industry,
      })
    }

    // Sort by match percentage (highest first)
    return candidates.sort((a, b) => b.matchPercentage - a.matchPercentage)
  }

  // Function to display candidates
  function displayCandidates(candidates, formData) {
    const candidatesList = document.getElementById("candidatesList")
    if (!candidatesList) return

    candidatesList.innerHTML = ""

    if (candidates.length === 0) {
      candidatesList.innerHTML =
        '<div class="col-12"><div class="alert alert-warning">No candidates found matching your criteria. Try adjusting your requirements.</div></div>'
      return
    }

    candidates.forEach((candidate) => {
      const educationDisplay = {
        high_school: "High School / K-12",
        vocational: "Vocational / Technical",
        associate: "Associate Degree",
        bachelor: "Bachelor's Degree",
        master: "Master's Degree",
        phd: "PhD or Doctorate",
      }

      const jobTypeDisplay = {
        full_time: "Full-Time",
        part_time: "Part-Time",
        contract: "Contract",
        temporary: "Temporary",
        internship: "Internship",
      }

      const workArrangementDisplay = {
        onsite: "On-site",
        remote: "Remote",
        hybrid: "Hybrid",
      }

      const availabilityDisplay = {
        immediate: "Immediate",
        two_weeks: "Within 2 weeks",
        one_month: "Within 1 month",
        three_months: "Within 3 months",
      }

      const certificationDisplay = {
        prc: "PRC Licensed",
        tesda: "TESDA Certified",
        csp: "Civil Service Eligible",
        pmp: "PMP",
        aws_cert: "AWS Certified",
        cisco: "Cisco Certified",
        microsoft: "Microsoft Certified",
        google: "Google Certified",
        cpa: "CPA",
        ncii: "NC II",
        nciii: "NC III",
        nciv: "NC IV",
      }

      const languageDisplay = {
        english: "English",
        filipino: "Filipino/Tagalog",
        cebuano: "Cebuano",
        ilocano: "Ilocano",
        hiligaynon: "Hiligaynon",
        bicolano: "Bicolano",
        waray: "Waray",
        chinese: "Chinese",
        japanese: "Japanese",
        korean: "Korean",
        spanish: "Spanish",
      }

      const candidateCard = document.createElement("div")
      candidateCard.className = "col-md-6 col-lg-4"

      // Group skills by category for better display
      const technicalSkills = candidate.skills.filter((skill) =>
        [
          "python",
          "java",
          "javascript",
          "react",
          "angular",
          "vue",
          "node",
          "django",
          "flask",
          "sql",
          "nosql",
          "aws",
          "docker",
          "kubernetes",
          "devops",
        ].includes(skill),
      )

      const businessSkills = candidate.skills.filter((skill) =>
        ["project_management", "marketing", "sales", "customer_service", "accounting", "hr"].includes(skill),
      )

      const softSkills = candidate.skills.filter((skill) =>
        ["communication", "leadership", "problem_solving", "teamwork", "time_management"].includes(skill),
      )

      // Create HTML for skills with categories
      let skillsHTML = ""

      if (technicalSkills.length > 0) {
        skillsHTML += `
          <div class="skill-category">
            <div class="skill-category-title">Technical Skills</div>
            <div class="skills-container">
        `

        technicalSkills.forEach((skill) => {
          const isMatch = formData.skills && formData.skills.includes(skill)
          skillsHTML += `<span class="skill-badge ${isMatch ? "skill-match" : ""}">${skill.replace("_", " ")}</span>`
        })

        skillsHTML += `
            </div>
          </div>
        `
      }

      if (businessSkills.length > 0) {
        skillsHTML += `
          <div class="skill-category">
            <div class="skill-category-title">Business Skills</div>
            <div class="skills-container">
        `

        businessSkills.forEach((skill) => {
          const isMatch = formData.skills && formData.skills.includes(skill)
          skillsHTML += `<span class="skill-badge ${isMatch ? "skill-match" : ""}">${skill.replace("_", " ")}</span>`
        })

        skillsHTML += `
            </div>
          </div>
        `
      }

      if (softSkills.length > 0) {
        skillsHTML += `
          <div class="skill-category">
            <div class="skill-category-title">Soft Skills</div>
            <div class="skills-container">
        `

        softSkills.forEach((skill) => {
          const isMatch = formData.skills && formData.skills.includes(skill)
          skillsHTML += `<span class="skill-badge ${isMatch ? "skill-match" : ""}">${skill.replace("_", " ")}</span>`
        })

        skillsHTML += `
            </div>
          </div>
        `
      }

      // Create HTML for certifications
      let certificationsHTML = ""
      if (candidate.certifications && candidate.certifications.length > 0) {
        certificationsHTML = `
          <div class="badge-container">
        `

        candidate.certifications.forEach((cert) => {
          const isMatch = formData.certifications && formData.certifications.includes(cert)
          certificationsHTML += `<span class="badge-item badge-certification ${isMatch ? "skill-match" : ""}">${certificationDisplay[cert] || cert}</span>`
        })

        certificationsHTML += `
          </div>
        `
      }

      // Create HTML for languages
      let languagesHTML = ""
      if (candidate.languages && candidate.languages.length > 0) {
        languagesHTML = `
          <div class="badge-container">
        `

        candidate.languages.forEach((lang) => {
          const isMatch = formData.languages && formData.languages.includes(lang)
          languagesHTML += `<span class="badge-item badge-language ${isMatch ? "skill-match" : ""}">${languageDisplay[lang] || lang}</span>`
        })

        languagesHTML += `
          </div>
        `
      }

      candidateCard.innerHTML = `
        <div class="candidate-card">
          <div class="candidate-header">
            <h3 class="candidate-name">${candidate.name}</h3>
            <span class="match-percentage">${candidate.matchPercentage}% Match</span>
          </div>
          <div class="candidate-body">
            <div class="match-progress">
              <div class="match-progress-bar" style="width: ${candidate.matchPercentage}%"></div>
            </div>
            
            <div class="candidate-info">
              <div class="info-label">Industry</div>
              <div class="info-value">${candidate.industry.charAt(0).toUpperCase() + candidate.industry.slice(1)}</div>
            </div>
            
            <div class="row">
              <div class="col-6">
                <div class="candidate-info">
                  <div class="info-label">Experience</div>
                  <div class="info-value">${candidate.experience} years</div>
                </div>
              </div>
              <div class="col-6">
                <div class="candidate-info">
                  <div class="info-label">Current Role</div>
                  <div class="info-value">${candidate.currentRoleYears} years</div>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col-6">
                <div class="candidate-info">
                  <div class="info-label">Education</div>
                  <div class="info-value">${educationDisplay[candidate.education]}</div>
                </div>
              </div>
              <div class="col-6">
                <div class="candidate-info">
                  <div class="info-label">Job Type</div>
                  <div class="info-value">${jobTypeDisplay[candidate.jobType]}</div>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col-6">
                <div class="candidate-info">
                  <div class="info-label">Work Arrangement</div>
                  <div class="info-value">${workArrangementDisplay[candidate.workArrangement]}</div>
                </div>
              </div>
              <div class="col-6">
                <div class="candidate-info">
                  <div class="info-label">Availability</div>
                  <div class="info-value">${availabilityDisplay[candidate.availability]}</div>
                </div>
              </div>
            </div>
            
            <div class="candidate-info">
              <div class="info-label">Salary Expectation</div>
              <div class="info-value">
                ${candidate.salaryExpectation.min.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                  maximumFractionDigits: 0,
                })} - 
                ${candidate.salaryExpectation.max.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
            
            <div class="candidate-info">
              <div class="info-label">Skills</div>
              ${skillsHTML}
            </div>
            
            ${
              candidate.certifications && candidate.certifications.length > 0
                ? `
              <div class="candidate-info">
                <div class="info-label">Certifications</div>
                ${certificationsHTML}
              </div>
            `
                : ""
            }
            
            ${
              candidate.languages && candidate.languages.length > 0
                ? `
              <div class="candidate-info">
                <div class="info-label">Languages</div>
                ${languagesHTML}
              </div>
            `
                : ""
            }
            
            <div class="candidate-stats">
              <div class="stat-item">
                <span class="stat-value">${candidate.experience}</span>
                <span class="stat-label">Years Exp</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">${candidate.skills.length}</span>
                <span class="stat-label">Skills</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">${candidate.certifications.length}</span>
                <span class="stat-label">Certs</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">${candidate.languages.length}</span>
                <span class="stat-label">Languages</span>
              </div>
            </div>
            
            <div class="candidate-actions">
              <a href="#" class="view-profile-btn">View Full Profile</a>
              <button class="btn btn-primary btn-sm">Contact</button>
            </div>
          </div>
        </div>
      `

      candidatesList.appendChild(candidateCard)
    })
  }
})

