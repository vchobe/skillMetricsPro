-- Update foreign key constraint for project_skills table
-- Change skill_id to reference skill_templates instead of skills

-- First, drop the existing constraint
ALTER TABLE project_skills DROP CONSTRAINT IF EXISTS project_skills_skill_id_fkey;

-- Rename column to match naming convention
ALTER TABLE project_skills RENAME COLUMN skill_id TO skill_template_id;

-- Add new constraint referencing skill_templates
ALTER TABLE project_skills ADD CONSTRAINT project_skills_skill_template_id_fkey
    FOREIGN KEY (skill_template_id) REFERENCES skill_templates(id);

-- Add comment explaining the change
COMMENT ON CONSTRAINT project_skills_skill_template_id_fkey ON project_skills
    IS 'Foreign key constraint updated during migration to reference skill_templates instead of skills';