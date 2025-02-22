// Add this function at the beginning of your dashboard.js file
async function getCompanyLocation() {
  try {
    const response = await fetch("/employer/profile/get/")
    const data = await response.json()

    if (data.profile) {
      return {
        address: data.profile.company_location || "",
        latitude: data.profile.latitude || "",
        longitude: data.profile.longitude || "",
      }
    }
  } catch (error) {
    console.error("Error fetching company location:", error)
  }
  return null
}

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
    createJobModal.classList.add("active")
    document.body.style.overflow = "hidden"
  }

  function closeModalHandler() {
    createJobModal.classList.remove("active")
    document.body.style.overflow = ""
    jobForm.reset()
  }

  // Modify the createJobBtn click handler
  createJobBtn.addEventListener("click", async () => {
    // Get company location before opening modal
    const companyLocation = await getCompanyLocation()

    if (companyLocation) {
      // Pre-fill the location field
      document.getElementById("location").value = companyLocation.address

      // Open modal
      openModal()

      // Initialize map with company location
      setTimeout(() => {
        initMap("map", companyLocation.address, {
          lat: Number.parseFloat(companyLocation.latitude),
          lng: Number.parseFloat(companyLocation.longitude),
        })
      }, 100)
    } else {
      // If no company location, just open modal normally
      openModal()
      setTimeout(() => {
        initMap("map")
      }, 100)
    }
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
      workSetup: document.getElementById("workSetup").value, // Add this line
      description: document.getElementById("description").value,
      salary: document.getElementById("salary").value,
      experience: document.getElementById("experience").value,
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
        // Add new job card to the grid
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
        document.getElementById("viewJobTitle").textContent = data.job.title
        document.getElementById("viewJobLocation").textContent = data.job.location
        document.getElementById("viewJobType").textContent = data.job.job_type
        document.getElementById("viewJobExperience").textContent = data.job.experience_level
        document.getElementById("viewJobSalary").textContent = data.job.salary_range
        document.getElementById("viewJobDescription").textContent = data.job.description
        document.getElementById("viewJobStatus").textContent = data.job.status

        viewJobModal.classList.add("active")
        document.body.style.overflow = "hidden"
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
        document.getElementById("editJobId").value = data.job.id
        document.getElementById("editJobTitle").value = data.job.title
        document.getElementById("editLocation").value = data.job.location
        document.getElementById("editJobType").value = data.job.job_type
        document.getElementById("editDescription").value = data.job.description
        document.getElementById("editSalary").value = data.job.salary_range
        document.getElementById("editExperience").value = data.job.experience_level
        document.getElementById("editStatus").value = data.job.status.toLowerCase()

        editJobModal.classList.add("active")
        document.body.style.overflow = "hidden"

        // Initialize map for edit modal
        setTimeout(() => {
          initMap("editMap", data.job.location)
        }, 100)
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
      description: document.getElementById("editDescription").value,
      salary: document.getElementById("editSalary").value,
      experience: document.getElementById("editExperience").value,
      status: document.getElementById("editStatus").value,
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
          <h3>${job.title}</h3>
          <span class="status-badge ${job.status.toLowerCase()}">${job.status}</span>
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
        toastNotification("Company profile updated successfully", "success")
      } else {
        toastNotification(data.error || "Error updating profile", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      toastNotification("An error occurred while updating profile", "error")
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
        toastNotification("Account settings updated successfully", "success")
      } else {
        toastNotification(data.error || "Error updating account", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      toastNotification("An error occurred while updating account", "error")
    }
  })

  // Change Password Form
  changePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const newPassword = document.getElementById("newPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value

    if (newPassword !== confirmPassword) {
      toastNotification("New passwords do not match", "error")
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
        toastNotification("Password changed successfully", "success")
        changePasswordForm.reset()
      } else {
        toastNotification(data.error || "Error changing password", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      toastNotification("An error occurred while changing password", "error")
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
                  <h3>${job.title}</h3>
                  <span class="status-badge ${job.status.toLowerCase()}">${job.status}</span>
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
                            <path d="M12 22C14 18 20 15.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 15.4183 10 18 12 22Z" stroke-width="2"/>
                        </svg>
                        ${escapeHtml(job.location)}
                    </span>
                    <span class="job-type">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 8V12L15 15" stroke-width="2" stroke-linecap="round"/>
                            <circle cx="12" cy="12" r="9" stroke-width="2"/>
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

  // OpenStreetMap integration
  let map, marker

  // Import Leaflet library
  //import * as L from "leaflet" //Removed as per update request

  // Add this function to handle location search
  function handleLocationSearch(mapElementId) {
    const searchModal = document.createElement("div")
    searchModal.className = "modal location-search-modal"
    searchModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Search Location</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="search-input-group">
                    <input type="text" 
                           id="locationSearchInput" 
                           placeholder="Enter location to search..."
                           class="location-search-input">
                    <button type="button" id="performSearch" class="search-button">
                        Search
                    </button>
                </div>
                <div id="searchResults" class="search-results"></div>
            </div>
        </div>
    `

    document.body.appendChild(searchModal)
    searchModal.classList.add("active")

    const searchInput = document.getElementById("locationSearchInput")
    const searchButton = document.getElementById("performSearch")
    const resultsContainer = document.getElementById("searchResults")
    const closeBtn = searchModal.querySelector(".close-modal")

    // Close modal handler
    function closeSearchModal() {
      searchModal.classList.remove("active")
      setTimeout(() => searchModal.remove(), 300)
    }

    closeBtn.addEventListener("click", closeSearchModal)
    searchModal.addEventListener("click", (e) => {
      if (e.target === searchModal) closeSearchModal()
    })

    // Search handler
    async function performLocationSearch() {
      const query = searchInput.value.trim()
      if (!query) return

      try {
        resultsContainer.innerHTML = '<div class="loading">Searching...</div>'

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        )
        const data = await response.json()

        if (data.length === 0) {
          resultsContainer.innerHTML = '<div class="no-results">No locations found</div>'
          return
        }

        resultsContainer.innerHTML = data
          .map(
            (result) => `
                <div class="search-result-item" data-lat="${result.lat}" data-lon="${result.lon}">
                    <span class="location-name">${result.display_name}</span>
                </div>
            `,
          )
          .join("")

        // Add click handlers to results
        document.querySelectorAll(".search-result-item").forEach((item) => {
          item.addEventListener("click", () => {
            const lat = Number.parseFloat(item.dataset.lat)
            const lon = Number.parseFloat(item.dataset.lon)
            const locationName = item.querySelector(".location-name").textContent

            // Update map and input
            const map = window.currentMap
            const marker = window.currentMarker
            if (map && marker) {
              const latlng = L.latLng(lat, lon)
              marker.setLatLng(latlng)
              map.setView(latlng, 13)
              document.getElementById(mapElementId === "map" ? "location" : "editLocation").value = locationName
            }

            closeSearchModal()
          })
        })
      } catch (error) {
        console.error("Error searching locations:", error)
        resultsContainer.innerHTML = '<div class="error">Error searching locations</div>'
      }
    }

    searchButton.addEventListener("click", performLocationSearch)
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        performLocationSearch()
      }
    })

    // Focus input when modal opens
    setTimeout(() => searchInput.focus(), 100)
  }

  // Modify your existing initMap function
  function initMap(mapElementId, initialLocation = "", initialCoords = null) {
    const mapContainer = document.getElementById(mapElementId)
    if (!mapContainer) return

    // Default to Manila if no coordinates provided
    const defaultLocation = [14.5995, 120.9842]
    const zoom = initialCoords ? 13 : 10
    const center = initialCoords ? [initialCoords.lat, initialCoords.lng] : defaultLocation

    const map = L.map(mapElementId).setView(center, zoom)
    window.currentMap = map // Store reference to current map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    const marker = L.marker(center, { draggable: true }).addTo(map)
    window.currentMarker = marker // Store reference to current marker

    // Update location input when marker is moved
    marker.on("dragend", async (event) => {
      const latlng = event.target.getLatLng()
      await updateLocationInput(mapElementId, latlng)
    })

    // Update location when map is clicked
    map.on("click", async (e) => {
      marker.setLatLng(e.latlng)
      await updateLocationInput(mapElementId, e.latlng)
    })

    // Add search button functionality
    const searchButton = document.getElementById(mapElementId === "map" ? "locationSearchBtn" : "editLocationSearchBtn")

    searchButton?.addEventListener("click", () => {
      handleLocationSearch(mapElementId)
    })

    // Force a map redraw
    setTimeout(() => {
      map.invalidateSize()
    }, 100)

    return { map, marker }
  }

  // Add these styles to your CSS
  const styles = `
.location-search-modal .modal-content {
    max-width: 500px;
}

.search-input-group {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.location-search-input {
    flex: 1;
    padding: 0.625rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    font-size: 0.875rem;
}

.search-button {
    padding: 0.625rem 1rem;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
}

.search-results {
    max-height: 300px;
    overflow-y: auto;
}

.search-result-item {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
}

.search-result-item:hover {
    background-color: var(--background-gray);
}

.location-name {
    font-size: 0.875rem;
}

.loading, .no-results, .error {
    padding: 1rem;
    text-align: center;
    color: var(--text-secondary);
}

.error {
    color: #dc2626;
}
`

  // Add styles to document
  const styleSheet = document.createElement("style")
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
  async function updateLocationInput(mapElementId, latlng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`,
      )
      const data = await response.json()

      if (data.display_name) {
        const inputId = mapElementId === "map" ? "location" : "editLocation"
        document.getElementById(inputId).value = data.display_name
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error)
    }
  }

  // Debounce function to limit API calls
  function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  function showNotification(message, type) {
    console.log(message, type) // Temporary - replace with actual notification logic
    // TODO: Implement a proper notification system
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

  // Modify the existing createJobBtn event listener

  // Function to open modal (assuming it's defined elsewhere)
  function openModal() {
    const createJobModal = document.getElementById("createJobModal")
    createJobModal.classList.add("active")
    document.body.style.overflow = "hidden"
  }

  // Function to close edit modal
  function closeEditModalHandler() {
    editJobModal.classList.remove("active")
    document.body.style.overflow = ""
  }

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
  const L = window.L

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

  // Declare toastNotification variable
  const toastNotification = showToast
})

