import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.CLOUD_SQL_HOST,
  port: process.env.CLOUD_SQL_PORT,
  database: process.env.CLOUD_SQL_DATABASE,
  user: process.env.CLOUD_SQL_USER,
  password: process.env.CLOUD_SQL_PASSWORD
});

async function updateTables() {
  const client = await pool.connect();
  try {
    console.log('Updating tables to include V2 fields...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Add columns to skill_histories table
    console.log('Updating skill_histories table...');
    await client.query(`
      ALTER TABLE skill_histories 
      ADD COLUMN IF NOT EXISTS user_skill_id INTEGER REFERENCES user_skills(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS change_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS approval_id INTEGER REFERENCES pending_skill_updates(id) ON DELETE SET NULL
    `);
    
    // Add columns to endorsements table
    console.log('Updating endorsements table...');
    await client.query(`
      ALTER TABLE endorsements 
      ADD COLUMN IF NOT EXISTS user_skill_id INTEGER REFERENCES user_skills(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS user_id INTEGER,
      ADD COLUMN IF NOT EXISTS level VARCHAR(20),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP
    `);
    
    // Add columns to pending_skill_updates table
    console.log('Updating pending_skill_updates table...');
    await client.query(`
      ALTER TABLE pending_skill_updates 
      ADD COLUMN IF NOT EXISTS user_skill_id INTEGER REFERENCES user_skills(id),
      ADD COLUMN IF NOT EXISTS skill_template_id INTEGER REFERENCES skill_templates(id)
    `);
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Successfully updated all tables');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating tables:', err);
  } finally {
    client.release();
    pool.end();
  }
}

updateTables();