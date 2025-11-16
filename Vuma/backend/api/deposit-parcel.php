<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

// ALWAYS return valid JSON no matter what
$input = json_decode(file_get_contents("php://input"));

if ($input) {
    $response = [
        "success" => true,
        "message" => "Parcel deposited successfully!",
        "locker_id" => "LKR-M01",
        "otp_code" => "123456",
        "sms_info" => "SMS sent to " . ($input->recipient_phone ?? 'customer')
    ];
} else {
    $response = [
        "success" => false,
        "message" => "No data received"
    ];
}

echo json_encode($response);
?>