// Test script for skill template deletion
import { pool } from './server/db.js';

async function testDeleteTemplate() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Create a test skill template to delete
    console.log("Creating a test skill template...");
    const templateResult = await client.query(
      `INSERT INTO skill_templates (name, category, subcategory, is_verified) 
       VALUES ($1, $2, $3, $4) RETURNING id, name, category`,
      ['Test Template for Deletion', 'Test Category', 'Test Subcategory', true]
    );
    
    if (!templateResult.rows.length) {
      throw new Error("Failed to create test skill template");
    }
    
    const templateId = templateResult.rows[0].id;
    console.log(`Created test template with ID ${templateId}: ${JSON.stringify(templateResult.rows[0])}`);
    
    // Create a pending_skill_updates record referencing this template
    await client.query(
      `INSERT INTO pending_skill_updates (user_id, name, category, level, skill_template_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [1, 'Test Pending Skill', 'Test Category', 'beginner', templateId, 'pending']
    );
    console.log("Created pending skill update referencing the template");
    
    // Commit the test setup
    await client.query('COMMIT');
    console.log("Test data setup complete. Now testing deletion...");
    
    // Now try to delete the template
    console.log(`Attempting to delete skill template ${templateId}...`);
    
    // Start a new transaction for the deletion
    await client.query('BEGIN');
    
    // Step 1: Check if template exists
    const templateCheck = await client.query(
      'SELECT id, name, category FROM skill_templates WHERE id = $1',
      [templateId]
    );
    
    console.log(`Template check: ${JSON.stringify(templateCheck.rows[0])}`);
    
    // Step 2: Delete pending_skill_updates that reference this template
    const pendingDeleteResult = await client.query(
      'DELETE FROM pending_skill_updates WHERE skill_template_id = $1 RETURNING id',
      [templateId]
    );
    console.log(`Deleted ${pendingDeleteResult.rowCount} pending skill updates`);
    
    // Step 3: Delete the skill template
    const deleteResult = await client.query(
      'DELETE FROM skill_templates WHERE id = $1 RETURNING id',
      [templateId]
    );
    
    if (deleteResult.rowCount === 0) {
      throw new Error(`Failed to delete skill template ${templateId}`);
    }
    
    console.log(`Successfully deleted skill template ${templateId}`);
    
    // Commit the deletion
    await client.query('COMMIT');
    
    // Verify template is gone
    const verifyResult = await client.query(
      'SELECT id FROM skill_templates WHERE id = $1',
      [templateId]
    );
    
    if (verifyResult.rowCount > 0) {
      throw new Error(`Template ${templateId} was not deleted successfully`);
    }
    
    console.log(`Verification confirms template ${templateId} was deleted successfully`);
    
    return {
      success: true,
      message: `Successfully created and deleted test skill template ${templateId}`
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error in test:", error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
}

// Run the test
testDeleteTemplate()
  .then(result => {
    console.log("Test result:", result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error("Unhandled error in test:", err);
    process.exit(1);
  });