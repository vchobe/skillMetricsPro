-- Complete migration from skills table to skill_templates
-- This script modifies all remaining foreign key constraints to reference skill_templates table
-- instead of the legacy skills table

-- 1. Update endorsements table
ALTER TABLE endorsements DROP CONSTRAINT IF EXISTS endorsements_skill_id_fkey;
ALTER TABLE endorsements RENAME COLUMN skill_id TO skill_template_id;
ALTER TABLE endorsements ADD CONSTRAINT endorsements_skill_template_id_fkey
    FOREIGN KEY (skill_template_id) REFERENCES skill_templates(id);
COMMENT ON CONSTRAINT endorsements_skill_template_id_fkey ON endorsements
    IS 'Foreign key constraint updated during migration to reference skill_templates instead of skills';

-- 2. Update notifications table
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_related_skill_id_fkey;
ALTER TABLE notifications RENAME COLUMN related_skill_id TO related_skill_template_id;
ALTER TABLE notifications ADD CONSTRAINT notifications_related_skill_template_id_fkey
    FOREIGN KEY (related_skill_template_id) REFERENCES skill_templates(id);
COMMENT ON CONSTRAINT notifications_related_skill_template_id_fkey ON notifications
    IS 'Foreign key constraint updated during migration to reference skill_templates instead of skills';

-- 3. Update project_skills table
ALTER TABLE project_skills DROP CONSTRAINT IF EXISTS project_skills_skill_id_fkey;
ALTER TABLE project_skills RENAME COLUMN skill_id TO skill_template_id;
ALTER TABLE project_skills ADD CONSTRAINT project_skills_skill_template_id_fkey
    FOREIGN KEY (skill_template_id) REFERENCES skill_templates(id);
COMMENT ON CONSTRAINT project_skills_skill_template_id_fkey ON project_skills
    IS 'Foreign key constraint updated during migration to reference skill_templates instead of skills';

-- 4. Update skill_histories table
ALTER TABLE skill_histories DROP CONSTRAINT IF EXISTS skill_histories_skill_id_fkey;
ALTER TABLE skill_histories RENAME COLUMN skill_id TO skill_template_id;
ALTER TABLE skill_histories ADD CONSTRAINT skill_histories_skill_template_id_fkey
    FOREIGN KEY (skill_template_id) REFERENCES skill_templates(id);
COMMENT ON CONSTRAINT skill_histories_skill_template_id_fkey ON skill_histories
    IS 'Foreign key constraint updated during migration to reference skill_templates instead of skills';

-- Add indices for improved query performance on the new columns
CREATE INDEX IF NOT EXISTS idx_endorsements_skill_template_id ON endorsements(skill_template_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_skill_template_id ON notifications(related_skill_template_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_skill_template_id ON project_skills(skill_template_id);
CREATE INDEX IF NOT EXISTS idx_skill_histories_skill_template_id ON skill_histories(skill_template_id);