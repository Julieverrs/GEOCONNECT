// Add these variables at the top of your file to track map instances
const mapInstances = {}

// Add this at the top of your file to define the standard options
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Temporary", "Internship"]

const EXPERIENCE_LEVELS = ["Entry Level", "Junior", "Mid Level", "Senior", "Lead", "Expert"]

// Add this at the top of your file with the other constants
const WORK_SETUPS = ["On-site", "Remote"]

document.addEventListener("DOMContentLoaded", () => {
  // Add this function after the document.addEventListener("DOMContentLoaded", () => { line
  // Initialize maps when modals are opened
  function initMap(mapElementId, inputElementId, latInputId, lngInputId, initialLocation = "", initialCoords = null) {
    // Get the map container
    const mapContainer = document.getElementById(mapElementId)
    if (!mapContainer) return null

    // Make the map container visible
    mapContainer.style.display = "block"

    // Check if a map instance already exists for this element
    if (mapInstances[mapElementId] && mapInstances[mapElementId].map) {
      // If it exists, just invalidate the size and return the existing instance
      mapInstances[mapElementId].map.invalidateSize()
      return mapInstances[mapElementId]
    }

    // Initialize the map
    const map = L.map(mapContainer).setView([14.5995, 120.9842], 13) // Default to Manila

    // Add the tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Create a marker if initial coordinates are provided
    let marker = null
    if (initialCoords && initialCoords.lat && initialCoords.lng) {
      map.setView([initialCoords.lat, initialCoords.lng], 15)
      marker = L.marker([initialCoords.lat, initialCoords.lng], { draggable: true }).addTo(map)

      // Update hidden inputs with initial coordinates
      document.getElementById(latInputId).value = initialCoords.lat
      document.getElementById(lngInputId).value = initialCoords.lng

      // Update coordinates when marker is dragged
      marker.on("dragend", (e) => {
        const position = marker.getLatLng()
        document.getElementById(latInputId).value = position.lat
        document.getElementById(lngInputId).value = position.lng
        reverseGeocode(position.lat, position.lng, inputElementId)
      })
    }

    // Handle map clicks to place/move marker
    map.on("click", (e) => {
      const latlng = e.latlng

      // Update hidden inputs
      document.getElementById(latInputId).value = latlng.lat
      document.getElementById(lngInputId).value = latlng.lng

      // Update or create marker
      if (marker) {
        marker.setLatLng(latlng)
      } else {
        marker = L.marker(latlng, { draggable: true }).addTo(map)

        // Update coordinates when marker is dragged
        marker.on("dragend", (e) => {
          const position = marker.getLatLng()
          document.getElementById(latInputId).value = position.lat
          document.getElementById(lngInputId).value = position.lng
          reverseGeocode(position.lat, position.lng, inputElementId)
        })
      }

      // Reverse geocode to get address
      reverseGeocode(latlng.lat, latlng.lng, inputElementId)
    })

    // If initial location is provided but no coordinates, geocode it
    if (initialLocation && (!initialCoords || !initialCoords.lat || !initialCoords.lng)) {
      geocodeLocation(initialLocation, map, marker, latInputId, lngInputId)
    }

    // Invalidate size to ensure map renders correctly
    setTimeout(() => {
      map.invalidateSize()
    }, 100)

    // Store the map instance
    mapInstances[mapElementId] = { map, marker }

    return { map, marker }
  }

  // Function to geocode a location string to coordinates
  async function geocodeLocation(locationString, map, marker, latInputId, lngInputId) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}`,
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const lat = Number.parseFloat(data[0].lat)
        const lng = Number.parseFloat(data[0].lon)

        // Update map view
        map.setView([lat, lng], 15)

        // Update or create marker
        if (marker) {
          marker.setLatLng([lat, lng])
        } else {
          marker = L.marker([lat, lng], { draggable: true }).addTo(map)
        }

        // Update hidden inputs
        document.getElementById(latInputId).value = lat
        document.getElementById(lngInputId).value = lng

        return { lat, lng }
      }
    } catch (error) {
      console.error("Error geocoding location:", error)
    }

    return null
  }

  // Function to reverse geocode coordinates to an address
  async function reverseGeocode(lat, lng, inputElementId) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      const data = await response.json()

      if (data && data.display_name) {
        document.getElementById(inputElementId).value = data.display_name
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error)
    }
  }

  // Function to clean up map instances
  function cleanupMap(mapElementId) {
    if (mapInstances[mapElementId]) {
      const { map, marker } = mapInstances[mapElementId]

      // Remove marker if it exists
      if (marker) {
        map.removeLayer(marker)
      }

      // Remove all event listeners
      map.off()

      // Remove the map
      map.remove()

      // Delete the instance
      delete mapInstances[mapElementId]
    }
  }

  // Profile Dropdown
  const profileTrigger = document.querySelector(".profile-trigger")
  const profileDropdown = document.querySelector(".profile-dropdown")
  const dropdownMenu = document.querySelector(".dropdown-menu")

  if (profileTrigger && profileDropdown && dropdownMenu) {
    profileTrigger.addEventListener("click", (e) => {
      e.stopPropagation()
      profileDropdown.classList.toggle("active")
    })

    document.addEventListener("click", (e) => {
      if (!profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove("active")
      }
    })
  }

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

    // Initialize map when modal is opened
    setTimeout(() => {
      initMap("jobLocationMap", "location", "jobLatitude", "jobLongitude")
    }, 300)
  }

  function closeModalHandler() {
    createJobModal.classList.remove("active")
    document.body.style.overflow = ""
    jobForm.reset()

    // Reset map container display
    const mapContainer = document.getElementById("jobLocationMap")
    if (mapContainer) {
      mapContainer.style.display = "none"
      cleanupMap("jobLocationMap")
    }
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

    // Modify the create_job function to include latitude and longitude
    // Find the job form submission event listener and modify the formData object to include coordinates:
    const formData = {
      jobTitle: document.getElementById("jobTitle").value,
      location: document.getElementById("location").value,
      latitude: document.getElementById("jobLatitude").value || null,
      longitude: document.getElementById("jobLongitude").value || null,
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

  // Update the addJobCard function
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
        <h3>${escapeHtml(job.title)}</h3>
        <span class="status-badge active">Active</span>
    </div>
    <div class="job-card-content">
        <p>${escapeHtml(job.description)}</p>
        <div class="job-meta">
            ${
              job.work_setup
                ? `
            <div class="job-type">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ${escapeHtml(job.work_setup)}
            </div>
            `
                : ""
            }
            ${
              job.job_type
                ? `
            <div class="job-type">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ${escapeHtml(job.job_type)}
            </div>
            `
                : ""
            }
            ${
              job.experience_level
                ? `
            <div class="job-type">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 9L12 5L2 9L12 13L22 9V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M6 11.5V16.5C6 16.5 8 18.5 12 18.5C16 18.5 18 16.5 18 16.5V11.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ${escapeHtml(job.experience_level)}
            </div>
            `
                : ""
            }
        </div>
    </div>
    <div class="job-card-footer">
        <div class="applications-count">
            ${job.applications_count || 0} Applications
        </div>
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

    // Reset map container display
    const editMapContainer = document.getElementById("editLocationMap")
    if (editMapContainer) {
      editMapContainer.style.display = "none"
      cleanupMap("editLocationMap")
    }
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

        // Show the modal first
        const editJobModal = document.getElementById("editJobModal")
        if (editJobModal) {
          editJobModal.classList.add("active")
          document.body.style.overflow = "hidden"
        }

        // Initialize or update the edit job map
        setTimeout(() => {
          const jobLat = data.job.latitude || null
          const jobLng = data.job.longitude || null
          const initialCoords = jobLat && jobLng ? { lat: jobLat, lng: jobLng } : null

          // Always initialize a new map instance for each edit
          initMap(
            "editLocationMap",
            "editLocation",
            "editJobLatitude",
            "editJobLongitude",
            data.job.location,
            initialCoords,
          )
        }, 300)
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
    // Modify the edit job form submission event listener to include coordinates:
    const formData = {
      jobTitle: document.getElementById("editJobTitle").value,
      location: document.getElementById("editLocation").value,
      latitude: document.getElementById("editJobLatitude").value || null,
      longitude: document.getElementById("editJobLongitude").value || null,
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
        updateJobCardFunc(data.job)
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

  // Update the updateJobCardFunc function
  function updateJobCardFunc(job) {
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
                ${
                  job.work_setup
                    ? `
                <div class="job-type">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${escapeHtml(job.work_setup)}
                </div>
                `
                    : ""
                }
                ${
                  job.job_type
                    ? `
                <div class="job-type">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${escapeHtml(job.job_type)}
                </div>
                `
                    : ""
                }
                ${
                  job.experience_level
                    ? `
                <div class="job-type">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 9L12 5L2 9L12 13L22 9V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6 11.5V16.5C6 16.5 8 18.5 12 18.5C16 18.5 18 16.5 18 16.5V11.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${escapeHtml(job.experience_level)}
                </div>
                `
                    : ""
                }
            </div>
        </div>
        <div class="job-card-footer">
            <div class="applications-count">
                ${job.applications_count || 0} Applications
            </div>
            <div class="card-actions">
                <button class="action-button edit" onclick="editJob(${job.id})">Edit</button>
                <button class="action-button view" onclick="viewJob(${job.id})">View</button>
            </div>
        </div>
        `
    }
  }

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
        updateJobsGridFunc(data.jobs)
        updateJobsCount(data.total)
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("Error searching jobs", "error")
    }
  }

  // Also update the updateJobsGridFunc function to use the updated createJobCardFunc
  function updateJobsGridFunc(jobs) {
    const jobsGrid = document.querySelector(".jobs-grid")

    if (jobs.length === 0) {
      jobsGrid.innerHTML = `
          <div class="no-jobs">
              <p>No jobs found matching your criteria</p>
          </div>
      `
      return
    }

    jobsGrid.innerHTML = jobs.map((job) => createJobCardFunc(job)).join("")
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

  // Update the createJobCardFunc function
  function createJobCardFunc(job) {
    return `
    <div class="job-card" data-job-id="${job.id}">
        <div class="job-card-header">
            <h3>${escapeHtml(job.title)}</h3>
            <span class="status-badge ${job.status.toLowerCase()}">${escapeHtml(job.status)}</span>
        </div>
        <div class="job-card-content">
            <p>${escapeHtml(job.description)}</p>
            <div class="job-meta">
                ${
                  job.work_setup
                    ? `
                <div class="job-type">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${escapeHtml(job.work_setup)}
                </div>
                `
                    : ""
                }
                ${
                  job.job_type
                    ? `
                <div class="job-type">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${escapeHtml(job.job_type)}
                </div>
                `
                    : ""
                }
                ${
                  job.experience_level
                    ? `
                <div class="job-type">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 9L12 5L2 9L12 13L22 9V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6 11.5V16.5C6 16.5 8 18.5 12 18.5C16 18.5 18 16.5 18 16.5V11.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${escapeHtml(job.experience_level)}
                </div>
                `
                    : ""
                }
            </div>
        </div>
        <div class="job-card-footer">
            <div class="applications-count">
                ${job.applications_count || 0} Applications
            </div>
            <div class="card-actions">
                <button class="action-button edit" onclick="editJob(${job.id})">Edit</button>
                <button class="action-button view" onclick="viewJob(${job.id})">View</button>
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

    jobsGrid.innerHTML = jobs.map((job) => createJobCardFunc(job)).join("")
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
  const profileModal = document.getElementById("profileModal") // Declare profileModal
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

  // Update the updateJobCard function
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
                ${
                  job.work_setup
                    ? `
                <div class="job-type">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${escapeHtml(job.work_setup)}
                </div>
                `
                    : ""
                }
                ${
                  job.job_type
                    ? `
                <div class="job-type">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${escapeHtml(job.job_type)}
                </div>
                `
                    : ""
                }
                ${
                  job.experience_level
                    ? `
                <div class="job-type">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 9L12 5L2 9L12 13L22 9V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6 11.5V16.5C6 16.5 8 18.5 12 18.5C16 18.5 18 16.5 18 16.5V11.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${escapeHtml(job.experience_level)}
                </div>
                `
                    : ""
                }
            </div>
        </div>
        <div class="job-card-footer">
            <div class="applications-count">
                ${job.applications_count || 0} Applications
            </div>
            <div class="card-actions">
                <button class="action-button edit" onclick="editJob(${job.id})">Edit</button>
                <button class="action-button view" onclick="viewJob(${job.id})">View</button>
            </div>
        </div>
        `
    }
  }
  // Profile Settings Handling
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

  // Update the createJobCard function
  function createJobCard(job) {
    return `
        <div class="job-card" data-job-id="${job.id}">
            <div class="job-card-header">
                <h3>${escapeHtml(job.title)}</h3>
                <span class="status-badge ${job.status.toLowerCase()}">${escapeHtml(job.status)}</span>
            </div>
            <div class="job-card-content">
                <p>${escapeHtml(job.description)}</p>
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

  // Add search location functionality
  document.getElementById("searchLocationBtn").addEventListener("click", () => {
    const locationInput = document.getElementById("location").value
    if (locationInput) {
      const mapId = "jobLocationMap"
      const mapInstance = initMap(mapId, "location", "jobLatitude", "jobLongitude")
      if (mapInstance) {
        geocodeLocation(locationInput, mapInstance.map, mapInstance.marker, "jobLatitude", "jobLongitude")
      }
    }
  })

  // Add search location functionality for edit modal
  document.getElementById("editSearchLocationBtn").addEventListener("click", () => {
    const locationInput = document.getElementById("editLocation").value
    if (locationInput) {
      const mapId = "editLocationMap"
      const mapInstance = initMap(mapId, "editLocation", "editJobLatitude", "editJobLongitude")
      if (mapInstance) {
        geocodeLocation(locationInput, mapInstance.map, mapInstance.marker, "editJobLatitude", "editJobLongitude")
      }
    }
  })
})
