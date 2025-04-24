/**
 * Script to apply report settings updates
 * 
 * This script modifies the report_settings table to add support for:
 * - Custom base_url for links in email reports
 * - Description field for report settings
 * - Daily report frequency
 * - Standardized column names (recipient_email, active)
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function applyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration for report settings updates...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'sql_migrations', 'update_report_settings_schema.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Split the SQL into individual statements and execute each one
    const statements = sql
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .filter(statement => statement.trim()); // Remove empty statements
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log('Executed SQL statement successfully');
        } catch (error) {
          console.error('Error executing SQL statement:', error.message);
          console.error('Statement:', statement);
          throw error;
        }
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully');
    
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Migration failed, changes rolled back:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration()
  .then(() => {
    console.log('Report settings update script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Report settings update script failed:', error);
    process.exit(1);
  });