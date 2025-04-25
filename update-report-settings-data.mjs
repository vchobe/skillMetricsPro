/**
 * Script to update report settings data
 * 
 * This script updates the existing report settings with:
 * 1. A default base_url value
 * 2. A description for the existing report
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
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Create a connection pool
const pool = new Pool(config);

async function updateReportSettingsData() {
  let client;
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Connection established successfully');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Update the existing report settings with default values
    console.log('\nUpdating report settings data...');
    const result = await client.query(`
      UPDATE report_settings
      SET 
        base_url = 'https://skillmetrics-production.run-asia-southeast1.goorm.app',
        description = 'Weekly summary of resources added to projects, sent every Monday at 9:00 AM'
      WHERE id = 1
      RETURNING *;
    `);
    
    if (result.rows.length === 0) {
      console.log('No report settings found to update');
    } else {
      console.log(`Updated report setting ID: ${result.rows[0].id}`);
      console.log(`Name: ${result.rows[0].name}`);
      console.log(`Description: ${result.rows[0].description}`);
      console.log(`Base URL: ${result.rows[0].base_url}`);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\nData update completed successfully');
    
    // Display all report settings
    const allSettings = await client.query(`
      SELECT * FROM report_settings;
    `);
    
    console.log('\nCurrent report settings:');
    console.table(allSettings.rows);
    
    return true;
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error updating data:', err);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Run the update
updateReportSettingsData()
  .then(success => {
    console.log('\nData update ' + (success ? 'completed successfully ✅' : 'failed ❌'));
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });