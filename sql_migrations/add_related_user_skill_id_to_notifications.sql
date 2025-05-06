-- Add related_user_skill_id column to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS related_user_skill_id INTEGER REFERENCES user_skills(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_related_user_skill_id ON notifications(related_user_skill_id);