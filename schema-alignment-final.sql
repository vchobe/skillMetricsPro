-- Final schema alignment script

-- Fix 1: Add related_user_skill_id to notifications table if missing in Cloud SQL
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'notifications' AND column_name = 'related_user_skill_id') THEN
        ALTER TABLE notifications 
        ADD COLUMN related_user_skill_id INTEGER REFERENCES user_skills(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added related_user_skill_id column to notifications table';
    ELSE
        RAISE NOTICE 'related_user_skill_id column already exists in notifications table';
    END IF;
END $$;

-- Fix 2: Change skill_id to skill_template_id in skill_approvers table in Cloud SQL if needed
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns 
              WHERE table_name = 'skill_approvers' AND column_name = 'skill_id') 
       AND NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'skill_approvers' AND column_name = 'skill_template_id') THEN
        
        -- First add the new column
        ALTER TABLE skill_approvers 
        ADD COLUMN skill_template_id INTEGER REFERENCES skill_templates(id);
        
        -- Then update the data (migrate any existing values if possible)
        -- This is a placeholder; you may need to customize this based on your data
        -- UPDATE skill_approvers SET skill_template_id = ???;
        
        -- Finally drop the old column
        ALTER TABLE skill_approvers DROP COLUMN skill_id;
        
        RAISE NOTICE 'Changed skill_id column to skill_template_id in skill_approvers table';
    ELSIF NOT EXISTS (SELECT FROM information_schema.columns 
                     WHERE table_name = 'skill_approvers' AND column_name = 'skill_template_id') THEN
        
        ALTER TABLE skill_approvers 
        ADD COLUMN skill_template_id INTEGER REFERENCES skill_templates(id);
        
        RAISE NOTICE 'Added skill_template_id column to skill_approvers table';
    ELSE
        RAISE NOTICE 'skill_template_id column already exists in skill_approvers table';
    END IF;
END $$;

-- Fix 3: Add category_type to skill_categories table if missing in Cloud SQL
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'skill_categories' AND column_name = 'category_type') THEN
        -- First create the category_type enum if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_type') THEN
            CREATE TYPE category_type AS ENUM ('technical', 'functional');
            RAISE NOTICE 'Created category_type enum type';
        END IF;
        
        -- Then add the column with a default value
        ALTER TABLE skill_categories 
        ADD COLUMN category_type category_type DEFAULT 'technical';
        
        RAISE NOTICE 'Added category_type column to skill_categories table';
    ELSE
        RAISE NOTICE 'category_type column already exists in skill_categories table';
    END IF;
END $$;

-- Create indexes to improve performance on common queries
CREATE INDEX IF NOT EXISTS idx_notifications_related_user_skill_id 
ON notifications(related_user_skill_id);

CREATE INDEX IF NOT EXISTS idx_skill_approvers_skill_template_id 
ON skill_approvers(skill_template_id);

CREATE INDEX IF NOT EXISTS idx_skill_categories_category_type 
ON skill_categories(category_type);