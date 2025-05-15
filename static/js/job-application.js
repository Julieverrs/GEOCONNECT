// Job application script
document.addEventListener("DOMContentLoaded", () => {
  console.log("Job application script loaded")

  // Get all apply buttons
  const applyButtons = document.querySelectorAll(".apply-btn")
  console.log("Found apply buttons:", applyButtons.length)

  // Add click event to all apply buttons
  applyButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault()
      console.log("Apply button clicked")

      // Get job details from data attributes
      const jobId = button.getAttribute("data-job-id")
      const jobTitle = button.getAttribute("data-job-title")
      const company = button.getAttribute("data-company")
      const location = button.getAttribute("data-location") || ""
      const jobType = button.getAttribute("data-job-type") || ""
      const workSetup = button.getAttribute("data-work-setup") || ""
      const salary = button.getAttribute("data-salary") || ""
      const experience = button.getAttribute("data-experience") || ""
      const description = button.getAttribute("data-description") || ""
      const requirements = button.getAttribute("data-requirements") || ""
      const posted = button.getAttribute("data-posted") || ""

      console.log("Job details:", jobId, jobTitle, company)

      // Set values in the modal for application form
      document.getElementById("jobId").value = jobId
      document.getElementById("jobTitleSpan").textContent = jobTitle
      document.getElementById("jobCompanySpan").textContent = company
      document.getElementById("jobTitleDetail").textContent = jobTitle

      // Set values for job details section
      if (document.getElementById("viewJobCompanyInitial")) {
        document.getElementById("viewJobCompanyInitial").textContent = company.charAt(0)
      }
      if (document.getElementById("viewJobTitle")) {
        document.getElementById("viewJobTitle").textContent = jobTitle
      }
      if (document.getElementById("viewJobCompany")) {
        document.getElementById("viewJobCompany").textContent = company
      }
      if (document.getElementById("viewJobLocation")) {
        document.getElementById("viewJobLocation").textContent = location
      }
      if (document.getElementById("viewJobType")) {
        document.getElementById("viewJobType").textContent = jobType
      }
      if (document.getElementById("viewJobWorkSetup")) {
        document.getElementById("viewJobWorkSetup").textContent = workSetup
      }
      if (document.getElementById("viewJobSalary")) {
        document.getElementById("viewJobSalary").textContent = salary
      }
      if (document.getElementById("viewJobExperience")) {
        document.getElementById("viewJobExperience").textContent = experience
      }
      if (document.getElementById("viewJobPosted")) {
        document.getElementById("viewJobPosted").textContent = posted ? "Posted " + posted : ""
      }
      if (document.getElementById("viewJobDescription")) {
        document.getElementById("viewJobDescription").innerHTML = description
      }
      if (document.getElementById("viewJobRequirements")) {
        document.getElementById("viewJobRequirements").innerHTML = requirements || "No specific requirements provided."
      }

      // Open the modal using Bootstrap's jQuery method
      // Ensure jQuery is loaded before this script
      const applyJobModal = new bootstrap.Modal(document.getElementById("applyJobModal"))
      applyJobModal.show()
    })
  })

  // Handle form submission
  const submitButton = document.getElementById("submitApplication")
  const applicationForm = document.getElementById("jobApplicationForm")

  if (submitButton && applicationForm) {
    submitButton.addEventListener("click", (e) => {
      e.preventDefault()

      // Validate form
      if (!applicationForm.checkValidity()) {
        applicationForm.reportValidity()
        return
      }

      // Check terms checkbox
      const termsCheck = document.getElementById("termsCheck")
      if (!termsCheck.checked) {
        showToast("Please accept the terms and conditions", "error")
        return
      }

      // Show loading state
      submitButton.disabled = true
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...'

      // Create form data
      const formData = new FormData(applicationForm)

      // Get CSRF token
      const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value

      // Send application using fetch API
      fetch("/employee/apply-job/", {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": csrfToken,
        },
      })
        .then((response) => {
          // Log the response status and headers for debugging
          console.log("Response status:", response.status)
          console.log("Response headers:", response.headers.get("content-type"))

          // Check if the response is a redirect to login page
          if (response.redirected) {
            console.error("Redirected to:", response.url)
            showToast("You need to be logged in to apply for jobs", "error")
            return Promise.reject("Authentication required")
          }

          // Check if response is JSON before parsing
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            return response.json()
          } else {
            // If not JSON, get the text and log it for debugging
            return response.text().then((text) => {
              console.error("Received non-JSON response:", text.substring(0, 150) + "...")
              return Promise.reject("Invalid response format")
            })
          }
        })
        .then((data) => {
          if (data.success) {
            // Show success message
            showToast(data.message || "Application submitted successfully!", "success")

            // Close the modal
            // Import Bootstrap
            //This line needs to be added to your HTML file within the <head> section, before the script tag:
            // <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
            const modalElement = document.getElementById("applyJobModal")
            const modal = bootstrap.Modal.getInstance(modalElement)
            if (modal) {
              modal.hide()
            }

            // Update UI to show application was submitted
            updateAppliedJobUI(formData.get("job_id"))
          } else {
            // Show error message
            showToast(data.error || "Application submission failed", "error")
          }
        })
        .catch((error) => {
          console.error("Error:", error)
          showToast("An error occurred while submitting your application. Please check if you are logged in.", "error")
        })
        .finally(() => {
          // Reset button state
          submitButton.disabled = false
          submitButton.innerHTML = "Submit Application"
        })
    })
  }

  // File size validation for resume upload
  const resumeUpload = document.getElementById("resumeUpload")
  if (resumeUpload) {
    resumeUpload.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file) {
        // Check file size (5MB max)
        const maxSize = 5 * 1024 * 1024 // 5MB in bytes
        if (file.size > maxSize) {
          alert("Resume file size must be less than 5MB")
          resumeUpload.value = "" // Clear the file input
          return
        }

        // Check file type
        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]
        if (!allowedTypes.includes(file.type)) {
          alert("Resume must be in PDF, DOC, or DOCX format")
          resumeUpload.value = "" // Clear the file input
          return
        }
      }
    })
  }

  // Function to show toast notifications
  function showToast(message, type) {
    // Check if we have a toast container, if not create one
    let toastContainer = document.querySelector(".toast-container")
    if (!toastContainer) {
      toastContainer = document.createElement("div")
      toastContainer.className = "toast-container position-fixed bottom-0 end-0 p-3"
      document.body.appendChild(toastContainer)
    }

    // Create toast element
    const toastEl = document.createElement("div")
    toastEl.className = `toast align-items-center text-white bg-${type === "success" ? "success" : "danger"} border-0`
    toastEl.setAttribute("role", "alert")
    toastEl.setAttribute("aria-live", "assertive")
    toastEl.setAttribute("aria-atomic", "true")

    // Create toast content
    toastEl.innerHTML = `
      <div class="d-flex">
          <div class="toast-body">
              ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `

    // Add toast to container
    toastContainer.appendChild(toastEl)

    // Initialize and show the toast
    const toast = new bootstrap.Toast(toastEl, {
      autohide: true,
      delay: 5000,
    })
    toast.show()

    // Remove toast after it's hidden
    toastEl.addEventListener("hidden.bs.toast", () => {
      toastEl.remove()
    })
  }

  // Function to update UI after successful application
  function updateAppliedJobUI(jobId) {
    // Find the apply button for this job
    const applyButtons = document.querySelectorAll(`.apply-now-btn[data-job-id="${jobId}"]`)

    applyButtons.forEach((button) => {
      // Disable the button
      button.disabled = true
      button.classList.remove("btn-primary")
      button.classList.add("btn-success")
      button.innerHTML = '<i class="fas fa-check me-1"></i> Applied'
      button.setAttribute("data-applied", "true")
    })

    // Also update the apply button in the view modal if it exists
    const applyFromViewBtn = document.querySelector(".apply-from-view-btn")
    if (applyFromViewBtn) {
      applyFromViewBtn.disabled = true
      applyFromViewBtn.classList.remove("btn-primary")
      applyFromViewBtn.classList.add("btn-success")
      applyFromViewBtn.innerHTML = '<i class="fas fa-check me-1"></i> Applied'
    }
  }

  // Handle apply from view button
  const applyFromViewBtn = document.querySelector(".apply-from-view-btn")
  if (applyFromViewBtn) {
    applyFromViewBtn.addEventListener("click", () => {
      // This functionality is no longer needed as we're using a single modal
      // but keeping it for compatibility
      console.log("Apply from view button clicked - functionality merged")
    })
  }

  // Function to prepare job application
  function prepareJobApplication(jobId, jobTitle, company) {
    console.log("Preparing job application for:", jobTitle)
    // Set the values in the modal
    document.getElementById("jobId").value = jobId
    document.getElementById("jobTitleSpan").textContent = jobTitle
    document.getElementById("jobCompanySpan").textContent = company
    document.getElementById("jobTitleDetail").textContent = jobTitle
  }
})
