/**
 * Test script for skill template creation
 * 
 * This script tests the direct database interaction for creating a skill template
 * to diagnose and fix issues with the createSkillTemplate function.
 */
import pg from 'pg';
const { Pool } = pg;

// Create a database connection pool with Google Cloud SQL
const pool = new Pool({
  host: process.env.CLOUD_SQL_HOST || process.env.PGHOST || '34.30.6.95',
  port: parseInt(process.env.CLOUD_SQL_PORT || process.env.PGPORT || '5432'),
  user: process.env.CLOUD_SQL_USER || process.env.PGUSER || 'app_user',
  password: process.env.CLOUD_SQL_PASSWORD || process.env.PGPASSWORD,
  database: process.env.CLOUD_SQL_DATABASE || process.env.PGDATABASE || 'neondb'
});

async function createSkillTemplate() {
  const client = await pool.connect();
  try {
    console.log("Connected to database");
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Define a test skill template
    const templateName = "Test Oracle DBA " + new Date().toISOString().substring(0, 16);
    const categoryName = "Database";
    
    // 1. First, find the categoryId for "Database"
    console.log(`Looking up categoryId for "${categoryName}"`);
    const categoryResult = await client.query(
      'SELECT id FROM skill_categories WHERE name = $1',
      [categoryName]
    );
    
    if (categoryResult.rows.length === 0) {
      throw new Error(`Category "${categoryName}" not found`);
    }
    
    const categoryId = categoryResult.rows[0].id;
    console.log(`Found categoryId: ${categoryId} for "${categoryName}"`);
    
    // 2. Find the subcategory "Relational Databases" under this category
    console.log(`Looking up subcategoryId for "Relational Databases" under category ${categoryId}`);
    const subcategoryResult = await client.query(
      'SELECT id FROM skill_subcategories WHERE name = $1 AND category_id = $2',
      ["Relational Databases", categoryId]
    );
    
    if (subcategoryResult.rows.length === 0) {
      throw new Error(`Subcategory "Relational Databases" not found under category ${categoryId}`);
    }
    
    const subcategoryId = subcategoryResult.rows[0].id;
    console.log(`Found subcategoryId: ${subcategoryId}`);
    
    // 3. Insert the skill template with explicit column names
    console.log(`Creating skill template: ${templateName}`);
    const result = await client.query(
      `INSERT INTO skill_templates (
        name, 
        category, 
        category_id, 
        subcategory_id, 
        description, 
        is_recommended, 
        target_level
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [
        templateName,
        categoryName,
        categoryId,
        subcategoryId,
        "Experience with Oracle database administration, SQL development, and performance tuning",
        true,
        "intermediate"
      ]
    );
    
    if (result.rows.length === 0) {
      throw new Error("Failed to create skill template");
    }
    
    console.log(`✅ Successfully created skill template with ID ${result.rows[0].id}`);
    console.log(`Template data:`, result.rows[0]);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Now try to fetch the template back
    console.log(`Verifying template retrieval...`);
    const verifyResult = await client.query(
      'SELECT * FROM skill_templates WHERE id = $1',
      [result.rows[0].id]
    );
    
    if (verifyResult.rows.length === 0) {
      throw new Error(`Could not retrieve the created template with ID ${result.rows[0].id}`);
    }
    
    console.log(`✅ Successfully verified template retrieval for ID ${result.rows[0].id}`);
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error in createSkillTemplate:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
createSkillTemplate()
  .then(result => {
    console.log("Test completed successfully");
    console.log("Template created:", result);
  })
  .catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
  });