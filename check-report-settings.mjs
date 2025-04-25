/**
 * Script to check report settings in the database
 * 
 * This utility script connects to the database and displays
 * the current report settings configuration.
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

// Create a connection pool
const pool = new Pool(config);

// Function to check report settings table
async function checkReportSettings() {
  let client;
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Connection established successfully\n');
    
    // Check if report_settings table exists
    const tableCheckResult = await client.query(`
      SELECT to_regclass('public.report_settings') IS NOT NULL as exists;
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    console.log(`Report settings table exists: ${tableExists}`);
    
    if (!tableExists) {
      console.log('\nTable does not exist. Here is the schema to create it:');
      console.log(`
CREATE TABLE report_settings (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  recipient_email TEXT NOT NULL,
  client_id INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  base_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
      `);
      return;
    }
    
    // Get table schema
    console.log('\nRetrieving report_settings table schema:');
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'report_settings'
      ORDER BY ordinal_position;
    `);
    
    console.table(schemaResult.rows);
    
    // Check column name differences
    console.log('\nChecking for column name variations:');
    const recipientsColumnResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'report_settings'
        AND (column_name = 'recipient_email' OR column_name = 'recipients');
    `);
    
    const activeColumnResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'report_settings'
        AND (column_name = 'active' OR column_name = 'is_active');
    `);
    
    console.log(`Email column name: ${recipientsColumnResult.rows.map(row => row.column_name).join(' or ')}`);
    console.log(`Active column name: ${activeColumnResult.rows.map(row => row.column_name).join(' or ')}`);
    
    // Get current report settings
    console.log('\nCurrent report settings:');
    const reportSettingsResult = await client.query(`
      SELECT * FROM report_settings;
    `);
    
    if (reportSettingsResult.rows.length === 0) {
      console.log('No report settings found in the database.');
    } else {
      console.table(reportSettingsResult.rows);
    }
    
    return true;
  } catch (err) {
    console.error('Error:', err);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Run the check
checkReportSettings()
  .then(() => {
    console.log('\nCheck complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });