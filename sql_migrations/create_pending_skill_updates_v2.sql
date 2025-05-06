-- Create the pending_skill_updates_v2 table if it doesn't exist
CREATE TABLE IF NOT EXISTS pending_skill_updates_v2 (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  user_skill_id INTEGER REFERENCES user_skills(id),
  skill_template_id INTEGER NOT NULL REFERENCES skill_templates(id),
  level skill_level NOT NULL,
  certification TEXT,
  credly_link TEXT,
  notes TEXT,
  certification_date TIMESTAMP,
  expiration_date TIMESTAMP,
  status approval_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER,
  review_notes TEXT,
  is_update BOOLEAN NOT NULL DEFAULT FALSE
);

-- Add comment explaining the purpose of this table
COMMENT ON TABLE pending_skill_updates_v2 IS 'Stores pending skill updates for the V2 skills structure, using skillTemplateId instead of skillId';