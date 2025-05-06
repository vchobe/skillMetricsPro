-- Update foreign key constraint for notifications table
-- Change related_skill_id to reference skill_templates instead of skills

-- First, drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_related_skill_id_fkey;

-- Rename column to match naming convention
ALTER TABLE notifications RENAME COLUMN related_skill_id TO related_skill_template_id;

-- Add new constraint referencing skill_templates
ALTER TABLE notifications ADD CONSTRAINT notifications_related_skill_template_id_fkey
    FOREIGN KEY (related_skill_template_id) REFERENCES skill_templates(id);

-- Add comment explaining the change
COMMENT ON CONSTRAINT notifications_related_skill_template_id_fkey ON notifications
    IS 'Foreign key constraint updated during migration to reference skill_templates instead of skills';