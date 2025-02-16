<template>
    <div class="employee-dashboard">
      <header class="header">
        <nav class="nav">
          <div class="nav-links">
            <button 
              v-for="section in sections" 
              :key="section.id" 
              @click="scrollToSection(section.id)" 
              :class="{ active: activeSection === section.id }" 
              class="nav-button"
            >
              {{ section.name }}
            </button>
          </div>
          <div class="profile-dropdown" ref="profileDropdown">
            <button @click="toggleDropdown" class="profile-button">
              {{ employeeName }}
              <i class="fas fa-chevron-down"></i>
            </button>
            <div v-show="isDropdownOpen" class="dropdown-content">
              <button @click="openProfileSettings" class="dropdown-item">
                <i class="fas fa-user-cog"></i> Profile Settings
              </button>
              <button @click="logout" class="dropdown-item">
                <i class="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
        </nav>
      </header>
  
      <main class="main-content">
        <section 
          v-for="section in sections" 
          :key="section.id" 
          :id="section.id" 
          class="content-section"
        >
          <h2>{{ section.name }}</h2>
          <div v-html="section.content"></div>
        </section>
      </main>
  
      <profile-settings-modal
        v-if="showProfileSettings"
        :employee="employee"
        @close="closeProfileSettings"
        @update="updateProfile"
      />
    </div>
  </template>
  
  <script>
  import { ref, onMounted, onUnmounted } from 'vue'
  import ProfileSettingsModal from './ProfileSettingsModal.vue'
  
  export default {
    name: 'EmployeeHome',
    template: `
        <div class="employee-dashboard">
            <header class="header">
                <nav class="nav">
                    <div class="nav-links">
                        <button 
                            v-for="section in sections" 
                            :key="section.id" 
                            @click="scrollToSection(section.id)" 
                            :class="{ active: activeSection === section.id }" 
                            class="nav-button"
                        >
                            {{ section.name }}
                        </button>
                    </div>
                    <div class="profile-dropdown" ref="profileDropdown">
                        <button @click="toggleDropdown" class="profile-button">
                            {{ employeeName }}
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div v-show="isDropdownOpen" class="dropdown-content">
                            <button @click="openProfileSettings" class="dropdown-item">
                                <i class="fas fa-user-cog"></i> Profile Settings
                            </button>
                            <button @click="logout" class="dropdown-item">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
                </nav>
            </header>

            <main class="main-content">
                <section 
                    v-for="section in sections" 
                    :key="section.id" 
                    :id="section.id" 
                    class="content-section"
                >
                    <h2>{{ section.name }}</h2>
                    <div v-html="section.content"></div>
                </section>
            </main>
        </div>
    `,
    data() {
        return {
            sections: [
                {
                    id: 'home',
                    name: 'Home',
                    content: '<div class="welcome-section"><h3>Welcome to Your Dashboard</h3><p>Access all your employee information and resources in one place.</p></div>'
                },
                {
                    id: 'jobs',
                    name: 'Jobs',
                    content: '<div class="jobs-section"><h3>Available Positions</h3><div class="job-listings"><p>Loading job listings...</p></div></div>'
                },
                {
                    id: 'about',
                    name: 'About Us',
                    content: '<div class="about-section"><h3>Our Company</h3><p>Learn about our mission, values, and team.</p></div>'
                },
                {
                    id: 'contact',
                    name: 'Contact Us',
                    content: '<div class="contact-section"><h3>Get in Touch</h3><p>We\'re here to help! Reach out to us with any questions.</p></div>'
                }
            ],
            activeSection: 'home',
            isDropdownOpen: false,
            employeeName: 'John Doe'
        }
    },
    methods: {
        scrollToSection(sectionId) {
            const element = document.getElementById(sectionId)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
                this.activeSection = sectionId
            }
        },
        toggleDropdown() {
            this.isDropdownOpen = !this.isDropdownOpen
        },
        openProfileSettings() {
            // Implement profile settings
            alert('Profile settings coming soon!')
            this.isDropdownOpen = false
        },
        async logout() {
            try {
                const response = await fetch('/employee/logout/', { 
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': this.getCookie('csrftoken')
                    }
                })
                if (response.ok) {
                    window.location.href = '/employee/login/'
                }
            } catch (error) {
                console.error('Logout failed:', error)
            }
        },
        getCookie(name) {
            let cookieValue = null
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';')
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim()
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
                        break
                    }
                }
            }
            return cookieValue
        }
    },
    mounted() {
        // Add click outside listener for dropdown
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.profile-dropdown')) {
                this.isDropdownOpen = false
            }
        })
    }
}
  </script>
  
  <style>
  /* Add your styles here - same as previous version */
  </style>