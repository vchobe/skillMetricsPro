// Script to check the database schema for the skill_templates table
const { Pool } = require('pg');
require('dotenv').config();

// Use the same database connection settings as the server
function getDatabaseConfig() {
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Is Cloud Run:', process.env.K_SERVICE ? 'Yes' : 'No');
  
  // Use Cloud SQL configuration
  const cloudSqlConnectionName = process.env.CLOUD_SQL_CONNECTION_NAME;
  const cloudSqlUser = process.env.CLOUD_SQL_USER;
  const cloudSqlPassword = process.env.CLOUD_SQL_PASSWORD;
  const cloudSqlDatabase = process.env.CLOUD_SQL_DATABASE;
  
  // Check if we have Cloud SQL configuration
  const hasCloudSqlConfig = cloudSqlConnectionName && cloudSqlUser && cloudSqlPassword && cloudSqlDatabase;
  
  // Verify required credentials
  if (!hasCloudSqlConfig) {
    throw new Error('Database configuration is missing.');
  }
  
  console.log('CONFIGURATION: Using Google Cloud SQL only');
  console.log('Forcing direct TCP connection for test script');
  
  // In development or direct connection mode, use TCP connection
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
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  };
}

// Configure pool with our database config
const pool = new Pool(getDatabaseConfig());

async function checkTableSchema(tableName) {
  try {
    console.log(`Checking schema for table: ${tableName}`);
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);
    
    if (result.rows.length === 0) {
      console.log(`Table ${tableName} not found or has no columns.`);
      return;
    }
    
    console.log(`Columns for table ${tableName}:`);
    result.rows.forEach(column => {
      console.log(`- ${column.column_name}: ${column.data_type} ${column.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    return result.rows;
  } catch (error) {
    console.error(`Error checking schema for table ${tableName}:`, error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Check the skill_templates table schema
checkTableSchema('skill_templates')
  .then(() => {
    console.log('Schema check completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Schema check failed:', error);
    process.exit(1);
  });