/**
 * Script to check columns in pending_skill_updates table
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

// Function to check table columns
async function checkTableColumns() {
  const client = await pool.connect();
  
  try {
    console.log('Checking columns in pending_skill_updates table...');
    
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pending_skill_updates' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Pending Skill Updates Table Columns:');
    console.table(columnsResult.rows);
    
    // Check columns referenced in create function
    const requiredColumns = [
      'id', 'user_id', 'skill_id', 'name', 'category', 'subcategory', 
      'level', 'certification', 'credly_link', 'notes', 'status', 
      'submitted_at', 'reviewed_at', 'reviewed_by', 'review_notes', 
      'is_update', 'category_id', 'subcategory_id', 'user_skill_id', 
      'skill_template_id', 'certification_date', 'expiration_date'
    ];
    
    console.log('\nChecking for missing required columns:');
    const missingColumns = [];
    
    for (const column of requiredColumns) {
      const found = columnsResult.rows.some(row => row.column_name === column);
      if (!found) {
        missingColumns.push(column);
        console.log(`Missing column: ${column}`);
      }
    }
    
    if (missingColumns.length === 0) {
      console.log('All required columns are present!');
    } else {
      console.log(`Found ${missingColumns.length} missing columns that need to be added.`);
    }
    
    // Also check notifications table
    console.log('\nChecking columns in notifications table...');
    
    const notificationsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Notifications Table Columns:');
    console.table(notificationsResult.rows);
    
  } catch (error) {
    console.error('Error checking table columns:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the function and exit
(async () => {
  try {
    await checkTableColumns();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Script failed:', error);
    await pool.end();
    process.exit(1);
  }
})();