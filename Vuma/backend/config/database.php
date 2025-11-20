<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        // For production (Heroku/Railway)
        if (getenv('CLEARDB_DATABASE_URL')) {
            $url = parse_url(getenv('CLEARDB_DATABASE_URL'));
            $this->host = $url['host'];
            $this->username = $url['user'];
            $this->password = $url['pass'];
            $this->db_name = substr($url['path'], 1);
        } else {
            // For local development
            $this->host = "localhost";
            $this->db_name = "vuma_lockers";
            $this->username = "root";
            $this->password = "";
        }
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>
