// Profile Settings Functionality
function initializeProfileSettings() {
  const profileModal = document.getElementById("profileModal")
  const profileSettingsLink = document.querySelector('.dropdown-item[href="#"]')
  const closeProfileModal = document.getElementById("closeProfileModal")
  const tabButtons = document.querySelectorAll(".tab-button")
  const tabContents = document.querySelectorAll(".tab-content")
  let companyLocationMap, companyLocationMarker

  function initializeCompanyLocationMap(latitude, longitude, initialLocation) {
    // Wait for the tab to be visible before initializing the map
    if (!document.getElementById("companyLocationMap")) {
      console.error("Map container not found")
      return
    }

    if (companyLocationMap) {
      companyLocationMap.remove()
    }

    const defaultLocation = [14.5995, 120.9842] // Default to Manila
    const zoom = latitude && longitude ? 13 : 10
    const center = latitude && longitude ? [latitude, longitude] : defaultLocation

    companyLocationMap = L.map("companyLocationMap").setView(center, zoom)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(companyLocationMap)

    companyLocationMarker = L.marker(center, { draggable: true }).addTo(companyLocationMap)

    if (initialLocation && !latitude && !longitude) {
      searchLocation(initialLocation)
    }

    companyLocationMarker.on("dragend", (event) => {
      const position = event.target.getLatLng()
      updateLocationInput(position)
    })

    companyLocationMap.on("click", (e) => {
      companyLocationMarker.setLatLng(e.latlng)
      updateLocationInput(e.latlng)
    })

    // Force a map redraw after initialization
    setTimeout(() => {
      companyLocationMap.invalidateSize()
    }, 100)
  }

  async function searchLocation(query) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      )
      const data = await response.json()

      if (data.length > 0) {
        const { lat, lon } = data[0]
        const latlng = L.latLng(lat, lon)
        companyLocationMarker.setLatLng(latlng)
        companyLocationMap.setView(latlng, 13)
        updateLocationInput(latlng)
      } else {
        showNotification("Location not found", "error")
      }
    } catch (error) {
      console.error("Error searching location:", error)
      showNotification("Error searching location", "error")
    }
  }

  async function updateLocationInput(latlng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`,
      )
      const data = await response.json()

      if (data.display_name) {
        document.getElementById("companyLocation").value = data.display_name
        document.getElementById("companyLatitude").value = latlng.lat
        document.getElementById("companyLongitude").value = latlng.lng
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error)
    }
  }

  // Load profile data
  async function loadProfileData() {
    try {
      const response = await fetch("/employer/profile/get/")
      const data = await response.json()

      if (data.profile) {
        // Fill company profile form
        document.getElementById("companyName").value = data.profile.company_name || ""
        document.getElementById("companyDescription").value = data.profile.company_description || ""
        document.getElementById("companyWebsite").value = data.profile.company_website || ""
        document.getElementById("companyLocation").value = data.profile.company_location || ""
        document.getElementById("industry").value = data.profile.industry || ""
        document.getElementById("companyLatitude").value = data.profile.latitude || ""
        document.getElementById("companyLongitude").value = data.profile.longitude || ""

        // Initialize map with company location
        const lat = data.profile.latitude
        const lng = data.profile.longitude
        const location = data.profile.company_location

        // Wait for the tab to be visible before initializing the map
        setTimeout(() => {
          initializeCompanyLocationMap(lat, lng, location)
        }, 100)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      showNotification("Error loading profile data", "error")
    }
  }

  // Handle form submissions
  const companyProfileForm = document.getElementById("companyProfileForm")
  const accountSettingsForm = document.getElementById("accountSettingsForm")
  const changePasswordForm = document.getElementById("changePasswordForm")

  companyProfileForm?.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Get the submit button and show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]')
    const originalText = submitBtn.innerHTML
    submitBtn.innerHTML = `
      <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 11-6.219-8.56"></path>
      </svg>
      Saving...
    `
    submitBtn.disabled = true

    const formData = {
      company_name: document.getElementById("companyName").value,
      company_description: document.getElementById("companyDescription").value,
      company_website: document.getElementById("companyWebsite").value,
      company_location: document.getElementById("companyLocation").value,
      latitude: document.getElementById("companyLatitude").value,
      longitude: document.getElementById("companyLongitude").value,
      industry: document.getElementById("industry").value,
    }

    try {
      const response = await fetch("/employer/profile/update/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        showNotification("Company profile updated successfully", "success")
        // Close modal on success
        setTimeout(() => {
          profileModal.style.display = "none"
          document.body.style.overflow = ""
        }, 1500) // Wait 1.5 seconds to show success message
      } else {
        showNotification(data.error || "Error updating profile", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("An error occurred while updating profile", "error")
    } finally {
      // Restore button state
      submitBtn.innerHTML = originalText
      submitBtn.disabled = false
    }
  })

  // Account Settings Form Handler
  accountSettingsForm?.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Get the submit button and show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]')
    const originalText = submitBtn.innerHTML
    submitBtn.innerHTML = `
      <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 11-6.219-8.56"></path>
      </svg>
      Updating...
    `
    submitBtn.disabled = true

    const formData = {
      email: document.getElementById("email").value,
    }

    try {
      const response = await fetch("/employer/account/update/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        showNotification("Account settings updated successfully", "success")
        // Close modal on success
        setTimeout(() => {
          profileModal.style.display = "none"
          document.body.style.overflow = ""
        }, 1500) // Wait 1.5 seconds to show success message
      } else {
        showNotification(data.error || "Error updating account settings", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("An error occurred while updating account settings", "error")
    } finally {
      // Restore button state
      submitBtn.innerHTML = originalText
      submitBtn.disabled = false
    }
  })

  // Change Password Form Handler
  changePasswordForm?.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Get the submit button and show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]')
    const originalText = submitBtn.innerHTML
    submitBtn.innerHTML = `
      <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 11-6.219-8.56"></path>
      </svg>
      Changing Password...
    `
    submitBtn.disabled = true

    const formData = {
      current_password: document.getElementById("currentPassword").value,
      new_password: document.getElementById("newPassword").value,
      confirm_password: document.getElementById("confirmPassword").value,
    }

    // Basic validation
    if (formData.new_password !== formData.confirm_password) {
      showNotification("New passwords do not match", "error")
      submitBtn.innerHTML = originalText
      submitBtn.disabled = false
      return
    }

    if (formData.new_password.length < 8) {
      showNotification("New password must be at least 8 characters long", "error")
      submitBtn.innerHTML = originalText
      submitBtn.disabled = false
      return
    }

    try {
      const response = await fetch("/employer/password/change/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        showNotification("Password changed successfully", "success")
        // Close modal on success
        setTimeout(() => {
          profileModal.style.display = "none"
          document.body.style.overflow = ""
        }, 1500) // Wait 1.5 seconds to show success message
        // Clear password fields
        document.getElementById("currentPassword").value = ""
        document.getElementById("newPassword").value = ""
        document.getElementById("confirmPassword").value = ""
      } else {
        showNotification(data.error || "Error changing password", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("An error occurred while changing password", "error")
    } finally {
      // Restore button state
      submitBtn.innerHTML = originalText
      submitBtn.disabled = false
    }
  })

  // Event Listeners
  profileSettingsLink?.addEventListener("click", (e) => {
    e.preventDefault()
    // Ensure modal is on top of everything
    profileModal.style.zIndex = "10002"
    profileModal.style.position = "fixed"
    profileModal.style.top = "0"
    profileModal.style.left = "0"
    profileModal.style.right = "0"
    profileModal.style.bottom = "0"
    profileModal.style.width = "100%"
    profileModal.style.height = "100%"
    profileModal.style.display = "flex"
    profileModal.style.alignItems = "center"
    profileModal.style.justifyContent = "center"
    profileModal.style.padding = "20px"
    document.body.style.overflow = "hidden"
    loadProfileData()
  })

  closeProfileModal?.addEventListener("click", () => {
    profileModal.style.display = "none"
    document.body.style.overflow = ""
  })

  // Tab switching
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      button.classList.add("active")
      const tabContent = document.getElementById(`${button.dataset.tab}Tab`)
      tabContent.classList.add("active")

      // Reinitialize map when company tab is activated
      if (button.dataset.tab === "company") {
        setTimeout(() => {
          if (companyLocationMap) {
            companyLocationMap.invalidateSize()
          }
        }, 100)
      }
    })
  })

  // Company location search
  const companyLocationSearchBtn = document.getElementById("companyLocationSearchBtn")
  const companyLocationInput = document.getElementById("companyLocation")

  companyLocationSearchBtn?.addEventListener("click", () => {
    const query = companyLocationInput.value.trim()
    if (query) {
      searchLocation(query)
    }
  })

  // Allow searching by pressing Enter in the location input
  companyLocationInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const query = companyLocationInput.value.trim()
      if (query) {
        searchLocation(query)
      }
    }
  })
}

// Helper function to show notifications
function showNotification(message, type) {
  const toastContainer = document.getElementById("toastContainer")
  if (!toastContainer) return

  const toast = document.createElement("div")
  toast.className = `toast show ${type}`
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

  // Initialize Bootstrap toast
  const bsToast = new bootstrap.Toast(toast)
  bsToast.show()

  // Remove toast after it's hidden
  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove()
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

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeProfileSettings)

