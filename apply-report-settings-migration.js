// Script to apply the report settings migration
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Get the database connection string from environment variables
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable not set');
  process.exit(1);
}

// Create a new pool
const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function applyMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration for report_settings table...');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'sql_migrations', 'add_report_settings_table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Begin transaction
    await client.query('BEGIN');

    // Check if table already exists
    const checkTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'report_settings'
      );
    `);

    const tableExists = checkTableResult.rows[0].exists;

    if (tableExists) {
      console.log('Table report_settings already exists. Checking for missing columns...');

      // Check if necessary columns exist and add them if they don't
      const requiredColumns = [
        { name: 'day_of_week', type: 'integer' },
        { name: 'day_of_month', type: 'integer' },
        { name: 'frequency', type: 'character varying(50)' },
        { name: 'next_scheduled_at', type: 'timestamp with time zone' }
      ];

      for (const column of requiredColumns) {
        const columnCheckResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'report_settings' 
            AND column_name = $1
          );
        `, [column.name]);

        if (!columnCheckResult.rows[0].exists) {
          console.log(`Adding missing column ${column.name} to report_settings table...`);
          await client.query(`ALTER TABLE report_settings ADD COLUMN ${column.name} ${column.type};`);
        }
      }

      console.log('Table report_settings updated successfully');
    } else {
      console.log('Table report_settings does not exist. Creating it...');
      // Execute SQL from file
      await client.query(sqlContent);
      console.log('Migration SQL executed successfully');
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error applying migration:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();