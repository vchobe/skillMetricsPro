import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config();

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('Using DATABASE_URL:', process.env.DATABASE_URL);

// Create a pool of Postgres clients
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration(filePath: string): Promise<void> {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Running migration: ${path.basename(filePath)}`);
    await pool.query(sql);
    console.log(`Migration ${path.basename(filePath)} completed successfully`);
  } catch (error) {
    console.error(`Error running migration ${path.basename(filePath)}:`, error);
    throw error;
  }
}

async function main() {
  try {
    // Connect to the database
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected successfully');
    client.release();

    // Get the migration file path from command-line argument
    const migrationFile = process.argv[2];
    if (!migrationFile) {
      console.error('Please specify a migration file to run');
      process.exit(1);
    }

    const migrationFilePath = path.resolve(process.cwd(), migrationFile);
    if (!fs.existsSync(migrationFilePath)) {
      console.error(`Migration file not found: ${migrationFilePath}`);
      process.exit(1);
    }

    // Run the migration
    await runMigration(migrationFilePath);

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the main function
main();