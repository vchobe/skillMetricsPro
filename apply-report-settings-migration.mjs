/**
 * Migration script for report settings
 * 
 * This script applies all necessary schema and data updates:
 * 1. Adds base_url column for configurable URLs in reports
 * 2. Adds description column for better context
 * 3. Adds compatibility for new column names (recipient_email vs recipients, active vs is_active)
 * 4. Adds support for daily frequency
 * 5. Sets default values for existing report settings
 */

import pkg from 'pg';
const { Pool } = pkg;

// Database configuration using direct IP connection
const config = {
  host: process.env.PGHOST || '34.30.6.95',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'neondb',
  user: process.env.PGUSER || 'neondb_owner',
  password: process.env.PGPASSWORD || 'npg_6SNPYmkEt5pa',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Log connection info (masking password)
console.log('Database connection config:', {
  ...config,
  password: '****'
});

// Create a connection pool
const pool = new Pool(config);

// Schema update function
async function updateSchema(client) {
  console.log('\n----- SCHEMA UPDATE -----');
  
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
  
  // Add check constraint for frequency if it doesn't exist
  console.log('Adding frequency check constraint if needed...');
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'report_settings_frequency_check'
      ) THEN
        ALTER TABLE report_settings 
        ADD CONSTRAINT report_settings_frequency_check 
        CHECK (frequency IN ('daily', 'weekly', 'monthly'));
      END IF;
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Skipping frequency constraint: %', SQLERRM;
    END $$;
  `);
  
  console.log('Schema updates completed successfully');
}

// Data update function
async function updateData(client) {
  console.log('\n----- DATA UPDATE -----');
  
  // Get count of report settings
  const countResult = await client.query(`
    SELECT COUNT(*) as count FROM report_settings;
  `);
  
  const count = parseInt(countResult.rows[0].count);
  console.log(`Found ${count} report settings`);
  
  if (count > 0) {
    // Update existing report settings with default values for new columns if they're NULL
    console.log('Updating existing report settings...');
    
    const result = await client.query(`
      UPDATE report_settings
      SET 
        base_url = COALESCE(base_url, 'https://skillmetrics-production.run-asia-southeast1.goorm.app'),
        description = COALESCE(description, 
          CASE 
            WHEN frequency = 'weekly' THEN 'Weekly summary of resources added to projects, sent every Monday at 9:00 AM'
            WHEN frequency = 'monthly' THEN 'Monthly summary of resources added to projects, sent on the 1st of each month'
            WHEN frequency = 'daily' THEN 'Daily summary of resources added to projects'
            ELSE 'Resource report'
          END
        ),
        recipient_email = COALESCE(recipient_email, recipients),
        active = COALESCE(active, is_active)
      WHERE 
        (base_url IS NULL OR description IS NULL OR 
         (recipient_email IS NULL AND recipients IS NOT NULL) OR
         (active IS NULL AND is_active IS NOT NULL))
      RETURNING id, name, frequency, base_url, description;
    `);
    
    if (result.rows.length === 0) {
      console.log('No report settings needed updates');
    } else {
      console.log(`Updated ${result.rows.length} report settings:`);
      result.rows.forEach(row => {
        console.log(`  - ID ${row.id}: ${row.name} (${row.frequency})`);
        console.log(`    Base URL: ${row.base_url}`);
        console.log(`    Description: ${row.description}`);
      });
    }
  }
  
  console.log('Data updates completed successfully');
}

// Main migration function
async function applyMigration() {
  let client;
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Connection established successfully');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Apply schema updates
    await updateSchema(client);
    
    // Apply data updates
    await updateData(client);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\nMigration completed successfully');
    
    // Report the current schema
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'report_settings'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nFinal report_settings table schema:');
    console.table(schemaResult.rows);
    
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
    console.error('Error applying migration:', err);
    return false;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the migration
applyMigration()
  .then(success => {
    console.log('\nMigration ' + (success ? 'completed successfully ✅' : 'failed ❌'));
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });