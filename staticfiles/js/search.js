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
  
      jobsGrid.innerHTML = jobs
        .map(
          (job) => `
              <div class="job-card" data-job-id="${job.id}">
                  <div class="job-card-header">
                      <h3>${escapeHtml(job.title)}</h3>
                      <span class="status-badge ${job.status.toLowerCase()}">${escapeHtml(job.status)}</span>
                  </div>
                  <div class="job-card-content">
                      <p>${escapeHtml(job.description)}</p>
                      <div class="job-meta">
                          <span class="job-location">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke-width="2"/>
                                  <path d="M12 22C14 18 20 15.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 15.4183 10 18 12 22Z" stroke-width="2"/>
                              </svg>
                              ${escapeHtml(job.location)}
                          </span>
                          <span class="job-type">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path d="M12 8V12L15 15" stroke-width="2" stroke-linecap="round"/>
                                  <circle cx="12" cy="12" r="9" stroke-width="2"/>
                              </svg>
                              ${escapeHtml(job.job_type)}
                          </span>
                      </div>
                  </div>
                  <div class="job-card-footer">
                      <span class="applications-count">${job.applications_count} applications</span>
                      <div class="card-actions">
                          <button class="action-button edit" onclick="editJob(${job.id})">Edit</button>
                          <button class="action-button view" onclick="viewJob(${job.id})">View</button>
                      </div>
                  </div>
              </div>
          `,
        )
        .join("")
    }
  
    // Update total jobs count
    function updateJobsCount(total) {
      const countElement = document.querySelector(".section-header h2")
      if (countElement) {
        countElement.textContent = `Your Job Postings (${total})`
      }
    }
  
    // Helper function to escape HTML
    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
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
  
  