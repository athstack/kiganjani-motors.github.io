require('dotenv').config(); // Loaded at the very top
const express = require("express");
const mysql = require("mysql2"); 
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({
    origin: [
        "https://athstack.github.io",
        "https://petty-directory-frigidly.ngrok-free.dev",
        "http://localhost:8080"
    ]
}));

// ==========================================
// ☁️ CLOUD DATABASE POOL CONFIGURATION 
// ==========================================
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10, 
    queueLimit: 0
});

// Test the cloud pool connection profile
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Cloud Database pool connection failed: ' + err.message);
        return;
    }
    console.log('✅ Connected to MySQL Cloud Database Pool.');
    connection.release(); // Crucial: gives the connection back to the pool
});

// ==========================================
// 🛣️ API ROUTES
// ==========================================

// Create a new user / order
app.post("/api/users", (req, res) => {
    const { name, email, phoneNo, location } = req.body;

    if (!name || !email || !phoneNo || !location) {
        return res.status(400).json({ message: "All fields required" });
    }

    const sql = "INSERT INTO users (name, email, phoneNo, location) VALUES (?, ?, ?, ?)";

    db.query(sql, [name, email, phoneNo, location], (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.json({ message: "Order placed successfully" });
    });
});

// Fetch all users from database
app.get("/api/users", (req, res) => {
    const sql = "SELECT * FROM users";
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.json(results);
    });
});

// Delete a specific user by their ID URL parameter
app.delete("/api/users/:id", (req, res) => {
    const userId = req.params.id;
    const sql = "DELETE FROM users WHERE id = ?";
    
    db.query(sql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: `User with ID ${userId} deleted successfully` });
    });
});

// Update an existing user's details by their ID
app.put("/api/users/:id", (req, res) => {
    const userId = req.params.id;
    const { name, email, phoneNo, location } = req.body;

    if (!name || !email || !phoneNo || !location) {
        return res.status(400).json({ message: "All fields are required for updates" });
    }

    const sql = "UPDATE users SET name = ?, email = ?, phoneNo = ?, location = ? WHERE id = ?";
    db.query(sql, [name, email, phoneNo, location, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: `User with ID ${userId} updated successfully` });
    });
});

// ==========================================
// 🚀 START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});