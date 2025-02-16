// Employee Profile Settings Functionality
function initializeEmployeeProfileSettings() {
  const profileModal = document.getElementById("profileModal")
  const tabButtons = document.querySelectorAll(".tab-button")
  const tabContents = document.querySelectorAll(".tab-content")

  // Load profile data
  window.loadProfileData = async () => {
    try {
      const response = await fetch("/employee/profile/get/")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("Debug - Fetched profile data:", data)

      if (data.profile) {
        // Fill personal information form
        document.getElementById("username").value = data.profile.username || ""
        document.getElementById("email").value = data.profile.email || ""
        document.getElementById("firstName").value = data.profile.first_name || ""
        document.getElementById("lastName").value = data.profile.last_name || ""
        document.getElementById("phone").value = data.profile.phone || ""
        document.getElementById("location").value = data.profile.location || ""
        document.getElementById("bio").value = data.profile.bio || ""

        // Fill professional information form
        // (Add this when you implement the professional tab)

        // Fill preferences form
        // (Add this when you implement the preferences tab)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      alert("Error loading profile data")
    }
  }

  // Handle form submissions
  const personalInfoForm = document.getElementById("personalInfoForm")

  personalInfoForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    await updateProfile("personal")
  })

  async function updateProfile(formType) {
    const formData = new FormData(personalInfoForm)
    const data = Object.fromEntries(formData.entries())

    try {
      const response = await fetch("/employee/profile/update/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        alert(`${formType.charAt(0).toUpperCase() + formType.slice(1)} information updated successfully`)
      } else {
        alert(result.error || "Error updating profile")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("An error occurred while updating profile")
    }
  }

  // Tab switching
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      button.classList.add("active")
      document.getElementById(`${button.dataset.tab}Tab`).classList.add("active")
    })
  })
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

// Initialize profile settings when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeEmployeeProfileSettings)

