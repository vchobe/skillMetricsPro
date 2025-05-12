/**
 * Migration script to add skill_template_id column to project_skills table
 * 
 * This script adds the skill_template_id column to the existing project_skills table
 * to properly reference skill templates instead of using the skill_id column.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Get database connection parameters
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration: Adding skill_template_id column to project_skills table...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Check if column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project_skills' 
        AND column_name = 'skill_template_id'
    `);
    
    // Add column if it doesn't exist
    if (columnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE project_skills 
        ADD COLUMN skill_template_id INTEGER REFERENCES skill_templates(id)
      `);
      
      // Initially set skill_template_id equal to skill_id for all existing rows
      await client.query(`
        UPDATE project_skills 
        SET skill_template_id = skill_id 
        WHERE skill_template_id IS NULL
      `);
      
      // Create an index for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_project_skills_skill_template_id 
        ON project_skills(skill_template_id)
      `);
      
      console.log('Added skill_template_id column to project_skills table');
    } else {
      console.log('skill_template_id column already exists in project_skills table');
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Migration complete: Added skill_template_id column to project_skills table');
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
addColumn().catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
});