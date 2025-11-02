document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const modal = document.getElementById('quoteModal');
    const openBtn = document.getElementById('openQuoteModal');
    const closeBtn = modal ? modal.querySelector('.close-modal') : null;
    const quoteForm = document.getElementById('quoteForm');
    
    // Create overlay element if it doesn't exist
    let overlay = document.querySelector('.overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'overlay';
        document.body.appendChild(overlay);
    }

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

    // Open modal
    if (openBtn) {
        openBtn.addEventListener('click', function(e) {
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

    // File input handling for quote form
    const fileInput = document.getElementById('quoteFiles');
    const fileInfo = document.querySelector('#quoteModal .file-info');
    let selectedFiles = [];
    const maxTotalSize = 10 * 1024 * 1024; // 10MB in bytes
    const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 
                             'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                             'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                             'text/plain'];

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            let totalSize = 0;
            
            // Reset previous selection
            selectedFiles = [];
            
            // Validate files
            for (const file of files) {
                // Check file type
                if (!allowedFileTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|pdf|doc|docx|xls|xlsx|txt)$/i)) {
                    showNotification(`File type not allowed: ${file.name}. Allowed types: JPG, PNG, PDF, DOC, DOCX, XLS, XLSX, TXT`, 'error');
                    fileInput.value = '';
                    fileInfo.textContent = '';
                    return;
                }
                
                // Check file size
                totalSize += file.size;
                
                if (totalSize > maxTotalSize) {
                    showNotification('Total file size exceeds 10MB. Please select fewer files or reduce their size.', 'error');
                    fileInput.value = '';
                    fileInfo.textContent = '';
                    return;
                }
                
                selectedFiles.push(file);
            }
            
            // Update file info display
            if (selectedFiles.length > 0) {
                const fileNames = selectedFiles.map(file => file.name).join(', ');
                const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
                fileInfo.textContent = `${selectedFiles.length} files selected (${totalSizeMB} MB): ${fileNames}`;
            } else {
                fileInfo.textContent = 'No file selected';
            }
        });
    }

    // Form submission
    if (quoteForm) {
        quoteForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(quoteForm);
            const submitBtn = quoteForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            // Validate required fields
            const requiredFields = ['service', 'name', 'email', 'phone', 'message'];
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

            // Add files to form data
            if (fileInput && fileInput.files.length > 0) {
                Array.from(fileInput.files).forEach(file => {
                    formData.append('quoteFiles[]', file);
                });
            }
            
            // Display loading indicator
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            try {
                const response = await fetch('quote_form.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.text();
                
                if (result === 'success') {
                    showNotification('Your quote request has been sent successfully! We will contact you soon.', 'success');
                    quoteForm.reset();
                    if (fileInfo) fileInfo.textContent = 'No file selected';
                    selectedFiles = [];
                    closeModal();
                } else {
                    throw new Error(result || 'Unknown error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error sending request: ' + error.message, 'error');
            } finally {
                // Restabilește butonul
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
});
