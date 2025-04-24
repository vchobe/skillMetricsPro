-- Add category_id and subcategory_id columns to pending_skill_updates table
ALTER TABLE pending_skill_updates 
ADD COLUMN category_id INTEGER REFERENCES skill_categories(id),
ADD COLUMN subcategory_id INTEGER REFERENCES skill_subcategories(id);

-- Update the pending skill updates with appropriate category/subcategory references
-- Match categories by name where possible
UPDATE pending_skill_updates psu
SET category_id = sc.id
FROM skill_categories sc
WHERE LOWER(psu.category) = LOWER(sc.name);

-- For entries that didn't match by exact name, use a more flexible match
UPDATE pending_skill_updates psu
SET category_id = (
    SELECT id FROM skill_categories
    WHERE LOWER(psu.category) LIKE '%' || LOWER(name) || '%'
    OR LOWER(name) LIKE '%' || LOWER(psu.category) || '%'
    LIMIT 1
)
WHERE category_id IS NULL;

-- For any remaining entries without a category, set to a default category
UPDATE pending_skill_updates
SET category_id = (SELECT id FROM skill_categories ORDER BY id LIMIT 1)
WHERE category_id IS NULL;

-- Then, set appropriate subcategories based on the determined categories
-- This uses a best-effort approach based on the skill name
UPDATE pending_skill_updates psu
SET subcategory_id = (
    SELECT ss.id 
    FROM skill_subcategories ss
    WHERE ss.category_id = psu.category_id
    ORDER BY id 
    LIMIT 1
);