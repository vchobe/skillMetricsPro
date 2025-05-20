/**
 * Script to fix the BigData category type inconsistency
 * Using CommonJS format for easier Node.js execution
 */
require('dotenv').config();
const { Pool } = require('pg');

async function fixBigDataCategory() {
  // Create a connection to the database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // 1. First check what's currently in the database
    console.log('Checking BigData category in the database...');
    const checkResult = await pool.query(
      'SELECT id, name, category_type FROM skill_categories WHERE name = $1',
      ['BigData']
    );
    
    if (checkResult.rows.length === 0) {
      console.log('BigData category not found in the database.');
      return;
    }
    
    const category = checkResult.rows[0];
    console.log('Current BigData category info:', category);
    
    // 2. Update the category to technical
    console.log('Updating BigData category type to technical...');
    
    await pool.query(
      'UPDATE skill_categories SET category_type = $1 WHERE id = $2',
      ['technical', category.id]
    );
    
    // 3. Verify the change
    const verifyResult = await pool.query(
      'SELECT id, name, category_type FROM skill_categories WHERE id = $1',
      [category.id]
    );
    
    console.log('Updated BigData category info:', verifyResult.rows[0]);
    console.log('Category type successfully updated!');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Execute the function
fixBigDataCategory();