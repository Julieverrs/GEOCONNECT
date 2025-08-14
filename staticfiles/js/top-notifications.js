// Handle top notifications on login and logout pages
document.addEventListener("DOMContentLoaded", () => {
    // Check if there are any messages
    const messages = document.querySelectorAll(".messages .alert")
  
    if (messages.length > 0) {
      // Create top notifications container
      const topNotificationsContainer = document.createElement("div")
      topNotificationsContainer.className = "top-notifications"
      document.body.insertBefore(topNotificationsContainer, document.body.firstChild)
  
      // Process each message
      messages.forEach((message) => {
        // Get the message type (success, error, etc.)
        let messageType = "info"
        if (message.classList.contains("alert-success")) {
          messageType = "success"
        } else if (message.classList.contains("alert-error")) {
          messageType = "error"
        } else if (message.classList.contains("alert-warning")) {
          messageType = "warning"
        }
  
        // Create notification element
        const notification = document.createElement("div")
        notification.className = `top-notification top-notification-${messageType}`
        notification.innerHTML = `
          ${message.textContent}
          <button type="button" class="close-notification" onclick="this.parentElement.style.display='none';">
            <i class="fas fa-times"></i>
          </button>
        `
  
        // Add to container
        topNotificationsContainer.appendChild(notification)
  
        // Hide the original message
        message.style.display = "none"
      })
  
      // Auto-hide notifications after 5 seconds
      setTimeout(() => {
        const notifications = document.querySelectorAll(".top-notification")
        notifications.forEach((notification) => {
          notification.style.opacity = "0"
          setTimeout(() => {
            notification.style.display = "none"
          }, 500)
        })
      }, 5000)
    }
  })
  