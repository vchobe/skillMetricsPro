-- SQL script to add category_type column to skill_categories table

-- First check if the enum type exists, create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_type') THEN
        CREATE TYPE category_type AS ENUM ('technical', 'functional');
    END IF;
END
$$;

-- Check if column exists, add it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'skill_categories' AND column_name = 'category_type'
    ) THEN
        ALTER TABLE skill_categories 
        ADD COLUMN category_type category_type NOT NULL DEFAULT 'technical';
    END IF;
END
$$;

-- Update technical categories
UPDATE skill_categories 
SET category_type = 'technical' 
WHERE name IN (
    'Programming', 'Database', 'Cloud', 'DevOps', 'Security', 
    'Data Science', 'AI', 'UI', 'Testing'
);

-- Update functional categories
UPDATE skill_categories 
SET category_type = 'functional' 
WHERE name IN (
    'Design', 'Project Management', 'Leadership', 'Communication',
    'Marketing', 'Messaging & Streaming', 'Metrics and visualization',
    'Log aggregation and search', 'BigData'
);

-- View all categories with their types
SELECT id, name, category_type 
FROM skill_categories 
ORDER BY name;