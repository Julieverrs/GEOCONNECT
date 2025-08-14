document.addEventListener("DOMContentLoaded", () => {
  // Get password fields
  const passwordField = document.getElementById("id_password")
  const confirmPasswordField = document.getElementById("id_confirm_password")

  // If we're on a password reset form
  const newPasswordField = document.getElementById("id_new_password1")
  const confirmNewPasswordField = document.getElementById("id_new_password2")

  // Function to create password strength indicator
  function createStrengthIndicator(passwordField) {
    if (!passwordField) return

    // Create container for password requirements
    const requirementsContainer = document.createElement("div")
    requirementsContainer.className = "password-requirements mt-2"

    // Create strength meter
    const strengthMeter = document.createElement("div")
    strengthMeter.className = "strength-meter mt-1 mb-2"
    strengthMeter.innerHTML = `
            <div class="strength-meter-bar" style="height: 5px; background-color: #e0e0e0; border-radius: 3px;">
                <div class="strength-meter-fill" style="width: 0%; height: 100%; background-color: #ff4d4d; border-radius: 3px; transition: width 0.3s, background-color 0.3s;"></div>
            </div>
            <div class="strength-text mt-1" style="font-size: 12px; color: #666;">Password strength: Too weak</div>
        `

    // Create requirements list
    const requirementsList = document.createElement("ul")
    requirementsList.className = "requirements-list pl-4 mt-2"
    requirementsList.style.fontSize = "12px"
    requirementsList.style.color = "#666"
    requirementsList.style.listStyleType = "none"
    requirementsList.style.padding = "0"

    const requirements = [
      { id: "length", text: "At least 8 characters" },
      { id: "uppercase", text: "At least one uppercase letter (A-Z)" },
      { id: "lowercase", text: "At least one lowercase letter (a-z)" },
      { id: "number", text: "At least one number (0-9)" },
      { id: "special", text: "At least one special character (!@#$%^&*()_+)" },
    ]

    requirements.forEach((req) => {
      const li = document.createElement("li")
      li.id = `req-${req.id}`
      li.innerHTML = `<span class="req-icon">❌</span> ${req.text}`
      requirementsList.appendChild(li)
    })

    requirementsContainer.appendChild(strengthMeter)
    requirementsContainer.appendChild(requirementsList)

    // Insert after password field
    passwordField.parentNode.insertBefore(requirementsContainer, passwordField.nextSibling)

    return {
      strengthMeter: strengthMeter.querySelector(".strength-meter-fill"),
      strengthText: strengthMeter.querySelector(".strength-text"),
      requirements: requirementsList,
    }
  }

  // Function to check password strength
  function checkPasswordStrength(password, indicators) {
    if (!indicators) return

    // Check requirements
    const hasLength = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};:'",.<>/?]/.test(password)

    // Update requirement indicators
    updateRequirement("length", hasLength, indicators.requirements)
    updateRequirement("uppercase", hasUppercase, indicators.requirements)
    updateRequirement("lowercase", hasLowercase, indicators.requirements)
    updateRequirement("number", hasNumber, indicators.requirements)
    updateRequirement("special", hasSpecial, indicators.requirements)

    // Calculate strength percentage
    let strength = 0
    if (hasLength) strength += 20
    if (hasUppercase) strength += 20
    if (hasLowercase) strength += 20
    if (hasNumber) strength += 20
    if (hasSpecial) strength += 20

    // Update strength meter
    indicators.strengthMeter.style.width = `${strength}%`

    // Update color based on strength
    if (strength < 40) {
      indicators.strengthMeter.style.backgroundColor = "#ff4d4d" // Red
      indicators.strengthText.textContent = "Password strength: Too weak"
      indicators.strengthText.style.color = "#ff4d4d"
    } else if (strength < 60) {
      indicators.strengthMeter.style.backgroundColor = "#ffa64d" // Orange
      indicators.strengthText.textContent = "Password strength: Weak"
      indicators.strengthText.style.color = "#ffa64d"
    } else if (strength < 80) {
      indicators.strengthMeter.style.backgroundColor = "#ffff4d" // Yellow
      indicators.strengthText.textContent = "Password strength: Medium"
      indicators.strengthText.style.color = "#aaaa00"
    } else if (strength < 100) {
      indicators.strengthMeter.style.backgroundColor = "#4dff4d" // Light Green
      indicators.strengthText.textContent = "Password strength: Strong"
      indicators.strengthText.style.color = "#4dff4d"
    } else {
      indicators.strengthMeter.style.backgroundColor = "#00cc00" // Green
      indicators.strengthText.textContent = "Password strength: Very strong"
      indicators.strengthText.style.color = "#00cc00"
    }

    return strength === 100 // Return true if all requirements are met
  }

  // Function to update requirement indicator
  function updateRequirement(reqId, isMet, requirementsList) {
    const reqItem = requirementsList.querySelector(`#req-${reqId}`)
    if (!reqItem) return

    const icon = reqItem.querySelector(".req-icon")
    if (isMet) {
      icon.textContent = "✅"
      reqItem.style.color = "#00cc00"
    } else {
      icon.textContent = "❌"
      reqItem.style.color = "#666"
    }
  }

  // Set up validation for signup form
  if (passwordField) {
    const indicators = createStrengthIndicator(passwordField)

    passwordField.addEventListener("input", function () {
      checkPasswordStrength(this.value, indicators)
    })

    // Form submission validation
    const form = passwordField.closest("form")
    if (form) {
      form.addEventListener("submit", (e) => {
        const password = passwordField.value
        const isValid = checkPasswordStrength(password, indicators)

        if (!isValid) {
          e.preventDefault()
          alert("Please ensure your password meets all the requirements.")
        }

        // Check if passwords match
        if (confirmPasswordField && password !== confirmPasswordField.value) {
          e.preventDefault()
          alert("Passwords do not match.")
        }
      })
    }
  }

  // Set up validation for password reset form
  if (newPasswordField) {
    const indicators = createStrengthIndicator(newPasswordField)

    newPasswordField.addEventListener("input", function () {
      checkPasswordStrength(this.value, indicators)
    })

    // Form submission validation
    const form = newPasswordField.closest("form")
    if (form) {
      form.addEventListener("submit", (e) => {
        const password = newPasswordField.value
        const isValid = checkPasswordStrength(password, indicators)

        if (!isValid) {
          e.preventDefault()
          alert("Please ensure your password meets all the requirements.")
        }

        // Check if passwords match
        if (confirmNewPasswordField && password !== confirmNewPasswordField.value) {
          e.preventDefault()
          alert("Passwords do not match.")
        }
      })
    }
  }
})
