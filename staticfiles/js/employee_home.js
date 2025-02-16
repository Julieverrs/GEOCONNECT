document.addEventListener("DOMContentLoaded", () => {
  // Navigation
  const navLinks = document.querySelectorAll(".nav-link")
  const sections = document.querySelectorAll(".section")
  const mobileMenuBtn = document.getElementById("mobileMenuBtn")
  const navLinksContainer = document.getElementById("navLinks")

  // Smooth scrolling and section highlighting
  function updateNavigation() {
    const scrollPosition = window.scrollY

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100
      const sectionBottom = sectionTop + section.offsetHeight
      const sectionId = section.getAttribute("id")

      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        navLinks.forEach((link) => {
          link.classList.remove("active")
          if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active")
          }
        })
      }
    })
  }

  window.addEventListener("scroll", updateNavigation)

  // Handle navigation
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()

      // Remove active class from all links and sections
      navLinks.forEach((l) => l.classList.remove("active"))
      sections.forEach((s) => s.classList.remove("active"))

      // Add active class to clicked link
      link.classList.add("active")

      // Show corresponding section
      const targetId = link.getAttribute("href").substring(1)
      const targetSection = document.getElementById(targetId)
      targetSection.classList.add("active")

      // Smooth scroll
      targetSection.scrollIntoView({ behavior: "smooth" })

      // Close mobile menu if open
      if (window.innerWidth <= 768) {
        navLinksContainer.classList.remove("active")
      }
    })
  })

  // Mobile menu toggle
  mobileMenuBtn.addEventListener("click", () => {
    navLinksContainer.classList.toggle("active")
  })

  // Notifications
  const notificationIcon = document.getElementById("notificationIcon")
  const notificationDropdown = document.querySelector(".notification-dropdown")

  notificationIcon.addEventListener("click", (e) => {
    e.stopPropagation()
    notificationDropdown.classList.toggle("active")
  })

  // Close notifications when clicking outside
  document.addEventListener("click", (e) => {
    if (!notificationIcon.contains(e.target)) {
      notificationDropdown.classList.remove("active")
    }
  })

  // Sample jobs data
  const jobs = [
    {
      title: "Senior Software Engineer",
      company: "Tech Solutions Inc.",
      location: "Remote",
      salary: "$80,000 - $120,000",
      type: "Full-time",
      tags: ["React", "Node.js", "TypeScript"],
    },
    {
      title: "UX/UI Designer",
      company: "Creative Studios",
      location: "Manila",
      salary: "$50,000 - $70,000",
      type: "Full-time",
      tags: ["Figma", "Adobe XD", "Sketch"],
    },
    {
      title: "Product Manager",
      company: "Innovation Hub",
      location: "Hybrid",
      salary: "$70,000 - $90,000",
      type: "Full-time",
      tags: ["Agile", "Scrum", "Product Strategy"],
    },
  ]

  // Populate jobs grid
  function renderJobs() {
    const jobsGrid = document.getElementById("jobsGrid")
    if (!jobsGrid) return

    jobsGrid.innerHTML = jobs
      .map(
        (job) => `
            <div class="job-card fade-in">
                <div class="job-header">
                    <h3>${job.title}</h3>
                    <span class="job-type">${job.type}</span>
                </div>
                <div class="job-company">
                    <i class="fas fa-building"></i>
                    <span>${job.company}</span>
                </div>
                <div class="job-details">
                    <div class="job-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${job.location}</span>
                    </div>
                    <div class="job-salary">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>${job.salary}</span>
                    </div>
                </div>
                <div class="job-tags">
                    ${job.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
                </div>
                <button class="apply-btn">Apply Now</button>
            </div>
        `,
      )
      .join("")
  }

  renderJobs()

  // User menu toggle
  const userMenuBtn = document.querySelector(".user-menu-btn")
  const userDropdown = document.querySelector(".user-dropdown")

  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener("click", () => {
      userDropdown.classList.toggle("show")
    })

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!userMenuBtn.contains(e.target)) {
        userDropdown.classList.remove("show")
      }
    })
  }

  // Contact form submission
  const contactForm = document.getElementById("contactForm")
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault()
      // Add your form submission logic here
      alert("Message sent successfully!")
      contactForm.reset()
    })
  }

  // Intersection Observer for animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in")
        }
      })
    },
    { threshold: 0.1 },
  )

  // Observe elements for animation
  document.querySelectorAll(".job-card, .feature-card, .stat-card").forEach((el) => {
    observer.observe(el)
  })

  // Progress Ring Animation
  function createProgressRing(element, percent) {
    const circle = element.querySelector(".progress-ring-circle")
    const radius = circle.r.baseVal.value
    const circumference = radius * 2 * Math.PI

    circle.style.strokeDasharray = `${circumference} ${circumference}`
    circle.style.strokeDashoffset = circumference

    const offset = circumference - (percent / 100) * circumference
    circle.style.strokeDashoffset = offset

    const textElement = element.querySelector(".progress-text")
    if (textElement) {
      textElement.textContent = `${percent}%`
    }
  }

  // Initialize progress rings
  document.querySelectorAll(".progress-ring").forEach((ring, index) => {
    const percentages = [85, 65, 92] // Example percentages
    createProgressRing(ring, percentages[index])
  })

  // Enhanced User Menu
  const userMenu = document.getElementById("userMenu")
  const userDropdownMenu = userMenu.querySelector(".user-dropdown")
  const userMenuBtnMenu = userMenu.querySelector(".user-menu-btn")

  userMenuBtnMenu.addEventListener("click", (e) => {
    e.stopPropagation()
    userDropdownMenu.classList.toggle("show")
  })

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target)) {
      userDropdownMenu.classList.remove("show")
    }
  })

  // Hover effects for dropdown items
  document.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("mouseenter", () => {
      const icon = item.querySelector("i")
      icon.style.transform = "scale(1.1)"
    })

    item.addEventListener("mouseleave", () => {
      const icon = item.querySelector("i")
      icon.style.transform = "scale(1)"
    })
  })

  // Add smooth transition for user status
  const userStatus = document.querySelector(".user-status")
  if (userStatus) {
    userStatus.addEventListener("click", () => {
      userStatus.classList.toggle("offline")
      const statusText = userStatus.querySelector("span")
      const statusIcon = userStatus.querySelector("i")

      if (userStatus.classList.contains("offline")) {
        statusText.textContent = "Offline"
        userStatus.style.background = "var(--secondary)"
      } else {
        statusText.textContent = "Online"
        userStatus.style.background = "var(--success)"
      }
    })
  }

  // Stats counter animation
  function animateValue(element, start, end, duration) {
    let startTimestamp = null
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      element.textContent = Math.floor(progress * (end - start) + start)
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    window.requestAnimationFrame(step)
  }

  // Animate stats when they come into view
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const statValue = entry.target.querySelector("h3")
          const endValue = Number.parseInt(statValue.textContent)
          animateValue(statValue, 0, endValue, 2000)
          statsObserver.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.5 },
  )

  document.querySelectorAll(".stat-item").forEach((stat) => {
    statsObserver.observe(stat)
  })
})

// Add smooth scrolling for all anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const targetId = this.getAttribute("href").substring(1)
    const targetElement = document.getElementById(targetId)

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
      })
    }
  })
})

