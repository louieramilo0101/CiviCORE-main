require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images and PDF files are allowed'));
        }
    }
});

// Session middleware
app.use(session({
    secret: 'civicore_secret_key_2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

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
    console.log('✓ OCR System Initialized and Ready');
});

// LOGIN ROUTE: This checks the database when you click Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length > 0) {
            const user = results[0];
            
            // Parse permissions from JSON string to array if it exists
            // Handle both string and already-parsed array cases
            if (user.permissions) {
                if (typeof user.permissions === 'string') {
                    try {
                        user.permissions = JSON.parse(user.permissions);
                    } catch (e) {
                        user.permissions = [];
                    }
                } else if (typeof user.permissions === 'object' && !Array.isArray(user.permissions)) {
                    // If it's an object (MySQL JSON column), try to parse it
                    try {
                        user.permissions = JSON.parse(JSON.stringify(user.permissions));
                    } catch (e) {
                        user.permissions = [];
                    }
                }
                // If it's already an array, keep it as is
            } else {
                user.permissions = [];
            }
            
            // Store user in session
            req.session.user = user;
            
            console.log('Login - User permissions:', user.permissions);
            res.json({ success: true, user: user });
        } else {
            res.status(401).json({ success: false, message: "Invalid email or password" });
        }
    });
});

// SESSION VALIDATION: Check if user session is valid - ALWAYS fetch fresh data from database
app.get('/api/session', (req, res) => {
    if (req.session && req.session.user) {
        // ALWAYS fetch fresh user data from database to get latest permissions
        const userId = req.session.user.id;
        const sql = "SELECT * FROM users WHERE id = ?";
        
        db.query(sql, [userId], (err, results) => {
            if (err) {
                console.error('Error fetching fresh user data:', err);
                // If database query fails, fall back to session data
                return res.json({ 
                    success: true, 
                    user: req.session.user,
                    sessionId: req.sessionID 
                });
            }
            
            if (results.length === 0) {
                // User was deleted from database, clear session
                req.session.destroy();
                return res.status(401).json({ 
                    success: false, 
                    message: "User not found" 
                });
            }
            
            // Parse permissions from fresh database data
            const freshUser = results[0];
            if (freshUser.permissions) {
                if (typeof freshUser.permissions === 'string') {
                    try {
                        freshUser.permissions = JSON.parse(freshUser.permissions);
                    } catch (e) {
                        freshUser.permissions = [];
                    }
                } else if (typeof freshUser.permissions === 'object' && !Array.isArray(freshUser.permissions)) {
                    try {
                        freshUser.permissions = JSON.parse(JSON.stringify(freshUser.permissions));
                    } catch (e) {
                        freshUser.permissions = [];
                    }
                }
            } else {
                freshUser.permissions = [];
            }
            
            console.log('Session validated - fresh permissions from DB:', freshUser.permissions);
            
            // Update session with fresh data
            req.session.user = freshUser;
            
            res.json({ 
                success: true, 
                user: freshUser,
                sessionId: req.sessionID 
            });
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: "No active session" 
        });
    }
});

// LOGOUT ROUTE: Destroy session
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Logout failed" });
        }
        res.json({ success: true, message: "Logged out successfully" });
    });
});

// CREATE USER ROUTE: Allows Super Admin to add new accounts
app.post('/api/create-account', (req, res) => {
    const { name, email, password, role } = req.body;

    let permissions = '["View Dashboard", "View Services"]'; 
    if (role === 'Super Admin') {
        permissions = '["View Dashboard", "Upload Documents", "Manage Users", "Edit Permissions", "Mapping Analytics"]';
    } else if (role === 'Admin') {
        permissions = '["View Dashboard", "Upload Documents", "Mapping Analytics", "View Reports"]';
    }

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

    const sql = "SELECT * FROM users WHERE id = ? AND password = ?";
    db.query(sql, [userId, currentPassword], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "Current password is incorrect" });
        }

        const updateSql = "UPDATE users SET password = ? WHERE id = ?";
        db.query(updateSql, [newPassword, userId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            console.log(`✅ Password changed for user ID: ${userId}`);
            res.json({ success: true, message: "Password changed successfully!" });
        });
    });
});

// VERIFY PASSWORD ROUTE: Verifies if password is correct (for confirmation modals)
app.post('/api/verify-password', (req, res) => {
    const { userId, password } = req.body;

    const sql = "SELECT * FROM users WHERE id = ? AND password = ?";
    db.query(sql, [userId, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }

        res.json({ success: true, message: "Password verified" });
    });
});

// ==========================================
// DOCUMENTS API ENDPOINTS
// ==========================================

app.get('/api/documents', (req, res) => {
    const sql = "SELECT * FROM documents ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/documents', (req, res) => {
    const { name, type, date, size, status, previewData, personName, barangay, metadata } = req.body;
    const sql = "INSERT INTO documents (name, type, date, size, status, previewData, personName, barangay, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [name, type, date, size, status, previewData, personName, barangay, metadata], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: result.insertId });
    });
});

app.delete('/api/documents/:id', (req, res) => {
    const sql = "DELETE FROM documents WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// FILE UPLOAD ENDPOINT - Handle file upload with multipart form data
app.post('/api/documents/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const { docType, personName, barangay } = req.body;
    
    // Get file info
    const fileInfo = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
    };
    
    // Save document metadata to database
    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const sql = "INSERT INTO documents (name, type, date, size, status, previewData, personName, barangay, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [
        req.file.originalname,
        docType || 'Uncategorized',
        new Date().toLocaleDateString(),
        fileSizeMB,
        'Uploaded',
        null, // previewData - can be generated from file if needed
        personName || '',
        barangay || '',
        JSON.stringify(fileInfo)
    ], (err, result) => {
        if (err) {
            console.error('Error saving document:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        console.log(`✅ File uploaded: ${req.file.originalname}`);
        res.json({ 
            success: true, 
            id: result.insertId,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: fileSizeMB
        });
    });
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// ==========================================
// ISSUANCES API ENDPOINTS
// ==========================================

app.get('/api/issuances', (req, res) => {
    const sql = "SELECT * FROM issuances ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/issuances/:id', (req, res) => {
    const sql = "SELECT * FROM issuances WHERE id = ?";
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(results[0]);
    });
});

app.post('/api/issuances', (req, res) => {
    const { certNumber, type, name, barangay, issuanceDate, status } = req.body;
    const sql = "INSERT INTO issuances (certNumber, type, name, barangay, issuanceDate, status) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [certNumber, type, name, barangay, issuanceDate, status], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: result.insertId });
    });
});

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

app.get('/api/templates', (req, res) => {
    const sql = "SELECT * FROM templates";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const templates = {};
        results.forEach(t => { templates[t.type] = t.content; });
        res.json(templates);
    });
});

app.put('/api/templates/:type', (req, res) => {
    const { content } = req.body;
    const sql = "UPDATE templates SET content = ? WHERE type = ?";
    db.query(sql, [content, req.params.type], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ==========================================
// USERS API ENDPOINTS
// ==========================================

app.get('/api/users', (req, res) => {
    const sql = "SELECT * FROM users ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        results.forEach(user => {
            if (user.permissions && typeof user.permissions === 'string') {
                try { user.permissions = JSON.parse(user.permissions); } 
                catch (e) { user.permissions = []; }
            }
        });
        res.json(results);
    });
});

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

app.put('/api/users/:id', (req, res) => {
    const { role, permissions } = req.body;
    console.log('UPDATE USER - Request params:', req.params.id);
    console.log('UPDATE USER - Request body:', req.body);
    
    // Automatically assign correct permissions based on role
    let updatedPermissions;
    if (role === 'Super Admin') {
        updatedPermissions = ["View Dashboard", "Upload Documents", "Manage Users", "Edit Permissions", "Mapping Analytics"];
    } else if (role === 'Admin') {
        updatedPermissions = ["View Dashboard", "Upload Documents", "Mapping Analytics", "View Reports"];
    } else if (role === 'User') {
        updatedPermissions = ["View Dashboard", "View Services"];
    } else {
        // For any other role or if role is not provided, use the provided permissions
        updatedPermissions = permissions || [];
    }
    
    const permissionsJson = JSON.stringify(updatedPermissions);
    const sql = "UPDATE users SET role = ?, permissions = ? WHERE id = ?";
    db.query(sql, [role, permissionsJson, req.params.id], (err, result) => {
        if (err) {
            console.error('UPDATE USER - Error:', err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log('UPDATE USER - Success, result:', result);
        console.log('UPDATE USER - Permissions set for role:', role, '->', updatedPermissions);
        res.json({ success: true });
    });
});

app.put('/api/users/:id/profile', (req, res) => {
    const { name, email } = req.body;
    const sql = "UPDATE users SET name = ?, email = ? WHERE id = ?";
    db.query(sql, [name, email, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Profile updated successfully!" });
    });
});

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
