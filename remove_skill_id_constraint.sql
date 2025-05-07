-- Script to remove skill_id not-null constraint from skill_histories table
-- This allows the skill_histories table to work with user_skills instead of the legacy skills table

-- First, let's identify the constraint name
SELECT conname, conrelid::regclass, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'skill_histories'::regclass AND conname LIKE '%skill_id%';

-- Make the skill_id column nullable to support V2 architecture
ALTER TABLE skill_histories ALTER COLUMN skill_id DROP NOT NULL;

-- Check if there's a foreign key constraint from skill_histories to skills
SELECT conname, conrelid::regclass, confrelid::regclass, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'skill_histories'::regclass AND confrelid = 'skills'::regclass;

-- If the above query returns a constraint, we'll drop it with the following:
-- (This is commented out because we need to see the constraint name first)
-- ALTER TABLE skill_histories DROP CONSTRAINT constraint_name_here;

-- Additional nullable update for endorsements table if needed
ALTER TABLE endorsements ALTER COLUMN skill_id DROP NOT NULL;

-- Check for foreign key constraints on endorsements table
SELECT conname, conrelid::regclass, confrelid::regclass, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'endorsements'::regclass AND confrelid = 'skills'::regclass;

-- If the above query returns a constraint, we'll drop it with:
-- ALTER TABLE endorsements DROP CONSTRAINT constraint_name_here;

-- Check for pending_skill_updates constraints
SELECT conname, conrelid::regclass, confrelid::regclass, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'pending_skill_updates'::regclass AND conname LIKE '%skill_id%';

-- If needed:
ALTER TABLE pending_skill_updates ALTER COLUMN skill_id DROP NOT NULL;