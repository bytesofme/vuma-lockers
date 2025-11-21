const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const dbConfig = {
    host: process.env.MYSQLHOST || 'switchback.proxy.rlwy.net',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || 'pGIDBtXseEgFaexixgFIswvTdNMammuM',
    database: process.env.MYSQLDATABASE || 'railway',
    port: process.env.MYSQLPORT || 29918,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Initialize database tables
async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();
        
        // Create lockers table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS lockers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                locker_number INT UNIQUE NOT NULL,
                status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
                is_open BOOLEAN DEFAULT FALSE,
                current_user VARCHAR(50) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create admin users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert default admin user if not exists
        await connection.execute(`
            INSERT IGNORE INTO admin_users (username, password) 
            VALUES ('admin', 'admin123')
        `);

        // Insert initial lockers if not exist
        for (let i = 1; i <= 20; i++) {
            await connection.execute(`
                INSERT IGNORE INTO lockers (locker_number, status) 
                VALUES (?, 'available')
            `, [i]);
        }

        connection.release();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Routes

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Vuma Lockers API is running!',
        endpoints: {
            lockers: '/api/lockers',
            adminLogin: '/api/admin/login',
            userLogin: '/api/users/login'
        }
    });
});

// Get all lockers
app.get('/api/lockers', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM lockers ORDER BY locker_number');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching lockers:', error);
        res.status(500).json({ error: 'Failed to fetch lockers' });
    }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const [rows] = await pool.execute(
            'SELECT * FROM admin_users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (rows.length > 0) {
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// User login (simple student ID validation)
app.post('/api/users/login', async (req, res) => {
    try {
        const { studentId } = req.body;
        
        // Simple validation - you can enhance this
        if (studentId && studentId.length >= 3) {
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.status(401).json({ error: 'Invalid student ID' });
        }
    } catch (error) {
        console.error('User login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Toggle locker lock/unlock
app.post('/api/lockers/:lockerNumber/toggle', async (req, res) => {
    try {
        const lockerNumber = req.params.lockerNumber;
        
        const [rows] = await pool.execute(
            'SELECT is_open FROM lockers WHERE locker_number = ?',
            [lockerNumber]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Locker not found' });
        }

        const newStatus = !rows[0].is_open;
        
        await pool.execute(
            'UPDATE lockers SET is_open = ? WHERE locker_number = ?',
            [newStatus, lockerNumber]
        );

        res.json({ 
            success: true, 
            isOpen: newStatus,
            message: `Locker ${lockerNumber} ${newStatus ? 'unlocked' : 'locked'}`
        });
    } catch (error) {
        console.error('Toggle locker error:', error);
        res.status(500).json({ error: 'Failed to toggle locker' });
    }
});

// Set locker to maintenance
app.post('/api/lockers/:lockerNumber/maintain', async (req, res) => {
    try {
        const lockerNumber = req.params.lockerNumber;
        
        await pool.execute(
            'UPDATE lockers SET status = "maintenance", current_user = NULL WHERE locker_number = ?',
            [lockerNumber]
        );

        res.json({ 
            success: true,
            message: `Locker ${lockerNumber} set to maintenance`
        });
    } catch (error) {
        console.error('Maintain locker error:', error);
        res.status(500).json({ error: 'Failed to set locker to maintenance' });
    }
});

// Release locker
app.post('/api/lockers/:lockerNumber/release', async (req, res) => {
    try {
        const lockerNumber = req.params.lockerNumber;
        
        await pool.execute(
            'UPDATE lockers SET status = "available", current_user = NULL WHERE locker_number = ?',
            [lockerNumber]
        );

        res.json({ 
            success: true,
            message: `Locker ${lockerNumber} released`
        });
    } catch (error) {
        console.error('Release locker error:', error);
        res.status(500).json({ error: 'Failed to release locker' });
    }
});

// Occupy locker (user request)
app.post('/api/lockers/:lockerNumber/occupy', async (req, res) => {
    try {
        const lockerNumber = req.params.lockerNumber;
        const { studentId } = req.body;
        
        // Check if locker is available
        const [rows] = await pool.execute(
            'SELECT status FROM lockers WHERE locker_number = ?',
            [lockerNumber]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Locker not found' });
        }

        if (rows[0].status !== 'available') {
            return res.status(400).json({ error: 'Locker is not available' });
        }

        // Occupy the locker
        await pool.execute(
            'UPDATE lockers SET status = "occupied", current_user = ? WHERE locker_number = ?',
            [studentId, lockerNumber]
        );

        res.json({ 
            success: true,
            message: `Locker ${lockerNumber} assigned to you!`
        });
    } catch (error) {
        console.error('Occupy locker error:', error);
        res.status(500).json({ error: 'Failed to assign locker' });
    }
});

// Serve frontend
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Visit: http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
});
