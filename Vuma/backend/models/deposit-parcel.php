<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Parcel.php';
include_once '../models/Locker.php';

$database = new Database();
$db = $database->getConnection();
$parcel = new Parcel($db);
$locker = new Locker($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->tracking_number) && !empty($data->recipient_phone) && !empty($data->parcel_size)) {
    
    // Get available locker
    $availableLocker = $parcel->getAvailableLocker($data->parcel_size);
    
    if($availableLocker) {
        // Generate OTP
        $otp = rand(100000, 999999);
        
        $parcel->tracking_number = $data->tracking_number;
        $parcel->recipient_phone = $data->recipient_phone;
        $parcel->locker_id = $availableLocker['id'];
        $parcel->agent_id = $data->agent_id ?? 1;
        $parcel->otp_code = $otp;
        
        if($parcel->create()) {
            // Update locker status
            $locker->id = $availableLocker['id'];
            $locker->updateStatus('occupied');
            
            http_response_code(201);
            echo json_encode(array(
                "success" => true,
                "message" => "Parcel deposited successfully",
                "locker_id" => $availableLocker['id'],
                "otp_code" => $otp
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("success" => false, "message" => "Unable to deposit parcel"));
        }
    } else {
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "No available lockers"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Incomplete data"));
}
?>