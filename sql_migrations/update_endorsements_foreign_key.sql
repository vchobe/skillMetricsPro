-- Update foreign key constraint for endorsements table
-- Change skill_id to reference skill_templates instead of skills

-- First, drop the existing constraint
ALTER TABLE endorsements DROP CONSTRAINT IF EXISTS endorsements_skill_id_fkey;

-- Rename column to match naming convention
ALTER TABLE endorsements RENAME COLUMN skill_id TO skill_template_id;

-- Add new constraint referencing skill_templates
ALTER TABLE endorsements ADD CONSTRAINT endorsements_skill_template_id_fkey
    FOREIGN KEY (skill_template_id) REFERENCES skill_templates(id);

-- Add comment explaining the change
COMMENT ON CONSTRAINT endorsements_skill_template_id_fkey ON endorsements
    IS 'Foreign key constraint updated during migration to reference skill_templates instead of skills';