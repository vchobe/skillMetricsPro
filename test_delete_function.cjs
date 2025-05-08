// Simple test script for the template deletion function using CommonJS
const { Pool } = require('pg');
require('dotenv').config();

// Use the same database connection settings as the server
function getDatabaseConfig() {
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Is Cloud Run:', process.env.K_SERVICE ? 'Yes' : 'No');
  
  // Use Cloud SQL configuration (Google Cloud SQL only)
  // Check for Google Cloud SQL configuration
  const cloudSqlConnectionName = process.env.CLOUD_SQL_CONNECTION_NAME;
  const cloudSqlUser = process.env.CLOUD_SQL_USER;
  const cloudSqlPassword = process.env.CLOUD_SQL_PASSWORD;
  const cloudSqlDatabase = process.env.CLOUD_SQL_DATABASE;
  
  // Check if we have Cloud SQL configuration
  const hasCloudSqlConfig = cloudSqlConnectionName && cloudSqlUser && cloudSqlPassword && cloudSqlDatabase;
  
  // Verify required credentials
  if (!hasCloudSqlConfig) {
    throw new Error('Database configuration is missing. Please set CLOUD_SQL_CONNECTION_NAME, CLOUD_SQL_USER, CLOUD_SQL_PASSWORD, and CLOUD_SQL_DATABASE environment variables.');
  }
  
  console.log('CONFIGURATION: Using Google Cloud SQL only');
  
  // Always use direct TCP connection for the test script
  console.log('Forcing direct TCP connection for test script');
  {
    // In development or direct connection mode, use TCP connection
    
    // Check if we have host and port override - useful for direct connections
    const dbHost = process.env.CLOUD_SQL_HOST || 'localhost';
    const dbPort = parseInt(process.env.CLOUD_SQL_PORT || '5432', 10);
    
    console.log(`Using direct TCP connection to: ${dbHost}:${dbPort}`);
    console.log('SSL Enabled:', process.env.CLOUD_SQL_USE_SSL === 'true' ? 'Yes' : 'No');
    
    return {
      user: cloudSqlUser,
      password: cloudSqlPassword,
      database: cloudSqlDatabase,
      host: dbHost,
      port: dbPort,
      ssl: process.env.CLOUD_SQL_USE_SSL === 'true',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };
  }
}

// Configure pool with our database config
const pool = new Pool(getDatabaseConfig());

async function runDeleteTest() {
  console.log("Starting delete template test...");
  
  // Create a test template
  console.log("\nStep 1: Creating a test template");
  let templateId;
  try {
    const createResult = await pool.query(`
      INSERT INTO skill_templates (name, category, subcategory, is_verified) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, category
    `, ['Test Delete Function', 'Test Category', 'Test Subcategory', true]);
    
    templateId = createResult.rows[0].id;
    console.log(`Created template with ID ${templateId}: ${createResult.rows[0].name}`);
  } catch (error) {
    console.error("Failed to create test template:", error);
    process.exit(1);
  }
  
  // Now attempt to delete it
  console.log("\nStep 2: Testing deletion...");
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
    
    console.log(`Found template: ${templateCheck.rows[0].name} (${templateCheck.rows[0].category})`);
    
    // First find all user skills to count them for the return value
    const userSkillsResult = await client.query(
      'SELECT COUNT(*) as count FROM user_skills WHERE skill_template_id = $1',
      [templateId]
    );
    const userSkillCount = parseInt(userSkillsResult.rows[0].count);
    console.log(`Found ${userSkillCount} user skills referencing this template`);
    
    // Execute all deletions in a specific, safe order
    
    // 1. First remove notifications that reference user_skills with this template
    console.log("- Step 1: Deleting notifications related to template's user skills");
    await client.query(
      'DELETE FROM notifications WHERE related_user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1)',
      [templateId]
    );
    
    // 2. Remove endorsements for user_skills with this template
    console.log("- Step 2: Deleting endorsements for user skills");
    await client.query(
      'DELETE FROM endorsements WHERE user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1)',
      [templateId]
    );
    
    // 3. Delete pending skill updates referencing this template (multiple ways)
    // Via user_skill_id from skills with this template
    console.log("- Step 3: Deleting pending skill updates (via user_skill_id)");
    await client.query(
      'DELETE FROM pending_skill_updates WHERE user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1)',
      [templateId]
    );
    
    // Via skill_template_id (v2 schema)
    console.log("- Step 4: Deleting pending skill updates (via skill_template_id)");
    await client.query(
      'DELETE FROM pending_skill_updates WHERE skill_template_id = $1',
      [templateId]
    );
    
    // Via skill_id (legacy schema)
    console.log("- Step 5: Deleting pending skill updates (via skill_id)");
    await client.query(
      'DELETE FROM pending_skill_updates WHERE skill_id = $1',
      [templateId]
    );
    
    // Try with pending_skill_updates_v2 table if it exists
    console.log("- Step 6: Checking for and deleting from pending_skill_updates_v2");
    try {
      await client.query(
        'DELETE FROM pending_skill_updates_v2 WHERE skill_template_id = $1',
        [templateId]
      );
    } catch (err) {
      // This is expected to fail if the table doesn't exist
      console.log("  Note: Could not delete from pending_skill_updates_v2, table may not exist");
    }
    
    // 4. Delete user skills referencing this template
    console.log("- Step 7: Deleting user skills referencing this template");
    await client.query(
      'DELETE FROM user_skills WHERE skill_template_id = $1',
      [templateId]
    );
    
    // 5. Delete project skills referencing this template
    console.log("- Step 8: Deleting project skills referencing this template");
    await client.query(
      'DELETE FROM project_skills WHERE skill_id = $1',
      [templateId]
    );
    
    // 6. Finally, delete the skill template
    console.log("- Step 9: Deleting the skill template itself");
    const deleteResult = await client.query(
      'DELETE FROM skill_templates WHERE id = $1 RETURNING id',
      [templateId]
    );
    
    if (deleteResult.rowCount === 0) {
      // This should never happen since we checked earlier
      await client.query('ROLLBACK');
      throw new Error(`Failed to delete skill template ${templateId}`);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log(`✓ Successfully deleted skill template ${templateId}`);
    
    return {
      success: true,
      message: `Successfully deleted skill template ${templateId}`,
      deletedUserSkills: userSkillCount
    };
  } catch (error) {
    // Ensure rollback happens
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error("Error during rollback:", rollbackError);
    }
    
    console.error(`Error deleting skill template ${templateId}:`, error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    // Always release the client
    client.release();
  }
}

// Run the test
runDeleteTest()
  .then(result => {
    console.log("\nFinal result:", result);
    if (result.success) {
      console.log("✓ Test completed successfully!");
    } else {
      console.log("✗ Test failed!");
    }
    // Exit process
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error("\nUnexpected error during test:", error);
    process.exit(1);
  });