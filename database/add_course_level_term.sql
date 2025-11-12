-- Add level and term columns to courses table
-- This migration adds the level and term fields to existing Course table

ALTER TABLE courses ADD COLUMN IF NOT EXISTS level VARCHAR(255);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS term VARCHAR(255);

-- Add some sample values for existing courses (optional)
UPDATE courses SET level = 'Undergraduate' WHERE level IS NULL;
UPDATE courses SET term = 'Fall 2024' WHERE term IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_term ON courses(term);

COMMIT;