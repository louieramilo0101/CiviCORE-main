-- ==========================================
-- CiviCORE MySQL Database Tables
-- Run these SQL statements in HeidiSQL or MySQL Workbench
-- ==========================================

-- 1. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    date VARCHAR(50) NOT NULL,
    size VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    previewData TEXT,
    personName VARCHAR(255),
    barangay VARCHAR(255),
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Issuances Table
CREATE TABLE IF NOT EXISTS issuances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certNumber VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    barangay VARCHAR(255) NOT NULL,
    issuanceDate VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Templates Table
CREATE TABLE IF NOT EXISTS templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default templates
INSERT INTO templates (type, content) VALUES 
('birth', 'Birth Certificate Template - [PLACEHOLDER]\nChild Name: _______________\nDate of Birth: _______________'),
('death', 'Death Certificate Template - [PLACEHOLDER]\nDecedent Name: _______________\nDate of Death: _______________'),
('marriage_license', 'Marriage License Template - [PLACEHOLDER]\nGroom: _______________\nBride: _______________'),
('consentForm', 'Parental Consent Form for Marriage (Ages 18-20)\nI/We, the undersigned, do hereby give consent...'),
('adviceForm', 'Marital Advice Form (Ages 21+)\nAdvice on marriage and family responsibilities...');

-- Insert sample issuances data
INSERT INTO issuances (certNumber, type, name, barangay, issuanceDate, status) VALUES 
('BC-2026-001', 'birth', 'Juan Dela Cruz', 'Bagong Karsada', '2026-01-15', 'Issued'),
('BC-2026-002', 'birth', 'Maria Santos', 'Balsahan', '2026-01-15', 'Issued'),
('DC-2026-001', 'death', 'Jose Reyes', 'Halang', '2026-01-15', 'Issued'),
('ML-2026-001', 'marriage_license', 'Pedro & Rosa', 'Bancaan', '2026-01-15', 'Issued'),
('BC-2026-003', 'birth', 'Anna Santos', 'Capt. C. Nazareno (Pob.)', '2026-01-15', 'Pending');
