<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/User.php';

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->email) && !empty($data->password)) {
    $user->email = $data->email;
    $email_exists = $user->emailExists();
    
    if($email_exists && password_verify($data->password, $user->password)) {
        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "message" => "Login successful.",
            "user_id" => $user->id,
            "name" => $user->name,
            "role" => $user->role
        ));
    } else {
        http_response_code(401);
        echo json_encode(array("success" => false, "message" => "Login failed. Invalid email or password."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Unable to login. Data is incomplete."));
}
?>