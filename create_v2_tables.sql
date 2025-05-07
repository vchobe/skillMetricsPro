-- First, create ENUM types if they don't exist (we'll skip errors since they might already exist)
DO $$ 
BEGIN
    BEGIN
        CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'expert');
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END
$$;

-- Create pending_skill_updates_v2 table
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
  is_update BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_pending_skill_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create skill_histories_v2 table
CREATE TABLE IF NOT EXISTS skill_histories_v2 (
  id SERIAL PRIMARY KEY,
  user_skill_id INTEGER NOT NULL REFERENCES user_skills(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  previous_level skill_level,
  new_level skill_level NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  change_note TEXT,
  change_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approval_id INTEGER REFERENCES pending_skill_updates_v2(id) ON DELETE SET NULL,
  CONSTRAINT fk_skill_history_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create endorsements_v2 table
CREATE TABLE IF NOT EXISTS endorsements_v2 (
  id SERIAL PRIMARY KEY,
  user_skill_id INTEGER NOT NULL REFERENCES user_skills(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  endorser_id INTEGER NOT NULL,
  comment TEXT,
  level VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  CONSTRAINT fk_endorsement_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_endorser FOREIGN KEY (endorser_id) REFERENCES users(id)
);

-- Add any missing indexes
CREATE INDEX IF NOT EXISTS idx_pending_skill_updates_v2_user_id ON pending_skill_updates_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_skill_updates_v2_status ON pending_skill_updates_v2(status);
CREATE INDEX IF NOT EXISTS idx_skill_histories_v2_user_id ON skill_histories_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_histories_v2_user_skill_id ON skill_histories_v2(user_skill_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_v2_user_id ON endorsements_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_v2_user_skill_id ON endorsements_v2(user_skill_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_v2_endorser_id ON endorsements_v2(endorser_id);