-- Update the foreign key constraint for the skill_template_id column in skill_approvers table

-- First, check for and drop the existing constraint
ALTER TABLE skill_approvers DROP CONSTRAINT IF EXISTS skill_approvers_skill_id_fkey;

-- Add the new constraint referencing skill_templates
ALTER TABLE skill_approvers ADD CONSTRAINT skill_approvers_skill_template_id_fkey
    FOREIGN KEY (skill_template_id) REFERENCES skill_templates(id);

-- Add comment explaining the change
COMMENT ON CONSTRAINT skill_approvers_skill_template_id_fkey ON skill_approvers
    IS 'Foreign key constraint updated during migration to reference skill_templates instead of skills';