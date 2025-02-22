document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("adminLoginForm")
    const usernameInput = document.getElementById("id_username")
    const passwordInput = document.getElementById("id_password")
    const togglePassword = document.getElementById("togglePassword")
  
    // Toggle password visibility
    togglePassword.addEventListener("click", function () {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
      passwordInput.setAttribute("type", type)
      this.querySelector("i").classList.toggle("fa-eye")
      this.querySelector("i").classList.toggle("fa-eye-slash")
    })
  
    // Form validation
    form.addEventListener("submit", (e) => {
      e.preventDefault()
      let isValid = true
  
      // Reset error messages
      document.querySelectorAll(".error-message").forEach((error) => (error.textContent = ""))
  
      // Username validation
      if (!usernameInput.value.trim()) {
        document.getElementById("username-error").textContent = "Username is required"
        isValid = false
      }
  
      // Password validation
      if (!passwordInput.value) {
        document.getElementById("password-error").textContent = "Password is required"
        isValid = false
      }
  
      // Add loading state to button
      if (isValid) {
        const submitBtn = form.querySelector('button[type="submit"]')
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...'
        submitBtn.disabled = true
  
        // Simulate loading (remove in production)
        setTimeout(() => {
          form.submit()
        }, 1000)
      }
    })
  
    // Real-time validation
    usernameInput.addEventListener("input", function () {
      const error = document.getElementById("username-error")
      if (this.value.trim()) {
        error.textContent = ""
      } else {
        error.textContent = "Username is required"
      }
    })
  
    passwordInput.addEventListener("input", function () {
      const error = document.getElementById("password-error")
      if (this.value) {
        error.textContent = ""
      } else {
        error.textContent = "Password is required"
      }
    })
  })
  
  