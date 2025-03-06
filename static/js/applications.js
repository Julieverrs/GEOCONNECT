// Simple toast notification function (replace with your preferred method)
function toastNotification(message, type) {
    const toast = document.createElement("div")
    toast.textContent = message
    toast.className = `toast ${type}`
    document.body.appendChild(toast)
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 3000)
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    // Filter handling
    const jobFilter = document.getElementById("jobFilter")
    const statusFilter = document.getElementById("statusFilter")
  
    if (jobFilter) {
      jobFilter.addEventListener("change", updateFilters)
    }
    if (statusFilter) {
      statusFilter.addEventListener("change", updateFilters)
    }
  
    function updateFilters() {
      const jobId = jobFilter.value
      const status = statusFilter.value
  
      // Build URL with filter parameters
      const url = new URL(window.location.href)
      if (jobId) url.searchParams.set("job", jobId)
      else url.searchParams.delete("job")
  
      if (status) url.searchParams.set("status", status)
      else url.searchParams.delete("status")
  
      // Redirect with new filters
      window.location.href = url.toString()
    }
  
    // Application detail modal
    window.viewApplication = (applicationId) => {
      fetch(`/employer/application/${applicationId}/`)
        .then((response) => response.json())
        .then((data) => {
          if (data.application) {
            const app = data.application
            document.getElementById("jobTitle").textContent = app.job_title
            document.getElementById("applicationDate").textContent = `Applied: ${app.application_date}`
            document.getElementById("currentStatus").textContent = `Status: ${app.status}`
            document.getElementById("applicantName").textContent = app.employee_name
  
            const resumeSection = document.getElementById("resumeSection")
            if (app.resume_url) {
              resumeSection.style.display = "block"
              document.getElementById("resumeLink").href = app.resume_url
            } else {
              resumeSection.style.display = "none"
            }
  
            document.getElementById("coverLetter").textContent = app.cover_letter
            document.getElementById("employerNotes").value = app.employer_notes
  
            if (app.interview_date) {
              document.getElementById("interviewDate").textContent = `Interview scheduled for: ${app.interview_date}`
            }
  
            // Show the modal
            const modal = document.getElementById("applicationDetailModal")
            modal.style.display = "block"
          }
        })
        .catch((error) => {
          console.error("Error:", error)
          toastNotification("Error loading application details", "error")
        })
    }
  
    // Status update modal
    window.openStatusUpdate = (applicationId) => {
      const modal = document.getElementById("statusUpdateModal")
      modal.dataset.applicationId = applicationId
      modal.style.display = "block"
  
      // Show/hide interview date field based on selected status
      const statusSelect = document.getElementById("newStatus")
      const interviewDateGroup = document.getElementById("interviewDateGroup")
  
      statusSelect.addEventListener("change", function () {
        interviewDateGroup.style.display = this.value === "scheduled_interview" ? "block" : "none"
      })
    }
  
    // Handle status update submission
    const statusUpdateForm = document.getElementById("statusUpdateForm")
    if (statusUpdateForm) {
      statusUpdateForm.addEventListener("submit", (e) => {
        e.preventDefault()
        const modal = document.getElementById("statusUpdateModal")
        const applicationId = modal.dataset.applicationId
  
        const data = {
          status: document.getElementById("newStatus").value,
          notes: document.getElementById("statusNotes").value,
        }
  
        if (data.status === "scheduled_interview") {
          data.interview_date = document.getElementById("interviewDateTime").value
        }
  
        fetch(`/employer/application/${applicationId}/update-status/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              toastNotification(data.message, "success")
              modal.style.display = "none"
              // Reload the page to show updated status
              window.location.reload()
            } else {
              toastNotification(data.error, "error")
            }
          })
          .catch((error) => {
            console.error("Error:", error)
            toastNotification("Error updating application status", "error")
          })
      })
    }
  
    // Close modal handlers
    document.querySelectorAll(".close-modal, .close-modal-btn").forEach((button) => {
      button.addEventListener("click", function () {
        this.closest(".modal").style.display = "none"
      })
    })
  
    // CSRF token helper
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
  })
  
  