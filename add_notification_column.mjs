/**
 * Script to add related_user_skill_id column to notifications table
 * This script adds support for referencing user_skills in notifications table
 */

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Use the same database connection logic as the server
function getDatabaseConfig() {
  console.log('Environment:', process.env.NODE_ENV || 'development');
  
  // Use Cloud SQL configuration (Google Cloud SQL only)
  const cloudSqlConnectionName = process.env.CLOUD_SQL_CONNECTION_NAME;
  const cloudSqlUser = process.env.CLOUD_SQL_USER;
  const cloudSqlPassword = process.env.CLOUD_SQL_PASSWORD;
  const cloudSqlDatabase = process.env.CLOUD_SQL_DATABASE;
  
  // Check if we have Cloud SQL configuration
  const hasCloudSqlConfig = cloudSqlConnectionName && cloudSqlUser && cloudSqlPassword && cloudSqlDatabase;
  
  // Verify required credentials
  if (!hasCloudSqlConfig) {
    throw new Error('Database configuration is missing. Please set CLOUD_SQL_CONNECTION_NAME, CLOUD_SQL_USER, CLOUD_SQL_PASSWORD, and CLOUD_SQL_DATABASE environment variables.');
  }
  
  console.log('CONFIGURATION: Using Google Cloud SQL only');
  
  // Always use the direct TCP connection when running from Replit
  const isCloudRun = false; // Force TCP connection
  
  if (isCloudRun) {
    // This branch won't execute, but keeping it for reference
    console.log(`Using Cloud SQL socket connection to: ${cloudSqlConnectionName}`);
    
    return {
      user: cloudSqlUser,
      password: cloudSqlPassword,
      database: cloudSqlDatabase,
      host: `/cloudsql/${cloudSqlConnectionName}`,
      ssl: false, // SSL is not used with Unix socket
    };
  } else {
    // In development or direct connection mode, use TCP connection
    
    // Check if we have host and port override - useful for direct connections
    const dbHost = process.env.CLOUD_SQL_HOST || 'localhost';
    const dbPort = parseInt(process.env.CLOUD_SQL_PORT || '5432', 10);
    
    console.log(`Using direct TCP connection to: ${dbHost}:${dbPort}`);
    console.log('SSL Enabled:', process.env.CLOUD_SQL_USE_SSL === 'true' ? 'Yes' : 'No');
    
    return {
      user: cloudSqlUser,
      password: cloudSqlPassword,
      database: cloudSqlDatabase,
      host: dbHost,
      port: dbPort,
      ssl: process.env.CLOUD_SQL_USE_SSL === 'true',
    };
  }
}

// Create a new connection pool with our config
const pool = new Pool(getDatabaseConfig());

// Function to add column
async function addNotificationColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Starting notifications table update...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Step 1: Check if the column already exists
    console.log('Checking if related_user_skill_id column exists in notifications table...');
    const columnExistsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'related_user_skill_id';
    `);
    
    if (columnExistsResult.rows.length === 0) {
      console.log('related_user_skill_id column does not exist in notifications. Adding it...');
      
      // Add the column with proper foreign key reference
      await client.query(`
        ALTER TABLE notifications 
        ADD COLUMN related_user_skill_id INTEGER;
      `);
      
      // Add foreign key constraint (optional) - using deferrable constraint to avoid circular issues
      await client.query(`
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_related_user_skill_id_fkey 
        FOREIGN KEY (related_user_skill_id) 
        REFERENCES user_skills(id) 
        ON DELETE SET NULL 
        DEFERRABLE INITIALLY DEFERRED;
      `);
      
      console.log('Successfully added related_user_skill_id column to notifications table');
    } else {
      console.log('related_user_skill_id column already exists in notifications table');
    }
    
    // Commit all changes
    await client.query('COMMIT');
    console.log('Successfully committed all schema changes');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding notification column, rolling back changes:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the function and exit
(async () => {
  try {
    await addNotificationColumn();
    console.log('Successfully updated notifications table schema');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Failed to update schema:', error);
    await pool.end();
    process.exit(1);
  }
})();