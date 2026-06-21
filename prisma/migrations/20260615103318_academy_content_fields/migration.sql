-- Add slug/tier/icon/color to courses, slug/body to lessons
ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT 'school';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'var(--teal)';

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS body TEXT;

-- Unique constraints (will not fail if column had no data)
CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_key ON courses(slug);
CREATE UNIQUE INDEX IF NOT EXISTS lessons_course_id_slug_key ON lessons(course_id, slug);
