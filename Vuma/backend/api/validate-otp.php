<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Parcel.php';

$database = new Database();
$db = $database->getConnection();
$parcel = new Parcel($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->parcel_id) && !empty($data->otp_code)) {
    
    if($parcel->validateOTP($data->parcel_id, $data->otp_code)) {
        // Update parcel status
        $parcel->updateStatus($data->parcel_id, 'picked_up');
        
        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "message" => "OTP validated successfully"
        ));
    } else {
        http_response_code(401);
        echo json_encode(array("success" => false, "message" => "Invalid or expired OTP"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Incomplete data"));
}
?>