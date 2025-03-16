// Wait for document to be ready
document.addEventListener("DOMContentLoaded", () => {
    // Initialize Select2 when jQuery is available
    if (typeof $ !== "undefined") {
      $(document).ready(() => {
        // Initialize select2
        $("#skills").select2({
          placeholder: "Select required skills",
          allowClear: true,
          tags: true,
        })
  
        // Update experience value display
        $("#experience").on("input", function () {
          $(".experience-value").text($(this).val())
        })
  
        // Form submission
        $("#recommendationForm").on("submit", (e) => {
          e.preventDefault()
  
          // Show loading spinner
          $("#loadingSpinner").show()
  
          // Simulate API call with timeout
          setTimeout(() => {
            // Hide loading spinner
            $("#loadingSpinner").hide()
  
            // Get form values
            const industry = document.getElementById("industry").value
  
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
            const education = document.getElementById("education").value
  
            // Generate mock candidate data
            // Generate mock candidates based on criteria
            const candidates = generateMockCandidates(industry, skills, experience, education)
  
            // Display candidates
            displayCandidates(candidates)
  
            // Show recommendations container
            $("#recommendationsContainer").show()
  
            // Scroll to recommendations
            $("html, body").animate(
              {
                scrollTop: $("#recommendationsContainer").offset().top - 50,
              },
              500,
            )
          }, 1500)
        })
      })
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
  
      // Form submission without jQuery
      const recommendationForm = document.getElementById("recommendationForm")
      const loadingSpinner = document.getElementById("loadingSpinner")
      const recommendationsContainer = document.getElementById("recommendationsContainer")
      const candidatesList = document.getElementById("candidatesList")
  
      if (recommendationForm && loadingSpinner && recommendationsContainer) {
        recommendationForm.addEventListener("submit", (e) => {
          e.preventDefault()
  
          // Show loading spinner
          loadingSpinner.style.display = "block"
          recommendationsContainer.style.display = "none"
  
          // Get form values
          const industry = document.getElementById("industry").value
  
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
          const education = document.getElementById("education").value
  
          // Simulate API call with timeout
          setTimeout(() => {
            // Hide loading spinner
            loadingSpinner.style.display = "none"
  
            // Generate mock candidate data
            // Generate mock candidates based on criteria
            const candidates = generateMockCandidates(industry, skills, experience, education)
  
            // Display candidates
            displayCandidates(candidates)
  
            // Show recommendations container
            recommendationsContainer.style.display = "block"
  
            // Scroll to recommendations
            recommendationsContainer.scrollIntoView({ behavior: "smooth", block: "start" })
          }, 1500)
        })
      }
    }
  
    // Function to generate mock candidate data
    function generateMockCandidates(industry, requiredSkills, minExperience, minEducation) {
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
  
      const educationLevels = {
        high_school: 1,
        associate: 2,
        bachelor: 3,
        master: 4,
        phd: 5,
      }
  
      const minEducationLevel = minEducation === "any" ? 0 : educationLevels[minEducation]
  
      // Generate 5-10 random candidates
      const numCandidates = Math.floor(Math.random() * 6) + 5
  
      for (let i = 0; i < numCandidates; i++) {
        // Random name
        const name = names[Math.floor(Math.random() * names.length)]
  
        // Random experience (weighted towards matching the minimum)
        const expYears = Math.max(Number.parseInt(minExperience), Math.floor(Math.random() * 15))
  
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
  
        // Generate candidate skills (include some required skills and some random ones)
        const candidateSkills = []
  
        // Include 70-100% of required skills
        if (requiredSkills && requiredSkills.length > 0) {
          const numRequiredToInclude = Math.floor(requiredSkills.length * (0.7 + Math.random() * 0.3))
          const shuffledRequired = [...requiredSkills].sort(() => 0.5 - Math.random())
  
          for (let j = 0; j < numRequiredToInclude; j++) {
            candidateSkills.push(shuffledRequired[j])
          }
        }
  
        // Add some random skills
        const remainingSkills = allSkills.filter((skill) => !candidateSkills.includes(skill))
        const numRandomSkills = Math.floor(Math.random() * 5) + 2 // 2-6 additional skills
  
        const shuffledRemaining = [...remainingSkills].sort(() => 0.5 - Math.random())
        for (let j = 0; j < Math.min(numRandomSkills, shuffledRemaining.length); j++) {
          candidateSkills.push(shuffledRemaining[j])
        }
  
        // Calculate match percentage
        let matchPercentage = 0
        if (requiredSkills && requiredSkills.length > 0) {
          const skillsMatch = requiredSkills.filter((skill) => candidateSkills.includes(skill)).length
          matchPercentage = Math.round((skillsMatch / requiredSkills.length) * 100)
        } else {
          matchPercentage = Math.floor(Math.random() * 30) + 70 // 70-100% if no skills specified
        }
  
        // Adjust match percentage based on experience and education
        if (expYears >= Number.parseInt(minExperience)) {
          matchPercentage += 5
        }
  
        if (educationLevels[education] >= minEducationLevel) {
          matchPercentage += 5
        }
  
        // Cap at 100%
        matchPercentage = Math.min(matchPercentage, 100)
  
        candidates.push({
          id: i + 1,
          name: name,
          skills: candidateSkills,
          experience: expYears,
          education: education,
          matchPercentage: matchPercentage,
          industry: industry,
        })
      }
  
      // Sort by match percentage (highest first)
      return candidates.sort((a, b) => b.matchPercentage - a.matchPercentage)
    }
  
    // Function to display candidates
    function displayCandidates(candidates) {
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
          high_school: "High School",
          associate: "Associate Degree",
          bachelor: "Bachelor's Degree",
          master: "Master's Degree",
          phd: "PhD or Doctorate",
        }
  
        const candidateCard = document.createElement("div")
        candidateCard.className = "col-md-6 col-lg-4"
  
        const skillsHtml = candidate.skills
          .map((skill) => {
            const isMatch =
              document.getElementById("skills") &&
              Array.from(document.getElementById("skills").selectedOptions).some((option) => option.value === skill)
  
            return `<span class="skill-badge ${isMatch ? "skill-match" : ""}">${skill.replace("_", " ")}</span>`
          })
          .join("")
  
        candidateCard.innerHTML = `
                  <div class="candidate-card">
                      <div class="candidate-header">
                          <h3 class="candidate-name">${candidate.name}</h3>
                          <span class="match-percentage">${candidate.matchPercentage}% Match</span>
                      </div>
                      <div class="candidate-body">
                          <div class="candidate-info">
                              <div class="info-label">Industry</div>
                              <div class="info-value">${candidate.industry.charAt(0).toUpperCase() + candidate.industry.slice(1)}</div>
                          </div>
                          <div class="candidate-info">
                              <div class="info-label">Experience</div>
                              <div class="info-value">${candidate.experience} years</div>
                          </div>
                          <div class="candidate-info">
                              <div class="info-label">Education</div>
                              <div class="info-value">${educationDisplay[candidate.education]}</div>
                          </div>
                          <div class="candidate-info">
                              <div class="info-label">Skills</div>
                              <div class="skills-container">${skillsHtml}</div>
                          </div>
                          <a href="#" class="view-profile-btn">View Full Profile</a>
                      </div>
                  </div>
              `
  
        candidatesList.appendChild(candidateCard)
      })
    }
  })
  
  