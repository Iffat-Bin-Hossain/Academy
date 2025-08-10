-- Attendance System Database Migration
-- Create tables for attendance tracking functionality

-- Create attendance_sessions table
CREATE TABLE attendance_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    session_date DATE NOT NULL,
    session_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_attendance_session_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_session_teacher FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate sessions on same date for same course
    UNIQUE KEY unique_course_session_date (course_id, session_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create attendance_records table
CREATE TABLE attendance_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    attendance_session_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    status ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED') NOT NULL DEFAULT 'ABSENT',
    marked_by BIGINT,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_attendance_record_session FOREIGN KEY (attendance_session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_record_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_record_marker FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique constraint to prevent duplicate records for same student in same session
    UNIQUE KEY unique_session_student (attendance_session_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX idx_attendance_sessions_course_date ON attendance_sessions (course_id, session_date DESC);
CREATE INDEX idx_attendance_sessions_created_by ON attendance_sessions (created_by);
CREATE INDEX idx_attendance_records_session ON attendance_records (attendance_session_id);
CREATE INDEX idx_attendance_records_student ON attendance_records (student_id);
CREATE INDEX idx_attendance_records_status ON attendance_records (status);

-- Insert some sample data (optional - remove if not needed)
-- Note: Replace course_id and user_id values with actual IDs from your database

-- Example attendance session for course ID 1 (replace with actual course ID)
INSERT INTO attendance_sessions (course_id, session_date, session_name, description, created_by) 
VALUES 
(1, '2024-01-15', 'Week 1 - Introduction', 'First class of the semester', 1),
(1, '2024-01-17', 'Week 1 - Fundamentals', 'Basic concepts overview', 1),
(1, '2024-01-22', 'Week 2 - Deep Dive', 'Advanced topics discussion', 1);

-- Example attendance records (replace session IDs and student IDs with actual values)
INSERT INTO attendance_records (attendance_session_id, student_id, status, marked_by) 
VALUES 
(1, 2, 'PRESENT', 1),
(1, 3, 'PRESENT', 1),
(1, 4, 'ABSENT', 1),
(2, 2, 'LATE', 1),
(2, 3, 'PRESENT', 1),
(2, 4, 'PRESENT', 1),
(3, 2, 'PRESENT', 1),
(3, 3, 'EXCUSED', 1),
(3, 4, 'PRESENT', 1);

-- Verify the tables were created successfully
SHOW TABLES LIKE 'attendance_%';
DESCRIBE attendance_sessions;
DESCRIBE attendance_records;

-- Sample queries to test the system
-- Get all attendance sessions for a course
SELECT * FROM attendance_sessions WHERE course_id = 1 ORDER BY session_date DESC;

-- Get attendance records for a specific session
SELECT ar.*, u.name as student_name, u.email as student_email
FROM attendance_records ar
JOIN users u ON ar.student_id = u.id
WHERE ar.attendance_session_id = 1;

-- Get attendance summary for a student in a course
SELECT 
    s.student_id,
    u.name as student_name,
    COUNT(ar.id) as total_sessions,
    SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
    SUM(CASE WHEN ar.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
    SUM(CASE WHEN ar.status = 'LATE' THEN 1 ELSE 0 END) as late_count,
    SUM(CASE WHEN ar.status = 'EXCUSED' THEN 1 ELSE 0 END) as excused_count,
    ROUND((SUM(CASE WHEN ar.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END) / COUNT(ar.id)) * 100, 2) as attendance_percentage
FROM attendance_sessions s
LEFT JOIN attendance_records ar ON s.id = ar.attendance_session_id
LEFT JOIN users u ON ar.student_id = u.id
WHERE s.course_id = 1
GROUP BY s.student_id, u.name;
