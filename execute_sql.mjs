/**
 * Execute SQL script to create project_skills_v2 table
 * 
 * This script uses the raw PostgreSQL client to directly create the table
 * using SQL rather than relying on Drizzle's APIs.
 */

import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

async function executeSQL() {
  // Create a new pool using DATABASE_URL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected successfully');

    console.log('Creating project_skills_v2 table...');
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
    console.log('Table created successfully');

    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_project_skills_v2_project_id ON project_skills_v2(project_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_project_skills_v2_skill_template_id ON project_skills_v2(skill_template_id);
    `);
    console.log('Indexes created successfully');

    client.release();
    console.log('Script completed successfully');
  } catch (error) {
    console.error('Error executing SQL:', error);
  } finally {
    await pool.end();
  }
}

executeSQL();