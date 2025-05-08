// Direct test of the deleteSkillTemplate function
const { Pool } = require('pg');
require('dotenv').config();

// Create a database pool identical to the one used in the application
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Import the storage module
const { storage } = require('./server/storage');

// First, let's find a skill template to delete
async function run() {
  try {
    console.log("Finding a test skill template...");
    
    // Look for a template that we can safely delete (one that we created for testing)
    const result = await pool.query(`
      SELECT id, name, category 
      FROM skill_templates 
      WHERE name LIKE 'Test%' OR name LIKE '%test%'
      ORDER BY id DESC
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.log("No test templates found, creating one...");
      
      // Create a test template
      const createResult = await pool.query(`
        INSERT INTO skill_templates (name, category, subcategory, is_verified) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, name, category
      `, ['Test Template for Deletion', 'Test Category', 'Test Subcategory', true]);
      
      if (createResult.rows.length === 0) {
        throw new Error("Failed to create test template");
      }
      
      console.log(`Created template with ID ${createResult.rows[0].id}`, createResult.rows[0]);
      return createResult.rows[0].id;
    } else {
      console.log(`Found template with ID ${result.rows[0].id}`, result.rows[0]);
      return result.rows[0].id;
    }
  } catch (error) {
    console.error("Error finding/creating template:", error);
    throw error;
  }
}

// Run the deletion test
async function testDeletion(templateId) {
  console.log(`\nTesting deletion of template ID ${templateId}...`);
  try {
    const result = await storage.deleteSkillTemplate(templateId);
    console.log("Deletion successful!", result);
    return { success: true, result };
  } catch (error) {
    console.error("Deletion failed:", error);
    return { success: false, error: error.message };
  }
}

// Run the full test
run()
  .then(templateId => testDeletion(templateId))
  .then(result => {
    console.log("\nFinal result:", result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });