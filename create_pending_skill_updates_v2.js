// Script to create the pending_skill_updates_v2 table for V2 API support

import pkg from 'pg';
const { Pool } = pkg;

async function createTable() {
  // Use the individual connection parameters instead of connection string
  const pool = new Pool({
    host: process.env.PGHOST || process.env.CLOUD_SQL_HOST,
    port: parseInt(process.env.PGPORT || process.env.CLOUD_SQL_PORT || '5432', 10),
    user: process.env.PGUSER || process.env.CLOUD_SQL_USER,
    password: process.env.PGPASSWORD || process.env.CLOUD_SQL_PASSWORD,
    database: process.env.PGDATABASE || process.env.CLOUD_SQL_DATABASE
  });

  try {
    console.log('Starting transaction to create pending_skill_updates_v2 table...');
    await pool.query('BEGIN');

    console.log('Creating pending_skill_updates_v2 table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_skill_updates_v2 (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        skill_template_id INTEGER REFERENCES skill_templates(id) ON DELETE SET NULL,
        user_skill_id INTEGER REFERENCES user_skills(id) ON DELETE SET NULL,
        level VARCHAR(20) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'expert')),
        certification VARCHAR(255),
        credly_link VARCHAR(500),
        notes TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        review_notes TEXT,
        is_update BOOLEAN DEFAULT FALSE
      );
    `);

    // Add indexes for faster lookups
    console.log('Adding indexes to pending_skill_updates_v2 table...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_pending_updates_v2_user_id ON pending_skill_updates_v2(user_id);
      CREATE INDEX IF NOT EXISTS idx_pending_updates_v2_skill_template_id ON pending_skill_updates_v2(skill_template_id);
      CREATE INDEX IF NOT EXISTS idx_pending_updates_v2_user_skill_id ON pending_skill_updates_v2(user_skill_id);
      CREATE INDEX IF NOT EXISTS idx_pending_updates_v2_status ON pending_skill_updates_v2(status);
    `);

    // Commit the transaction
    await pool.query('COMMIT');
    console.log('✅ Successfully created pending_skill_updates_v2 table');

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Error creating pending_skill_updates_v2 table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createTable().catch(err => {
  console.error('Failed to create table:', err);
  process.exit(1);
});