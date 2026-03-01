require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// This tells the server to look in 'public' for your index.html
app.use(express.static('public')); 

// Database connection using environment variables
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'civicore_db'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ MySQL Connected successfully via Laragon!');
    console.log('✓ OCR System Initialized and Ready'); // As per your docs
});

// LOGIN ROUTE: This checks the database when you click Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length > 0) {
            // Success! Send the user data back to the website
            const user = results[0];
            
            // Parse permissions from JSON string to array if it exists
            if (user.permissions && typeof user.permissions === 'string') {
                try {
                    user.permissions = JSON.parse(user.permissions);
                } catch (e) {
                    // If parsing fails, set to empty array
                    user.permissions = [];
                }
            }
            
            res.json({ success: true, user: user });
        } else {
            // Failed login
            res.status(401).json({ success: false, message: "Invalid email or password" });
        }
    });
});

// CREATE USER ROUTE: Allows Super Admin to add new accounts
app.post('/api/create-account', (req, res) => {
    // 1. Removed 'department' from here
    const { name, email, password, role } = req.body;

    let permissions = '["View Dashboard", "View Services"]'; 
    if (role === 'Super Admin') {
        permissions = '["View Dashboard", "Upload Documents", "Manage Users", "Edit Permissions", "Mapping Analytics"]';
    } else if (role === 'Admin') {
        permissions = '["View Dashboard", "Upload Documents", "Mapping Analytics", "View Reports"]';
    }

    // 2. Removed 'department' from the SQL query and the list of values
    const sql = "INSERT INTO users (name, email, password, role, permissions) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [name, email, password, role, permissions], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        console.log(`✅ Account created: ${name} (${email})`); 
        res.json({ success: true, message: "Account created successfully!" });
    });
});

// CHANGE PASSWORD ROUTE: Allows users to change their password
app.post('/api/change-password', (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;

    // First, verify the user exists and current password is correct
    const sql = "SELECT * FROM users WHERE id = ? AND password = ?";
    db.query(sql, [userId, currentPassword], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "Current password is incorrect" });
        }

        // Update the password
        const updateSql = "UPDATE users SET password = ? WHERE id = ?";
        db.query(updateSql, [newPassword, userId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            console.log(`✅ Password changed for user ID: ${userId}`);
            res.json({ success: true, message: "Password changed successfully!" });
        });
    });
});

// ==========================================
// DOCUMENTS API ENDPOINTS
// ==========================================

// GET all documents
app.get('/api/documents', (req, res) => {
    const sql = "SELECT * FROM documents ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// POST new document
app.post('/api/documents', (req, res) => {
    const { name, type, date, size, status, previewData, personName, barangay, metadata } = req.body;
    const sql = "INSERT INTO documents (name, type, date, size, status, previewData, personName, barangay, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [name, type, date, size, status, previewData, personName, barangay, metadata], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: result.insertId });
    });
});

// DELETE document
app.delete('/api/documents/:id', (req, res) => {
    const sql = "DELETE FROM documents WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ==========================================
// ISSUANCES API ENDPOINTS
// ==========================================

// GET all issuances
app.get('/api/issuances', (req, res) => {
    const sql = "SELECT * FROM issuances ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// GET issuance by ID
app.get('/api/issuances/:id', (req, res) => {
    const sql = "SELECT * FROM issuances WHERE id = ?";
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});

// POST new issuance
app.post('/api/issuances', (req, res) => {
    const { certNumber, type, name, barangay, issuanceDate, status } = req.body;
    const sql = "INSERT INTO issuances (certNumber, type, name, barangay, issuanceDate, status) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [certNumber, type, name, barangay, issuanceDate, status], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: result.insertId });
    });
});

// GET next certificate number (auto-generate)
app.get('/api/issuances/next-cert-number/:type', (req, res) => {
    const type = req.params.type;
    let prefix = 'BC';
    if (type === 'death') prefix = 'DC';
    if (type === 'marriage' || type === 'marriage_license') prefix = 'ML';
    
    const year = new Date().getFullYear();
    const sql = "SELECT certNumber FROM issuances WHERE type = ? AND certNumber LIKE ? ORDER BY id DESC LIMIT 1";
    db.query(sql, [type, `${prefix}-${year}%`], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        let nextNum = 1;
        if (results.length > 0) {
            const lastCertNum = results[0].certNumber;
            const parts = lastCertNum.split('-');
            if (parts.length === 3) {
                nextNum = parseInt(parts[2]) + 1;
            }
        }
        
        const certNumber = `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`;
        res.json({ certNumber });
    });
});

// ==========================================
// BARANGAYS API ENDPOINTS
// ==========================================

// GET all barangays
app.get('/api/barangays', (req, res) => {
    const sql = "SELECT * FROM barangays ORDER BY name ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            const naicBarangays = [
                "Gomez-Zamora (Pob.)", "Capt. C. Nazareno (Pob.)", "Ibayo Silangan",
                "Ibayo Estacion", "Kanluran", "Makina", "Sapa", "Bucana Malaki",
                "Bucana Sasahan", "Bagong Karsada", "Balsahan", "Bancaan", "Muzon",
                "Latoria", "Labac", "Mabolo", "San Roque", "Santulan", "Molino",
                "Calubcob", "Halang", "Malainen Bago", "Malainen Luma", "Palangue 1",
                "Palangue 2 & 3", "Humbac", "Munting Mapino", "Sabang", "Timalan Balsahan",
                "Timalan Concepcion"
            ];
            res.json(naicBarangays.map(name => ({ name })));
        } else {
            res.json(results);
        }
    });
});

// ==========================================
// TEMPLATES API ENDPOINTS
// ==========================================

// GET all templates
app.get('/api/templates', (req, res) => {
    const sql = "SELECT * FROM templates";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        // Convert array to object with type as key
        const templates = {};
        results.forEach(t => { templates[t.type] = t.content; });
        res.json(templates);
    });
});

// UPDATE template
app.put('/api/templates/:type', (req, res) => {
    const { content } = req.body;
    const sql = "UPDATE templates SET content = ? WHERE type = ?";
    db.query(sql, [content, req.params.type], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ==========================================
// USERS API ENDPOINTS (for management)
// ==========================================

// GET all users
app.get('/api/users', (req, res) => {
    const sql = "SELECT * FROM users ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        // Parse permissions for each user
        results.forEach(user => {
            if (user.permissions && typeof user.permissions === 'string') {
                try { user.permissions = JSON.parse(user.permissions); } 
                catch (e) { user.permissions = []; }
            }
        });
        res.json(results);
    });
});

// GET user by ID
app.get('/api/users/:id', (req, res) => {
    const sql = "SELECT * FROM users WHERE id = ?";
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        const user = results[0];
        if (user.permissions && typeof user.permissions === 'string') {
            try { user.permissions = JSON.parse(user.permissions); } 
            catch (e) { user.permissions = []; }
        }
        res.json(user);
    });
});

// UPDATE user (role and permissions)
app.put('/api/users/:id', (req, res) => {
    const { role, permissions } = req.body;
    const permissionsJson = JSON.stringify(permissions);
    const sql = "UPDATE users SET role = ?, permissions = ? WHERE id = ?";
    db.query(sql, [role, permissionsJson, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// UPDATE user profile (name and email)
app.put('/api/users/:id/profile', (req, res) => {
    const { name, email } = req.body;
    const sql = "UPDATE users SET name = ?, email = ? WHERE id = ?";
    db.query(sql, [name, email, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Profile updated successfully!" });
    });
});

// DELETE user
app.delete('/api/users/:id', (req, res) => {
    const sql = "DELETE FROM users WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Port for your local website
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 CiviCORE running at http://localhost:${PORT}`);
});
