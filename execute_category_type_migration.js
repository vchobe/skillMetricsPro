/**
 * Add category_type column to the database
 * This script is integrated with the application to ensure proper connections
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read the SQL migration script
const sqlScript = fs.readFileSync(path.join(__dirname, 'add_category_type.sql'), 'utf8');

// Create a database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Execute the SQL migration for category types
 */
async function executeSQL() {
  console.log('Starting category type migration...');
  const client = await pool.connect();
  
  try {
    // Create a single transaction for all operations
    await client.query('BEGIN');
    
    // Check and create the enum type
    const enumCheck = await client.query(`
      SELECT 1 FROM pg_type WHERE typname = 'category_type'
    `);
    
    if (enumCheck.rows.length === 0) {
      console.log('Creating category_type enum...');
      await client.query(`
        CREATE TYPE category_type AS ENUM ('technical', 'functional')
      `);
    } else {
      console.log('Category type enum already exists.');
    }
    
    // Check and add the column
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'skill_categories' AND column_name = 'category_type'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('Adding category_type column to skill_categories table...');
      await client.query(`
        ALTER TABLE skill_categories
        ADD COLUMN category_type category_type NOT NULL DEFAULT 'technical'
      `);
    } else {
      console.log('Column category_type already exists.');
    }
    
    // Update technical categories
    const techResult = await client.query(`
      UPDATE skill_categories 
      SET category_type = 'technical' 
      WHERE name IN (
        'Programming', 'Database', 'Cloud', 'DevOps', 'Security', 
        'Data Science', 'AI', 'UI', 'Testing'
      )
      RETURNING id, name
    `);
    
    console.log(`Updated ${techResult.rowCount} technical categories.`);
    
    // Update functional categories
    const funcResult = await client.query(`
      UPDATE skill_categories 
      SET category_type = 'functional' 
      WHERE name IN (
        'Design', 'Project Management', 'Leadership', 'Communication',
        'Marketing', 'Messaging & Streaming', 'Metrics and visualization',
        'Log aggregation and search', 'BigData'
      )
      RETURNING id, name
    `);
    
    console.log(`Updated ${funcResult.rowCount} functional categories.`);
    
    // Check all categories
    const allCategories = await client.query(`
      SELECT id, name, category_type 
      FROM skill_categories
      ORDER BY name
    `);
    
    console.log('\nCategory types:');
    allCategories.rows.forEach(cat => {
      console.log(`- ${cat.name}: ${cat.category_type}`);
    });
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('\nMigration completed successfully!');
    
  } catch (error) {
    // Rollback the transaction on error
    await client.query('ROLLBACK');
    console.error('Error during migration:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute the migration
executeSQL()
  .then(() => {
    console.log('Migration script finished executing.');
  })
  .catch(err => {
    console.error('Fatal error in migration script:', err);
    process.exit(1);
  });