document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed")

  // Check for messages in the DOM
  const messages = document.querySelectorAll(".django-message")
  console.log("Found messages:", messages.length)
  messages.forEach((message) => {
    const messageText = message.textContent.trim()
    const messageType = message.dataset.type
    console.log("Processing message:", messageText, messageType)
    if (typeof toastNotification === "function") {
      toastNotification(messageText, messageType)
    } else {
      console.error("toastNotification function is not defined")
    }
    message.remove()
  })

  // Navbar scroll effect
  const navbar = document.querySelector(".navbar")
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("navbar-scrolled")
    } else {
      navbar.classList.remove("navbar-scrolled")
    }
  })

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href")
      // Only proceed if href is a valid selector (not just "#")
      if (href && href !== "#") {
        e.preventDefault()
        const targetElement = document.querySelector(href)
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
          })
        }
      }
    })
  })

  // Job search functionality
  const jobSearch = document.getElementById("jobSearch")
  const jobCategory = document.getElementById("jobCategory")
  const jobLocation = document.getElementById("jobLocation")
  const jobsGrid = document.getElementById("jobsGrid")
  const filterJobsBtn = document.getElementById("filterJobs")

  async function filterJobs(showAll = false) {
    const searchQuery = document.getElementById("jobSearch").value
    const category = document.getElementById("jobCategory").value
    const location = document.getElementById("jobLocation").value

    try {
      const response = await fetch(
        `/employee/filter-jobs/?search=${searchQuery}&category=${category}&location=${location}`,
      )
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      const data = await response.json()

      const jobsGrid = document.getElementById("jobsGrid")
      jobsGrid.innerHTML = "" // Clear existing content

      // Create container for jobs
      const jobsContainer = document.createElement("div")
      jobsContainer.className = "row jobs-container"

      if (data.jobs.length === 0) {
        jobsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        No jobs found matching your criteria.
                    </div>
                </div>
            `
        jobsGrid.appendChild(jobsContainer)
        return
      }

      // Display jobs (all or just 6 based on showAll)
      const jobsToShow = showAll ? data.jobs : data.jobs.slice(0, 6)
      jobsToShow.forEach((job) => {
        const jobCard = `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="job-card">
                        <div class="job-card-header">
                            <h3 class="job-title">${job.title}</h3>
                            <div class="badges">
                                <span class="badge bg-primary">${job.job_type}</span>
                                <span class="badge bg-info">${job.work_setup}</span>
                            </div>
                        </div>
                        <div class="job-card-body">
                            <p class="company-name">
                                <i class="fas fa-building me-2"></i>
                                ${job.company}
                            </p>
                            <p class="location">
                                <i class="fas fa-map-marker-alt me-2"></i>
                                ${job.location}
                            </p>
                            <p class="salary">
                                <i class="fas fa-money-bill-wave me-2"></i>
                                ${job.salary_range}
                            </p>
                            <p class="experience">
                                <i class="fas fa-briefcase me-2"></i>
                                ${job.experience_level}
                            </p>
                            <div class="description">
                                ${job.description.length > 150 ? job.description.substring(0, 150) + "..." : job.description}
                            </div>
                        </div>
                        <div class="job-card-footer">
                            <small class="text-muted">Posted on ${job.created_at}</small>
                            <button class="btn btn-primary btn-sm apply-btn" data-job-id="${job.id}">
                                Apply Now
                            </button>
                        </div>
                    </div>
                </div>
            `
        jobsContainer.innerHTML += jobCard
      })

      jobsGrid.appendChild(jobsContainer)

      // Add toggle button if there are more than 6 jobs
      if (data.jobs.length > 6) {
        const viewAllContainer = document.createElement("div")
        viewAllContainer.className = "view-all-container text-center mt-4 mb-4"
        viewAllContainer.innerHTML = `
                <button id="viewAllJobs" class="btn btn-outline-primary btn-lg">
                    <i class="fas ${showAll ? "fa-compress-alt" : "fa-expand-alt"} me-2"></i>
                    ${showAll ? "Show Less" : `View All Jobs (${data.jobs.length})`}
                </button>
            `
        jobsGrid.appendChild(viewAllContainer)

        // Add event listener to the toggle button
        document.getElementById("viewAllJobs").addEventListener("click", () => {
          filterJobs(!showAll) // Toggle the showAll state
        })
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
      const jobsGrid = document.getElementById("jobsGrid")
      jobsGrid.innerHTML = `
            <div class="row jobs-container">
                <div class="col-12 text-center">
                    <div class="alert alert-danger">
                        Error loading jobs. Please try again later.
                    </div>
                </div>
            </div>
        `
    }
  }

  // Add event listeners
  document.getElementById("filterJobs").addEventListener("click", filterJobs)
  document.getElementById("jobSearch").addEventListener("input", debounce(filterJobs, 500))
  document.getElementById("jobCategory").addEventListener("change", filterJobs)
  document.getElementById("jobLocation").addEventListener("change", filterJobs)

  // Debounce function to prevent too many requests
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

  // Initial job load
  if (typeof filterJobs === "function") {
    filterJobs()
  }

  // Profile form submission
  const profileForm = document.getElementById("profileForm")
  const saveProfileBtn = document.getElementById("saveProfile")

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async (e) => {
      e.preventDefault()

      try {
        const formData = new FormData(profileForm)
        const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value

        // Get file input
        const avatarInput = document.getElementById("avatarUpload")
        if (avatarInput.files.length > 0) {
          formData.append("avatar", avatarInput.files[0])
        }

        const response = await fetch("/employee/update-profile/", {
          method: "POST",
          headers: {
            "X-CSRFToken": csrfToken,
          },
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // Show success message
            toastNotification("Profile updated successfully!", "success")

            // Update avatar in navbar if it was changed
            if (data.avatar_url) {
              const navAvatar = document.querySelector(".avatar-sm img")
              if (navAvatar) {
                navAvatar.src = data.avatar_url
              }
            }

            // Close the modal
            const modalElement = document.getElementById("profileModal")
            const modal = bootstrap.Modal.getInstance(modalElement)
            modal.hide()

            // Optionally reload the page to show all updates
            // window.location.reload();
          } else {
            throw new Error(data.error || "Profile update failed")
          }
        } else {
          throw new Error("Profile update failed")
        }
      } catch (error) {
        console.error("Error updating profile:", error)
        toastNotification(error.message || "Error updating profile", "error")
      }
    })
  }

  // Avatar preview functionality
  const avatarUpload = document.getElementById("avatarUpload")
  const avatarPreview = document.getElementById("avatarPreview")

  if (avatarUpload && avatarPreview) {
    avatarUpload.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          avatarPreview.src = e.target.result
        }
        reader.readAsDataURL(file)
      }
    })
  }

  // Profile Settings Modal Functionality
  const profileModal = document.getElementById("profileModal")
  const saveProfile = document.getElementById("saveProfile") // Match the ID in HTML

  // Handle profile form submission

  // Initialize Bootstrap modal
  const modalElement = document.getElementById("profileModal")
  if (modalElement) {
    // The issue was here.  bootstrap wasn't imported or declared.  This assumes it's available globally, which is bad practice, but fixes the immediate issue.
    const modal = new bootstrap.Modal(modalElement, {
      keyboard: true,
      backdrop: true,
    })

    // Add event listener to show modal when profile settings is clicked
    const profileSettingsLink = document.getElementById("profileSettingsLink")
    if (profileSettingsLink) {
      profileSettingsLink.addEventListener("click", (e) => {
        e.preventDefault()
        modal.show()
      })
    }
  }

  // Contact form submission
  const contactForm = document.querySelector(".contact-form")
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault()
      // Simulated form submission (replace with actual AJAX call to your backend)
      const formData = new FormData(contactForm)
      console.log("Contact form data:", Object.fromEntries(formData))
      contactForm.reset()
      if (typeof toastNotification === "function") {
        toastNotification("Message sent successfully!", "success")
      }
    })
  }

  // Replace showNotification with toastNotification
  function toastNotification(message, type) {
    console.log("Showing toast notification:", message, type)
    const toastContainer = document.getElementById("toastContainer") || createToastContainer()
    const toast = document.createElement("div")
    toast.className = `toast ${type} show`
    toast.setAttribute("role", "alert")
    toast.setAttribute("aria-live", "assertive")
    toast.setAttribute("aria-atomic", "true")
    toast.innerHTML = `
    <div class="toast-header">
      <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `
    toastContainer.appendChild(toast)

    // Initialize the Bootstrap toast
    const bsToast = new bootstrap.Toast(toast)
    bsToast.show()

    // Auto-hide the toast after 3 seconds
    setTimeout(() => {
      bsToast.hide()
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

  function createToastContainer() {
    console.log("Creating toast container")
    const container = document.createElement("div")
    container.id = "toastContainer"
    container.className = "toast-container position-fixed bottom-0 end-0 p-3"
    document.body.appendChild(container)
    return container
  }

  // Add animation to stat cards
  const statCards = document.querySelectorAll(".stat-card")
  statCards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "scale(1.05)"
    })
    card.addEventListener("mouseleave", () => {
      card.style.transform = "scale(1)"
    })
  })
})

