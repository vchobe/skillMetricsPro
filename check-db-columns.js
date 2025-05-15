/**
 * Script to check database columns for user_skills table
 */
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Use direct connection parameters
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString
});

async function checkTableColumns() {
  try {
    // Get table columns
    const res = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_skills'
    `);
    
    console.log('Columns in user_skills table:');
    console.table(res.rows);
    
    // Check if description column exists
    const hasDescriptionColumn = res.rows.some(row => row.column_name === 'description');
    console.log(`Description column exists: ${hasDescriptionColumn}`);

    // Also check skill_templates table
    const templatesRes = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'skill_templates'
    `);
    
    console.log('\nColumns in skill_templates table:');
    console.table(templatesRes.rows);
    
    const templateHasDescription = templatesRes.rows.some(row => row.column_name === 'description');
    console.log(`Description column exists in skill_templates: ${templateHasDescription}`);
    
  } catch (err) {
    console.error('Error checking table columns:', err);
  } finally {
    // Close the pool
    await pool.end();
  }
}

checkTableColumns();