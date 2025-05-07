-- First check if the column exists
DO $$
BEGIN
    -- Check if the skill_template_id column already exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'skill_approvers' AND column_name = 'skill_template_id'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE skill_approvers 
        ADD COLUMN skill_template_id INTEGER REFERENCES skill_templates(id);
        
        RAISE NOTICE 'Added skill_template_id column to skill_approvers table';
    ELSE
        RAISE NOTICE 'skill_template_id column already exists in skill_approvers table';
    END IF;
END $$;

-- Now let's create an index on the column to improve query performance
CREATE INDEX IF NOT EXISTS idx_skill_approvers_skill_template_id 
ON skill_approvers(skill_template_id);

-- Finally, let's check if the column is there
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'skill_approvers' AND column_name = 'skill_template_id';