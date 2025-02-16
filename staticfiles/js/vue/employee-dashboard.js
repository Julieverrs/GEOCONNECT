import { createApp } from 'vue'
import EmployeeHome from './components/EmployeeHome.vue'

const app = createApp({})
app.component('employee-home', EmployeeHome)
app.mount('#app')