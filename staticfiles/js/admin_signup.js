document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("adminSignupForm")
    const inputs = {
      username: document.getElementById("id_username"),
      email: document.getElementById("id_email"),
      password1: document.getElementById("id_password1"),
      password2: document.getElementById("id_password2"),
    }
    const togglePassword1 = document.getElementById("togglePassword1")
    const togglePassword2 = document.getElementById("togglePassword2")
  
    // Toggle password visibility
    ;[togglePassword1, togglePassword2].forEach((toggle) => {
      toggle.addEventListener("click", function () {
        const input = this.id === "togglePassword1" ? inputs.password1 : inputs.password2
        const type = input.getAttribute("type") === "password" ? "text" : "password"
        input.setAttribute("type", type)
        this.querySelector("i").classList.toggle("fa-eye")
        this.querySelector("i").classList.toggle("fa-eye-slash")
      })
    })
  
    // Form validation
    form.addEventListener("submit", (e) => {
      e.preventDefault()
      let isValid = true
  
      // Reset error messages
      document.querySelectorAll(".error-message").forEach((error) => (error.textContent = ""))
  
      // Username validation
      if (!inputs.username.value.trim()) {
        document.getElementById("username-error").textContent = "Username is required"
        isValid = false
      }
  
      // Email validation
      if (!inputs.email.value.trim()) {
        document.getElementById("email-error").textContent = "Email is required"
        isValid = false
      } else if (!isValidEmail(inputs.email.value)) {
        document.getElementById("email-error").textContent = "Please enter a valid email address"
        isValid = false
      }
  
      // Password validation
      if (!inputs.password1.value) {
        document.getElementById("password1-error").textContent = "Password is required"
        isValid = false
      } else if (inputs.password1.value.length < 8) {
        document.getElementById("password1-error").textContent = "Password must be at least 8 characters long"
        isValid = false
      }
  
      // Confirm password validation
      if (!inputs.password2.value) {
        document.getElementById("password2-error").textContent = "Please confirm your password"
        isValid = false
      } else if (inputs.password1.value !== inputs.password2.value) {
        document.getElementById("password2-error").textContent = "Passwords do not match"
        isValid = false
      }
  
      // Add loading state to button
      if (isValid) {
        const submitBtn = form.querySelector('button[type="submit"]')
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...'
        submitBtn.disabled = true
  
        // Simulate loading (remove in production)
        setTimeout(() => {
          form.submit()
        }, 1000)
      }
    })
  
    // Real-time validation
    Object.entries(inputs).forEach(([key, input]) => {
      input.addEventListener("input", function () {
        const error = document.getElementById(`${key}-error`)
  
        if (!this.value.trim()) {
          error.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`
        } else if (key === "email" && !isValidEmail(this.value)) {
          error.textContent = "Please enter a valid email address"
        } else if (key === "password1" && this.value.length < 8) {
          error.textContent = "Password must be at least 8 characters long"
        } else if (key === "password2" && this.value !== inputs.password1.value) {
          error.textContent = "Passwords do not match"
        } else {
          error.textContent = ""
        }
      })
    })
  
    // Email validation helper
    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }
  })
  
  