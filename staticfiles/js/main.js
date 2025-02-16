import { createApp } from 'vue'
import EmployeeDashboard from './components/EmployeeDashboard.vue'

document.addEventListener('DOMContentLoaded', () => {
  const app = createApp({
    components: {
      'employee-dashboard': EmployeeDashboard
    }
  })

  app.mount('#app')
})