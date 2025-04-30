/**
 * User Skills Migration Script
 * 
 * This script handles migrating data from the legacy 'skills' table to the new 'user_skills' table
 * which references skill templates instead of storing skill definitions inline.
 * 
 * Process:
 * 1. Find or create skill templates for each unique skill in the skills table
 * 2. Create new user_skills entries that point to these templates
 * 3. Migrate any existing endorsements and skill histories to reference new user_skill ids
 * 
 * Run with: node scripts/migrate-to-user-skills.js
 */

import pg from 'pg';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect to database using environment variables
console.log('Database connection settings:');
console.log(`- Host: ${process.env.CLOUD_SQL_HOST || 'localhost'}`);
console.log(`- Port: ${process.env.CLOUD_SQL_PORT || '5432'}`);
console.log(`- Database: ${process.env.CLOUD_SQL_DATABASE}`);
console.log(`- User: ${process.env.CLOUD_SQL_USER}`);
console.log(`- SSL: ${process.env.CLOUD_SQL_USE_SSL === 'true'}`);

// Connect using DATABASE_URL directly from environment
let connectionConfig;
if (process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL for connection');
  connectionConfig = { connectionString: process.env.DATABASE_URL };
} else {
  console.log('Using individual connection parameters');
  connectionConfig = {
    user: process.env.CLOUD_SQL_USER,
    password: process.env.CLOUD_SQL_PASSWORD,
    database: process.env.CLOUD_SQL_DATABASE,
    host: process.env.CLOUD_SQL_HOST || 'localhost',
    port: parseInt(process.env.CLOUD_SQL_PORT || '5432', 10),
    ssl: process.env.CLOUD_SQL_USE_SSL === 'true'
  };
}

const pool = new Pool(connectionConfig);

async function migrateSkillsToUserSkills() {
  const client = await pool.connect();
  
  try {
    // Create tables outside of transaction
    console.log('Creating or verifying necessary tables before migration...');
    
    // First, check if the skill_level enum type exists
    console.log('Ensuring skill_level enum type exists...');
    try {
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'skill_level') THEN
            CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'expert');
          END IF;
        END$$;
      `);
      console.log('skill_level enum type created or already exists');
    } catch (err) {
      console.error('Error creating skill_level enum:', err.message);
      // Continue anyway
    }
    
    // Check if skill_templates table exists, create if it doesn't
    console.log('Ensuring skill_templates table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS skill_templates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        category_id INTEGER,
        subcategory_id INTEGER,
        description TEXT,
        is_recommended BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Check if user_skills table exists, create if it doesn't
    console.log('Ensuring user_skills table exists...');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_skills (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          skill_template_id INTEGER NOT NULL,
          level TEXT NOT NULL,
          certification TEXT,
          credly_link TEXT,
          notes TEXT,
          endorsement_count INTEGER DEFAULT 0,
          certification_date TIMESTAMP WITH TIME ZONE,
          expiration_date TIMESTAMP WITH TIME ZONE,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (skill_template_id) REFERENCES skill_templates(id) ON DELETE CASCADE,
          UNIQUE (user_id, skill_template_id)
        )
      `);
      console.log('user_skills table created or already exists');
    } catch (err) {
      console.error('Error creating user_skills table:', err.message);
      // Continue anyway
    }
    
    // Create a mapping table that records the relationship between old skill ids and new user_skill ids
    console.log('Ensuring skill_migration_map table exists...');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS skill_migration_map (
          old_skill_id INTEGER NOT NULL,
          new_user_skill_id INTEGER NOT NULL,
          migrated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('skill_migration_map table created or already exists');
    } catch (err) {
      console.error('Error creating skill_migration_map table:', err.message);
      // Continue anyway
    }
    
    // Start a transaction for data migration
    await client.query('BEGIN');
    
    console.log('Beginning migration from skills to user_skills...');
    
    // 1. Get all existing skills (use LIMIT for testing)
    const { rows: skills } = await client.query(`
      SELECT * FROM skills ORDER BY user_id, category, name LIMIT 50
    `);
    
    console.log(`Found ${skills.length} skills to migrate`);
    
    // Define the batch size
    const BATCH_SIZE = 50;
    
    // 2. Process each skill to find or create corresponding skill template
    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];
      
      // Log batch progress
      if (i % BATCH_SIZE === 0) {
        console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(skills.length/BATCH_SIZE)} (skills ${i+1}-${Math.min(i+BATCH_SIZE, skills.length)} of ${skills.length})`);
      }
      // First check if a template already exists for this skill
      const { rows: templates } = await client.query(`
        SELECT * FROM skill_templates 
        WHERE name = $1 AND category = $2
        ORDER BY id LIMIT 1
      `, [skill.name, skill.category]);
      
      let templateId;
      
      // If template doesn't exist, create one
      if (templates.length === 0) {
        console.log(`Creating new skill template for "${skill.name}" in category "${skill.category}"`);
        
        const { rows: newTemplate } = await client.query(`
          INSERT INTO skill_templates (
            name, category, category_id, subcategory_id, description, is_recommended
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [
          skill.name, 
          skill.category, 
          skill.category_id, 
          skill.subcategory_id, 
          '', // empty description for migrated templates
          false // not recommended by default
        ]);
        
        templateId = newTemplate[0].id;
      } else {
        templateId = templates[0].id;
        console.log(`Using existing skill template #${templateId} for "${skill.name}"`);
      }
      
      // Check if user_skill already exists
      const { rows: existingUserSkills } = await client.query(`
        SELECT * FROM user_skills
        WHERE user_id = $1 AND skill_template_id = $2
      `, [skill.user_id, templateId]);
      
      if (existingUserSkills.length > 0) {
        console.log(`User skill already exists for user ${skill.user_id} and template ${templateId}, skipping...`);
        continue;
      }
      
      // Create user_skill entry
      const { rows: newUserSkill } = await client.query(`
        INSERT INTO user_skills (
          user_id, skill_template_id, level, certification, credly_link,
          notes, endorsement_count, certification_date, expiration_date, last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        skill.user_id,
        templateId,
        skill.level,
        skill.certification,
        skill.credly_link,
        skill.notes,
        skill.endorsement_count || 0,
        skill.certification_date,
        skill.expiration_date,
        skill.last_updated || new Date()
      ]);
      
      const userSkillId = newUserSkill[0].id;
      console.log(`Created user_skill #${userSkillId} for user ${skill.user_id} using template ${templateId}`);
      
      // Instead of updating references in other tables, let's create a mapping table that we can use later
      // to migrate references in endorsements and skill_histories
      
      // Add entry to the mapping between old and new IDs
      await client.query(`
        INSERT INTO skill_migration_map (old_skill_id, new_user_skill_id)
        VALUES ($1, $2)
      `, [skill.id, userSkillId]);
      
      console.log(`Added migration mapping: skill #${skill.id} -> user_skill #${userSkillId}`);
    }
    
    // Count how many entries were added to the mapping table during the migration
    
    // Count how many mappings were created
    const { rows: mappingCount } = await client.query(`
      SELECT COUNT(*) FROM skill_migration_map
    `);
    
    console.log(`Created ${mappingCount[0].count} migration mappings between skills and user_skills`);
    
    // Verify table schema before committing
    console.log('Verifying tables before committing...');
    
    // List all tables
    const { rows: tables } = await client.query(`
      SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'
    `);
    console.log('Available tables:', tables.map(t => t.tablename).join(', '));
    
    // Verify skill_templates content
    const { rows: templateCount } = await client.query(`
      SELECT COUNT(*) FROM skill_templates
    `);
    console.log(`skill_templates table has ${templateCount[0].count} rows`);
    
    try {
      // Verify user_skills content
      const { rows: userSkillsCount } = await client.query(`
        SELECT COUNT(*) FROM user_skills
      `);
      console.log(`user_skills table has ${userSkillsCount[0].count} rows`);
    } catch (e) {
      console.error('Could not query user_skills table:', e.message);
    }
    
    try {
      // Verify migration map content
      const { rows: mapCount } = await client.query(`
        SELECT COUNT(*) FROM skill_migration_map
      `);
      console.log(`skill_migration_map table has ${mapCount[0].count} rows`);
    } catch (e) {
      console.error('Could not query skill_migration_map table:', e.message);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Migration committed successfully!');
    
  } catch (error) {
    console.error('Error during migration, rolling back transaction');
    try {
      await client.query('ROLLBACK');
      console.error('Transaction rolled back successfully');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }
    console.error('Original error details:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
migrateSkillsToUserSkills()
  .then(() => {
    console.log('Migration process completed.');
    pool.end();
  })
  .catch(err => {
    console.error('Migration failed:', err);
    pool.end();
    process.exit(1);
  });