document.addEventListener("DOMContentLoaded", () => {
  // Get form elements
  const profileForm = document.getElementById("profileForm")
  const avatarUpload = document.getElementById("avatarUpload")
  const avatarPreview = document.getElementById("avatarPreview")
  const resumeUpload = document.getElementById("resumeUpload")
  const saveProfileBtn = document.getElementById("saveProfile")

  // Add image validation
  function validateImage(file) {
    // Check file size (2MB limit)
    const maxSize = 2 * 1024 * 1024 // 2MB in bytes
    if (file.size > maxSize) {
      if (typeof window.toastNotification === "function") {
        window.toastNotification("Image size should be less than 2MB", "error")
      } else {
        alert("Image size should be less than 2MB")
      }
      return false
    }

    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg"]
    if (!validTypes.includes(file.type)) {
      if (typeof window.toastNotification === "function") {
        window.toastNotification("Please upload a valid image (JPG, PNG)", "error")
      } else {
        alert("Please upload a valid image (JPG, PNG)")
      }
      return false
    }

    return true
  }

  // Add resume validation
  function validateResume(file) {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      if (typeof window.toastNotification === "function") {
        window.toastNotification("Resume size should be less than 5MB", "error")
      } else {
        alert("Resume size should be less than 5MB")
      }
      return false
    }

    // Check file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!validTypes.includes(file.type)) {
      if (typeof window.toastNotification === "function") {
        window.toastNotification("Please upload a valid resume (PDF, DOC, DOCX)", "error")
      } else {
        alert("Please upload a valid resume (PDF, DOC, DOCX)")
      }
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

  // Handle resume validation
  if (resumeUpload) {
    resumeUpload.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file && !validateResume(file)) {
        // Reset file input if validation fails
        e.target.value = ""
      }
    })
  }

  // Handle profile form submission
  if (saveProfileBtn && profileForm) {
    saveProfileBtn.addEventListener("click", async (e) => {
      e.preventDefault()
      console.log("Profile save button clicked")

      // Validate resume if one is selected
      const resumeFile = resumeUpload?.files[0]
      if (resumeFile && !validateResume(resumeFile)) {
        return
      }

      const formData = new FormData(profileForm)

      try {
        console.log("Sending profile update request...")
        const response = await fetch("/employee/profile/update/", {
          method: "POST",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: formData,
        })

        console.log("Response status:", response.status)

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`)
        }

        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json()

          if (data.success) {
            // Show success message using the existing toast system
            if (typeof window.toastNotification === "function") {
              window.toastNotification("Profile updated successfully", "success")
            } else {
              alert("Profile updated successfully")
            }

            // Close the modal
            const modal = document.getElementById("profileModal")
            if (window.bootstrap && modal) {
              const modalInstance = window.bootstrap.Modal.getInstance(modal)
              if (modalInstance) {
                modalInstance.hide()
              }
            }

            // Reload the page after a short delay
            setTimeout(() => {
              window.location.reload()
            }, 1500)
          } else {
            if (typeof window.toastNotification === "function") {
              window.toastNotification(data.error || "Error updating profile", "error")
            } else {
              alert(data.error || "Error updating profile")
            }
          }
        } else {
          throw new Error("Server did not return JSON")
        }
      } catch (error) {
        console.error("Error:", error)
        if (typeof window.toastNotification === "function") {
          window.toastNotification("An error occurred while updating profile", "error")
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

// Add this event listener for the remove resume button
document.addEventListener("DOMContentLoaded", () => {
  const removeResumeBtn = document.getElementById("remove-resume-btn")

  if (removeResumeBtn) {
    removeResumeBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to remove your resume?")) {
        // Send AJAX request to remove the resume
        fetch("/employee/remove-resume/", {
          method: "POST",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Server responded with status: ${response.status}`)
            }
            return response.json()
          })
          .then((data) => {
            if (data.success) {
              // Show success message
              if (typeof window.toastNotification === "function") {
                window.toastNotification("Resume removed successfully", "success")
              } else {
                alert("Resume removed successfully")
              }

              // Remove the resume container from the DOM or hide it
              const resumeContainer = document.querySelector(".resume-container")
              if (resumeContainer) {
                resumeContainer.style.display = "none"
              }

              // Reload the page after a short delay to reflect changes
              setTimeout(() => {
                window.location.reload()
              }, 1500)
            } else {
              // Show error message
              if (typeof window.toastNotification === "function") {
                window.toastNotification(data.error || "Failed to remove resume", "error")
              } else {
                alert(data.error || "Failed to remove resume")
              }
            }
          })
          .catch((error) => {
            console.error("Error:", error)
            if (typeof window.toastNotification === "function") {
              window.toastNotification("An error occurred while removing resume", "error")
            } else {
              alert("An error occurred while removing resume")
            }
          })
      }
    })
  }
})

