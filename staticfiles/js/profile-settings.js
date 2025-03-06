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
      } else {
        showNotification(data.error || "Error updating profile", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("An error occurred while updating profile", "error")
    }
  })

  // Event Listeners
  profileSettingsLink?.addEventListener("click", (e) => {
    e.preventDefault()
    profileModal.classList.add("active")
    document.body.style.overflow = "hidden"
    loadProfileData()
  })

  closeProfileModal?.addEventListener("click", () => {
    profileModal.classList.remove("active")
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

