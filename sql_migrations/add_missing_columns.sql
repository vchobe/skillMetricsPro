-- Add subcategory_id column to skills table
ALTER TABLE skills 
ADD COLUMN subcategory_id INTEGER REFERENCES skill_subcategories(id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_skills_category_id ON skills(category_id);
CREATE INDEX IF NOT EXISTS idx_skills_subcategory_id ON skills(subcategory_id);