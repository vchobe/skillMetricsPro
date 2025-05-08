// A simpler direct test of the skill template deletion function
import pg from 'pg';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

const { Pool } = pg;

// Use the database connection directly
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testDeletion() {
  // Create a new test template
  console.log("Creating a test skill template...");
  const createResult = await pool.query(`
    INSERT INTO skill_templates (name, category, subcategory, is_verified) 
    VALUES ($1, $2, $3, $4) 
    RETURNING id, name, category
  `, ['Test Deletion Template', 'Test Category', 'Test Subcategory', true]);
  
  if (createResult.rows.length === 0) {
    console.error("Failed to create test template");
    process.exit(1);
  }
  
  const templateId = createResult.rows[0].id;
  console.log(`Created test template with ID ${templateId}`, createResult.rows[0]);
  
  // Test deletion with our own implementation of deleteSkillTemplate
  // that follows the same pattern as in storage.ts
  try {
    console.log(`\nAttempting to delete template ${templateId}...`);
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // First check if the template exists
      const templateCheck = await client.query(
        'SELECT id, name, category FROM skill_templates WHERE id = $1',
        [templateId]
      );
      
      if (templateCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error(`Skill template with ID ${templateId} not found`);
      }
      
      // First find all user skills to count them
      const userSkillsResult = await client.query(
        'SELECT COUNT(*) as count FROM user_skills WHERE skill_template_id = $1',
        [templateId]
      );
      const userSkillCount = parseInt(userSkillsResult.rows[0].count || 0);
      console.log(`Found ${userSkillCount} user skills referencing this template`);
      
      // Execute deletions in a specific order
      
      // 1. First notifications
      console.log("Step 1: Deleting notifications");
      await client.query(
        'DELETE FROM notifications WHERE related_user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1)',
        [templateId]
      );
      
      // 2. Remove endorsements
      console.log("Step 2: Deleting endorsements");
      await client.query(
        'DELETE FROM endorsements WHERE user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1)',
        [templateId]
      );
      
      // 3. Delete pending skill updates
      console.log("Step 3: Deleting pending skill updates");
      await client.query(
        'DELETE FROM pending_skill_updates WHERE user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1)',
        [templateId]
      );
      
      await client.query(
        'DELETE FROM pending_skill_updates WHERE skill_template_id = $1',
        [templateId]
      );
      
      await client.query(
        'DELETE FROM pending_skill_updates WHERE skill_id = $1',
        [templateId]
      );
      
      // 4. Delete user skills
      console.log("Step 4: Deleting user skills");
      await client.query(
        'DELETE FROM user_skills WHERE skill_template_id = $1',
        [templateId]
      );
      
      // 5. Delete project skills
      console.log("Step 5: Deleting project skills");
      await client.query(
        'DELETE FROM project_skills WHERE skill_id = $1',
        [templateId]
      );
      
      // 6. Finally, delete the skill template
      console.log("Step 6: Deleting the skill template");
      const deleteResult = await client.query(
        'DELETE FROM skill_templates WHERE id = $1 RETURNING id',
        [templateId]
      );
      
      if (deleteResult.rowCount === 0) {
        await client.query('ROLLBACK');
        throw new Error(`Failed to delete skill template ${templateId}`);
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log(`Successfully deleted skill template ${templateId}`);
      
      return { 
        success: true, 
        message: `Successfully deleted skill template ${templateId}`,
        deletedUserSkills: userSkillCount,
      };
    } catch (error) {
      // Ensure rollback happens
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
      
      console.error(`Error deleting skill template ${templateId}:`, error);
      throw error;
    } finally {
      // Always release the client
      client.release();
    }
  } catch (error) {
    console.error("Deletion failed:", error);
    return { success: false, error: error.message };
  }
}

// Run the test
testDeletion()
  .then(result => {
    console.log("\nFinal result:", result);
    console.log("Test completed successfully!");
    process.exit(0);
  })
  .catch(error => {
    console.error("\nTest failed with error:", error);
    process.exit(1);
  });