-- Faculty Feedback System Database Migration
-- Create table for faculty feedback functionality (PostgreSQL)

-- Create faculty_feedback table
CREATE TABLE faculty_feedback (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    teaching_quality INTEGER NOT NULL CHECK (teaching_quality >= 1 AND teaching_quality <= 5),
    course_content INTEGER NOT NULL CHECK (course_content >= 1 AND course_content <= 5),
    responsiveness INTEGER NOT NULL CHECK (responsiveness >= 1 AND responsiveness <= 5),
    overall_satisfaction INTEGER NOT NULL CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
    comments TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_faculty_feedback_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_faculty_feedback_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_faculty_feedback_course FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent multiple feedback from same student for same course
    CONSTRAINT unique_student_course_feedback UNIQUE (student_id, course_id)
);

-- Create indexes for better performance
CREATE INDEX idx_faculty_feedback_teacher ON faculty_feedback (teacher_id);
CREATE INDEX idx_faculty_feedback_course ON faculty_feedback (course_id);
CREATE INDEX idx_faculty_feedback_student ON faculty_feedback (student_id);
CREATE INDEX idx_faculty_feedback_submitted_at ON faculty_feedback (submitted_at DESC);
CREATE INDEX idx_faculty_feedback_teacher_course ON faculty_feedback (teacher_id, course_id);

-- Add comment to the table for documentation
COMMENT ON TABLE faculty_feedback IS 'Stores feedback submitted by students about their instructors and courses';

-- Sample data for testing (optional - can be removed in production)
-- INSERT INTO faculty_feedback (student_id, teacher_id, course_id, teaching_quality, course_content, responsiveness, overall_satisfaction, comments, is_anonymous) VALUES
-- (1, 2, 1, 5, 4, 5, 5, 'Excellent instructor, very knowledgeable and helpful.', FALSE),
-- (3, 2, 1, 4, 4, 3, 4, 'Good teaching style but could improve response time to emails.', TRUE),
-- (4, 5, 2, 3, 3, 2, 3, 'Course content was okay but instructor was not very responsive.', TRUE);
