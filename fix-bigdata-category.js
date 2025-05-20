/**
 * Script to check and fix the BigData category type inconsistency
 */
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAndFixBigDataCategory() {
  const client = await pool.connect();
  
  try {
    // First check what's in the database
    console.log('Checking BigData category in the database...');
    const checkResult = await client.query(
      'SELECT id, name, category_type FROM skill_categories WHERE name = $1',
      ['BigData']
    );
    
    if (checkResult.rows.length === 0) {
      console.log('BigData category not found in the database.');
      return;
    }
    
    const category = checkResult.rows[0];
    console.log('Current BigData category info:', category);
    
    // Fix if needed - update to technical if it's currently functional
    if (category.category_type === 'functional') {
      console.log('Updating BigData category type from functional to technical...');
      
      await client.query(
        'UPDATE skill_categories SET category_type = $1 WHERE id = $2',
        ['technical', category.id]
      );
      
      // Verify the change
      const verifyResult = await client.query(
        'SELECT id, name, category_type FROM skill_categories WHERE id = $1',
        [category.id]
      );
      
      console.log('Updated BigData category info:', verifyResult.rows[0]);
      console.log('Category type successfully updated!');
    } else {
      console.log('BigData category type is already correctly set to', category.category_type);
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

// Call the function
checkAndFixBigDataCategory();