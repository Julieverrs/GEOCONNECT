document.addEventListener('DOMContentLoaded', function() {
    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Parallax Effect for Cards
    document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.stat-card, .feature-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.transform = `perspective(1000px) rotateX(${(y - rect.height/2)/20}deg) rotateY(${-(x - rect.width/2)/20}deg)`;
        });
    });

    // Reset card transform on mouse leave
    const cards = document.querySelectorAll('.stat-card, .feature-card');
    cards.forEach(card => {
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        });
    });

    // Smooth Scroll with Offset
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-scale');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.stat-card, .feature-card, .job-card').forEach(el => {
        observer.observe(el);
    });

    // Advanced Form Validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });

            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('focused');
                validateInput(input);
            });
        });
    });

    function validateInput(input) {
        const value = input.value.trim();
        if (!value) {
            input.classList.add('is-invalid');
            return false;
        }
        input.classList.remove('is-invalid');
        return true;
    }

    // Loading States
    function showLoading(element) {
        element.classList.add('loading-skeleton');
        element.setAttribute('disabled', true);
    }

    function hideLoading(element) {
        element.classList.remove('loading-skeleton');
        element.removeAttribute('disabled');
    }

    // Form Submission with Loading State
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const form = button.closest('form');
            if (form) {
                const isValid = Array.from(form.querySelectorAll('input, textarea'))
                    .every(input => validateInput(input));

                if (isValid) {
                    showLoading(button);
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    hideLoading(button);
                    // Show success message
                    showNotification('Success!', 'Your form has been submitted.');
                }
            }
        });
    });

    // Custom Notification System
    function showNotification(title, message) {
        const notification = document.createElement('div');
        notification.className = 'custom-notification fade-in-scale';
        notification.innerHTML = `
            <h4>${title}</h4>
            <p>${message}</p>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});