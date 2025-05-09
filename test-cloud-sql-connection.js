/**
 * Test script for direct connection to Cloud SQL
 * 
 * This script tests a direct TCP connection to the Cloud SQL database
 * using app_user account with no fallbacks
 */
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

async function testConnection() {
  console.log('Testing Cloud SQL Connection with app_user');
  
  // Use app_user for Google Cloud SQL as required
  const cloudSqlUser = 'app_user';
  const cloudSqlPassword = process.env.CLOUD_SQL_PASSWORD;
  const cloudSqlHost = '34.30.6.95';
  const cloudSqlPort = 5432;
  const cloudSqlDatabase = 'neondb';
  
  console.log('Connection parameters:');
  console.log('Database host:', cloudSqlHost);
  console.log('Database user:', cloudSqlUser);
  console.log('Database name:', cloudSqlDatabase);
  console.log('Password available:', cloudSqlPassword ? 'Yes' : 'No');
  
  // Create connection configuration
  const config = {
    user: cloudSqlUser,
    password: cloudSqlPassword,
    database: cloudSqlDatabase,
    host: cloudSqlHost,
    port: cloudSqlPort,
    ssl: false, // Cloud SQL direct connection doesn't require SSL
    connectionTimeoutMillis: 10000 // 10 seconds for testing
  };
  
  // Create a new Pool
  const pool = new Pool(config);
  
  try {
    console.log('Attempting to connect to database...');
    const client = await pool.connect();
    
    console.log('Connection successful!');
    console.log('Running test query...');
    
    const result = await client.query('SELECT CURRENT_TIMESTAMP');
    console.log('Query result:', result.rows[0]);
    
    // Release client back to pool
    client.release();
    
    console.log('Test complete - Database connection working properly');
    return true;
  } catch (err) {
    console.error('Database connection failed:');
    console.error(err);
    return false;
  } finally {
    // End pool
    await pool.end();
  }
}

// Run the test
testConnection().then(success => {
  console.log('Connection test ' + (success ? 'PASSED' : 'FAILED'));
  
  if (!success) {
    console.log('\nPossible solutions:');
    console.log('1. Verify CLOUD_SQL_PASSWORD is correct in .env');
    console.log('2. Ensure app_user exists and has access to skillmetrics database');
    console.log('3. Verify IP address 34.30.6.95 is correct for the Cloud SQL instance');
    console.log('4. Check that Replit\'s IP is allowed in Cloud SQL authorized networks');
  }
}).catch(err => {
  console.error('Error running test:', err);
});