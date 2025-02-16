// Profile Settings Functionality
function initializeProfileSettings() {
  const profileModal = document.getElementById("profileModal")
  const profileSettingsLink = document.querySelector('.dropdown-item[href="#"]')
  const closeProfileModal = document.getElementById("closeProfileModal")
  const tabButtons = document.querySelectorAll(".tab-button")
  const tabContents = document.querySelectorAll(".tab-content")
  let companyLocationMap, companyLocationMarker

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

        // Fill account settings
        document.getElementById("username").value = data.profile.username
        document.getElementById("email").value = data.profile.email

        // Initialize map with company location
        initializeCompanyLocationMap(data.profile.latitude, data.profile.longitude, data.profile.company_location)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      showNotification("Error loading profile data", "error")
    }
  }

  function initializeCompanyLocationMap(latitude, longitude, initialLocation) {
    if (companyLocationMap) {
      companyLocationMap.remove()
    }

    const defaultLocation = [0, 0]
    const zoom = latitude && longitude ? 13 : 2
    const center = latitude && longitude ? [latitude, longitude] : defaultLocation

    companyLocationMap = L.map("companyLocationMap").setView(center, zoom)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
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
  }

  function searchLocation(query) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          const { lat, lon } = data[0]
          const latlng = L.latLng(lat, lon)
          companyLocationMarker.setLatLng(latlng)
          companyLocationMap.setView(latlng, 13)
          updateLocationInput(latlng)
        }
      })
      .catch((error) => console.error("Error:", error))
  }

  function updateLocationInput(latlng) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.display_name) {
          document.getElementById("companyLocation").value = data.display_name
          document.getElementById("companyLatitude").value = latlng.lat
          document.getElementById("companyLongitude").value = latlng.lng
        }
      })
      .catch((error) => console.error("Error:", error))
  }

  // Handle form submissions
  const companyProfileForm = document.getElementById("companyProfileForm")
  const accountSettingsForm = document.getElementById("accountSettingsForm")
  const changePasswordForm = document.getElementById("changePasswordForm")

  companyProfileForm.addEventListener("submit", async (e) => {
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
  profileSettingsLink.addEventListener("click", (e) => {
    e.preventDefault()
    profileModal.classList.add("active")
    document.body.style.overflow = "hidden"
    loadProfileData()
  })

  closeProfileModal.addEventListener("click", () => {
    profileModal.classList.remove("active")
    document.body.style.overflow = ""
  })

  // Tab switching
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      button.classList.add("active")
      document.getElementById(`${button.dataset.tab}Tab`).classList.add("active")

      if (button.dataset.tab === "company") {
        setTimeout(() => {
          companyLocationMap.invalidateSize()
        }, 0)
      }
    })
  })

  // Company location search
  const companyLocationSearchBtn = document.getElementById("companyLocationSearchBtn")
  companyLocationSearchBtn.addEventListener("click", () => {
    const locationInput = document.getElementById("companyLocation")
    searchLocation(locationInput.value)
  })
}

// Helper function to show notifications
function showNotification(message, type) {
  // Implementation to display notification. Replace with your actual notification logic.
  console.log(`Notification: ${message} (${type})`)
  // Example using an alert (replace with a better notification system in a real application)
  alert(message)
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
document.addEventListener("DOMContentLoaded", initializeProfileSettings)

