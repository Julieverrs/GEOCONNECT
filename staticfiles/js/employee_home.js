document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed")
  // Check for messages in the DOM
  const messages = document.querySelectorAll(".message")
  console.log("Found messages:", messages.length)
  messages.forEach((message) => {
    const messageText = message.textContent
    const messageType = message.classList.contains("success") ? "success" : "error"
    console.log("Processing message:", messageText, messageType)
    toastNotification(messageText, messageType)
    message.remove() // Remove the message from the DOM after showing the toast
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
      e.preventDefault()
      document.querySelector(this.getAttribute("href")).scrollIntoView({
        behavior: "smooth",
      })
    })
  })

  // Job search functionality
  const jobSearch = document.getElementById("jobSearch")
  const jobCategory = document.getElementById("jobCategory")
  const jobLocation = document.getElementById("jobLocation")
  const jobsGrid = document.getElementById("jobsGrid")

  function filterJobs() {
    const searchTerm = jobSearch.value.toLowerCase()
    const category = jobCategory.value
    const location = jobLocation.value

    // Simulated job data (replace with actual data from your backend)
    const jobs = [
      {
        title: "Software Developer",
        category: "tech",
        location: "remote",
        company: "TechCorp",
        description: "Exciting opportunity for a skilled developer...",
      },
      {
        title: "Marketing Specialist",
        category: "marketing",
        location: "onsite",
        company: "AdAgency",
        description: "Join our creative marketing team...",
      },
      {
        title: "UI/UX Designer",
        category: "design",
        location: "hybrid",
        company: "DesignStudio",
        description: "Create beautiful and functional interfaces...",
      },
      // Add more job listings as needed
    ]

    const filteredJobs = jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchTerm) &&
        (category === "" || job.category === category) &&
        (location === "" || job.location === location),
    )

    displayJobs(filteredJobs)
  }

  function displayJobs(jobs) {
    jobsGrid.innerHTML = ""
    jobs.forEach((job) => {
      const jobCard = document.createElement("div")
      jobCard.className = "job-card"
      jobCard.innerHTML = `
                <h3>${job.title}</h3>
                <p><strong>${job.company}</strong> - ${job.location}</p>
                <p>${job.description}</p>
                <button class="btn btn-primary btn-sm">Apply Now</button>
            `
      jobsGrid.appendChild(jobCard)
    })
  }

  jobSearch.addEventListener("input", filterJobs)
  jobCategory.addEventListener("change", filterJobs)
  jobLocation.addEventListener("change", filterJobs)

  // Initial job display
  filterJobs()

  // Profile form submission
  const profileForm = document.getElementById("profileForm")
  const saveProfileBtn = document.getElementById("saveProfileBtn") // Added to get the save button
  saveProfileBtn.addEventListener("click", (e) => {
    e.preventDefault()
    // Simulated form submission (replace with actual AJAX call to your backend)
    const formData = new FormData(profileForm)
    console.log("Profile data:", Object.fromEntries(formData))
    //The following line was commented out because it's unclear how to properly import jQuery in this context without more information about the project setup.  The user should add a proper jQuery import to their HTML file.
    //$("#profileModal").modal("hide")
    toastNotification("Profile updated successfully!", "success")
  })

  // Contact form submission
  const contactForm = document.querySelector(".contact-form")
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault()
    // Simulated form submission (replace with actual AJAX call to your backend)
    const formData = new FormData(contactForm)
    console.log("Contact form data:", Object.fromEntries(formData))
    contactForm.reset()
    toastNotification("Message sent successfully!", "success")
  })

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

