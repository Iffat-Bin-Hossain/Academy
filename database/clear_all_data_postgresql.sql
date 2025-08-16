-- PostgreSQL Database Cleanup Script
-- This script will clear all data from all tables in the Academy database
-- Execute this carefully as it will permanently delete all data

-- Clear tables in the correct order to handle dependencies
-- Start with tables that have the most foreign key dependencies

-- Clear attendance records first (depends on attendance_sessions and users)
TRUNCATE TABLE attendance_records RESTART IDENTITY CASCADE;

-- Clear attendance sessions (depends on courses and users)
TRUNCATE TABLE attendance_sessions RESTART IDENTITY CASCADE;

-- Clear faculty feedback (depends on users and assignments)
TRUNCATE TABLE faculty_feedback RESTART IDENTITY CASCADE;

-- Clear assessment grids (depends on users and assignments)
TRUNCATE TABLE assessment_grids RESTART IDENTITY CASCADE;

-- Clear post reactions (depends on discussion_posts and users)
TRUNCATE TABLE post_reactions RESTART IDENTITY CASCADE;

-- Clear discussion posts (depends on discussion_threads and users)
TRUNCATE TABLE discussion_posts RESTART IDENTITY CASCADE;

-- Clear discussion threads (depends on courses and users)
TRUNCATE TABLE discussion_threads RESTART IDENTITY CASCADE;

-- Clear submission files (depends on student_submissions)
TRUNCATE TABLE submission_files RESTART IDENTITY CASCADE;

-- Clear student submissions (depends on assignments and users)
TRUNCATE TABLE student_submissions RESTART IDENTITY CASCADE;

-- Clear assignment files (depends on assignments)
TRUNCATE TABLE assignment_files RESTART IDENTITY CASCADE;

-- Clear assignments (depends on courses and users)
TRUNCATE TABLE assignments RESTART IDENTITY CASCADE;

-- Clear resources (depends on courses and users)
TRUNCATE TABLE resources RESTART IDENTITY CASCADE;

-- Clear notifications (depends on users)
TRUNCATE TABLE notifications RESTART IDENTITY CASCADE;

-- Clear messages (depends on users)
TRUNCATE TABLE messages RESTART IDENTITY CASCADE;

-- Clear announcements (depends on courses and users)
TRUNCATE TABLE announcements RESTART IDENTITY CASCADE;

-- Clear course enrollments (depends on courses and users)
TRUNCATE TABLE course_enrollments RESTART IDENTITY CASCADE;

-- Clear course teachers (depends on courses and users)
TRUNCATE TABLE course_teachers RESTART IDENTITY CASCADE;

-- Clear courses (depends on users)
TRUNCATE TABLE courses RESTART IDENTITY CASCADE;

-- Clear users (this should be last as many tables depend on it)
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Verify that all tables are empty
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'course_teachers', COUNT(*) FROM course_teachers
UNION ALL
SELECT 'course_enrollments', COUNT(*) FROM course_enrollments
UNION ALL
SELECT 'announcements', COUNT(*) FROM announcements
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'resources', COUNT(*) FROM resources
UNION ALL
SELECT 'assignments', COUNT(*) FROM assignments
UNION ALL
SELECT 'assignment_files', COUNT(*) FROM assignment_files
UNION ALL
SELECT 'student_submissions', COUNT(*) FROM student_submissions
UNION ALL
SELECT 'submission_files', COUNT(*) FROM submission_files
UNION ALL
SELECT 'discussion_threads', COUNT(*) FROM discussion_threads
UNION ALL
SELECT 'discussion_posts', COUNT(*) FROM discussion_posts
UNION ALL
SELECT 'post_reactions', COUNT(*) FROM post_reactions
UNION ALL
SELECT 'assessment_grids', COUNT(*) FROM assessment_grids
UNION ALL
SELECT 'faculty_feedback', COUNT(*) FROM faculty_feedback
UNION ALL
SELECT 'attendance_sessions', COUNT(*) FROM attendance_sessions
UNION ALL
SELECT 'attendance_records', COUNT(*) FROM attendance_records
ORDER BY table_name;

-- List all tables to verify structure remains intact
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Success message
SELECT 'Database cleanup completed successfully! All tables have been cleared.' as status;
