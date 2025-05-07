// Import Bootstrap (assuming it's included elsewhere)
import * as bootstrap from "bootstrap"

// Function to show toast notifications
export function toastNotification(message, type = "info") {
  // Check if we're on a login or logout page and skip toast notifications if we are
  const currentPath = window.location.pathname
  const isLoginPage = currentPath.includes("login") || currentPath.includes("logout")

  if (isLoginPage) {
    console.log("On login/logout page - toast notifications disabled")
    return // Skip toast notifications on login/logout pages
  }

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

// Function to create toast container if it doesn't exist
function createToastContainer() {
  // Check if we're on a login or logout page and skip toast container creation if we are
  const currentPath = window.location.pathname
  const isLoginPage = currentPath.includes("login") || currentPath.includes("logout")

  if (isLoginPage) {
    console.log("On login/logout page - toast container creation skipped")
    return document.createElement("div") // Return dummy container that won't be added to DOM
  }

  console.log("Creating toast container")
  const container = document.createElement("div")
  container.id = "toastContainer"
  container.className = "toast-container position-fixed bottom-0 end-0 p-3"
  document.body.appendChild(container)
  return container
}
