// Utility function to get CSRF token
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

// Toast notification function
function showToast(message, type = "info") {
  const toast = document.createElement("div")
  toast.className = `toast toast-${type}`
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">
        ${type === "success" ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>'}
      </span>
      <span class="toast-message">${message}</span>
    </div>
    <button class="toast-close">
      <i class="fas fa-times"></i>
    </button>
  `

  const toastContainer = document.getElementById("toastContainer")
  toastContainer.appendChild(toast)

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

// View User Details Function
window.viewUser = async (type, id) => {
  try {
    const response = await fetch(`/admin-panel/${type}/${id}/details/`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    const modalBody = document.querySelector("#userModal .modal-body")
    const modalTitle = document.querySelector("#userModal .modal-header h3")

    let detailsHtml = `<div class="user-details">`

    if (type === "employer") {
      modalTitle.textContent = "Employer Details"
      detailsHtml += `
        <div class="detail-group">
          <label>Company Name</label>
          <p>${data.company_name || "N/A"}</p>
        </div>
        <div class="detail-group">
          <label>Email</label>
          <p>${data.email || "N/A"}</p>
        </div>
        <div class="detail-group">
          <label>Company Description</label>
          <p>${data.company_description || "N/A"}</p>
        </div>
        <div class="detail-group">
          <label>Company Website</label>
          <p>${data.company_website || "N/A"}</p>
        </div>
        <div class="detail-group">
          <label>Company Location</label>
          <p>${data.company_location || "N/A"}</p>
        </div>
        <div class="detail-group">
          <label>Industry</label>
          <p>${data.industry || "N/A"}</p>
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
          <label>Registration Date</label>
          <p>${data.registration_date || "N/A"}</p>
        </div>
        <div class="detail-group">
          <label>Date Joined</label>
          <p>${data.date_joined || "N/A"}</p>
        </div>
        <div class="detail-group">
          <label>Status</label>
          <p>${data.is_active ? "Active" : "Inactive"}</p>
        </div>
        <div class="detail-group">
          <label>Verification Status</label>
          <p>${data.is_verified ? "Verified" : "Not Verified"}</p>
        </div>
      `

      // Add document links if they exist
      if (data.business_permit_url) {
        detailsHtml += `
          <div class="detail-group">
            <label>Business Permit</label>
            <p><a href="${data.business_permit_url}" target="_blank" class="document-link">View Document</a></p>
          </div>
        `
      }
      if (data.registration_document_url) {
        detailsHtml += `
          <div class="detail-group">
            <label>Registration Document</label>
            <p><a href="${data.registration_document_url}" target="_blank" class="document-link">View Document</a></p>
          </div>
        `
      }
    } else {
      modalTitle.textContent = "Employee Details"
      detailsHtml += `
        <div class="detail-group">
          <label>Name</label>
          <p>${data.first_name} ${data.last_name}</p>
        </div>
        <div class="detail-group">
          <label>Email</label>
          <p>${data.email || "N/A"}</p>
        </div>
        <div class="detail-group">
          <label>Phone</label>
          <p>${data.phone || "N/A"}</p>
        </div>
        <div class="detail-group">
          <label>Location</label>
          <p>${data.location || "N/A"}</p>
        </div>
        <div class="detail-group">
          <label>Job Title</label>
          <p>${data.job_title || "N/A"}</p>
        </div>
        <div class="detail-group">
          <label>Years of Experience</label>
          <p>${data.years_of_experience || "N/A"}</p>
        </div>
        <div class="detail-group">
          <label>Skills</label>
          <p>${data.skills || "N/A"}</p>
        </div>
        <div class="detail-group">
          <label>Education</label>
          <p>${data.education || "N/A"}</p>
        </div>
        <div class="detail-group">
          <label>Status</label>
          <p>${data.is_active ? "Active" : "Inactive"}</p>
        </div>
        <div class="detail-group">
          <label>Date Joined</label>
          <p>${data.date_joined || "N/A"}</p>
        </div>
      `

      if (data.document) {
        detailsHtml += `
          <div class="detail-group">
            <label>Resume/CV</label>
            <p><a href="${data.document}" target="_blank" class="document-link">View Document</a></p>
          </div>
        `
      }
    }

    detailsHtml += `</div>`
    modalBody.innerHTML = detailsHtml
    document.getElementById("userModal").classList.add("active")
  } catch (error) {
    console.error("Error:", error)
    showToast("Error fetching user details", "error")
  }
}

// Delete User Function
window.deleteUser = (type, id) => {
  userToDelete = { type, id }
  const deleteModal = document.getElementById("deleteConfirmModal")
  deleteModal.style.display = "block"
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

// Global variable for tracking user to delete
let userToDelete = null

document.addEventListener("DOMContentLoaded", () => {
  // Get modal elements
  const deleteModal = document.getElementById("deleteConfirmModal")
  const confirmDeleteBtn = document.getElementById("confirmDelete")
  const cancelDeleteBtn = document.getElementById("cancelDelete")
  const closeModalBtn = deleteModal.querySelector(".close-modal")

  // Confirm delete handler
  confirmDeleteBtn.addEventListener("click", async () => {
    if (!userToDelete) return

    try {
      const csrfToken = getCookie("csrftoken")
      // Updated URL to match the new Django URL pattern
      const response = await fetch(`/admin-panel/${userToDelete.type}/${userToDelete.id}/delete/`, {
        method: "POST",
        headers: {
          "X-CSRFToken": csrfToken,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Remove the row from the table
      const row = document.querySelector(`tr[data-${userToDelete.type}-id="${userToDelete.id}"]`)
      if (row) {
        row.remove()
      }

      // Update the total entries count
      const totalEntriesSpan = document.querySelector(`#${userToDelete.type}s-content .total-entries`)
      if (totalEntriesSpan) {
        const currentTotal = Number.parseInt(totalEntriesSpan.textContent.match(/\d+/)[0])
        totalEntriesSpan.textContent = `Total: ${currentTotal - 1} entries`
      }

      showToast(
        data.message ||
          `${userToDelete.type.charAt(0).toUpperCase() + userToDelete.type.slice(1)} deleted successfully`,
        "success",
      )
    } catch (error) {
      console.error("Error:", error)
      showToast(`Failed to delete ${userToDelete.type}`, "error")
    }

    // Close modal and reset
    deleteModal.style.display = "none"
    userToDelete = null
  })

  // Cancel delete handler
  cancelDeleteBtn.addEventListener("click", () => {
    deleteModal.style.display = "none"
    userToDelete = null
  })

  // Close modal handler
  closeModalBtn.addEventListener("click", () => {
    deleteModal.style.display = "none"
    userToDelete = null
  })

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === deleteModal) {
      deleteModal.style.display = "none"
      userToDelete = null
    }
  })

  // Initialize toast container if it doesn't exist
  if (!document.getElementById("toastContainer")) {
    const toastContainer = document.createElement("div")
    toastContainer.id = "toastContainer"
    toastContainer.className = "toast-container"
    document.body.appendChild(toastContainer)
  }

  // Tab switching functionality
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      // Add active class to clicked button and corresponding content
      button.classList.add("active")
      const contentId = `${button.getAttribute("data-tab")}-content`
      document.getElementById(contentId).classList.add("active")
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

  // Sort Functionality
  const sortButtons = document.querySelectorAll(".sort-btn")
  sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const column = button.getAttribute("data-sort")
      const type = button.closest(".tab-content").getAttribute("id").replace("-content", "")
      const table = document.querySelector(`#${type}s-table`)
      const tbody = table.querySelector("tbody")
      const rows = Array.from(tbody.querySelectorAll("tr"))

      // Toggle sort direction
      const isAscending = button.classList.toggle("asc")

      // Sort rows
      rows.sort((a, b) => {
        const aValue = a.querySelector(`td[data-${column}]`).textContent
        const bValue = b.querySelector(`td[data-${column}]`).textContent
        return isAscending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      })

      // Update table
      tbody.innerHTML = ""
      rows.forEach((row) => tbody.appendChild(row))
    })
  })

  // Close modal when clicking outside or on close button
  const modals = document.querySelectorAll(".modal")
  modals.forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active")
      }
    })

    const closeBtn = modal.querySelector(".close-modal")
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.classList.remove("active")
      })
    }
  })
})

let currentDeleteUser = null // Declare currentDeleteUser
const deleteModal2 = document.getElementById("deleteModal") // Declare deleteModal

// Handle delete confirmation
async function handleDeleteConfirmation() {
  if (!currentDeleteUser) return

  try {
    const response = await fetch(`/admin/${currentDeleteUser.type}/${currentDeleteUser.id}/delete/`, {
      method: "POST",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      // Remove the row from the table
      const row = document.querySelector(`tr[data-${currentDeleteUser.type}-id="${currentDeleteUser.id}"]`)
      if (row) {
        row.remove()
      }

      // Update the total entries count
      const totalEntriesSpan = document.querySelector(`#${currentDeleteUser.type}s-content .total-entries`)
      if (totalEntriesSpan) {
        const currentTotal = Number.parseInt(totalEntriesSpan.textContent.match(/\d+/)[0])
        totalEntriesSpan.textContent = `Total: ${currentTotal - 1} entries`
      }

      showToast(
        `${currentDeleteUser.type.charAt(0).toUpperCase() + currentDeleteUser.type.slice(1)} deleted successfully`,
      )
    } else {
      throw new Error("Failed to delete user")
    }
  } catch (error) {
    console.error("Error:", error)
    showToast("Failed to delete user", "error")
  }

  // Close modal and reset current user
  deleteModal2.style.display = "none"
  currentDeleteUser = null
}

