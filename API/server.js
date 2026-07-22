require('dotenv').config();
const express = require("express");
const mysql = require("mysql2"); 
const cors = require("cors");

const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, ngrok-skip-browser-warning");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

if (process.env.DB_SSL_CA) {
    dbConfig.ssl = { ca: process.env.DB_SSL_CA };
}

const db = mysql.createPool(dbConfig);

db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed: ' + err.message);
        return;
    }
    console.log('Connected to MySQL Database.');
    connection.release();
});

// ==========================================
// CREATE TABLES
// ==========================================
const tables = [
    `CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        preferred_date DATE,
        preferred_time VARCHAR(50),
        vehicle VARCHAR(255),
        notes TEXT,
        status ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS service_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50) NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        vehicle VARCHAR(255),
        notes TEXT,
        status ENUM('pending','in_progress','completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS rentals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        vehicle VARCHAR(255) NOT NULL,
        rental_class VARCHAR(50),
        start_date DATE,
        end_date DATE,
        total_price DECIMAL(10,2),
        status ENUM('reserved','active','returned','cancelled') DEFAULT 'reserved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        rating INT NOT NULL,
        vehicle VARCHAR(255),
        review_text TEXT NOT NULL,
        approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS blog_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        excerpt TEXT,
        content LONGTEXT,
        category VARCHAR(50) DEFAULT 'general',
        image_url VARCHAR(500),
        published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS parts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50),
        compatible_vehicles VARCHAR(500),
        price DECIMAL(10,2) NOT NULL,
        stock INT DEFAULT 0,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS part_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        items JSON,
        total DECIMAL(10,2),
        status ENUM('pending','processing','shipped','delivered') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        department VARCHAR(50),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
];

tables.forEach(sql => {
    db.query(sql, (err) => {
        if (err) console.error('Table creation error:', err.message);
    });
});

// ==========================================
// BOOKINGS API
// ==========================================
app.post("/api/bookings", (req, res) => {
    const { name, email, phone, service_type, preferred_date, preferred_time, vehicle, notes } = req.body;
    if (!name || !email || !phone || !service_type) {
        return res.status(400).json({ message: "Name, email, phone, and service type are required" });
    }
    const sql = "INSERT INTO bookings (name, email, phone, service_type, preferred_date, preferred_time, vehicle, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [name, email, phone, service_type, preferred_date, preferred_time, vehicle, notes], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Appointment booked successfully" });
    });
});

app.get("/api/bookings", (req, res) => {
    db.query("SELECT * FROM bookings ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
});

// ==========================================
// SERVICE RECORDS API
// ==========================================
app.post("/api/services", (req, res) => {
    const { name, email, phone, service_type, vehicle, notes } = req.body;
    if (!name || !phone || !service_type) {
        return res.status(400).json({ message: "Name, phone, and service type are required" });
    }
    const sql = "INSERT INTO service_records (name, email, phone, service_type, vehicle, notes) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [name, email, phone, service_type, vehicle, notes], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Service recorded successfully" });
    });
});

app.get("/api/services/lookup", (req, res) => {
    const phone = req.query.phone;
    if (!phone) return res.status(400).json({ message: "Phone number required" });
    db.query("SELECT * FROM service_records WHERE phone = ? ORDER BY created_at DESC", [phone], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
});

// ==========================================
// RENTALS API
// ==========================================
app.post("/api/rentals", (req, res) => {
    const { name, email, phone, vehicle, rental_class, start_date, end_date, total_price } = req.body;
    if (!name || !email || !phone || !vehicle) {
        return res.status(400).json({ message: "Name, email, phone, and vehicle are required" });
    }
    const sql = "INSERT INTO rentals (name, email, phone, vehicle, rental_class, start_date, end_date, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [name, email, phone, vehicle, rental_class, start_date, end_date, total_price], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Car reserved successfully" });
    });
});

app.get("/api/rentals", (req, res) => {
    db.query("SELECT * FROM rentals ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
});

// ==========================================
// REVIEWS API
// ==========================================
app.post("/api/reviews", (req, res) => {
    const { name, email, rating, vehicle, review_text, review } = req.body;
    const text = review_text || review;
    if (!name || !rating || !text) {
        return res.status(400).json({ message: "Name, rating, and review are required" });
    }
    const sql = "INSERT INTO reviews (name, email, rating, vehicle, review_text) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [name, email, rating, vehicle, text], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Review submitted successfully" });
    });
});

app.get("/api/reviews", (req, res) => {
    db.query("SELECT * FROM reviews WHERE approved = TRUE ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
});

// ==========================================
// BLOG API
// ==========================================
app.get("/api/blog", (req, res) => {
    db.query("SELECT * FROM blog_posts WHERE published = TRUE ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
});

app.post("/api/blog", (req, res) => {
    const { title, excerpt, content, category, image_url } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
    }
    const sql = "INSERT INTO blog_posts (title, excerpt, content, category, image_url) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [title, excerpt, content, category, image_url], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Blog post published" });
    });
});

// ==========================================
// PARTS API
// ==========================================
app.get("/api/parts", (req, res) => {
    const category = req.query.category;
    let sql = "SELECT * FROM parts";
    let params = [];
    if (category && category !== 'all') {
        sql += " WHERE category = ?";
        params.push(category);
    }
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
});

app.post("/api/parts/orders", (req, res) => {
    const { name, email, phone, items, total } = req.body;
    if (!name || !email || !phone || !items) {
        return res.status(400).json({ message: "Name, email, phone, and items are required" });
    }
    var itemsJson = typeof items === 'string' ? items : JSON.stringify(items);
    const sql = "INSERT INTO part_orders (name, email, phone, items, total) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [name, email, phone, itemsJson, total || 0], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Order placed successfully" });
    });
});

// ==========================================
// TICKETS API
// ==========================================
app.post("/api/tickets", (req, res) => {
    const { name, email, phone, department, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "Name, email, subject, and message are required" });
    }
    const sql = "INSERT INTO tickets (name, email, phone, department, subject, message) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [name, email, phone, department, subject, message], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Ticket submitted successfully" });
    });
});

app.get("/api/tickets", (req, res) => {
    db.query("SELECT * FROM tickets ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
});

// ==========================================
// EXISTING USERS / ORDERS API
// ==========================================
app.post("/api/users", (req, res) => {
    const { name, email, phoneNo, location } = req.body;
    if (!name || !email || !phoneNo || !location) {
        return res.status(400).json({ message: "All fields required" });
    }
    const sql = "INSERT INTO users (name, email, phoneNo, location) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, email, phoneNo, location], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Order placed successfully" });
    });
});

app.get("/api/users", (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
});

app.delete("/api/users/:id", (req, res) => {
    const userId = req.params.id;
    db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User deleted successfully" });
    });
});

app.put("/api/users/:id", (req, res) => {
    const userId = req.params.id;
    const { name, email, phoneNo, location } = req.body;
    if (!name || !email || !phoneNo || !location) {
        return res.status(400).json({ message: "All fields required" });
    }
    const sql = "UPDATE users SET name = ?, email = ?, phoneNo = ?, location = ? WHERE id = ?";
    db.query(sql, [name, email, phoneNo, location, userId], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User updated successfully" });
    });
});

// ==========================================
// START SERVER (local dev only)
// ==========================================
if (process.env.VERCEL !== "1") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log("Server running on port " + PORT);
    });
}

module.exports = app;
