// Job Mapping Enhanced JavaScript
class JobMapManager {
    constructor() {
        this.map = null;
        this.jobMarkers = [];
        this.userLocationCircle = null;
        this.mapInitialized = false;
        this.jobData = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeMapModal();
    }
    
    setupEventListeners() {
        // Search button
        document.getElementById('searchLocationBtn')?.addEventListener('click', () => {
            this.handleLocationSearch();
        });
        
        // Radius filter
        document.getElementById('radiusFilter')?.addEventListener('change', () => {
            this.handleRadiusChange();
        });
        
        // Reset button
        document.getElementById('resetMapBtn')?.addEventListener('click', () => {
            this.handleResetMap();
        });
        
        // Enter key on search input
        document.getElementById('locationSearchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLocationSearch();
            }
        });
    }
    
    initializeMapModal() {
        const jobMapModal = document.getElementById('jobMapModal');
        if (!jobMapModal) return;
        
        jobMapModal.addEventListener('shown.bs.modal', () => {
            if (!this.mapInitialized) {
                this.initializeMap();
            }
        });
    }
    
    initializeMap() {
        // Initialize the map
        this.map = L.map('jobMap').setView([12.8797, 121.7740], 5); // Default to Philippines
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Store map reference globally
        window.jobMap = this.map;
        window.jobMarkers = this.jobMarkers;
        
        // Load job data and create markers
        this.loadJobMarkers();
        
        // Invalidate map size to ensure proper rendering
        this.map.invalidateSize();
        this.mapInitialized = true;
        
        // Add loading animation
        this.showMapLoading();
        
        // Hide loading after a short delay
        setTimeout(() => {
            this.hideMapLoading();
        }, 1000);
    }
    
    loadJobMarkers() {
        // Get job data from the page (this will be populated by Django template)
        this.jobData = window.jobDataFromTemplate || [];
        
        this.jobData.forEach(job => {
            if (job.lat && job.lng) {
                const marker = L.marker([job.lat, job.lng]).addTo(this.map);
                
                // Create enhanced popup content
                const popupContent = this.createPopupContent(job);
                
                marker.bindPopup(popupContent, {
                    maxWidth: 320,
                    className: 'map-popup'
                });
                
                this.jobMarkers.push(marker);
            }
        });
    }
    
    createPopupContent(job) {
        return `
            <div class="map-popup">
                <h5>${this.escapeHtml(job.title)}</h5>
                <p class="text-muted">${this.escapeHtml(job.company)}</p>
                <div class="popup-badges">
                    <span class="badge bg-primary">${this.escapeHtml(job.job_type)}</span>
                    <span class="badge bg-info">${this.escapeHtml(job.work_setup)}</span>
                    <span class="badge bg-success">${this.escapeHtml(job.salary_range)}</span>
                </div>
                <div class="popup-details">
                    <p><i class="fas fa-map-marker-alt"></i><strong>Location:</strong> ${this.escapeHtml(job.location)}</p>
                    <p><i class="fas fa-briefcase"></i><strong>Experience:</strong> ${this.escapeHtml(job.experience_level || 'Any')}</p>
                    <p><i class="far fa-calendar-alt"></i><strong>Posted:</strong> ${this.formatDate(job.posted_date)}</p>
                </div>
                <div class="mt-3 d-flex justify-content-end">
                    <button class="check-job-btn" onclick="jobMapManager.scrollToJobCard('${job.id}')">
                        <i class="fas fa-arrow-right"></i> Check Job
                    </button>
                </div>
            </div>
        `;
    }
    
    handleLocationSearch() {
        const query = document.getElementById('locationSearchInput').value.trim();
        if (!query) {
            this.showNotification('Please enter a location to search', 'warning');
            return;
        }
        
        this.showMapLoading('Searching for location...');
        
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                this.hideMapLoading();
                
                if (data && data.length > 0) {
                    const result = data[0];
                    const lat = parseFloat(result.lat);
                    const lon = parseFloat(result.lon);
                    
                    this.map.setView([lat, lon], 14);
                    
                    // Remove previous circle
                    if (this.userLocationCircle) {
                        this.userLocationCircle.removeFrom(this.map);
                    }
                    
                    const radiusKm = parseFloat(document.getElementById('radiusFilter').value);
                    const radiusMeters = radiusKm * 1000;
                    
                    this.userLocationCircle = L.circle([lat, lon], {
                        radius: radiusMeters,
                        color: "#3949ab",
                        fillColor: "#3949ab",
                        fillOpacity: 0.15,
                        weight: 3
                    }).addTo(this.map);
                    
                    this.map.fitBounds(this.userLocationCircle.getBounds());
                    
                    this.showNotification(`Found location: ${result.display_name}`, 'success');
                } else {
                    this.showNotification('No results found for this location.', 'error');
                }
            })
            .catch(error => {
                this.hideMapLoading();
                console.error('Location search error:', error);
                this.showNotification('Error searching for location. Please try again.', 'error');
            });
    }
    
    handleRadiusChange() {
        if (this.userLocationCircle) {
            const center = this.userLocationCircle.getLatLng();
            const radiusKm = parseFloat(document.getElementById('radiusFilter').value);
            const radiusMeters = radiusKm * 1000;
            
            this.userLocationCircle.setRadius(radiusMeters);
            this.map.fitBounds(this.userLocationCircle.getBounds());
        }
    }
    
    handleResetMap() {
        const input = document.getElementById('locationSearchInput');
        
        // Clear search input
        input.value = '';
        
        // Reset map view to default
        this.map.setView([12.8797, 121.7740], 5);
        
        // Remove circle if exists
        if (this.userLocationCircle) {
            this.userLocationCircle.removeFrom(this.map);
            this.userLocationCircle = null;
        }
        
        // Show all job markers again
        this.jobMarkers.forEach(marker => marker.addTo(this.map));
        
        this.showNotification('Map view reset to default', 'info');
    }
    
    scrollToJobCard(jobId) {
        const jobCard = document.querySelector(`[data-job-id="${jobId}"]`);
        if (!jobCard) {
            this.showNotification('Job not found on this page.', 'error');
            return;
        }
        
        // Close modal
        const mapModal = bootstrap.Modal.getInstance(document.getElementById('jobMapModal'));
        if (mapModal) mapModal.hide();
        
        // Scroll to job card with smooth animation
        jobCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight temporarily
        jobCard.style.transition = 'all 0.5s ease';
        jobCard.style.backgroundColor = '#e8f5e8';
        jobCard.style.transform = 'scale(1.02)';
        jobCard.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.3)';
        
        setTimeout(() => {
            jobCard.style.backgroundColor = '';
            jobCard.style.transform = '';
            jobCard.style.boxShadow = '';
        }, 2000);
        
        this.showNotification('Job card highlighted!', 'success');
    }
    
    showMapLoading(message = 'Loading map...') {
        const mapContainer = document.getElementById('jobMap');
        if (!mapContainer) return;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'map-loading';
        loadingDiv.innerHTML = `
            <div class="map-loading-spinner"></div>
            <div class="map-loading-text">${message}</div>
        `;
        
        mapContainer.appendChild(loadingDiv);
    }
    
    hideMapLoading() {
        const loadingDiv = document.querySelector('.map-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `map-notification map-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (e) {
            return dateString;
        }
    }
}

// Initialize job map manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the job map manager
    window.jobMapManager = new JobMapManager();
    
    // Make scrollToJobCard function globally available
    window.scrollToJobCard = function(jobId) {
        if (window.jobMapManager) {
            window.jobMapManager.scrollToJobCard(jobId);
        }
    };
});

// Add notification styles
const notificationStyles = `
<style>
.map-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    padding: 1rem 1.5rem;
    z-index: 9999;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 350px;
    border-left: 4px solid #3949ab;
}

.map-notification.show {
    transform: translateX(0);
}

.map-notification-success {
    border-left-color: #4caf50;
}

.map-notification-error {
    border-left-color: #f44336;
}

.map-notification-warning {
    border-left-color: #ff9800;
}

.map-notification-info {
    border-left-color: #2196f3;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.notification-content i {
    font-size: 1.2rem;
    color: #3949ab;
}

.map-notification-success .notification-content i {
    color: #4caf50;
}

.map-notification-error .notification-content i {
    color: #f44336;
}

.map-notification-warning .notification-content i {
    color: #ff9800;
}

.map-notification-info .notification-content i {
    color: #2196f3;
}

.notification-content span {
    font-weight: 500;
    color: #333;
    font-size: 0.9rem;
}

@media (max-width: 768px) {
    .map-notification {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
        transform: translateY(-100%);
    }
    
    .map-notification.show {
        transform: translateY(0);
    }
}
</style>
`;

// Inject notification styles
document.head.insertAdjacentHTML('beforeend', notificationStyles); 