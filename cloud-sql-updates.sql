-- SQL script to update Google Cloud SQL Database to match Replit schema
-- This will create the missing v2 tables and update table definitions with missing columns

-- 1. Add missing column to notifications table
ALTER TABLE IF EXISTS notifications 
ADD COLUMN IF NOT EXISTS related_user_skill_id INTEGER REFERENCES user_skills(id) ON DELETE CASCADE;

-- 2. Update skill_approvers table (replace skill_id with skill_template_id)
-- First, we'll check if the alter is needed
DO $$
BEGIN
   IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'skill_approvers' AND column_name = 'skill_id') 
      AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'skill_approvers' AND column_name = 'skill_template_id') THEN
      
      -- Create the new column
      ALTER TABLE skill_approvers ADD COLUMN skill_template_id INTEGER REFERENCES skill_templates(id);
      
      -- Copy data if there's a logical mapping between skill_id and skill_template_id
      -- This assumes there's a way to map between skills and skill_templates
      -- UPDATE skill_approvers sa 
      -- SET skill_template_id = (SELECT template_id FROM skills WHERE id = sa.skill_id);
      
      -- Drop the old column (only if you've migrated the data)
      -- ALTER TABLE skill_approvers DROP COLUMN skill_id;
   END IF;
END $$;

-- 3. Add missing column to skill_categories
ALTER TABLE IF EXISTS skill_categories
ADD COLUMN IF NOT EXISTS category_type VARCHAR(50);

-- 4. Create endorsements_v2 table
CREATE TABLE IF NOT EXISTS endorsements_v2 (
  id SERIAL PRIMARY KEY,
  user_skill_id INTEGER NOT NULL REFERENCES user_skills(id) ON DELETE CASCADE,
  endorser_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  level VARCHAR(20) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 5. Create pending_skill_updates_v2 table
CREATE TABLE IF NOT EXISTS pending_skill_updates_v2 (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user_skill_id INTEGER REFERENCES user_skills(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL,
  is_new BOOLEAN DEFAULT false,
  previous_level VARCHAR(20),
  rejection_reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  skill_template_id INTEGER REFERENCES skill_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 6. Create project_skills_v2 table
CREATE TABLE IF NOT EXISTS project_skills_v2 (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_skill_id INTEGER NOT NULL REFERENCES user_skills(id) ON DELETE CASCADE,
  requiredlevel VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, user_skill_id)
);

-- 7. Create skill_histories_v2 table
CREATE TABLE IF NOT EXISTS skill_histories_v2 (
  id SERIAL PRIMARY KEY,
  user_skill_id INTEGER NOT NULL REFERENCES user_skills(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  old_level VARCHAR(20),
  new_level VARCHAR(20) NOT NULL,
  change_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  change_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approval_id INTEGER REFERENCES pending_skill_updates_v2(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_endorsements_v2_user_skill_id ON endorsements_v2(user_skill_id);
CREATE INDEX IF NOT EXISTS idx_pending_skill_updates_v2_user_skill_id ON pending_skill_updates_v2(user_skill_id);
CREATE INDEX IF NOT EXISTS idx_pending_skill_updates_v2_user_id ON pending_skill_updates_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_skill_updates_v2_status ON pending_skill_updates_v2(status);
CREATE INDEX IF NOT EXISTS idx_project_skills_v2_project_id ON project_skills_v2(project_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_v2_user_skill_id ON project_skills_v2(user_skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_histories_v2_user_skill_id ON skill_histories_v2(user_skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_histories_v2_user_id ON skill_histories_v2(user_id);