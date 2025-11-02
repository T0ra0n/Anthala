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

    // Notification display function
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

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

    // File input handling for contact form
    const contactFileInput = document.getElementById('contactFiles');
    const contactFileInfo = document.querySelector('#contactModal .file-info');
    let contactSelectedFiles = [];
    const maxTotalSize = 10 * 1024 * 1024; // 10MB in bytes
    const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 
                             'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                             'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                             'text/plain'];

    if (contactFileInput) {
        contactFileInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            let totalSize = 0;
            
            // Reset previous selection
            contactSelectedFiles = [];
            
            // Validate files
            for (const file of files) {
                // Check file type
                if (!allowedFileTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|pdf|doc|docx|xls|xlsx|txt)$/i)) {
                    showNotification(`File type not allowed: ${file.name}. Allowed types: JPG, PNG, PDF, DOC, DOCX, XLS, XLSX, TXT`, 'error');
                    contactFileInput.value = '';
                    contactFileInfo.textContent = '';
                    return;
                }
                
                // Check file size
                totalSize += file.size;
                
                if (totalSize > maxTotalSize) {
                    showNotification('Total file size exceeds 10MB. Please select fewer files or reduce their size.', 'error');
                    contactFileInput.value = '';
                    contactFileInfo.textContent = '';
                    return;
                }
                
                contactSelectedFiles.push(file);
            }
            
            // Update file info display
            if (contactSelectedFiles.length > 0) {
                const fileNames = contactSelectedFiles.map(file => file.name).join(', ');
                const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
                contactFileInfo.textContent = `${contactSelectedFiles.length} files selected (${totalSizeMB} MB): ${fileNames}`;
            } else {
                contactFileInfo.textContent = 'No file selected';
            }
        });
    }

    // Form submission
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            // Validate required fields
            const requiredFields = ['name', 'email', 'subject', 'message'];
            const missingFields = [];
            
            requiredFields.forEach(field => {
                if (!formData.get(field)) {
                    missingFields.push(field);
                }
            });
            
            if (missingFields.length > 0) {
                showNotification('Please fill in all required fields (marked with *).', 'error');
                return;
            }

            // Validate email format
            const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(formData.get('email'))) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
            
            // Add files to form data if any
            if (contactFileInput && contactSelectedFiles.length > 0) {
                contactSelectedFiles.forEach(file => {
                    formData.append('contactFiles[]', file);
                });
            }
            
            // Display loading indicator
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            try {
                const response = await fetch('contact_form.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.text();
                
                if (result === 'success') {
                    showNotification('Your message has been sent successfully! We will contact you soon.', 'success');
                    contactForm.reset();
                    if (contactFileInfo) contactFileInfo.textContent = 'No file selected';
                    contactSelectedFiles = [];
                    closeModal();
                } else {
                    throw new Error(result || 'Unknown error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error sending message: ' + error.message, 'error');
            } finally {
                // Restabilește butonul
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
});
