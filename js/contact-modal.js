document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const modal = document.getElementById('contactModal');
    const openBtn = document.getElementById('openContactModal');
    const emailLink = document.getElementById('emailSocialLink');
    const closeBtn = document.querySelector('.close-modal');
    const contactForm = document.getElementById('contactForm');
    
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    // Open modal function
    function openModal() {
        document.body.style.overflow = 'hidden';
        modal.style.display = 'block';
        overlay.classList.add('active');
        // Trigger reflow
        void modal.offsetWidth;
        modal.classList.add('open');
    }

    // Close modal function
    function closeModal() {
        modal.classList.remove('open');
        overlay.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300); // Match this with the CSS transition duration
    }

    // Open modal from contact button (kept for backward compatibility)
    if (openBtn) {
        openBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    }

    // Open modal from email icon
    if (emailLink) {
        emailLink.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    }

    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Close when clicking overlay
    overlay.addEventListener('click', closeModal);

    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });

    // File input handling
    const fileInput = document.getElementById('attachment');
    const fileInfo = document.querySelector('.file-info');
    let selectedFile = null;

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Check file size (max 5MB)
                const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                if (file.size > maxSize) {
                    alert('File is too large. Maximum allowed size is 5MB.');
                    fileInput.value = '';
                    fileInfo.textContent = '';
                    return;
                }
                
                selectedFile = file;
                fileInfo.textContent = `Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            } else {
                selectedFile = null;
                fileInfo.textContent = '';
            }
        });
    }

    // Form submission
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const formObject = {};
            formData.forEach((value, key) => {
                formObject[key] = value;
            });

            // Validate form
            if (!formObject.name || !formObject.email || !formObject.message) {
                alert('Please fill in all required fields.');
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formObject.email)) {
                alert('Please enter a valid email address.');
                return;
            }

            // Prepare email body
            let body = `Name: ${formObject.name}%0D%0A`;
            body += `Email: ${formObject.email}%0D%0A`;
            if (formObject.subject) {
                body += `Subject: ${formObject.subject}%0D%0A`;
            }
            body += `%0D%0AMessage:%0D%0A${formObject.message}`;

            // Add file info to the email body if a file is selected
            if (selectedFile) {
                body += `%0D%0A%0D%0AAttached file: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)%0D%0A`;
                body += `Note: Files cannot be attached directly through this form. `;
                body += `Please attach the file manually in your email client.`;
            }

            // Initialize EmailJS with your Public Key
            (function() {
                emailjs.init('ej7NeHS5Z0ZpEyyv0');
            })();

            // Send email using EmailJS
            emailjs.send('service_rj4dm3a', 'template_xrirird', {
                name: formObject.name,
                email: formObject.email,
                subject: formObject.subject || 'New message from website',
                message: formObject.message
            })
            .then(function(response) {
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.textContent = 'Thank you for your message! We will get back to you soon.';
                document.body.appendChild(successMessage);
                
                // Remove success message after 5 seconds
                setTimeout(() => {
                    successMessage.remove();
                }, 5000);
            }, function(error) {
                // Show error message
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = 'There was an error sending your message. Please try again or contact us directly at radu.tonu@yahoo.com';
                document.body.appendChild(errorMessage);
                
                // Remove error message after 5 seconds
                setTimeout(() => {
                    errorMessage.remove();
                }, 5000);
            });
            
            // Reset form and close modal
            contactForm.reset();
            fileInfo.textContent = '';
            selectedFile = null;
            closeModal();
        });
    }
});
