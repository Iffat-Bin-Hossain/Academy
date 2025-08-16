-- Database Cleanup Script - PostgreSQL Version
-- This script will clear all data (rows) from all tables in the Academy database
-- It keeps the table structure intact and only removes the data
-- Execute this carefully as it will permanently delete all data

-- Disable foreign key checks to avoid constraint violations during cleanup
-- PostgreSQL doesn't have FOREIGN_KEY_CHECKS, so we'll use CASCADE option with TRUNCATE

-- Clear all tables using TRUNCATE CASCADE (PostgreSQL syntax)
-- TRUNCATE removes all rows but keeps table structure
-- CASCADE handles foreign key dependencies automatically
TRUNCATE TABLE 
    attendance_records,
    attendance_sessions,
    faculty_feedback,
    assessment_grids,
    post_reactions,
    discussion_posts,
    discussion_threads,
    submission_files,
    student_submissions,
    assignment_files,
    assignments,
    resources,
    notifications,
    messages,
    announcements,
    course_enrollment,
    course_teachers,
    course,
    users
RESTART IDENTITY CASCADE;

-- Verify that all tables are empty (but still exist)
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'course', COUNT(*) FROM course
UNION ALL
SELECT 'course_teachers', COUNT(*) FROM course_teachers
UNION ALL
SELECT 'course_enrollment', COUNT(*) FROM course_enrollment
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
SELECT 'attendance_records', COUNT(*) FROM attendance_records;
SELECT 'attendance_records', COUNT(*) FROM attendance_records;

-- Show that all tables still exist (structure preserved)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Success message
SELECT 'Database cleanup completed successfully! All table data has been cleared but table structures are preserved.' as status;
