/**
 * Test script to create a skill template directly via the database
 */
import pkg from 'pg';
const { Pool } = pkg;

// Get database connection config from environment variables
function getDatabaseConfig() {
  const cloudSqlUser = process.env.CLOUD_SQL_USER;
  const cloudSqlPassword = process.env.CLOUD_SQL_PASSWORD;
  const cloudSqlDatabase = process.env.CLOUD_SQL_DATABASE;
  const dbHost = process.env.CLOUD_SQL_HOST || 'localhost';
  const dbPort = parseInt(process.env.CLOUD_SQL_PORT || '5432', 10);
  
  console.log(`Using direct TCP connection to: ${dbHost}:${dbPort}`);
  
  return {
    user: cloudSqlUser,
    password: cloudSqlPassword,
    database: cloudSqlDatabase,
    host: dbHost,
    port: dbPort,
    ssl: process.env.CLOUD_SQL_USE_SSL === 'true',
  };
}

// Create the database pool
const pool = new Pool(getDatabaseConfig());

async function testCreateSkillTemplate() {
  try {
    console.log('Starting test...');
    
    // First, check that the database is accessible
    const testResult = await pool.query('SELECT NOW() as time');
    console.log('Database is accessible, current time:', testResult.rows[0].time);
    
    // Check skill_categories table structure
    console.log('Checking skill_categories table...');
    const categoriesTableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'skill_categories'
    `);
    console.log('skill_categories columns:', categoriesTableInfo.rows);
    
    // Check skill_subcategories table structure
    console.log('Checking skill_subcategories table...');
    const subcategoriesTableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'skill_subcategories'
    `);
    console.log('skill_subcategories columns:', subcategoriesTableInfo.rows);
    
    // Check skill_templates table structure
    console.log('Checking skill_templates table...');
    const templatesTableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'skill_templates'
    `);
    console.log('skill_templates columns:', templatesTableInfo.rows);
    
    // Get available categories
    const categories = await pool.query('SELECT * FROM skill_categories');
    console.log('Available categories:', categories.rows);
    
    // Get available subcategories
    const subcategories = await pool.query('SELECT * FROM skill_subcategories');
    console.log('Available subcategories:', subcategories.rows);
    
    // Get the Database category ID (should be around 2)
    const databaseCategory = categories.rows.find(c => c.name === 'Database');
    if (!databaseCategory) {
      console.error('Database category not found!');
      return;
    }
    console.log('Database category:', databaseCategory);
    
    // Get the SQL Databases subcategory ID
    const sqlSubcategory = subcategories.rows.find(s => 
      s.name === 'SQL Databases' && s.category_id === databaseCategory.id);
    if (!sqlSubcategory) {
      console.error('SQL Databases subcategory not found!');
      return;
    }
    console.log('SQL Databases subcategory:', sqlSubcategory);
    
    // Create a test skill template
    console.log('Creating test MSSQL skill template...');
    const result = await pool.query(`
      INSERT INTO skill_templates (
        name, 
        category, 
        category_id, 
        subcategory_id, 
        description, 
        is_recommended, 
        target_level
      ) VALUES (
        'Microsoft SQL Server', 
        $1, 
        $2, 
        $3, 
        'Professional experience with Microsoft SQL Server database management', 
        true, 
        'intermediate'
      ) RETURNING *
    `, [databaseCategory.name, databaseCategory.id, sqlSubcategory.id]);
    
    console.log('Successfully created skill template:', result.rows[0]);
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    // Close the pool
    await pool.end();
    console.log('Test completed.');
  }
}

// Run the test
testCreateSkillTemplate().catch(error => {
  console.error('Unhandled error:', error);
});