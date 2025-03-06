/**
 * Notifications JavaScript file for GeoConnect
 * Handles notification-related functionality
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("Notifications.js loaded successfully")

  // Function to show a toast notification
  window.showNotification = (message, type = "info", duration = 5000) => {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector(".toast-container")
    if (!toastContainer) {
      toastContainer = document.createElement("div")
      toastContainer.className = "toast-container position-fixed bottom-0 end-0 p-3"
      document.body.appendChild(toastContainer)
    }

    // Create toast element
    const toastId = "toast-" + Date.now()
    const toast = document.createElement("div")
    toast.className = `toast align-items-center text-white bg-${type}`
    toast.id = toastId
    toast.setAttribute("role", "alert")
    toast.setAttribute("aria-live", "assertive")
    toast.setAttribute("aria-atomic", "true")

    // Create toast content
    toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `

    // Add toast to container
    toastContainer.appendChild(toast)

    // Initialize and show toast
    if (typeof bootstrap !== "undefined" && bootstrap.Toast) {
      const toastInstance = new bootstrap.Toast(toast, {
        autohide: true,
        delay: duration,
      })
      toastInstance.show()

      // Remove toast from DOM after it's hidden
      toast.addEventListener("hidden.bs.toast", () => {
        toast.remove()
      })
    }
  }

  // Check for flash messages in Django templates
  const flashMessages = document.querySelectorAll(".flash-message")
  flashMessages.forEach((messageElement) => {
    const message = messageElement.textContent
    const messageType = messageElement.dataset.type || "info"

    if (message) {
      window.showNotification(message, messageType)
    }

    // Remove the flash message element
    messageElement.remove()
  })
})

//Import bootstrap here to fix the undeclared variable error.  This assumes bootstrap.js is included in your html.
//If it's a module, adjust accordingly.
if (typeof window.bootstrap === "undefined") {
  console.error("Bootstrap is not loaded. Make sure you have included Bootstrap JS properly.")
}

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
  const bsToast = new window.bootstrap.Toast(toast)
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

// document.addEventListener("DOMContentLoaded", () => {
//   console.log("DOM fully loaded and parsed")
//   // Check for messages in the DOM
//   const messages = document.querySelectorAll(".django-message")
//   console.log("Found messages:", messages.length)
//   messages.forEach((message) => {
//     const messageText = message.textContent
//     const messageType = message.dataset.type || "info"
//     console.log("Processing message:", messageText, messageType)
//     toastNotification(messageText, messageType)
//     message.remove() // Remove the message from the DOM after showing the toast
//   })
// })

window.toastNotification = toastNotification

