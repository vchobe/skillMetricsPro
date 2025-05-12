// Script to check table schema
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

// Load environment variables
dotenv.config();

// Create connection using Cloud SQL configuration
const pool = new Pool({
  host: process.env.CLOUD_SQL_HOST,
  port: process.env.CLOUD_SQL_PORT,
  user: process.env.CLOUD_SQL_USER,
  password: process.env.CLOUD_SQL_PASSWORD,
  database: process.env.CLOUD_SQL_DATABASE
});

async function checkSchema() {
  try {
    console.log('Checking skill_subcategories table schema...');
    
    // Get column information
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'skill_subcategories'
      ORDER BY ordinal_position
    `);
    
    console.log('skill_subcategories table schema:');
    result.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
    // Also, look at a sample record
    const sampleResult = await pool.query('SELECT * FROM skill_subcategories LIMIT 1');
    if (sampleResult.rows.length > 0) {
      console.log('\nSample subcategory record:');
      console.log(sampleResult.rows[0]);
    } else {
      console.log('\nNo subcategory records found');
    }
    
    console.log('\nDone checking schema!');
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();