/**
 * Migration script to add description column to user_skills table
 * 
 * This script adds the description column to hold information about
 * a user's experience with a particular skill.
 */
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

// Get database connection parameters
function getDatabaseConfig() {
  // Check for Google Cloud SQL configuration
  const cloudSqlUser = process.env.CLOUD_SQL_USER;
  const cloudSqlPassword = process.env.CLOUD_SQL_PASSWORD;
  const cloudSqlDatabase = process.env.CLOUD_SQL_DATABASE;
  const dbHost = process.env.CLOUD_SQL_HOST || 'localhost';
  const dbPort = parseInt(process.env.CLOUD_SQL_PORT || '5432', 10);
  
  return {
    user: cloudSqlUser,
    password: cloudSqlPassword,
    database: cloudSqlDatabase,
    host: dbHost,
    port: dbPort,
    ssl: process.env.CLOUD_SQL_USE_SSL === 'true'
  };
}

async function addDescriptionColumn() {
  const pool = new Pool(getDatabaseConfig());
  
  try {
    console.log('Adding description column to user_skills table...');
    
    // Check if column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_skills' AND column_name = 'description'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('description column already exists in user_skills table.');
    } else {
      // Add the description column
      await pool.query(`
        ALTER TABLE user_skills
        ADD COLUMN description TEXT
      `);
      console.log('Successfully added description column to user_skills table.');
    }
  } catch (error) {
    console.error('Error adding description column:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
addDescriptionColumn().then(() => {
  console.log('Migration completed.');
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});