// Add these variables at the top of your file to track map instances
//let currentMap = null
//let currentMarker = null

// Add this at the top of your file to define the standard options
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Temporary", "Internship"]

const EXPERIENCE_LEVELS = ["Entry Level", "Junior", "Mid Level", "Senior", "Lead", "Expert"]

// Add this at the top of your file with the other constants
const WORK_SETUPS = ["On-site", "Hybrid", "Remote"]

// Remove this function entirely
// async function getCompanyLocation() {
//   // ... removing this function
// }

document.addEventListener("DOMContentLoaded", () => {
  // Profile Dropdown
  const profileTrigger = document.querySelector(".profile-trigger")
  const dropdownMenu = document.querySelector(".dropdown-menu")

  profileTrigger.addEventListener("click", (e) => {
    e.stopPropagation()
    dropdownMenu.classList.toggle("active")
  })

  document.addEventListener("click", (e) => {
    if (!dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove("active")
    }
  })

  // Modal Handling
  const createJobBtn = document.getElementById("createJobBtn")
  const createJobModal = document.getElementById("createJobModal")
  const closeModal = document.querySelector(".close-modal")
  const cancelBtn = document.getElementById("cancelJob")
  const jobForm = document.querySelector(".job-form")

  function openModal() {
    const createJobModal = document.getElementById("createJobModal")
    createJobModal.classList.add("active")
    document.body.style.overflow = "hidden"
  }

  function closeModalHandler() {
    createJobModal.classList.remove("active")
    document.body.style.overflow = ""
    jobForm.reset()
  }

  // Modify the createJobBtn click handler
  createJobBtn.addEventListener("click", () => {
    // Simply open modal
    openModal()
  })
  closeModal.addEventListener("click", closeModalHandler)
  cancelBtn.addEventListener("click", closeModalHandler)

  createJobModal.addEventListener("click", (e) => {
    if (e.target === createJobModal) {
      closeModalHandler()
    }
  })

  // Get CSRF token
  function getCookie(name) {
    let cookieValue = null
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";")
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim()
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
          break
        }
      }
    }
    return cookieValue
  }

  // Job Form Submission
  jobForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = {
      jobTitle: document.getElementById("jobTitle").value,
      location: document.getElementById("location").value,
      jobType: document.getElementById("jobType").value,
      workSetup: document.getElementById("workSetup").value,
      description: document.getElementById("description").value,
      salary: document.getElementById("salary").value,
      experience: document.getElementById("experience").value,
      requirements: document.getElementById("requirements").value || "",
    }

    // Validate job type, experience level, and work setup
    if (!JOB_TYPES.includes(formData.jobType)) {
      showNotification("Invalid job type selected", "error")
      return
    }

    if (!EXPERIENCE_LEVELS.includes(formData.experience)) {
      showNotification("Invalid experience level selected", "error")
      return
    }

    if (!WORK_SETUPS.includes(formData.workSetup)) {
      showNotification("Invalid work setup selected", "error")
      return
    }

    try {
      const response = await fetch("/employer/create-job/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        addJobCard(data.job)
        closeModalHandler()
        showNotification("Job posted successfully!", "success")
      } else {
        showNotification(data.error || "Error creating job", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("An error occurred while creating the job.", "error")
    }
  })

  function addJobCard(job) {
    const jobsGrid = document.querySelector(".jobs-grid")
    const noJobs = jobsGrid.querySelector(".no-jobs")
    if (noJobs) {
      noJobs.remove()
    }

    const jobCard = document.createElement("div")
    jobCard.className = "job-card"
    jobCard.dataset.jobId = job.id

    jobCard.innerHTML = `
        <div class="job-card-header">
            <h3>${job.title}</h3>
            <span class="status-badge active">Active</span>
        </div>
        <div class="job-card-content">
            <p>${job.description}</p>
            <div class="job-meta">
                <span class="job-location">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke-width="2"/>
                        <path d="M12 22C14 18 20 15.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 15.4183 10 18 12 22Z" stroke-width="2"/>
                    </svg>
                    ${job.location}
                </span>
                <span class="job-type">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 8V12L15 15" stroke-width="2" stroke-linecap="round"/>
                        <circle cx="12" cy="12" r="9" stroke-width="2"/>
                    </svg>
                    ${job.job_type}
                </span>
                <span class="work-setup">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke-width="2"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke-width="2"/>
                    </svg>
                    ${job.work_setup}
                </span>
            </div>
            <div class="requirements">
                <h4>Requirements:</h4>
                <p>${job.requirements || "No requirements specified"}</p>
            </div>
        </div>
        <div class="job-card-footer">
            <span class="applications-count">0 applications</span>
            <div class="card-actions">
                <button class="action-button edit" onclick="editJob(${job.id})">Edit</button>
                <button class="action-button view" onclick="viewJob(${job.id})">View</button>
            </div>
        </div>
    `

    jobsGrid.insertBefore(jobCard, jobsGrid.firstChild)
  }

  function showNotification(message, type) {
    const notification = document.createElement("div")
    notification.className = `notification ${type}`
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  // View Job Modal
  const viewJobModal = document.getElementById("viewJobModal")
  const closeViewModal = viewJobModal.querySelector(".close-modal")
  const closeViewBtn = viewJobModal.querySelector(".close-view-modal")

  // Edit Job Modal
  const editJobModal = document.getElementById("editJobModal")
  const closeEditModal = editJobModal.querySelector(".close-modal")
  const closeEditBtn = editJobModal.querySelector(".close-edit-modal")
  const editJobForm = document.getElementById("editJobForm")

  function closeViewModalHandler() {
    viewJobModal.classList.remove("active")
    document.body.style.overflow = ""
  }

  function closeEditModalHandler() {
    editJobModal.classList.remove("active")
    document.body.style.overflow = ""
    editJobForm.reset()
  }

  closeViewModal.addEventListener("click", closeViewModalHandler)
  closeViewBtn.addEventListener("click", closeViewModalHandler)
  closeEditModal.addEventListener("click", closeEditModalHandler)
  closeEditBtn.addEventListener("click", closeEditModalHandler)

  viewJobModal.addEventListener("click", (e) => {
    if (e.target === viewJobModal) closeViewModalHandler()
  })

  editJobModal.addEventListener("click", (e) => {
    if (e.target === editJobModal) closeEditModalHandler()
  })

  // Update the global view and edit functions
  window.viewJob = async (jobId) => {
    try {
      const response = await fetch(`/employer/get-job/${jobId}/`)
      const data = await response.json()

      if (data.job) {
        // Make sure we have all elements before setting their content
        const elements = {
          title: document.getElementById("viewJobTitle"),
          location: document.getElementById("viewJobLocation"),
          type: document.getElementById("viewJobType"),
          workSetup: document.getElementById("viewWorkSetup"),
          experience: document.getElementById("viewJobExperience"),
          salary: document.getElementById("viewJobSalary"),
          description: document.getElementById("viewJobDescription"),
          status: document.getElementById("viewJobStatus"),
          requirements: document.getElementById("viewJobRequirements"),
        }

        // Check if all elements exist
        for (const [key, element] of Object.entries(elements)) {
          if (!element) {
            console.error(`Missing element: view${key.charAt(0).toUpperCase() + key.slice(1)}`)
            return
          }
        }

        // Set the content
        elements.title.textContent = data.job.title
        elements.location.textContent = data.job.location
        elements.type.textContent = data.job.job_type
        elements.workSetup.textContent = data.job.work_setup || "Not specified"
        elements.experience.textContent = data.job.experience_level
        elements.salary.textContent = data.job.salary_range
        elements.description.textContent = data.job.description
        elements.status.textContent = data.job.status
        elements.requirements.textContent = data.job.requirements || "No requirements specified"

        // Show the modal
        const viewJobModal = document.getElementById("viewJobModal")
        if (viewJobModal) {
          viewJobModal.classList.add("active")
          document.body.style.overflow = "hidden"
        }
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("Error loading job details", "error")
    }
  }

  // Function to edit job
  window.editJob = async (jobId) => {
    try {
      const response = await fetch(`/employer/get-job/${jobId}/`)
      const data = await response.json()

      if (data.job) {
        // Make sure we have all elements before setting their values
        const elements = {
          id: document.getElementById("editJobId"),
          title: document.getElementById("editJobTitle"),
          location: document.getElementById("editLocation"),
          type: document.getElementById("editJobType"),
          workSetup: document.getElementById("editWorkSetup"),
          description: document.getElementById("editDescription"),
          salary: document.getElementById("editSalary"),
          experience: document.getElementById("editExperience"),
          status: document.getElementById("editStatus"),
          requirements: document.getElementById("editRequirements"),
        }

        // Check if all elements exist
        for (const [key, element] of Object.entries(elements)) {
          if (!element) {
            console.error(`Missing element: edit${key.charAt(0).toUpperCase() + key.slice(1)}`)
            return
          }
        }

        // Set the values
        elements.id.value = data.job.id
        elements.title.value = data.job.title
        elements.location.value = data.job.location
        elements.type.value = data.job.job_type
        elements.workSetup.value = data.job.work_setup
        elements.description.value = data.job.description
        elements.salary.value = data.job.salary_range
        elements.experience.value = data.job.experience_level
        elements.status.value = data.job.status.toLowerCase()
        elements.requirements.value = data.job.requirements || ""

        // Ensure the correct options are selected
        const jobTypeSelect = elements.type
        const experienceSelect = elements.experience
        const workSetupSelect = elements.workSetup

        // Set job type
        for (let i = 0; i < jobTypeSelect.options.length; i++) {
          if (jobTypeSelect.options[i].value === data.job.job_type) {
            jobTypeSelect.selectedIndex = i
            break
          }
        }

        // Set experience level
        for (let i = 0; i < experienceSelect.options.length; i++) {
          if (experienceSelect.options[i].value === data.job.experience_level) {
            experienceSelect.selectedIndex = i
            break
          }
        }

        // Set work setup
        for (let i = 0; i < workSetupSelect.options.length; i++) {
          if (workSetupSelect.options[i].value === data.job.work_setup) {
            workSetupSelect.selectedIndex = i
            break
          }
        }

        // Show the modal
        const editJobModal = document.getElementById("editJobModal")
        if (editJobModal) {
          editJobModal.classList.add("active")
          document.body.style.overflow = "hidden"
        }
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("Error loading job details", "error")
    }
  }

  // Handle Edit Job Form Submission
  editJobForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const jobId = document.getElementById("editJobId").value
    const formData = {
      jobTitle: document.getElementById("editJobTitle").value,
      location: document.getElementById("editLocation").value,
      jobType: document.getElementById("editJobType").value,
      workSetup: document.getElementById("editWorkSetup").value,
      description: document.getElementById("editDescription").value,
      salary: document.getElementById("editSalary").value,
      experience: document.getElementById("editExperience").value,
      status: document.getElementById("editStatus").value,
      requirements: document.getElementById("editRequirements").value || "",
    }

    // Validate job type, experience level, and work setup
    if (!JOB_TYPES.includes(formData.jobType)) {
      showNotification("Invalid job type selected", "error")
      return
    }

    if (!EXPERIENCE_LEVELS.includes(formData.experience)) {
      showNotification("Invalid experience level selected", "error")
      return
    }

    if (!WORK_SETUPS.includes(formData.workSetup)) {
      showNotification("Invalid work setup selected", "error")
      return
    }

    try {
      const response = await fetch(`/employer/edit-job/${jobId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        updateJobCard(data.job)
        closeEditModalHandler()
        showNotification("Job updated successfully!", "success")
      } else {
        showNotification(data.error || "Error updating job", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("An error occurred while updating the job.", "error")
    }
  })

  function updateJobCard(job) {
    const jobCard = document.querySelector(`.job-card[data-job-id="${job.id}"]`)
    if (jobCard) {
      jobCard.innerHTML = `
      <div class="job-card-header">
          <h3>${escapeHtml(job.title)}</h3>
          <span class="status-badge ${job.status.toLowerCase()}">${escapeHtml(job.status)}</span>
      </div>
      <div class="job-card-content">
          <p>${escapeHtml(job.description)}</p>
          <div class="job-meta">
              <span class="job-location">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"/>
                      <path d="M12 22C14 18 20 15.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 15.4183 10 18 12 22Z"/>
                  </svg>
                  ${escapeHtml(job.location)}
              </span>
              <span class="job-type">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 8V12L15 15"/>
                      <circle cx="12" cy="12" r="9"/>
                  </svg>
                  ${escapeHtml(job.job_type)}
              </span>
              <span class="work-setup">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke-width="2"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke-width="2"/>
                    </svg>
                    ${escapeHtml(job.work_setup)}
                </span>
          </div>
      </div>
      <div class="job-card-footer">
          <span class="applications-count">${job.applications_count} applications</span>
          <div class="card-actions">
              <button class="action-button edit" onclick="editJob(${job.id})">Edit</button>
              <button class="action-button view" onclick="viewJob(${job.id})">View</button>
          </div>
      </div>
    `
    }
  }

  // Assuming showNotification is defined elsewhere and accessible.  If not, define it here:
  function showNotification(message, type) {
    //Implementation for showing notifications.  Could use an alert, a custom element, etc.
    alert(message) //Replace with proper notification implementation.
  }

  function getCookie(name) {
    let cookieValue = null
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";")
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim()
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
          break
        }
      }
    }
    return cookieValue
  }
  // Profile Settings Handling
  const profileModal = document.getElementById("profileModal")
  const profileSettingsLink = document.querySelector('.dropdown-item[href="#"]') // Update the selector based on your menu item
  const tabButtons = document.querySelectorAll(".tab-button")
  const tabContents = document.querySelectorAll(".tab-content")
  const companyProfileForm = document.getElementById("companyProfileForm")
  const accountSettingsForm = document.getElementById("accountSettingsForm")
  const changePasswordForm = document.getElementById("changePasswordForm")

  // Load profile data when opening settings
  async function loadProfileData() {
    try {
      const response = await fetch("/employer/profile/get/")
      const data = await response.json()

      if (data.profile) {
        // Fill company profile form
        document.getElementById("companyName").value = data.profile.company_name || ""
        document.getElementById("companyDescription").value = data.profile.company_description || ""
        document.getElementById("companyWebsite").value = data.profile.company_website || ""
        document.getElementById("companyLocation").value = data.profile.company_location || ""
        document.getElementById("industry").value = data.profile.industry || ""

        // Fill account settings
        document.getElementById("username").value = data.profile.username
        document.getElementById("email").value = data.profile.email
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      showNotification("Error loading profile data", "error")
    }
  }

  // Profile Settings Modal
  profileSettingsLink.addEventListener("click", (e) => {
    e.preventDefault()
    profileModal.classList.add("active")
    document.body.style.overflow = "hidden"
    loadProfileData()
  })

  // Tab Switching
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      button.classList.add("active")
      document.getElementById(`${button.dataset.tab}Tab`).classList.add("active")
    })
  })

  // Company Profile Form
  companyProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = {
      company_name: document.getElementById("companyName").value,
      company_description: document.getElementById("companyDescription").value,
      company_website: document.getElementById("companyWebsite").value,
      company_location: document.getElementById("companyLocation").value,
      industry: document.getElementById("industry").value,
    }

    try {
      const response = await fetch("/employer/profile/update/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Close the modal
        profileModal.classList.remove("active")
        document.body.style.overflow = ""
        // Show success notification
        showToast("Company profile updated successfully", "success")
      } else {
        showToast(data.error || "Error updating profile", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred while updating profile", "error")
    }
  })

  // Account Settings Form
  accountSettingsForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = {
      email: document.getElementById("email").value,
    }

    try {
      const response = await fetch("/employer/profile/update/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Close the modal
        profileModal.classList.remove("active")
        document.body.style.overflow = ""
        // Show success notification
        showToast("Account settings updated successfully", "success")
      } else {
        showToast(data.error || "Error updating account", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred while updating account", "error")
    }
  })

  // Change Password Form
  changePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const newPassword = document.getElementById("newPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error")
      return
    }

    const formData = {
      current_password: document.getElementById("currentPassword").value,
      new_password: newPassword,
    }

    try {
      const response = await fetch("/employer/profile/change-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Close the modal
        profileModal.classList.remove("active")
        document.body.style.overflow = ""
        // Show success notification
        showToast("Password changed successfully", "success")
        changePasswordForm.reset()
      } else {
        showToast(data.error || "Error changing password", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred while changing password", "error")
    }
  })

  // Improved Search and Filter Functionality
  const searchInput = document.getElementById("searchInput")
  const statusFilter = document.getElementById("statusFilter")
  const sortBy = document.getElementById("sortBy")
  let searchTimeout

  async function performSearch() {
    const searchQuery = searchInput.value
    const statusValue = statusFilter.value
    const sortValue = sortBy.value

    try {
      const response = await fetch(
        `/employer/search-jobs/?q=${encodeURIComponent(searchQuery)}&status=${statusValue}&sort=${sortValue}`,
      )
      const data = await response.json()

      if (data.jobs) {
        updateJobsGrid(data.jobs)
        updateJobsCount(data.total)
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("Error searching jobs", "error")
    }
  }

  function updateJobsGrid(jobs) {
    const jobsGrid = document.querySelector(".jobs-grid")

    if (jobs.length === 0) {
      jobsGrid.innerHTML = `
            <div class="no-jobs">
                <p>No jobs found matching your criteria</p>
            </div>
        `
      return
    }

    jobsGrid.innerHTML = jobs
      .map(
        (job) => `
        <div class="job-card" data-job-id="${job.id}">
            <div class="job-card-header">
                <h3>${escapeHtml(job.title)}</h3>
                <span class="status-badge ${job.status.toLowerCase()}">${escapeHtml(job.status)}</span>
            </div>
            <div class="job-card-content">
                <p>${escapeHtml(job.description)}</p>
                <div class="job-meta">
                    <span class="job-location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"/>
                            <path d="M12 22C14 18 20 15.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 15.4183 10 18 12 22Z"/>
                        </svg>
                        ${escapeHtml(job.location)}
                    </span>
                    <span class="job-type">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 8V12L15 15"/>
                            <circle cx="12" cy="12" r="9"/>
                        </svg>
                        ${escapeHtml(job.job_type)}
                    </span>
                    <span class="work-setup">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"/>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke-width="2"/>
                        </svg>
                        ${job.work_setup || "Not specified"}
                    </span>
                </div>
                <div class="requirements">
                    <h4>Requirements:</h4>
                    <p>${job.requirements || "No requirements specified"}</p>
                </div>
            </div>
            <div class="job-card-footer">
                <span class="applications-count">${job.applications_count} applications</span>
                <div class="card-actions">
                    <button class="action-button edit" onclick="editJob(${job.id})">Edit</button>
                    <button class="action-button view" onclick="viewJob(${job.id})">View</button>
                    <button class="action-button status-toggle" onclick="updateJobStatus(${job.id}, '${job.status === "Active" ? "Closed" : "Active"}')">
                        ${job.status === "Active" ? "Close Job" : "Reopen Job"}
                    </button>
                </div>
            </div>
        </div>
    `,
      )
      .join("")
  }

  function updateJobsCount(total) {
    const countElement = document.querySelector(".section-header h2")
    if (countElement) {
      countElement.textContent = `Your Job Postings (${total})`
    }
  }

  // Event listeners for search and filters
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(performSearch, 300)
  })

  statusFilter.addEventListener("change", performSearch)
  sortBy.addEventListener("change", performSearch)

  // Initial search on page load
  performSearch()

  // Function to update job status
  async function updateJobStatus(jobId, newStatus) {
    try {
      const response = await fetch(`/employer/update-job-status/${jobId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Update the job card in the UI
        updateJobCardStatus(jobId, newStatus)
        showNotification(`Job status updated to ${newStatus}`, "success")
      } else {
        throw new Error(data.error || "Failed to update job status")
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("Error updating job status. Please try again.", "error")
    }
  }

  // Function to update job card status in the UI
  function updateJobCardStatus(jobId, newStatus) {
    const jobCard = document.querySelector(`.job-card[data-job-id="${jobId}"]`)
    if (jobCard) {
      const statusBadge = jobCard.querySelector(".status-badge")
      if (statusBadge) {
        statusBadge.textContent = newStatus
        statusBadge.className = `status-badge ${newStatus.toLowerCase()}`
      }

      // Update the status toggle button
      const statusToggle = jobCard.querySelector(".status-toggle")
      if (statusToggle) {
        statusToggle.textContent = newStatus === "Active" ? "Close Job" : "Reopen Job"
        statusToggle.onclick = () => updateJobStatus(jobId, newStatus === "Active" ? "Closed" : "Active")
      }
    }
  }

  // Function to create job card (modified to include status toggle)
  function createJobCard(job) {
    return `
          <div class="job-card" data-job-id="${job.id}">
              <div class="job-card-header">
                  <h3>${escapeHtml(job.title)}</h3>
                  <span class="status-badge ${job.status.toLowerCase()}">${escapeHtml(job.status)}</span>
              </div>
              <div class="job-card-content">
                  <p>${escapeHtml(job.description)}</p>
                  <div class="job-meta">
                      <span class="job-location">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke-width="2"/>
                              <path d="M12 22C14 18 20 15.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 15.4183 10 18 12 22Z"/>
                          </svg>
                          ${escapeHtml(job.location)}
                      </span>
                      <span class="job-type">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M12 8V12L15 15"/>
                              <circle cx="12" cy="12" r="9"/>
                          </svg>
                          ${escapeHtml(job.job_type)}
                      </span>
                  </div>
              </div>
              <div class="job-card-footer">
                  <span class="applications-count">${job.applications_count} applications</span>
                  <div class="card-actions">
                      <button class="action-button edit" onclick="editJob(${job.id})">Edit</button>
                      <button class="action-button view" onclick="viewJob(${job.id})">View</button>
                      <button class="action-button status-toggle" onclick="updateJobStatus(${job.id}, '${job.status === "Active" ? "Closed" : "Active"}')">
                          ${job.status === "Active" ? "Close Job" : "Reopen Job"}
                      </button>
                  </div>
              </div>
          </div>
      `
  }

  // Function to update jobs grid (modified to use createJobCard)
  function updateJobsGrid(jobs) {
    const jobsGrid = document.querySelector(".jobs-grid")

    if (jobs.length === 0) {
      jobsGrid.innerHTML = `
              <div class="no-jobs">
                  <p>No jobs found matching your criteria</p>
              </div>
          `
      return
    }

    jobsGrid.innerHTML = jobs.map((job) => createJobCard(job)).join("")
  }

  // ... (existing code)

  // Remove or comment out these variables at the top
  // let currentMap = null
  // let currentMarker = null

  // Remove or comment out the initMap function and all map-related code
  // function initMap(mapElementId, initialLocation = "", initialCoords = null) { ... }

  // Remove or comment out the updateLocationInput function
  // async function updateLocationInput(mapElementId, latlng) { ... }

  // Remove or comment out the handleLocationSearch function
  // async function handleLocationSearch(mapElementId) { ... }

  // Declare escapeHtml function
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }

  // Declare L variable
  //const L = window.L

  // Add this toast notification function
  function showToast(message, type) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById("toastContainer")
    if (!toastContainer) {
      toastContainer = document.createElement("div")
      toastContainer.id = "toastContainer"
      toastContainer.className = "toast-container"
      document.body.appendChild(toastContainer)
    }

    // Create toast element
    const toast = document.createElement("div")
    toast.className = `toast ${type}`

    // Create toast content
    const content = document.createElement("div")
    content.className = "toast-content"

    // Add icon based on type
    const icon = document.createElement("span")
    icon.className = "toast-icon"
    if (type === "success") {
      icon.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
          `
    } else if (type === "error") {
      icon.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
          `
    }
    content.appendChild(icon)

    // Add message
    const messageElement = document.createElement("span")
    messageElement.className = "toast-message"
    messageElement.textContent = message
    content.appendChild(messageElement)

    toast.appendChild(content)

    // Add close button
    const closeButton = document.createElement("button")
    closeButton.className = "toast-close"
    closeButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
      `
    closeButton.addEventListener("click", () => {
      toast.classList.add("toast-closing")
      setTimeout(() => {
        toast.remove()
      }, 300)
    })
    toast.appendChild(closeButton)

    // Add toast to container
    toastContainer.appendChild(toast)

    // Auto remove toast after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add("toast-closing")
        setTimeout(() => {
          toast.remove()
        }, 300)
      }
    }, 5000)
  }

  // Add close button handler for the profile modal
  const closeProfileModal = document.getElementById("closeProfileModal")
  if (closeProfileModal) {
    closeProfileModal.addEventListener("click", () => {
      profileModal.classList.remove("active")
      document.body.style.overflow = ""
    })
  }

  // Close modal when clicking outside
  profileModal.addEventListener("click", (e) => {
    if (e.target === profileModal) {
      profileModal.classList.remove("active")
      document.body.style.overflow = ""
    }
  })

  function updateJobCard(job) {
    const jobCard = document.querySelector(`.job-card[data-job-id="${job.id}"]`)
    if (jobCard) {
      jobCard.innerHTML = `
          <div class="job-card-header">
              <h3>${escapeHtml(job.title)}</h3>
              <span class="status-badge ${job.status.toLowerCase()}">${escapeHtml(job.status)}</span>
          </div>
          <div class="job-card-content">
              <p>${escapeHtml(job.description)}</p>
              <div class="job-meta">
                  <span class="job-location">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"/>
                          <path d="M12 22C14 18 20 15.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 15.4183 10 18 12 22Z"/>
                      </svg>
                      ${escapeHtml(job.location)}
                  </span>
                  <span class="job-type">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 8V12L15 15"/>
                          <circle cx="12" cy="12" r="9"/>
                      </svg>
                      ${escapeHtml(job.job_type)}
                  </span>
                  <span class="work-setup">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"/>
                          <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21"/>
                      </svg>
                      ${job.work_setup || "Not specified"}
                  </span>
              </div>
          </div>
          <div class="job-card-footer">
              <span class="applications-count">${job.applications_count} applications</span>
              <div class="card-actions">
                  <button class="action-button edit" onclick="editJob(${job.id})">Edit</button>
                  <button class="action-button view" onclick="viewJob(${job.id})">View</button>
              </div>
          </div>
          `
    }
  }

  function createJobCard(job) {
    return `
          <div class="job-card" data-job-id="${job.id}">
              <div class="job-card-header">
                  <h3>${escapeHtml(job.title)}</h3>
                  <span class="status-badge ${job.status.toLowerCase()}">${escapeHtml(job.status)}</span>
              </div>
              <div class="job-card-content">
                  <p>${escapeHtml(job.description)}</p>
                  <div class="job-meta">
                      <span class="job-location">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"/>
                              <path d="M12 22C14 18 20 15.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 15.4183 10 18 12 22Z"/>
                          </svg>
                          ${escapeHtml(job.location)}
                      </span>
                      <span class="job-type">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M12 8V12L15 15"/>
                              <circle cx="12" cy="12" r="9"/>
                          </svg>
                          ${escapeHtml(job.job_type)}
                      </span>
                      <span class="work-setup">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"/>
                              <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21"/>
                          </svg>
                          ${job.work_setup || "Not specified"}
                      </span>
                  </div>
              </div>
              <div class="job-card-footer">
                  <span class="applications-count">${job.applications_count} applications</span>
                  <div class="card-actions">
                      <button class="action-button edit" onclick="editJob(${job.id})">Edit</button>
                      <button class="action-button view" onclick="viewJob(${job.id})">View</button>
                  </div>
              </div>
          </div>
      `
  }
})

