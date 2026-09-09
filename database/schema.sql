-- ==========================================================
-- Student Certificate Attestations Database Schema
-- Dedicated to: مدرسة مخيم الزعتري الأساسية الثانية للبنين
-- Table: certificate_requests (Single school - no school_name column)
-- ==========================================================

CREATE TABLE IF NOT EXISTS certificate_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name VARCHAR(255) NOT NULL,
    grade_level TEXT NOT NULL,
    security_number VARCHAR(100),
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    academic_year VARCHAR(9) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'انتظار',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fast indexed lookup by security_number (optional, allows multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cert_security_number 
ON certificate_requests (security_number)
WHERE security_number IS NOT NULL AND security_number != '';

-- Index for searching student names
CREATE INDEX IF NOT EXISTS idx_cert_student_name 
ON certificate_requests (student_name);

-- Index for academic year reporting
CREATE INDEX IF NOT EXISTS idx_cert_academic_year 
ON certificate_requests (academic_year);

-- Index for status filtering in administrative dashboard
CREATE INDEX IF NOT EXISTS idx_cert_status 
ON certificate_requests (status);
