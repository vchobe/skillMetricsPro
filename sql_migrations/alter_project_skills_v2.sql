-- Migration to make user_skill_id column nullable in project_skills_v2 table
ALTER TABLE project_skills_v2 ALTER COLUMN user_skill_id DROP NOT NULL;

-- Add a comment to explain this is for backward compatibility
COMMENT ON COLUMN project_skills_v2.user_skill_id IS 'Legacy reference - maintained for backwards compatibility';