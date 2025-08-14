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
  // Filter functionality
  const jobFilter = document.getElementById("jobFilter")
  const statusFilter = document.getElementById("statusFilter")
  const resetFiltersBtn = document.getElementById("resetFilters")
  const applicationCards = document.querySelectorAll(".application-card")
  const emptyState = document.getElementById("emptyState")

  // Function to filter applications
  function filterApplications() {
    const selectedJobId = jobFilter.value
    const selectedStatus = statusFilter.value
    let visibleCount = 0

    applicationCards.forEach((card) => {
      const jobId = card.getAttribute("data-job-id")
      const status = card.getAttribute("data-status")

      const jobMatch = selectedJobId === "all" || jobId === selectedJobId
      const statusMatch = selectedStatus === "all" || status === selectedStatus

      if (jobMatch && statusMatch) {
        card.style.display = "flex"
        visibleCount++
      } else {
        card.style.display = "none"
      }
    })

    // Show empty state if no applications match the filters
    // Only try to access emptyState if it exists
    if (emptyState) {
      if (visibleCount === 0 && applicationCards.length > 0) {
        emptyState.style.display = "block"
      } else {
        emptyState.style.display = "none"
      }
    }
  }

  // Add event listeners to filters
  if (jobFilter) {
    jobFilter.addEventListener("change", filterApplications)
  }
  if (statusFilter) {
    statusFilter.addEventListener("change", filterApplications)
  }

  // Reset filters button
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      jobFilter.value = "all"
      statusFilter.value = "all"
      filterApplications()
    })
  }

  // Application detail modal functionality
  window.viewApplication = (applicationId) => {
    const applicationDetailModal = document.getElementById("applicationDetailModal")

    // Show loading state
    if (applicationDetailModal) {
      applicationDetailModal.style.display = "block"
      document.body.style.overflow = "hidden" // Prevent scrolling
    }

    const jobTitleElement = document.getElementById("jobTitle")
    if (jobTitleElement) {
      const loadingHTML =
        '<div class="text-center"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Loading application details...</p></div>'
      jobTitleElement.innerHTML = loadingHTML
    }

    // Fetch application details from the server
    fetch(`/employer/application/${applicationId}/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        console.log("Application data:", data) // Debug log

        if (data.application) {
          const app = data.application

          // Job Information
          const jobTitleEl = document.getElementById("jobTitle")
          if (jobTitleEl) jobTitleEl.textContent = app.job_title || "Not specified"

          const jobLocationEl = document.getElementById("jobLocation")
          if (jobLocationEl) jobLocationEl.textContent = app.job_location || "Not specified"

          // Applicant Information
          const applicantNameEl = document.getElementById("applicantName")
          if (applicantNameEl) applicantNameEl.textContent = app.employee_name || "Not specified"

          const applicantEmailEl = document.getElementById("applicantEmail")
          if (applicantEmailEl) applicantEmailEl.textContent = app.employee_email || "Not provided"

          // Application Details
          const applicationStatusEl = document.getElementById("applicationStatus")
          if (applicationStatusEl) applicationStatusEl.textContent = getStatusDisplayName(app.status)

          const applicationDateEl = document.getElementById("applicationDate")
          if (applicationDateEl) applicationDateEl.textContent = app.application_date || "Not available"

          // Interview Details (if applicable)
          const interviewSection = document.getElementById("interviewSection")
          if (interviewSection) {
            if (app.interview_date) {
              interviewSection.style.display = "flex"
              const interviewDetailsEl = document.getElementById("interviewDetails")
              if (interviewDetailsEl) interviewDetailsEl.textContent = app.interview_date
            } else {
              interviewSection.style.display = "none"
            }
          }

          // Cover Letter
          const coverLetterEl = document.getElementById("coverLetter")
          if (coverLetterEl) {
            coverLetterEl.innerHTML = app.cover_letter
              ? app.cover_letter.replace(/\n/g, "<br>")
              : "<em>No cover letter provided</em>"
          }

          // Resume
          const resumeSection = document.getElementById("resumeSection")
          if (resumeSection) {
            if (app.resume_url) {
              resumeSection.style.display = "block"
              const resumeLinkEl = document.getElementById("resumeLink")
              if (resumeLinkEl) resumeLinkEl.href = app.resume_url
            } else {
              resumeSection.style.display = "none"
            }
          }

          // Employer Notes
          const employerNotesEl = document.getElementById("employerNotes")
          if (employerNotesEl) employerNotesEl.value = app.employer_notes || ""

          // Update status button
          const updateStatusBtn = document.querySelector(".update-status-from-detail")
          if (updateStatusBtn) {
            updateStatusBtn.setAttribute("data-id", applicationId)
          }
        } else {
          throw new Error("Application data not found")
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        const jobTitleEl = document.getElementById("jobTitle")
        if (jobTitleEl) {
          jobTitleEl.innerHTML = `
            <div class="text-center text-danger">
              <i class="fas fa-exclamation-circle fa-2x"></i>
              <p>Error loading application details: ${error.message}</p>
            </div>
          `
        }
        toastNotification("Error loading application details", "error")
      })
  }

  // Fallback for direct DOM click events
  const viewDetailsBtns = document.querySelectorAll(".view-details")
  viewDetailsBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const applicationId = this.getAttribute("data-id")
      window.viewApplication(applicationId)
    })
  })

  // Status update modal functionality
  window.openStatusUpdate = (applicationId) => {
    const statusUpdateModal = document.getElementById("statusUpdateModal")
    const applicationIdInput = document.getElementById("applicationId")

    if (statusUpdateModal && applicationIdInput) {
      applicationIdInput.value = applicationId

      // Reset form
      const statusUpdateForm = document.getElementById("statusUpdateForm")
      if (statusUpdateForm) statusUpdateForm.reset()

      // Show modal
      statusUpdateModal.style.display = "block"
      document.body.style.overflow = "hidden" // Prevent scrolling

      // Check if interview fields should be shown
      toggleInterviewFields()
    }
  }

  // Fallback for direct DOM click events
  const updateStatusBtns = document.querySelectorAll(".update-status, .update-status-from-detail")
  updateStatusBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const applicationId = this.getAttribute("data-id")
      window.openStatusUpdate(applicationId)
    })
  })

  // Toggle interview fields based on status
  const statusSelect = document.getElementById("statusSelect")
  const interviewFields = document.getElementById("interviewFields")

  function toggleInterviewFields() {
    // Since we're only using Accept/Decline, we don't need interview fields
    if (interviewFields) {
      interviewFields.style.display = "none"
    }
  }

  if (statusSelect) {
    statusSelect.addEventListener("change", toggleInterviewFields)
  }

  // Handle form submission
  const statusUpdateForm = document.getElementById("statusUpdateForm")
  if (statusUpdateForm) {
    statusUpdateForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // Show loading spinner
      const saveBtn = document.getElementById("saveStatusBtn")
      const spinner = document.getElementById("saveStatusSpinner")
      if (saveBtn) saveBtn.disabled = true
      if (spinner) spinner.style.display = "inline-block"

      // Get form data
      const formData = new FormData(statusUpdateForm)
      const applicationId = formData.get("application_id")
      const newStatus = formData.get("status")

      // Debug log
      console.log("Updating application:", applicationId, "to status:", newStatus)
      console.log("Form data:", Object.fromEntries(formData))

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

      // Prepare data for submission
      const data = {
        status: newStatus,
        notes: formData.get("notes") || "",
      }

      if (newStatus === "scheduled_interview") {
        const interviewDate = formData.get("interview_date")
        const interviewTime = formData.get("interview_time")

        if (interviewDate && interviewTime) {
          // Format as ISO string for the backend
          data.interview_date = `${interviewDate}T${interviewTime}`
        }

        data.interview_location = formData.get("interview_location") || ""
      }

      console.log("Sending data:", data)

      // Send data to server
      fetch(`/employer/application/${applicationId}/update-status/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((errorData) => {
              throw new Error(errorData.error || `Server error: ${response.status}`)
            })
          }
          return response.json()
        })
        .then((data) => {
          if (data.success) {
            // Update the UI to reflect the new status
            const card = document.querySelector(`.application-card[data-id="${applicationId}"]`)
            if (card) {
              card.setAttribute("data-status", newStatus)
              const statusBadge = card.querySelector(".status-badge")
              if (statusBadge) {
                statusBadge.className = "status-badge status-" + newStatus
                statusBadge.textContent = getStatusDisplayName(newStatus)
              }
            }

            // Hide modal and reset form
            const statusUpdateModal = document.getElementById("statusUpdateModal")
            if (statusUpdateModal) {
              statusUpdateModal.style.display = "none"
              document.body.style.overflow = "auto" // Enable scrolling
            }
            statusUpdateForm.reset()

            toastNotification("Status updated successfully", "success")

            // Reload the page to reflect changes
            setTimeout(() => {
              window.location.reload()
            }, 1500)
          } else {
            toastNotification(data.error || "Error updating status", "error")
          }
        })
        .catch((error) => {
          console.error("Error:", error)
          toastNotification(`Error updating application status: ${error.message}`, "error")
        })
        .finally(() => {
          // Hide loading spinner
          if (saveBtn) saveBtn.disabled = false
          if (spinner) spinner.style.display = "none"

          // Reapply filters
          filterApplications()
        })
    })
  }

  // Helper function to get status display name
  function getStatusDisplayName(status) {
    const statusMap = {
      hired: "Accept",
      rejected: "Decline",
      // Keep these for backward compatibility with existing data
      pending: "Pending",
      under_review: "Under Review",
      shortlisted: "Shortlisted",
      scheduled_interview: "Interview Scheduled",
      interviewed: "Interviewed",
      offered: "Offered",
      declined: "Declined",
    }
    return statusMap[status] || status
  }

  // Close modal handlers
  document.querySelectorAll(".close-modal, .close-modal-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const modal = this.closest(".modal")
      if (modal) {
        modal.style.display = "none"
        document.body.style.overflow = "auto" // Enable scrolling
      }
    })
  })

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none"
      document.body.style.overflow = "auto" // Enable scrolling
    }
  })

  // Update status badge colors for the simplified statuses
  document.querySelectorAll(".status-badge").forEach((badge) => {
    const status = badge.closest(".application-card").getAttribute("data-status")
    if (status === "hired") {
      badge.textContent = "Accept"
      badge.className = "status-badge status-hired"
    } else if (status === "rejected") {
      badge.textContent = "Decline"
      badge.className = "status-badge status-rejected"
    }
  })
})
