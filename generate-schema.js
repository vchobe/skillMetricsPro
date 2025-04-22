/**
 * Generate SQL Schema Script
 *
 * This script reads the Drizzle schema definitions and generates SQL CREATE TABLE
 * statements that can be used to create the database schema on any PostgreSQL instance.
 *
 * Usage: node generate-schema.js > schema.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './shared/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Output SQL file
const outputFile = path.join(__dirname, 'schema.sql');

// Function to generate SQL schema from Drizzle schema
async function generateSchema() {
  console.log('Generating SQL schema from Drizzle definitions...');
  
  // SQL script header
  let sqlScript = `--
-- PostgreSQL schema for SkillMetrics application
-- Generated on ${new Date().toISOString()}
--

-- Create enum types
CREATE TYPE IF NOT EXISTS approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE IF NOT EXISTS skill_level AS ENUM ('beginner', 'intermediate', 'expert');
CREATE TYPE IF NOT EXISTS tab_visibility AS ENUM ('visible', 'hidden');
CREATE TYPE IF NOT EXISTS notification_type AS ENUM ('endorsement', 'level_up', 'achievement');

`;

  // Add Users table
  sqlScript += `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  username TEXT DEFAULT '',
  password TEXT DEFAULT '',
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  project TEXT DEFAULT '',
  role TEXT DEFAULT '',
  location TEXT DEFAULT ''
);

`;

  // Add Skill Categories table
  sqlScript += `
-- Skill Categories table
CREATE TABLE IF NOT EXISTS skill_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tab_order INTEGER DEFAULT 0,
  visibility tab_visibility DEFAULT 'visible',
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'code',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;

  // Add Skill Subcategories table
  sqlScript += `
-- Skill Subcategories table
CREATE TABLE IF NOT EXISTS skill_subcategories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id INTEGER NOT NULL REFERENCES skill_categories(id),
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'code',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;

  // Add Skills table
  sqlScript += `
-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  category_id INTEGER REFERENCES skill_categories(id),
  level skill_level NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  certification TEXT,
  credly_link TEXT,
  notes TEXT,
  endorsement_count INTEGER DEFAULT 0,
  certification_date TIMESTAMP WITH TIME ZONE,
  expiration_date TIMESTAMP WITH TIME ZONE
);

`;

  // Add Skill Approvers table
  sqlScript += `
-- Skill Approvers table
CREATE TABLE IF NOT EXISTS skill_approvers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  category_id INTEGER REFERENCES skill_categories(id),
  subcategory_id INTEGER REFERENCES skill_subcategories(id),
  skill_id INTEGER REFERENCES skills(id),
  can_approve_all BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;

  // Add Skill Histories table
  sqlScript += `
-- Skill Histories table
CREATE TABLE IF NOT EXISTS skill_histories (
  id SERIAL PRIMARY KEY,
  skill_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  previous_level skill_level,
  new_level skill_level NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  change_note TEXT
);

`;

  // Add Profile Histories table
  sqlScript += `
-- Profile Histories table
CREATE TABLE IF NOT EXISTS profile_histories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  changed_field TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

`;

  // Add Notifications table
  sqlScript += `
-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type notification_type NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_skill_id INTEGER,
  related_user_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

`;

  // Add Endorsements table
  sqlScript += `
-- Endorsements table
CREATE TABLE IF NOT EXISTS endorsements (
  id SERIAL PRIMARY KEY,
  skill_id INTEGER NOT NULL,
  endorser_id INTEGER NOT NULL,
  endorsee_id INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

`;

  // Add Skill Templates table
  sqlScript += `
-- Skill Templates table
CREATE TABLE IF NOT EXISTS skill_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  is_recommended BOOLEAN DEFAULT false,
  target_level skill_level,
  target_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

`;

  // Add Skill Targets tables
  sqlScript += `
-- Skill Targets table
CREATE TABLE IF NOT EXISTS skill_targets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  target_level skill_level NOT NULL,
  target_date DATE,
  target_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Skill Target Skills table
CREATE TABLE IF NOT EXISTS skill_target_skills (
  id SERIAL PRIMARY KEY,
  target_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL
);

-- Skill Target Users table
CREATE TABLE IF NOT EXISTS skill_target_users (
  id SERIAL PRIMARY KEY,
  target_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL
);

`;

  // Add Pending Skill Updates table
  sqlScript += `
-- Pending Skill Updates table
CREATE TABLE IF NOT EXISTS pending_skill_updates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  skill_id INTEGER,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  level skill_level NOT NULL,
  certification TEXT,
  credly_link TEXT,
  notes TEXT,
  certification_date TIMESTAMP WITH TIME ZONE,
  expiration_date TIMESTAMP WITH TIME ZONE,
  status approval_status DEFAULT 'pending' NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by INTEGER,
  review_notes TEXT,
  is_update BOOLEAN DEFAULT false NOT NULL
);

`;

  // Add Clients table
  sqlScript += `
-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  logo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;

  // Add Projects table
  sqlScript += `
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  client_id INTEGER REFERENCES clients(id),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  confluence_link TEXT,
  lead_id INTEGER REFERENCES users(id),
  delivery_lead_id INTEGER REFERENCES users(id),
  hr_coordinator_email TEXT,
  finance_team_email TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;

  // Add Project Resources table
  sqlScript += `
-- Project Resources table
CREATE TABLE IF NOT EXISTS project_resources (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT,
  allocation INTEGER DEFAULT 100,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;

  // Add Project Skills table
  sqlScript += `
-- Project Skills table
CREATE TABLE IF NOT EXISTS project_skills (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  required_level TEXT DEFAULT 'beginner',
  importance TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;

  // Add Project Resource Histories table
  sqlScript += `
-- Project Resource Histories table
CREATE TABLE IF NOT EXISTS project_resource_histories (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  previous_role TEXT,
  new_role TEXT,
  previous_allocation INTEGER,
  new_allocation INTEGER,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  performed_by_id INTEGER,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;

  // Add Session table
  sqlScript += `
-- Session table
CREATE TABLE IF NOT EXISTS session (
  sid TEXT PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_skill_id ON endorsements(skill_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_skill_updates_user_id ON pending_skill_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_skill_updates_status ON pending_skill_updates(status);
CREATE INDEX IF NOT EXISTS idx_project_resources_project_id ON project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_user_id ON project_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_project_id ON project_skills(project_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_skill_id ON project_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_approvers_user_id ON skill_approvers(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_approvers_category_id ON skill_approvers(category_id);
CREATE INDEX IF NOT EXISTS idx_skill_subcategories_category_id ON skill_subcategories(category_id);
`;

  // Add super admin user
  sqlScript += `
-- Create default super admin user (admin@atyeti.com with password Admin@123)
-- Password hash is for 'Admin@123' - DO NOT USE IN PRODUCTION without changing
INSERT INTO users (username, email, password, first_name, last_name, is_admin)
VALUES ('admin', 'admin@atyeti.com', '60f0ab7d2700d00c650e2c58ae0a16204922647caf98a581afff8f0c080c0c3b4201c856573834ef675535d7e466cbbb2b19fd3ca988b5f6694203ac5a2a5ab4.83b3107d001dbbb297c2d91faf1180ad', 'Super', 'Admin', TRUE)
ON CONFLICT (email) DO UPDATE
SET is_admin = TRUE;
`;

  // Write to file
  fs.writeFileSync(outputFile, sqlScript);
  console.log(`SQL schema generated and saved to ${outputFile}`);
}

// Run the generator
generateSchema().catch(error => {
  console.error('Error generating schema:', error);
  process.exit(1);
});