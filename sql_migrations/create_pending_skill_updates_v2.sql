-- Create the pending_skill_updates_v2 table
CREATE TABLE IF NOT EXISTS pending_skill_updates_v2 (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  user_skill_id INTEGER REFERENCES user_skills(id),
  skill_template_id INTEGER NOT NULL REFERENCES skill_templates(id),
  level VARCHAR(20) NOT NULL,
  certification TEXT,
  credly_link TEXT,
  notes TEXT,
  certification_date TIMESTAMP,
  expiration_date TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER,
  review_notes TEXT,
  is_update BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS pending_skill_updates_v2_user_id_idx ON pending_skill_updates_v2(user_id);

-- Create index on status for filtering pending/approved/rejected updates
CREATE INDEX IF NOT EXISTS pending_skill_updates_v2_status_idx ON pending_skill_updates_v2(status);

-- Create pending_skill_update_metadata table for additional metadata
CREATE TABLE IF NOT EXISTS pending_skill_update_metadata (
  id SERIAL PRIMARY KEY,
  pending_skill_update_id INTEGER REFERENCES pending_skill_updates_v2(id) ON DELETE CASCADE,
  meta_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create a view to join pending updates with skill templates
CREATE OR REPLACE VIEW pending_updates_v2_with_templates AS
SELECT 
  psu.*,
  st.name as skill_name,
  st.category as skill_category,
  sc.name as category_name,
  sc.color as category_color,
  sc.icon as category_icon,
  ss.name as subcategory_name,
  ss.color as subcategory_color,
  ss.icon as subcategory_icon,
  u.username as user_username,
  u.email as user_email,
  r.username as reviewer_username
FROM 
  pending_skill_updates_v2 psu
LEFT JOIN skill_templates st ON psu.skill_template_id = st.id
LEFT JOIN skill_categories sc ON st.category_id = sc.id
LEFT JOIN skill_subcategories ss ON st.subcategory_id = ss.id
LEFT JOIN users u ON psu.user_id = u.id
LEFT JOIN users r ON psu.reviewed_by = r.id;