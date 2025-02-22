document.addEventListener("DOMContentLoaded", () => {
    // Toast notification function
    function showToast(message, type = "info") {
      const toast = document.createElement("div")
      toast.className = `toast toast-${type}`
      toast.innerHTML = `
              <div class="toast-content">
                  <span class="toast-icon">
                      ${
                        type === "success"
                          ? '<i class="fas fa-check-circle"></i>'
                          : '<i class="fas fa-exclamation-circle"></i>'
                      }
                  </span>
                  <span class="toast-message">${message}</span>
              </div>
              <button class="toast-close">
                  <i class="fas fa-times"></i>
              </button>
          `
  
      document.body.appendChild(toast)
  
      // Auto remove after 3 seconds
      setTimeout(() => {
        toast.classList.add("toast-closing")
        setTimeout(() => toast.remove(), 300)
      }, 3000)
  
      // Close button handler
      toast.querySelector(".toast-close").addEventListener("click", () => {
        toast.classList.add("toast-closing")
        setTimeout(() => toast.remove(), 300)
      })
    }
  
    // Tab switching
    const tabs = document.querySelectorAll(".tab-btn")
    const tabContents = document.querySelectorAll(".tab-content")
  
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"))
        tabContents.forEach((c) => c.classList.remove("active"))
  
        tab.classList.add("active")
        document.getElementById(`${tab.dataset.tab}-content`).classList.add("active")
      })
    })
  
    // Search functionality
    document.querySelectorAll(".search-box input").forEach((input) => {
      input.addEventListener("input", function () {
        const searchTerm = this.value.toLowerCase()
        const tableBody = this.closest(".table-container").querySelector("tbody")
        const rows = tableBody.querySelectorAll("tr")
  
        rows.forEach((row) => {
          const text = row.textContent.toLowerCase()
          row.style.display = text.includes(searchTerm) ? "" : "none"
        })
      })
    })
  
    // Get CSRF token
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
  
    // View user details
    window.viewUser = async (type, id) => {
      try {
        const response = await fetch(`/admin-panel/${type}/${id}/`)
        if (!response.ok) throw new Error("Failed to fetch user details")
  
        const data = await response.json()
        const modalBody = document.querySelector("#userModal .modal-body")
  
        let detailsHtml = `<div class="user-details">`
  
        if (type === "employer") {
          detailsHtml += `
                      <div class="detail-group">
                          <label>Company Name</label>
                          <p>${data.company_name || "N/A"}</p>
                      </div>
                      <div class="detail-group">
                          <label>Registration Type</label>
                          <p>${data.registration_type || "N/A"}</p>
                      </div>
                      <div class="detail-group">
                          <label>Registration Number</label>
                          <p>${data.registration_number || "N/A"}</p>
                      </div>
                      <div class="detail-group">
                          <label>Industry</label>
                          <p>${data.industry || "N/A"}</p>
                      </div>
                  `
        }
  
        detailsHtml += `
                  <div class="detail-group">
                      <label>Username</label>
                      <p>${data.username}</p>
                  </div>
                  <div class="detail-group">
                      <label>Email</label>
                      <p>${data.email}</p>
                  </div>
                  <div class="detail-group">
                      <label>Status</label>
                      <p>${data.is_active ? "Active" : "Inactive"}</p>
                  </div>
                  <div class="detail-group">
                      <label>Joined Date</label>
                      <p>${data.date_joined}</p>
                  </div>
              </div>`
  
        modalBody.innerHTML = detailsHtml
        document.getElementById("userModal").classList.add("active")
      } catch (error) {
        console.error("Error:", error)
        showToast("Error fetching user details", "error")
      }
    }
  
    // Toggle user status
    window.toggleStatus = async (type, id) => {
      try {
        const response = await fetch(`/admin-panel/${type}/${id}/toggle-status/`, {
          method: "POST",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
          },
        })
  
        if (!response.ok) throw new Error("Failed to toggle status")
  
        const data = await response.json()
        showToast(data.message, "success")
        setTimeout(() => location.reload(), 1000)
      } catch (error) {
        console.error("Error:", error)
        showToast("Error toggling status", "error")
      }
    }
  
    // Toggle employer verification
    window.toggleVerification = async (id) => {
      try {
        const response = await fetch(`/admin-panel/employer/${id}/toggle-verification/`, {
          method: "POST",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
          },
        })
  
        if (!response.ok) throw new Error("Failed to toggle verification")
  
        const data = await response.json()
        showToast(data.message, "success")
        setTimeout(() => location.reload(), 1000)
      } catch (error) {
        console.error("Error:", error)
        showToast("Error toggling verification", "error")
      }
    }
  
    // Delete user
    window.deleteUser = async (type, id) => {
      if (!confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
        return
      }
  
      try {
        const response = await fetch(`/admin-panel/${type}/${id}/delete/`, {
          method: "DELETE",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
          },
        })
  
        if (!response.ok) throw new Error("Failed to delete user")
  
        const data = await response.json()
        showToast(data.message, "success")
        setTimeout(() => location.reload(), 1000)
      } catch (error) {
        console.error("Error:", error)
        showToast("Error deleting user", "error")
      }
    }
  
    // Close modals
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("active")
        }
      })
    })
  
    document.querySelectorAll(".close-modal").forEach((button) => {
      button.addEventListener("click", () => {
        button.closest(".modal").classList.remove("active")
      })
    })
  })
  
  