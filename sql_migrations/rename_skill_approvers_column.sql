-- Rename the skill_id column to skill_template_id in skill_approvers table
DO $$
BEGIN
    -- Check if the skill_id column exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'skill_approvers' AND column_name = 'skill_id'
    ) THEN
        -- Rename the column
        ALTER TABLE skill_approvers RENAME COLUMN skill_id TO skill_template_id;
        
        -- Add a comment explaining the change
        COMMENT ON COLUMN skill_approvers.skill_template_id IS 'Reference to skill_templates.id, renamed from skill_id during migration';
    END IF;
END $$;