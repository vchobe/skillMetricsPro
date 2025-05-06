-- Update foreign key constraint for skill_histories table
-- Change skill_id to reference skill_templates instead of skills

-- First, drop the existing constraint
ALTER TABLE skill_histories DROP CONSTRAINT IF EXISTS skill_histories_skill_id_fkey;

-- Rename column to match naming convention
ALTER TABLE skill_histories RENAME COLUMN skill_id TO skill_template_id;

-- Add new constraint referencing skill_templates
ALTER TABLE skill_histories ADD CONSTRAINT skill_histories_skill_template_id_fkey
    FOREIGN KEY (skill_template_id) REFERENCES skill_templates(id);

-- Add comment explaining the change
COMMENT ON CONSTRAINT skill_histories_skill_template_id_fkey ON skill_histories
    IS 'Foreign key constraint updated during migration to reference skill_templates instead of skills';