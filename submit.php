<?php
// Report all errors
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CHECK 1: Function exists (low-level check)
if (function_exists('curl_init')) {
    echo "<h1>SUCCESS: cURL extension is installed.</h1>";
    // CHECK 2: Try a simple connection test
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.telegram.org/bot"); // Just hitting the root URL
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5); // 5 second timeout
    $result = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($result === FALSE && $error) {
        echo "<h2>ERROR: cURL is installed but network connection is blocked or failing.</h2>";
        echo "<p>CURL Error Details: " . $error . "</p>";
        echo "<p><strong>ACTION:</strong> Contact your host about the firewall/network block.</p>";
    } else {
        echo "<h2>SUCCESS: cURL is installed and can connect to Telegram API.</h2>";
        echo "<p><strong>ACTION:</strong> The error is likely in the file upload method or syntax. Please re-check the script provided in Step 1.</p>";
    }

} else {
    echo "<h1>FATAL ERROR: cURL extension is NOT installed.</h1>";
    echo "<p><strong>ACTION:</strong> You must contact your host and ask them to enable the cURL extension for PHP.</p>";
}

// Do not redirect, we want to see the output.
exit;
?>
