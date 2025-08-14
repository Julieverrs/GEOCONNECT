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

  // Find the smooth scrolling code section and replace it with this improved version:

  // Add smooth scrolling to navigation links
  document.querySelectorAll(".nav-links a, .scroll-btn, .scroll-down").forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()

      const targetId = this.getAttribute("href").substring(1)
      const targetElement = document.getElementById(targetId)

      if (targetElement) {
        // Calculate header height
        const headerHeight = document.querySelector(".dashboard-header").offsetHeight

        // Calculate the position to scroll to
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        })

        // Update active link manually
        document.querySelectorAll(".nav-links a").forEach((link) => {
          link.classList.remove("active")
        })
        this.classList.add("active")
      }
    })
  })

  // Improve the active navigation link detection based on scroll position
  function updateActiveNavLink() {
    const sections = document.querySelectorAll("section.section")
    const navLinks = document.querySelectorAll(".nav-links a")
    const headerHeight = document.querySelector(".dashboard-header").offsetHeight

    let currentSectionId = ""

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - headerHeight - 10 // Added extra offset for better detection
      const sectionHeight = section.offsetHeight
      const sectionId = section.getAttribute("id")

      // Check if we've scrolled past the top of the section and not past the bottom
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentSectionId = sectionId
      }
    })

    navLinks.forEach((link) => {
      link.classList.remove("active")
      const href = link.getAttribute("href").substring(1)
      if (href === currentSectionId) {
        link.classList.add("active")
      }
    })
  }

  // Job search functionality
  const filterJobsBtn = document.getElementById("filterJobs")
  if (filterJobsBtn) {
    filterJobsBtn.addEventListener("click", () => filterJobs(false))
  }

  const jobSearch = document.getElementById("jobSearch")
  if (jobSearch) {
    jobSearch.addEventListener(
      "input",
      debounce(() => filterJobs(false), 500),
    )
  }

  const jobCategory = document.getElementById("jobCategory")
  if (jobCategory) {
    jobCategory.addEventListener("change", () => filterJobs(false))
  }

  const jobLocation = document.getElementById("jobLocation")
  if (jobLocation) {
    jobLocation.addEventListener("change", () => filterJobs(false))
  }

  // Initial job load
  filterJobs(false)

  // Add this near the top of the file, after the DOMContentLoaded event
  let appliedJobs = new Set()

  // Add a function to fetch applied jobs
  async function fetchAppliedJobs() {
    try {
      const response = await fetch("/employee/get-applied-jobs/")
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      const data = await response.json()
      if (data.success) {
        appliedJobs = new Set(data.applied_jobs)
      }
    } catch (error) {
      console.error("Error fetching applied jobs:", error)
    }
  }

  // Find the filterJobs function and modify it to support the showAll parameter
  // Update the filterJobs function to work with the scrollable container

  // Find the filterJobs function and replace it with:

  async function filterJobs(showAll = false) {
    // Fetch applied jobs first
    await fetchAppliedJobs()

    const searchQuery = document.getElementById("jobSearch").value
    const category = document.getElementById("jobCategory").value
    const location = document.getElementById("jobLocation").value

    // Filter jobs function
    const searchTerm = jobSearch ? jobSearch.value.toLowerCase() : ""
    const categoryFilter = jobCategory ? jobCategory.value : ""
    const locationFilter = jobLocation ? jobLocation.value : ""

    const jobCards = document.querySelectorAll(".job-card")
    let visibleCount = 0

    jobCards.forEach((card) => {
      const cardContainer = card.closest(".col-md-6")
      const jobTitle = card.querySelector(".job-title").textContent.toLowerCase()
      const jobType = card.querySelector(".badge.bg-primary").textContent
      const jobWorkSetup = card.querySelector(".badge.bg-info").textContent

      const matchesSearch = !searchTerm || jobTitle.includes(searchTerm)
      const matchesCategory = !categoryFilter || jobType === categoryFilter
      const matchesLocation = !locationFilter || jobWorkSetup === locationFilter

      if (matchesSearch && matchesCategory && matchesLocation) {
        cardContainer.style.display = "block"
        visibleCount++
      } else {
        cardContainer.style.display = "none"
      }
    })

    // Show/hide no results message
    const noResultsMsg = document.querySelector(".no-results-message")
    if (visibleCount === 0) {
      if (!noResultsMsg) {
        const message = document.createElement("div")
        message.className = "col-12 text-center no-results-message"
        message.innerHTML = '<div class="alert alert-info">No jobs match your search criteria.</div>'
        document.querySelector(".jobs-container").appendChild(message)
      }
    } else if (noResultsMsg) {
      noResultsMsg.remove()
    }

    // Update the jobs count indicator
    const jobsCount = document.querySelector(".jobs-count .text-muted")
    if (jobsCount) {
      const totalJobs = document.querySelectorAll(".job-card").length
      jobsCount.textContent = `Showing ${visibleCount} of ${totalJobs} available jobs`
    }

    // Scroll the container back to top after filtering
    const scrollableContainer = document.querySelector(".scrollable-jobs-container")
    if (scrollableContainer) {
      scrollableContainer.scrollTop = 0
    }
  }

  // Find the initializeJobButtons function and replace it with:
  function initializeJobButtons() {
    // Initialize view/apply job buttons
    document.querySelectorAll(".view-job-btn").forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault()
        // Now prepareJobDetails will open the apply modal directly
        prepareJobDetails(this)
      })
    })
  }

  // Function to prepare job details and open the apply modal
  function prepareJobDetails(button) {
    // Get job details from data attributes
    const jobId = button.getAttribute("data-job-id")
    const jobTitle = button.getAttribute("data-job-title")
    const company = button.getAttribute("data-company")
    const location = button.getAttribute("data-location")
    const jobType = button.getAttribute("data-job-type")
    const workSetup = button.getAttribute("data-work-setup")
    const salary = button.getAttribute("data-salary")
    const experience = button.getAttribute("data-experience")
    const description = button.getAttribute("data-description")
    const requirements = button.getAttribute("data-requirements")
    const posted = button.getAttribute("data-posted")

    // Set company initial
    if (document.getElementById("viewJobCompanyInitial")) {
      document.getElementById("viewJobCompanyInitial").textContent = company.charAt(0)
    }

    // Set values in the apply modal
    if (document.getElementById("viewJobTitle")) {
      document.getElementById("viewJobTitle").textContent = jobTitle
    }
    if (document.getElementById("viewJobCompany")) {
      document.getElementById("viewJobCompany").textContent = company
    }
    if (document.getElementById("viewJobLocation")) {
      document.getElementById("viewJobLocation").textContent = location
    }
    if (document.getElementById("viewJobType")) {
      document.getElementById("viewJobType").textContent = jobType
    }
    if (document.getElementById("viewJobWorkSetup")) {
      document.getElementById("viewJobWorkSetup").textContent = workSetup
    }
    if (document.getElementById("viewJobSalary")) {
      document.getElementById("viewJobSalary").textContent = salary
    }
    if (document.getElementById("viewJobExperience")) {
      document.getElementById("viewJobExperience").textContent = experience
    }
    if (document.getElementById("viewJobPosted")) {
      document.getElementById("viewJobPosted").textContent = "Posted " + posted
    }

    // Set content sections
    if (document.getElementById("viewJobDescription")) {
      document.getElementById("viewJobDescription").innerHTML = description
    }
    if (document.getElementById("viewJobRequirements")) {
      document.getElementById("viewJobRequirements").innerHTML = requirements || "No specific requirements provided."
    }

    // Also set the application form fields
    document.getElementById("jobId").value = jobId
    document.getElementById("jobTitleSpan").textContent = jobTitle
    document.getElementById("jobCompanySpan").textContent = company
    document.getElementById("jobTitleDetail").textContent = jobTitle

    // Open the apply modal
    const applyModal = new bootstrap.Modal(document.getElementById("applyJobModal"))
    applyModal.show()
  }

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

  // Dummy functions to satisfy the calls.  These would normally be defined elsewhere.
  function prepareJobApplication(jobId, jobTitle, company) {
    console.log("prepareJobApplication called", jobId, jobTitle, company)
  }

  // Remove or comment out the Bootstrap popover initialization code if it exists
  // Look for code like this and remove or comment it out:

  // Initialize popovers for company badges
  // const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
  // const popoverList = popoverTriggerList.map(
  //   (popoverTriggerEl) =>
  //     new bootstrap.Popover(popoverTriggerEl, {
  //       container: "body",
  //       sanitize: false,
  //     }),
  // )

  // Also remove or comment out any other popover initialization code

  // Function to initialize popovers for dynamically added elements
  function initializePopovers() {
    const newPopoverTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="popover"]:not([data-bs-popover-initialized])'),
    )
    newPopoverTriggerList.forEach((popoverTriggerEl) => {
      new bootstrap.Popover(popoverTriggerEl, {
        container: "body",
        sanitize: false,
      })
      popoverTriggerEl.setAttribute("data-bs-popover-initialized", "true")
    })
  }

  // Call after filtering jobs
  const originalFilterJobs = filterJobs
  filterJobs = (showAll = false) => {
    originalFilterJobs(showAll)
    setTimeout(initializePopovers, 100)
  }
})
