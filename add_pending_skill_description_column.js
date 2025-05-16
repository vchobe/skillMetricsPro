/**
 * Migration script to add description column to pending_skill_updates table
 * 
 * This script adds the description column to hold information about a user's 
 * experience with a particular skill in the pending approval workflow.
 */

import pg from 'pg';
const { Pool } = pg;

function getDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    };
  } else {
    return {
      host: process.env.PGHOST || process.env.CLOUD_SQL_HOST || 'localhost',
      port: process.env.PGPORT || process.env.CLOUD_SQL_PORT || 5432,
      database: process.env.PGDATABASE || process.env.CLOUD_SQL_DATABASE || 'skillmetrics',
      user: process.env.PGUSER || process.env.CLOUD_SQL_USER || 'postgres',
      password: process.env.PGPASSWORD || process.env.CLOUD_SQL_PASSWORD || '',
      ssl: process.env.CLOUD_SQL_USE_SSL === 'true' ? { rejectUnauthorized: false } : false
    };
  }
}

async function addDescriptionColumn() {
  const pool = new Pool(getDatabaseConfig());

  try {
    // First check if the column already exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pending_skill_updates' AND column_name = 'description';
    `;
    
    const checkResult = await pool.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      console.log('Adding description column to pending_skill_updates table...');
      
      // Add the column
      const alterQuery = `
        ALTER TABLE pending_skill_updates
        ADD COLUMN description TEXT;
      `;
      
      await pool.query(alterQuery);
      console.log('Description column added successfully to pending_skill_updates table.');
    } else {
      console.log('Description column already exists in pending_skill_updates table.');
    }
  } catch (error) {
    console.error('Error adding description column to pending_skill_updates table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
addDescriptionColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });

export { addDescriptionColumn };