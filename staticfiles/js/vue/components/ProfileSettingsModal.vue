<template>
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Profile Settings</h2>
          <button @click="$emit('close')" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form @submit.prevent="updateProfile" class="settings-form">
          <div class="form-group">
            <label for="name">Name:</label>
            <input 
              type="text" 
              id="name" 
              v-model="form.name" 
              required
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="email">Email:</label>
            <input 
              type="email" 
              id="email" 
              v-model="form.email" 
              required
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="password">New Password:</label>
            <input 
              type="password" 
              id="password" 
              v-model="form.password"
              class="form-input"
            >
          </div>
          <div class="form-actions">
            <button type="button" @click="$emit('close')" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue'
  
  export default {
    name: 'ProfileSettingsModal',
    props: {
      employee: {
        type: Object,
        required: true
      }
    },
    emits: ['close', 'update'],
    setup(props, { emit }) {
      const form = ref({
        name: props.employee.name,
        email: props.employee.email,
        password: ''
      })
  
      const updateProfile = () => {
        emit('update', {
          name: form.value.name,
          email: form.value.email,
          ...(form.value.password && { password: form.value.password })
        })
      }
  
      return {
        form,
        updateProfile
      }
    }
  }
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: #fff;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #eee;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: #666;
  }
  
  .settings-form {
    padding: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 500;
  }
  
  .form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .form-input:focus {
    outline: none;
    border-color: #2c3e50;
    box-shadow: 0 0 0 2px rgba(44, 62, 80, 0.1);
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  .btn-primary,
  .btn-secondary {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .btn-primary {
    background-color: #2c3e50;
    color: white;
  }
  
  .btn-primary:hover {
    background-color: #34495e;
  }
  
  .btn-secondary {
    background-color: #e9ecef;
    color: #2c3e50;
  }
  
  .btn-secondary:hover {
    background-color: #dee2e6;
  }
  </style>