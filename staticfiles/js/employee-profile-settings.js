// Employee Profile Settings Functionality
function initializeEmployeeProfileSettings() {
    // Get form elements
    const personalProfileForm = document.getElementById("personalProfileForm")
    const avatarUpload = document.getElementById("avatarUpload")
    const avatarPreview = document.getElementById("avatarPreview")
    const saveProfileBtn = document.getElementById("saveProfile")
  
    // Handle avatar preview
    if (avatarUpload) {
      avatarUpload.addEventListener("change", (e) => {
        const file = e.target.files[0]
        if (file && avatarPreview) {
          const reader = new FileReader()
          reader.onload = (e) => {
            avatarPreview.src = e.target.result
          }
          reader.readAsDataURL(file)
        }
      })
    }
  
    // Handle profile form submission
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener("click", async (e) => {
        e.preventDefault()
  
        const formData = new FormData(document.getElementById("profileForm"))
  
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
            // Assuming toastNotification is a globally available function or imported
            toastNotification("Profile updated successfully", "success")
            // Close the modal
            // Assuming bootstrap is a globally available object or imported
            const profileModal = bootstrap.Modal.getInstance(document.getElementById("profileModal"))
            profileModal.hide()
          } else {
            toastNotification(data.error || "Error updating profile", "error")
          }
        } catch (error) {
          console.error("Error:", error)
          toastNotification("An error occurred while updating profile", "error")
        }
      })
    }
  }
  
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
  
  // Initialize when DOM is loaded
  document.addEventListener("DOMContentLoaded", initializeEmployeeProfileSettings)
  
  