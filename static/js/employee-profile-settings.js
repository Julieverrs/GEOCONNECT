// Import necessary modules (assuming these are available in your project)
import { toastNotification } from "./toast-notifications" // Adjust path as needed
import * as bootstrap from "bootstrap" // Adjust path as needed

document.addEventListener("DOMContentLoaded", () => {
  // Get form elements
  const profileForm = document.getElementById("profileForm")
  const avatarUpload = document.getElementById("avatarUpload")
  const avatarPreview = document.getElementById("avatarPreview")
  const saveProfileBtn = document.getElementById("saveProfile")

  // Add image validation
  function validateImage(file) {
    // Check file size (2MB limit)
    const maxSize = 2 * 1024 * 1024 // 2MB in bytes
    if (file.size > maxSize) {
      toastNotification("Image size should be less than 2MB", "error")
      return false
    }

    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg"]
    if (!validTypes.includes(file.type)) {
      toastNotification("Please upload a valid image (JPG, PNG)", "error")
      return false
    }

    return true
  }

  // Handle avatar preview
  if (avatarUpload) {
    avatarUpload.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file) {
        if (validateImage(file)) {
          const reader = new FileReader()
          reader.onload = (e) => {
            if (avatarPreview) {
              avatarPreview.src = e.target.result
            }
          }
          reader.readAsDataURL(file)
        } else {
          // Reset file input
          e.target.value = ""
        }
      }
    })
  }

  // Handle profile form submission
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async (e) => {
      e.preventDefault()

      const formData = new FormData(profileForm)

      try {
        const response = await fetch("/employee/profile/update/", {
          method: "POST",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: formData,
        })

        const data = await response.json()

        if (data.success) {
          // Show success message using the existing toast system
          if (typeof toastNotification === "function") {
            toastNotification("Profile updated successfully", "success")
          } else {
            alert("Profile updated successfully")
          }

          // Close the modal
          const modal = document.getElementById("profileModal")
          const modalInstance = bootstrap.Modal.getInstance(modal)
          if (modalInstance) {
            modalInstance.hide()
          }

          // Reload the page after a short delay
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        } else {
          if (typeof toastNotification === "function") {
            toastNotification(data.error || "Error updating profile", "error")
          } else {
            alert(data.error || "Error updating profile")
          }
        }
      } catch (error) {
        console.error("Error:", error)
        if (typeof toastNotification === "function") {
          toastNotification("An error occurred while updating profile", "error")
        } else {
          alert("An error occurred while updating profile")
        }
      }
    })
  }
})

// Helper function to get CSRF token
function getCookie(name) {
  let cookieValue = null
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";")
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

