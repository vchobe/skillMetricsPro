/**
 * Test script for direct connection to Cloud SQL
 * 
 * This script tests a direct TCP connection to the Cloud SQL database
 * using the IP address instead of Unix sockets.
 */

import pkg from 'pg';
const { Pool } = pkg;

// Database configuration using direct IP connection
const config = {
  host: '34.30.6.95',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_6SNPYmkEt5pa',
  // Connection pool settings
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

console.log('Testing direct IP connection to Cloud SQL');
console.log('Connection config:', {
  ...config,
  // Hide password in logs
  password: '****'
});

// Create a connection pool
const pool = new Pool(config);

// Test the connection
async function testConnection() {
  let client;
  try {
    console.log('Attempting to connect...');
    client = await pool.connect();
    console.log('Connection established successfully');
    
    // Test simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Query executed successfully:');
    console.log(result.rows[0]);
    
    // Get database version
    const versionResult = await client.query('SELECT version()');
    console.log('\nDatabase version:');
    console.log(versionResult.rows[0].version);
    
    // Count tables in the public schema
    const tablesResult = await client.query(`
      SELECT count(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`\nNumber of tables in public schema: ${tablesResult.rows[0].table_count}`);
    
    // List some table names if there are any
    if (parseInt(tablesResult.rows[0].table_count) > 0) {
      const tableNamesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        LIMIT 5
      `);
      console.log('\nSample tables:');
      tableNamesResult.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
    return true;
  } catch (err) {
    console.error('Connection error:', err);
    return false;
  } finally {
    if (client) {
      console.log('Releasing connection');
      client.release();
    }
  }
}

// Run the test
testConnection()
  .then(success => {
    console.log('\nConnection test ' + (success ? 'PASSED ✅' : 'FAILED ❌'));
    // Exit with appropriate code
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error during test:', err);
    process.exit(1);
  });