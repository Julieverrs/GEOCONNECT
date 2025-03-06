if (typeof window.bootstrap === "undefined") {
    console.error("Bootstrap is not loaded. Make sure you have included Bootstrap JS properly.")
  }
  
  // import * as bootstrap from "bootstrap"
  
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
  
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed")
    // Check for messages in the DOM
    const messages = document.querySelectorAll(".django-message")
    console.log("Found messages:", messages.length)
    messages.forEach((message) => {
      const messageText = message.textContent
      const messageType = message.dataset.type || "info"
      console.log("Processing message:", messageText, messageType)
      toastNotification(messageText, messageType)
      message.remove() // Remove the message from the DOM after showing the toast
    })
  })
  
  window.toastNotification = toastNotification
  
  