<?php
class Parcel {
    private $conn;
    private $table_name = "parcels";

    public $id;
    public $tracking_number;
    public $recipient_phone;
    public $locker_id;
    public $agent_id;
    public $status;
    public $deposit_time;
    public $pickup_time;
    public $otp_code;
    public $otp_expiry;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create new parcel
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET tracking_number=:tracking_number, recipient_phone=:recipient_phone,
                      locker_id=:locker_id, agent_id=:agent_id, status=:status,
                      otp_code=:otp_code, otp_expiry=:otp_expiry";
        
        $stmt = $this->conn->prepare($query);
        
        $this->status = 'awaiting_pickup';
        $this->otp_expiry = date('Y-m-d H:i:s', strtotime('+10 minutes'));
        
        $stmt->bindParam(":tracking_number", $this->tracking_number);
        $stmt->bindParam(":recipient_phone", $this->recipient_phone);
        $stmt->bindParam(":locker_id", $this->locker_id);
        $stmt->bindParam(":agent_id", $this->agent_id);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":otp_code", $this->otp_code);
        $stmt->bindParam(":otp_expiry", $this->otp_expiry);
        
        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Get available locker
    public function getAvailableLocker($size) {
        $query = "SELECT id FROM lockers WHERE size = ? AND status = 'available' LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $size);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Validate OTP
    public function validateOTP($parcel_id, $otp_code) {
        $query = "SELECT * FROM parcels WHERE id = ? AND otp_code = ? AND otp_expiry > NOW() AND status = 'awaiting_pickup'";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $parcel_id);
        $stmt->bindParam(2, $otp_code);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }

    // Update parcel status
    public function updateStatus($parcel_id, $status) {
        $query = "UPDATE parcels SET status = ?, pickup_time = ? WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        
        $pickup_time = ($status == 'picked_up') ? date('Y-m-d H:i:s') : null;
        
        $stmt->bindParam(1, $status);
        $stmt->bindParam(2, $pickup_time);
        $stmt->bindParam(3, $parcel_id);
        
        return $stmt->execute();
    }
}
?>