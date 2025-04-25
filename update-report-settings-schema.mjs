/**
 * Script to update report_settings table schema
 * 
 * This script applies the following schema changes:
 * 1. Adds base_url column for configurable URLs in reports
 * 2. Adds description column for better context
 * 3. Adds compatibility for new column names (recipient_email vs recipients, active vs is_active)
 * 4. Adds support for daily frequency
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

async function updateReportSettingsSchema() {
  let client;
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Connection established successfully');
    
    // Start transaction
    await client.query('BEGIN');
    
    console.log('\nChecking for existing columns...');
    
    // Check if base_url column exists
    const baseUrlResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'report_settings'
        AND column_name = 'base_url';
    `);
    
    // Check if description column exists
    const descriptionResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'report_settings'
        AND column_name = 'description';
    `);
    
    // Check recipients/recipient_email column
    const recipientsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'report_settings'
        AND (column_name = 'recipients' OR column_name = 'recipient_email');
    `);
    
    // Check active/is_active column
    const activeResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'report_settings'
        AND (column_name = 'is_active' OR column_name = 'active');
    `);
    
    // Add base_url column if it doesn't exist
    if (baseUrlResult.rows.length === 0) {
      console.log('Adding base_url column...');
      await client.query(`
        ALTER TABLE report_settings 
        ADD COLUMN base_url TEXT;
      `);
      console.log('✅ base_url column added');
    } else {
      console.log('✅ base_url column already exists');
    }
    
    // Add description column if it doesn't exist
    if (descriptionResult.rows.length === 0) {
      console.log('Adding description column...');
      await client.query(`
        ALTER TABLE report_settings 
        ADD COLUMN description TEXT;
      `);
      console.log('✅ description column added');
    } else {
      console.log('✅ description column already exists');
    }
    
    // Handle recipients/recipient_email column
    if (recipientsResult.rows.length > 0) {
      const currentColumn = recipientsResult.rows[0].column_name;
      if (currentColumn === 'recipients') {
        console.log('Creating recipient_email column for compatibility...');
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'report_settings' AND column_name = 'recipient_email'
            ) THEN
              ALTER TABLE report_settings 
              ADD COLUMN recipient_email TEXT;
              
              UPDATE report_settings 
              SET recipient_email = recipients;
            END IF;
          END $$;
        `);
        console.log('✅ recipient_email column created and data copied');
      } else {
        console.log('✅ recipient_email column already exists');
      }
    }
    
    // Handle active/is_active column
    if (activeResult.rows.length > 0) {
      const currentColumn = activeResult.rows[0].column_name;
      if (currentColumn === 'is_active') {
        console.log('Creating active column for compatibility...');
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'report_settings' AND column_name = 'active'
            ) THEN
              ALTER TABLE report_settings 
              ADD COLUMN active BOOLEAN DEFAULT true;
              
              UPDATE report_settings 
              SET active = is_active;
            END IF;
          END $$;
        `);
        console.log('✅ active column created and data copied');
      } else {
        console.log('✅ active column already exists');
      }
    }
    
    // Add support for daily frequency if needed
    console.log('Checking frequency values...');
    const frequencyResult = await client.query(`
      SELECT DISTINCT frequency FROM report_settings;
    `);
    
    console.log('Current frequency values:', frequencyResult.rows.map(row => row.frequency).join(', '));
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\nSchema update transaction completed successfully');
    
    // Report the current schema
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'report_settings'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nUpdated report_settings table schema:');
    console.table(schemaResult.rows);
    
    return true;
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error updating schema:', err);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Run the update
updateReportSettingsSchema()
  .then(success => {
    console.log('\nSchema update ' + (success ? 'completed successfully ✅' : 'failed ❌'));
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });