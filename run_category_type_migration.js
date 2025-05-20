/**
 * Script to execute the SQL migration for adding category_type column
 * to the skill_categories table. This uses the DB connection from the app
 * to ensure proper authentication.
 */
import fs from 'fs';
import { pool } from './server/db.js';

// Main function to run the migration
async function runMigration() {
  console.log('Starting category_type migration...');
  
  try {
    // Read the SQL file
    const sqlScript = fs.readFileSync('./add_category_type.sql', 'utf8');
    
    // Begin a transaction
    await pool.query('BEGIN');
    
    try {
      // Split the SQL script into individual commands
      // We only care about statements between the first and last line
      const commands = sqlScript.split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0);
      
      // Execute each command
      for (const command of commands) {
        console.log(`Executing: ${command.substring(0, 80)}...`);
        await pool.query(command);
      }
      
      // Commit the transaction
      await pool.query('COMMIT');
      console.log('Category type migration completed successfully!');
      
      // Check the results
      const results = await pool.query(`
        SELECT id, name, category_type
        FROM skill_categories
        ORDER BY name
      `);
      
      console.log('\nCategory types after migration:');
      results.rows.forEach(cat => {
        console.log(`- ${cat.name}: ${cat.category_type}`);
      });
    } catch (error) {
      // Rollback the transaction on error
      await pool.query('ROLLBACK');
      console.error('Error during migration, rolling back:', error);
    }
  } catch (error) {
    console.error('Failed to run migration:', error);
  } finally {
    // Always end the pool
    await pool.end();
  }
}

// Execute the migration
runMigration()
  .then(() => {
    console.log('Migration script execution complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });