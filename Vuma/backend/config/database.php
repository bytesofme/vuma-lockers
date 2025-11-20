<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    public $conn;

    public function __construct() {
        // For Railway MySQL
        if (getenv('MYSQLHOST')) {
            $this->host = getenv('MYSQLHOST');
            $this->username = getenv('MYSQLUSER');
            $this->password = getenv('MYSQLPASSWORD');
            $this->db_name = getenv('MYSQLDATABASE');
            $this->port = getenv('MYSQLPORT') ?: '3306';
        }
        // For local development
        else {
            $this->host = "localhost";
            $this->db_name = "vuma_lockers";
            $this->username = "root";
            $this->password = "";
            $this->port = "3306";
        }
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            error_log("✅ Database connected successfully to: " . $this->host);
        } catch(PDOException $exception) {
            error_log("❌ Database connection failed: " . $exception->getMessage());
            return null;
        }
        return $this->conn;
    }
}
?>
