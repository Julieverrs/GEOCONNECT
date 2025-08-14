
  // Assuming showNotification is defined elsewhere and accessible.  If not, define it here:
  //function showNotification(message, type) {
  //Implementation for showing notifications.  Could use an alert, a custom element, etc.
  //  alert(message) //Replace with proper notification implementation.
  //}

  // Profile Settings Handling
  const profileModal = document.getElementById("profileModal")
  const profileSettingsLink = document.querySelector('.dropdown-item[href="#"]') // Update the selector based on your menu item
  const tabButtons = document.querySelectorAll(".tab-button")
  const tabContents = document.querySelectorAll(".tab-content")
  const companyProfileForm = document.getElementById("companyProfileForm")
  const accountSettingsForm = document.getElementById("accountSettingsForm")
  const changePasswordForm = document.getElementById("changePasswordForm")

  // Load profile data when opening settings
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

        // Fill account settings
        document.getElementById("username").value = data.profile.username
        document.getElementById("email").value = data.profile.email
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      showNotification("Error loading profile data", "error")
    }
  }

  // Profile Settings Modal
  profileSettingsLink.addEventListener("click", (e) => {
    e.preventDefault()
    profileModal.classList.add("active")
    document.body.style.overflow = "hidden"
    loadProfileData()
  })

  // Tab Switching
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      button.classList.add("active")
      document.getElementById(`${button.dataset.tab}Tab`).classList.add("active")
    })
  })

  // Company Profile Form
  companyProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = {
      company_name: document.getElementById("companyName").value,
      company_description: document.getElementById("companyDescription").value,
      company_website: document.getElementById("companyWebsite").value,
      company_location: document.getElementById("companyLocation").value,
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
        // Close the modal
        profileModal.classList.remove("active")
        document.body.style.overflow = ""
        // Show success notification
        showToast("Company profile updated successfully", "success")
      } else {
        showToast(data.error || "Error updating profile", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred while updating profile", "error")
    }
  })

  // Account Settings Form
  accountSettingsForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = {
      email: document.getElementById("email").value,
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
        // Close the modal
        profileModal.classList.remove("active")
        document.body.style.overflow = ""
        // Show success notification
        showToast("Account settings updated successfully", "success")
      } else {
        showToast(data.error || "Error updating account", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred while updating account", "error")
    }
  })

  // Change Password Form
  changePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const newPassword = document.getElementById("newPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error")
      return
    }

    const formData = {
      current_password: document.getElementById("currentPassword").value,
      new_password: newPassword,
    }

    try {
      const response = await fetch("/employer/profile/change-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Close the modal
        profileModal.classList.remove("active")
        document.body.style.overflow = ""
        // Show success notification
        showToast("Password changed successfully", "success")
        changePasswordForm.reset()
      } else {
        showToast(data.error || "Error changing password", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred while changing password", "error")
    }
  })
