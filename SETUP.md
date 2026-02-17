# CiviCORE - Local Setup Guide for Team Members

This guide will help you set up CiviCORE locally on your computer.

## Prerequisites

- **Laragon** (with MySQL enabled) - https://laragon.org/
- **Node.js** - https://nodejs.org/ ( LTS version recommended)

---

## Step 1: Install Dependencies

1. Open your terminal/command prompt
2. Navigate to the project folder:
   
```
bash
   cd /path/to/CiviCORE
   
```
3. Install the required packages:
   
```
bash
   npm install
   
```

---

## Step 2: Set Up the Database

### Option C: Import Ready-made Database (Easiest!)

 (`civicore_db.sql`), follow these steps:

1. **Open HeidiSQL** (from Laragon's menu)(Database)
2. **Create an empty database**:
   - Right-click on left sidebar → "Create new" → "Database"
   - Name it: `civicore_db`
   - Click "Create"

3. **Import the database**:
   - Select `civicore_db` in the left sidebar
   - Go to File → "Load SQL file..."
   - Navigate to the exported database file (e.g., `civicore_db.sql`)
   - Click "Run" (or press F9)

4. **Done!** The database is ready with all data included.

### Option A: Using Laragon (Recommended)

1. **Open Laragon** and make sure MySQL is running (green indicator)
2. **Open HeidiSQL** (can be launched from Laragon's menu)
3. In HeidiSQL:
   - Right-click on the left sidebar → "Create new" → "Database"
   - Name it: `civicore_db`
   - Click "Create"

4. **Create the tables**:
   - Select `civicore_db` in the left sidebar
   - Go to File → "Load SQL file..."
   - Navigate to the project folder and select `database_tables.sql`
   - Click "Run" (or press F9)

5. **Create a test user** (for logging in):
   - In HeidiSQL, right-click on `civicore_db` → "Query tab"
   - Run this SQL:
   
```
sql
   INSERT INTO users (name, email, password, role, permissions) 
   VALUES ('Test Admin', 'admin@test.com', 'admin123', 'Super Admin', '["View Dashboard", "Upload Documents", "Manage Users", "Edit Permissions", "Mapping Analytics"]');
   
```

### Option B: Using MySQL Command Line

1. Open Laragon terminal or MySQL command line
2. Run:
   
```
bash
   mysql -u root
   
```
3. Create database and tables:
   
```
sql
   CREATE DATABASE civicore_db;
   USE civicore_db;
   SOURCE path/to/database_tables.sql;
   
```

---

## How to Export Your Database

If you want to share your existing database:

1. **Open HeidiSQL**
2. Right-click on `civicore_db` database
3. Select **"Export database as SQL"**
4. In the export options:
   - Check **"Create database"** 
   - Check **"Export data"** (not just structure)
   - Uncheck "Drop statements" if you want to keep existing data
5. Save as `civicore_db.sql` in the project folder
6. Share this file with your team!

---

## Step 3: Configure Environment Variables

1. In the project folder, find the file named `.env.example`
2. Create a new file called `.env` (copy from .env.example)
3. Open `.env` in a text editor and update if needed:
   
```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=civicore_db
   PORT=5000
   
```
   - If your MySQL has a password, add it after `DB_PASSWORD=`

---

## Step 4: Run the Application

1. In your terminal, make sure you're in the project folder
2. Start the server:
   
```
bash
   node server.js
   
```
3. You should see:
   
```
   ✅ MySQL Connected successfully via Laragon!
   ✓ OCR System Initialized and Ready
   🚀 CiviCORE running at http://localhost:5000
   
```

---

## Step 5: Access the Application

1. Open your browser
2. Go to: **http://localhost:5000**
3. Login with the test account:
   - Email: `admin@test.com`
   - Password: `admin123`

---

## Troubleshooting

### ❌ "Database connection failed" error
- Make sure Laragon MySQL is running (green indicator in Laragon)
- Check your `.env` file has correct database credentials
- Verify the database `civicore_db` exists in HeidiSQL

### ❌ "Cannot find module" error
- Run `npm install` again to ensure all packages are installed

### ❌ Port 5000 is already in use
- Change the port in `.env` file to something else (e.g., 3000)
- Or stop the other application using port 5000

---

## For Team Lead Only

To create additional user accounts:
1. Login as Super Admin
2. Go to "Manage Users" section
3. Click "Add New User"
4. Fill in the details and select a role

---

## Need Help?

If you encounter any issues, contact the team lead or check the project documentation.
