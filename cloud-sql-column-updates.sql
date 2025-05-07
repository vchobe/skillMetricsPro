-- SQL script to update column definitions in Google Cloud SQL Database
-- This will align columns in the v2 tables with the Replit schema

-- 1. Update endorsements_v2 to add missing 'level' column
ALTER TABLE endorsements_v2 
ADD COLUMN IF NOT EXISTS level VARCHAR(20) NOT NULL;

-- 2. Add any missing columns to pending_skill_updates_v2
-- Checking if we need to add any columns not present
ALTER TABLE pending_skill_updates_v2
ADD COLUMN IF NOT EXISTS level VARCHAR(20) NOT NULL;

-- 3. Add any missing columns to project_skills_v2
-- Make sure requiredlevel is present
ALTER TABLE project_skills_v2
ADD COLUMN IF NOT EXISTS requiredlevel VARCHAR(20) NOT NULL;

-- 4. Add any missing columns to skill_histories_v2
-- Ensure old_level and new_level are present
ALTER TABLE skill_histories_v2
ADD COLUMN IF NOT EXISTS old_level VARCHAR(20),
ADD COLUMN IF NOT EXISTS new_level VARCHAR(20) NOT NULL;