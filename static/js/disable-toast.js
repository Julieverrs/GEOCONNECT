// Disable toast notifications on login and logout pages
document.addEventListener("DOMContentLoaded", () => {
    // Check if we're on a login or logout page
    const path = window.location.pathname
  
    // Only disable toasts on employer login and logout pages
    const isEmployerLoginPage = path.includes("employer/login") || path.includes("employer/logout")
  
    if (isEmployerLoginPage) {
      // Remove any existing toast containers
      const toastContainers = document.querySelectorAll(".toast-container")
      toastContainers.forEach((container) => {
        container.remove()
      })
  
      // Override the toastNotification function to do nothing on employer login pages
      window.toastNotification = () => {
        // Do nothing - effectively disabling toast notifications
        console.log("Toast notifications disabled on employer login/logout pages")
        return
      }
    }
  })
  