/**
 * Main JavaScript file for GeoConnect
 * Contains common functionality used across the application
 */

// Initialize common UI elements when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("Main.js loaded successfully")
  
    // Initialize tooltips if Bootstrap is available
    const bootstrap = window.bootstrap
    if (typeof bootstrap !== "undefined" && bootstrap.Tooltip) {
      var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
      tooltipTriggerList.map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl))
    }
  
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        if (this.getAttribute("href") !== "#") {
          e.preventDefault()
  
          const targetId = this.getAttribute("href")
          const targetElement = document.querySelector(targetId)
  
          if (targetElement) {
            window.scrollTo({
              top: targetElement.offsetTop - 70, // Adjust for fixed header
              behavior: "smooth",
            })
          }
        }
      })
    })
  
    // Add active class to nav items based on scroll position
    function setActiveNavItem() {
      const sections = document.querySelectorAll("section[id]")
      const scrollPosition = window.scrollY + 100 // Adjust for header height
  
      sections.forEach((section) => {
        const sectionTop = section.offsetTop
        const sectionHeight = section.offsetHeight
        const sectionId = section.getAttribute("id")
  
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          document.querySelectorAll(".nav-link").forEach((navLink) => {
            navLink.classList.remove("active")
            if (navLink.getAttribute("href") === "#" + sectionId) {
              navLink.classList.add("active")
            }
          })
        }
      })
    }
  
    // Listen for scroll events to update active nav item
    window.addEventListener("scroll", setActiveNavItem)
  
    // Initialize active nav item on page load
    setActiveNavItem()
  
    // Global fix for Bootstrap modal backdrop issues
    function fixModalBackdropIssue() {
      // Fix for any existing modal backdrops on page load
      if (!document.querySelector(".modal.show")) {
        document.body.classList.remove("modal-open")
        var modalBackdrops = document.querySelectorAll(".modal-backdrop")
        modalBackdrops.forEach((backdrop) => {
          backdrop.parentNode.removeChild(backdrop)
        })
        document.body.style.overflow = ""
        document.body.style.paddingRight = ""
      }
    }
  
    // Run the fix on page load
    fixModalBackdropIssue()
  
    // Add global event listener for all modals
    document.addEventListener("hidden.bs.modal", () => {
      setTimeout(fixModalBackdropIssue, 100) // Small delay to ensure Bootstrap has finished its operations
    })
  
    // Add event listener for ESC key to properly close modals
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        fixModalBackdropIssue()
      }
    })
  })
  
  