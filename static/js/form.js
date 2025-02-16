document.addEventListener('DOMContentLoaded', function() {
    // Add input focus effects
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
            validateInput(this);
        });
    });

    // Form validation
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const username = document.getElementById('id_username');
            const password = document.getElementById('id_password');

            let isValid = true;

            if (!username.value.trim()) {
                showError(username, 'Username is required');
                isValid = false;
            }

            if (!password.value) {
                showError(password, 'Password is required');
                isValid = false;
            }

            if (!isValid) {
                e.preventDefault();
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            const username = document.getElementById('id_username');
            const email = document.getElementById('id_email');
            const password = document.getElementById('id_password');
            const confirmPassword = document.getElementById('id_confirm_password');

            let isValid = true;

            if (!username.value.trim()) {
                showError(username, 'Username is required');
                isValid = false;
            }

            if (!email.value.trim()) {
                showError(email, 'Email is required');
                isValid = false;
            } else if (!isValidEmail(email.value)) {
                showError(email, 'Please enter a valid email address');
                isValid = false;
            }

            if (!password.value) {
                showError(password, 'Password is required');
                isValid = false;
            }

            if (!confirmPassword.value) {
                showError(confirmPassword, 'Please confirm your password');
                isValid = false;
            } else if (password.value !== confirmPassword.value) {
                showError(confirmPassword, 'Passwords do not match');
                isValid = false;
            }

            if (!isValid) {
                e.preventDefault();
            }
        });
    }
});

function validateInput(input) {
    if (!input.value.trim() && input.required) {
        showError(input, `${input.name} is required`);
    } else {
        clearError(input);
    }
}

function showError(input, message) {
    input.classList.add('error');
    let errorElement = input.parentElement.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        input.parentElement.appendChild(errorElement);
    }
    errorElement.textContent = message;
}

function clearError(input) {
    input.classList.remove('error');
    const errorElement = input.parentElement.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Add this to your existing form.js file

function showError(input, message) {
    // your showError function implementation here
    input.classList.add("error")
    const errorElement = input.nextElementSibling
    if (errorElement) {
      errorElement.textContent = message
    }
  }
  
  function isValidEmail(email) {
    // your isValidEmail function implementation here
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  // Password reset form validation
  const resetForm = document.getElementById("resetForm")
  if (resetForm) {
    resetForm.addEventListener("submit", (e) => {
      const email = document.getElementById("id_email")
  
      let isValid = true
  
      if (!email.value.trim()) {
        showError(email, "Email is required")
        isValid = false
      } else if (!isValidEmail(email.value)) {
        showError(email, "Please enter a valid email address")
        isValid = false
      }
  
      if (!isValid) {
        e.preventDefault()
      }
    })
  }
  
  // New password form validation
  const newPasswordForm = document.getElementById("newPasswordForm")
  if (newPasswordForm) {
    newPasswordForm.addEventListener("submit", (e) => {
      const newPassword = document.getElementById("id_new_password")
      const confirmPassword = document.getElementById("id_confirm_password")
  
      let isValid = true
  
      if (!newPassword.value) {
        showError(newPassword, "Password is required")
        isValid = false
      }
  
      if (!confirmPassword.value) {
        showError(confirmPassword, "Please confirm your password")
        isValid = false
      } else if (newPassword.value !== confirmPassword.value) {
        showError(confirmPassword, "Passwords do not match")
        isValid = false
      }
  
      if (!isValid) {
        e.preventDefault()
      }
    })
  }
  
  