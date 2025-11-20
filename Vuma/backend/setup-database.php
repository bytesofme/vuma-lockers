<?php
include_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db) {
    // Create users table
    $query = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('customer', 'agent', 'admin') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    $db->exec($query);
    echo "✅ Users table created\n";

    // Create parcels table
    $query = "CREATE TABLE IF NOT EXISTS parcels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tracking_number VARCHAR(100) UNIQUE NOT NULL,
        recipient_phone VARCHAR(20) NOT NULL,
        parcel_size ENUM('small', 'medium', 'large', 'xlarge') NOT NULL,
        locker_id VARCHAR(50),
        otp_code VARCHAR(10),
        status ENUM('deposited', 'picked_up') DEFAULT 'deposited',
        agent_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES users(id)
    )";
    
    $db->exec($query);
    echo "✅ Parcels table created\n";

    // Create test data
    $hashed_admin = password_hash('admin123', PASSWORD_DEFAULT);
    $hashed_agent = password_hash('agent123', PASSWORD_DEFAULT);
    $hashed_customer = password_hash('customer123', PASSWORD_DEFAULT);

    $users = [
        ['Admin User', 'admin@vuma.com', '+254700000000', $hashed_admin, 'admin'],
        ['Delivery Agent', 'agent@vuma.com', '+254711223344', $hashed_agent, 'agent'],
        ['Test Customer', 'customer@vuma.com', '+254722334455', $hashed_customer, 'customer']
    ];

    foreach ($users as $user) {
        $stmt = $db->prepare("INSERT IGNORE INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute($user);
    }
    echo "✅ Test users created\n";

    echo "🎉 Database setup completed successfully!";
} else {
    echo "❌ Database connection failed";
}
?>
