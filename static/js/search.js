// Search and Filter Functionality
function initializeSearch() {
  const searchInput = document.getElementById("searchInput")
  const statusFilter = document.getElementById("statusFilter")
  const sortBy = document.getElementById("sortBy")
  let searchTimeout

  // Function to perform search
  async function performSearch() {
    const searchQuery = searchInput.value
    const statusValue = statusFilter.value
    const sortValue = sortBy.value

    try {
      const response = await fetch(
        `/employer/search-jobs/?q=${encodeURIComponent(searchQuery)}&status=${statusValue}&sort=${sortValue}`,
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      if (data.jobs) {
        updateJobsGrid(data.jobs)
        updateJobsCount(data.total)
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("Error searching jobs. Please try again.", "error")
    }
  }

  // Update jobs grid with search results
  function updateJobsGrid(jobs) {
    const jobsGrid = document.querySelector(".jobs-grid")

    if (jobs.length === 0) {
      jobsGrid.innerHTML = `
                  <div class="no-jobs">
                      <p>No jobs found matching your criteria</p>
                  </div>
              `
      return
    }

    jobsGrid.innerHTML = jobs.map((job) => createJobCard(job)).join("")
  }

  // Update total jobs count
  function updateJobsCount(total) {
    const countElement = document.querySelector(".section-header h2")
    if (countElement) {
      countElement.textContent = `Your Job Postings (${total})`
    }
  }

  // Event listeners
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(performSearch, 300)
  })

  statusFilter.addEventListener("change", performSearch)
  sortBy.addEventListener("change", performSearch)

  // Initial search
  performSearch()

  // Helper function to create job card HTML
  function createJobCard(job) {
    // Define escapeHtml function inside the scope where it's used
    function escapeHtml(unsafe) {
      if (!unsafe) return ""
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
    }

    return `
    <div class="job-card" data-job-id="${job.id}">
        <div class="job-card-header">
            <h3>${escapeHtml(job.title)}</h3>
            <span class="status-badge ${job.status.toLowerCase()}">${escapeHtml(job.status)}</span>
        </div>
        <div class="job-card-content">
            <p>${escapeHtml(job.description)}</p>
            <div class="job-meta">
                ${
                  job.work_setup
                    ? `
                <div class="job-type">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${escapeHtml(job.work_setup)}
                </div>
                `
                    : ""
                }
                ${
                  job.job_type
                    ? `
                <div class="job-type">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${escapeHtml(job.job_type)}
                </div>
                `
                    : ""
                }
                ${
                  job.experience_level
                    ? `
                <div class="job-type">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 9L12 5L2 9L12 13L22 9V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6 11.5V16.5C6 16.5 8 18.5 12 18.5C16 18.5 18 16.5 18 16.5V11.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${escapeHtml(job.experience_level)}
                </div>
                `
                    : ""
                }
            </div>
        </div>
        <div class="job-card-footer">
            <div class="applications-count">
                ${job.applications_count || 0} Applications
            </div>
            <div class="card-actions">
                <button class="action-button edit" onclick="editJob(${job.id})">Edit</button>
                <button class="action-button view" onclick="viewJob(${job.id})">View</button>
            </div>
        </div>
    </div>
    `
  }
}

// Helper function to show notifications
function showNotification(message, type) {
  // Implementation to display notification. Replace with your actual notification logic.
  console.log(`Notification: ${message} (${type})`)
  // Example using an alert (replace with a better notification system in a real application)
  alert(message)
}

// Initialize search when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeSearch)

