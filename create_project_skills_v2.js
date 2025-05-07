/**
 * Migration script to create the project_skills_v2 table
 * 
 * This script creates the project_skills_v2 table which is used to associate
 * skill templates with projects rather than using the legacy skills table.
 */

const pg = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Get database connection parameters
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTable() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration: Creating project_skills_v2 table...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Create project_skills_v2 table
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_skills_v2 (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        skill_template_id INTEGER NOT NULL REFERENCES skill_templates(id),
        user_skill_id INTEGER,
        required_level VARCHAR(20) DEFAULT 'beginner',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_project_skills_v2_project_id ON project_skills_v2(project_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_project_skills_v2_skill_template_id ON project_skills_v2(skill_template_id);
    `);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Migration complete: project_skills_v2 table created successfully');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute the migration
createTable().catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
});