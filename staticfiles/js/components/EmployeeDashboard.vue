<template>
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Welcome, {{ username }}</h1>
        <button @click="logout" class="btn btn-danger">Logout</button>
      </header>
  
      <div class="dashboard-content">
        <div class="card profile-card">
          <h2>Profile Information</h2>
          <div class="profile-info">
            <p><strong>Username:</strong> {{ username }}</p>
            <p><strong>Email:</strong> {{ email }}</p>
          </div>
        </div>
  
        <div class="card">
          <h2>Quick Actions</h2>
          <div class="action-buttons">
            <button @click="updateProfile" class="btn btn-primary">Update Profile</button>
            <button @click="viewSchedule" class="btn btn-primary">View Schedule</button>
            <button @click="viewTasks" class="btn btn-primary">View Tasks</button>
          </div>
        </div>
  
        <div class="card">
          <h2>Recent Activity</h2>
          <div class="activity-list" v-if="activities.length">
            <div v-for="activity in activities" :key="activity.id" class="activity-item">
              {{ activity.description }}
            </div>
          </div>
          <p v-else>No recent activities</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  
  const username = ref('')
  const email = ref('')
  const activities = ref([])
  
  onMounted(() => {
    // Get employee data from Django context
    const employeeData = window.employeeData || {}
    username.value = employeeData.username || ''
    email.value = employeeData.email || ''
    
    // Mock activities - replace with actual API calls
    activities.value = [
      { id: 1, description: 'Logged in at 9:00 AM' },
      { id: 2, description: 'Updated profile at 9:30 AM' }
    ]
  })
  
  const logout = () => {
    window.location.href = '/employee/logout/'
  }
  
  const updateProfile = () => {
    console.log('Update profile clicked')
  }
  
  const viewSchedule = () => {
    console.log('View schedule clicked')
  }
  
  const viewTasks = () => {
    console.log('View tasks clicked')
  }
  </script>
  
  <style scoped>
  .dashboard-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .dashboard-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
  
  .profile-info {
    margin-top: 1rem;
  }
  
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .activity-item {
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
  }
  
  .activity-item:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 768px) {
    .dashboard-content {
      grid-template-columns: 1fr;
    }
  }
  </style>