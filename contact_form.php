<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Required fields validation
    $required = ['name', 'email', 'subject', 'message'];
    $missing = [];
    $data = [];

    // Get and sanitize data
    foreach ($required as $field) {
        if (empty($_POST[$field])) {
            $missing[] = $field;
        } else {
            $data[$field] = htmlspecialchars(trim($_POST[$field]));
        }
    }

    // Check for missing required fields
    if (!empty($missing)) {
        http_response_code(400);
        echo "Please fill in all required fields.";
        exit;
    }

    // Email validation
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo "Please enter a valid email address.";
        exit;
    }

    // Create upload directory if it doesn't exist
    $upload_dir = __DIR__ . '/uploads/';
    if (!file_exists($upload_dir)) {
        if (!@mkdir($upload_dir, 0755, true)) {
            error_log("Failed to create upload directory: " . $upload_dir);
            http_response_code(500);
            echo "Server error. Please try again later.";
            exit;
        }
    }
    
    // Verify directory permissions
    if (!is_writable($upload_dir)) {
        error_log("Upload directory is not writable: " . $upload_dir);
        http_response_code(500);
        echo "Server configuration error. Please contact support.";
        exit;
    }

    // Extract data
    $name = $data['name'];
    $email = $data['email'];
    $phone = htmlspecialchars(trim($_POST['phone'] ?? ''));
    $subject = $data['subject'];
    $message = $data['message'];
    
    // Process file uploads
    $file_attachments = [];
    $total_size = 0;
    $max_total_size = 10 * 1024 * 1024; // 10MB
    $allowed_types = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];

    if (!empty($_FILES['contactFiles'])) {

        foreach ($_FILES['contactFiles']['tmp_name'] as $key => $tmp_name) {
            $file_error = $_FILES['contactFiles']['error'][$key];
            
            // Skip if no file was uploaded
            if ($file_error === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            
            // Handle upload errors
            if ($file_error !== UPLOAD_ERR_OK) {
                $error_message = "File upload error: ";
                switch ($file_error) {
                    case UPLOAD_ERR_INI_SIZE:
                    case UPLOAD_ERR_FORM_SIZE:
                        $error_message .= "File is too large.";
                        break;
                    case UPLOAD_ERR_PARTIAL:
                        $error_message .= "The uploaded file was only partially uploaded.";
                        break;
                    default:
                        $error_message .= "Error code: $file_error";
                }
                http_response_code(400);
                echo $error_message;
                exit;
            }
            
            $file_size = $_FILES['contactFiles']['size'][$key];
            $original_name = $_FILES['contactFiles']['name'][$key];
            
            // Sanitize file name
            $file_name = preg_replace("/[^a-zA-Z0-9._-]/", "", $original_name);
            if (empty($file_name)) {
                $file_name = 'file' . uniqid();
            }
            
            $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
            
            // Validate file type
            if (!in_array($file_ext, $allowed_types)) {
                http_response_code(400);
                echo "File type not allowed: $original_name. Allowed types: " . implode(', ', $allowed_types);
                exit;
            }
            
            // Additional MIME type validation
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime_type = finfo_file($finfo, $tmp_name);
            finfo_close($finfo);
            
            $allowed_mime_types = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'application/pdf' => 'pdf',
                'application/msword' => 'doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
                'application/vnd.ms-excel' => 'xls',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
                'text/plain' => 'txt'
            ];
            
            if (!in_array($mime_type, array_keys($allowed_mime_types)) || 
                $allowed_mime_types[$mime_type] !== $file_ext) {
                http_response_code(400);
                echo "Invalid file type or content: $original_name";
                exit;
            }
            
            $total_size += $file_size;
            
            // Validate total size
            if ($total_size > $max_total_size) {
                http_response_code(400);
                $total_size_mb = number_format($max_total_size / (1024 * 1024), 2);
                echo "Total file size exceeds the {$total_size_mb}MB limit.";
                exit;
            }
            
            // Generate a unique file name
            $file_path = $upload_dir . uniqid('file_', true) . '_' . $file_name;
                
                // Additional security check
                if (!is_uploaded_file($tmp_name)) {
                    error_log("Possible file upload attack: " . $original_name);
                    continue;
                }
                
                // Move the uploaded file to the destination
                if (move_uploaded_file($tmp_name, $file_path)) {
                    // Set secure permissions (read/write for owner, read for others)
                    chmod($file_path, 0644);
                    
                    $file_attachments[] = [
                        'path' => $file_path,
                        'name' => $file_name,
                        'original_name' => $original_name,
                        'size' => $file_size,
                        'mime_type' => $mime_type
                    ];
                } else {
                    error_log("Failed to move uploaded file: " . $original_name);
                }
            }
        }
    }

    // Recipient email address
    $to = "contact@anthala.uk, anthala.ltd@gmail.com";
    
    // Build email content
    $email_body = "You have received a new message from the contact form.\n\n";
    $email_body .= "=== CONTACT INFORMATION ===\n";
    $email_body .= "Name: $name\n";
    $email_body .= "Email: $email\n";
    $email_body .= "Phone: " . ($phone ?: 'Not provided') . "\n\n";
    $email_body .= "=== MESSAGE DETAILS ===\n";
    $email_body .= "Subject: $subject\n\n";
    $email_body .= "Message:\n$message\n\n";
    $email_body .= "Attached Files: " . (empty($file_attachments) ? "No files attached" : "\n- " . 
        implode("\n- ", array_column($file_attachments, 'name')));
    
    // Set email headers for multipart message
    $boundary = md5(time());
    $headers = "From: $name <$email>\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";
    
    // Build email body with attachments
    $email_content = "--$boundary\r\n";
    $email_content .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $email_content .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $email_content .= $email_body . "\r\n";
    
    // Add attachments
    foreach ($file_attachments as $file) {
        $file_content = file_get_contents($file['path']);
        $file_content_encoded = chunk_split(base64_encode($file_content));
        $file_name = basename($file['name']);
        
        $email_content .= "--$boundary\r\n";
        $email_content .= "Content-Type: application/octet-stream; name=\"$file_name\"\r\n";
        $email_content .= "Content-Transfer-Encoding: base64\r\n";
        $email_content .= "Content-Disposition: attachment; filename=\"$file_name\"\r\n\r\n";
        $email_content .= $file_content_encoded . "\r\n";
    }
    
    $email_content .= "--$boundary--";
    
    // Try to send the email
    $mail_sent = false;
    try {
        $mail_sent = mail($to, "Contact Form: $subject", $email_content, $headers);
    } catch (Exception $e) {
        error_log("Email sending failed: " . $e->getMessage());
        $mail_sent = false;
    }
    
    // Clean up uploaded files
    $cleanup_errors = [];
    foreach ($file_attachments as $file) {
        if (file_exists($file['path'])) {
            if (!@unlink($file['path'])) {
                $cleanup_errors[] = $file['original_name'];
                error_log("Failed to delete uploaded file: " . $file['path']);
            }
        }
    }
    
    if ($mail_sent) {
        if (!empty($cleanup_errors)) {
            error_log("Message sent but failed to delete some files: " . implode(', ', $cleanup_errors));
        }
        echo "success";
    } else {
        http_response_code(500);
        echo "An error occurred while sending the message. Please try again later.";
        
        // Log the error for debugging
        $last_error = error_get_last();
        if ($last_error) {
            error_log("PHP Error: " . print_r($last_error, true));
        }
    }
} else {
    http_response_code(405);
    echo "Method not allowed.";
}
?>
