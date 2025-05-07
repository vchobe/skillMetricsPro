-- Final column checks and fixes for v2 tables

-- 1. Add missing columns to project_skills_v2 if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'project_skills_v2' AND column_name = 'skill_template_id') THEN
        ALTER TABLE project_skills_v2 
        ADD COLUMN skill_template_id INTEGER REFERENCES skill_templates(id);
    END IF;
END $$;

-- 2. Add missing 'change_by_id' to skill_histories_v2 if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'skill_histories_v2' AND column_name = 'change_by_id') THEN
        ALTER TABLE skill_histories_v2 
        ADD COLUMN change_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Add missing 'approval_id' to skill_histories_v2 if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'skill_histories_v2' AND column_name = 'approval_id') THEN
        ALTER TABLE skill_histories_v2 
        ADD COLUMN approval_id INTEGER REFERENCES pending_skill_updates_v2(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Check for more differences in endorsements_v2
DO $$
BEGIN
    -- Check for missing user_id column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'endorsements_v2' AND column_name = 'user_id') THEN
        RAISE NOTICE 'user_id column already exists in endorsements_v2';
    END IF;
    
    -- Check level column exists and has proper type
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'endorsements_v2' AND column_name = 'level') THEN
        RAISE NOTICE 'Adding level column to endorsements_v2';
        ALTER TABLE endorsements_v2 
        ADD COLUMN level VARCHAR(20) NOT NULL;
    END IF;
END $$;

-- 5. Add updated_at column to endorsements_v2
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'endorsements_v2' AND column_name = 'updated_at') THEN
        ALTER TABLE endorsements_v2 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 6. Update column types if needed (e.g., ensure timestamps have timezone info)
ALTER TABLE endorsements_v2
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

-- 7. Final check: create indexes that might be missing but important for performance
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_template_id ON user_skills(skill_template_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_v2_user_skill_id ON endorsements_v2(user_skill_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_v2_endorser_id ON endorsements_v2(endorser_id);
CREATE INDEX IF NOT EXISTS idx_skill_histories_v2_user_skill_id ON skill_histories_v2(user_skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_histories_v2_user_id ON skill_histories_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_skill_updates_v2_user_id ON pending_skill_updates_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_skill_updates_v2_user_skill_id ON pending_skill_updates_v2(user_skill_id);
CREATE INDEX IF NOT EXISTS idx_pending_skill_updates_v2_skill_template_id ON pending_skill_updates_v2(skill_template_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_v2_project_id ON project_skills_v2(project_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_v2_user_skill_id ON project_skills_v2(user_skill_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_v2_skill_template_id ON project_skills_v2(skill_template_id);