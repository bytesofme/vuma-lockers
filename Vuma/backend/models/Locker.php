<?php
class Locker {
    private $conn;
    private $table_name = "lockers";

    public $id;
    public $size;
    public $status;
    public $location;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Update locker status
    public function updateStatus($status) {
        $query = "UPDATE lockers SET status = ? WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $status);
        $stmt->bindParam(2, $this->id);
        return $stmt->execute();
    }

    // Get all lockers
    public function readAll() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
}
?>