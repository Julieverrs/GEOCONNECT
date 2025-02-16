document.addEventListener('DOMContentLoaded', function() {
    // Profile Dropdown
    const profileTrigger = document.querySelector('.profile-trigger');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    

    profileTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
        if (!dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('active');
        }
    });

    // Modal Handling
    const createJobBtn = document.getElementById('createJobBtn');
    const createJobModal = document.getElementById('createJobModal');
    const closeModal = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancelJob');
    const jobForm = document.querySelector('.job-form');
    

    function openModal() {
        createJobModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModalHandler() {
        createJobModal.classList.remove('active');
        document.body.style.overflow = '';
        jobForm.reset();
    }

    createJobBtn.addEventListener('click', openModal);
    closeModal.addEventListener('click', closeModalHandler);
    cancelBtn.addEventListener('click', closeModalHandler);

    createJobModal.addEventListener('click', function(e) {
        if (e.target === createJobModal) {
            closeModalHandler();
        }
    });

    // Get CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Job Form Submission
    jobForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            jobTitle: document.getElementById('jobTitle').value,
            location: document.getElementById('location').value,
            jobType: document.getElementById('jobType').value,
            description: document.getElementById('description').value,
            salary: document.getElementById('salary').value,
            experience: document.getElementById('experience').value
        };

        try {
            const response = await fetch('/employer/create-job/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.success) {
                // Add new job card to the grid
                addJobCard(data.job);
                closeModalHandler();
                showNotification('Job posted successfully!', 'success');
            } else {
                showNotification(data.error || 'Error creating job', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('An error occurred while creating the job.', 'error');
        }
    });

    function addJobCard(job) {
        const jobsGrid = document.querySelector('.jobs-grid');
        const noJobs = jobsGrid.querySelector('.no-jobs');
        if (noJobs) {
            noJobs.remove();
        }

        const jobCard = document.createElement('div');
        jobCard.className = 'job-card';
        jobCard.dataset.jobId = job.id;
        
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
                </div>
            </div>
            <div class="job-card-footer">
                <span class="applications-count">0 applications</span>
                <div class="card-actions">
                    <button class="action-button edit" onclick="editJob(${job.id})">Edit</button>
                    <button class="action-button view" onclick="viewJob(${job.id})">View</button>
                </div>
            </div>
        `;
        
        jobsGrid.insertBefore(jobCard, jobsGrid.firstChild);
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
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
        showNotification("Company profile updated successfully", "success")
      } else {
        showNotification(data.error || "Error updating profile", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("An error occurred while updating profile", "error")
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
        showNotification("Account settings updated successfully", "success")
      } else {
        showNotification(data.error || "Error updating account", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("An error occurred while updating account", "error")
    }
  })

  // Change Password Form
  changePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const newPassword = document.getElementById("newPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value

    if (newPassword !== confirmPassword) {
      showNotification("New passwords do not match", "error")
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
        showNotification("Password changed successfully", "success")
        changePasswordForm.reset()
      } else {
        showNotification(data.error || "Error changing password", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("An error occurred while changing password", "error")
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

function initMap(mapElementId, initialLocation = "") {
  // Initialize the map
  map = L.map(mapElementId).setView([0, 0], 2)

  // Add OpenStreetMap tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  // Add a draggable marker
  marker = L.marker([0, 0], { draggable: true }).addTo(map)

  // Update location input when marker is dragged
  marker.on("dragend", (event) => {
    updateLocationInput(mapElementId, marker.getLatLng())
  })

  // Add click event to map to update marker position
  map.on("click", (e) => {
    marker.setLatLng(e.latlng)
    updateLocationInput(mapElementId, e.latlng)
  })

  // If there's an initial location, search for it
  if (initialLocation) {
    searchLocation(mapElementId, initialLocation)
  }

  // Add search button event listener
  const searchButton = document.getElementById(mapElementId === "map" ? "locationSearchBtn" : "editLocationSearchBtn")
  searchButton.addEventListener("click", () => {
    const inputId = mapElementId === "map" ? "location" : "editLocation"
    const locationInput = document.getElementById(inputId)
    searchLocation(mapElementId, locationInput.value)
  })
}

function updateLocationInput(mapElementId, latlng) {
  // Reverse geocoding using Nominatim
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.display_name) {
        const inputId = mapElementId === "map" ? "location" : "editLocation"
        document.getElementById(inputId).value = data.display_name
      }
    })
    .catch((error) => console.error("Error:", error))
}

function searchLocation(mapElementId, query = "") {
  if (!query) return

  // Forward geocoding using Nominatim
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.length > 0) {
        const result = data[0]
        const latlng = L.latLng(result.lat, result.lon)
        marker.setLatLng(latlng)
        map.setView(latlng, 13)
        updateLocationInput(mapElementId, latlng)
      }
    })
    .catch((error) => console.error("Error:", error))
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

createJobBtn.addEventListener("click", () => {
  openModal()
  // Initialize the map when the modal is opened
  setTimeout(() => {
    initMap("map")
  }, 100)
})

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
});



