/**
 * Create Skill History Table V2 Script
 * 
 * This script creates a new skill_histories_v2 table that references the user_skills table
 * instead of the original skills table. This allows us to maintain historical data
 * while migrating to the new skill model.
 */

import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false
});

async function createSkillHistoryV2Table() {
  console.log("Creating skill_histories_v2 table...");
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create the skill_histories_v2 table
    await client.query(`
      CREATE TABLE IF NOT EXISTS skill_histories_v2 (
        id SERIAL PRIMARY KEY,
        user_skill_id INTEGER NOT NULL REFERENCES user_skills(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        previous_level VARCHAR(255),
        new_level VARCHAR(255),
        change_note TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log("skill_histories_v2 table created successfully");
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_skill_histories_v2_user_skill_id ON skill_histories_v2(user_skill_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_skill_histories_v2_user_id ON skill_histories_v2(user_id)
    `);
    
    console.log("Indexes created for skill_histories_v2 table");
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Table creation committed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating skill_histories_v2 table:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
createSkillHistoryV2Table()
  .then(() => {
    console.log('Table creation process completed.');
    pool.end();
  })
  .catch(err => {
    console.error('Table creation failed:', err);
    pool.end();
    process.exit(1);
  });