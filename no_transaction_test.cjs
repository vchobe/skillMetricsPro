// Script for testing template deletion without transactions
const { Pool } = require('pg');
require('dotenv').config();

// Use the same database connection settings as the server
function getDatabaseConfig() {
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Is Cloud Run:', process.env.K_SERVICE ? 'Yes' : 'No');
  
  // Use Cloud SQL configuration
  const cloudSqlConnectionName = process.env.CLOUD_SQL_CONNECTION_NAME;
  const cloudSqlUser = process.env.CLOUD_SQL_USER;
  const cloudSqlPassword = process.env.CLOUD_SQL_PASSWORD;
  const cloudSqlDatabase = process.env.CLOUD_SQL_DATABASE;
  
  // Check if we have Cloud SQL configuration
  const hasCloudSqlConfig = cloudSqlConnectionName && cloudSqlUser && cloudSqlPassword && cloudSqlDatabase;
  
  // Verify required credentials
  if (!hasCloudSqlConfig) {
    throw new Error('Database configuration is missing.');
  }
  
  console.log('CONFIGURATION: Using Google Cloud SQL only');
  console.log('Forcing direct TCP connection for test script');
  
  // In development or direct connection mode, use TCP connection
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

// Configure pool with our database config
const pool = new Pool(getDatabaseConfig());

async function runNonTransactionTest() {
  console.log("Starting non-transaction delete test...");
  
  // Create a test template
  console.log("\nStep 1: Creating a test template");
  let templateId;
  try {
    const createResult = await pool.query(`
      INSERT INTO skill_templates (name, category, description, is_recommended, category_id, subcategory_id, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, name, category
    `, ['Non-Transaction Test', 'Test Category', 'Test template for deletion without transaction', false, 4, 17]);
    
    templateId = createResult.rows[0].id;
    console.log(`Created template with ID ${templateId}: ${createResult.rows[0].name}`);
  } catch (error) {
    console.error("Failed to create test template:", error);
    await pool.end();
    process.exit(1);
  }
  
  // Check if the template exists
  try {
    const templateCheck = await pool.query(
      'SELECT id, name, category FROM skill_templates WHERE id = $1',
      [templateId]
    );
    
    if (templateCheck.rows.length === 0) {
      throw new Error(`Skill template with ID ${templateId} not found`);
    }
    
    console.log(`Found template: ${templateCheck.rows[0].name} (${templateCheck.rows[0].category})`);
  } catch (error) {
    console.error("Error checking if template exists:", error);
    await pool.end();
    process.exit(1);
  }
  
  // Count user skills
  let userSkillCount = 0;
  try {
    const userSkillsResult = await pool.query(
      'SELECT COUNT(*) as count FROM user_skills WHERE skill_template_id = $1',
      [templateId]
    );
    userSkillCount = parseInt(userSkillsResult.rows[0].count);
    console.log(`Found ${userSkillCount} user skills referencing this template`);
  } catch (error) {
    console.error("Error counting user skills:", error);
    await pool.end();
    process.exit(1);
  }
  
  // Step 1: Delete notifications
  try {
    console.log("- Step 1: Deleting notifications related to template's user skills");
    const notificationsResult = await pool.query(
      'DELETE FROM notifications WHERE related_user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1) RETURNING id',
      [templateId]
    );
    console.log(`  Deleted ${notificationsResult.rowCount} notifications`);
  } catch (error) {
    console.error("Error deleting notifications:", error);
  }
  
  // Step 2: Delete endorsements
  try {
    console.log("- Step 2: Deleting endorsements for user skills");
    const endorsementsResult = await pool.query(
      'DELETE FROM endorsements WHERE user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1) RETURNING id',
      [templateId]
    );
    console.log(`  Deleted ${endorsementsResult.rowCount} endorsements`);
  } catch (error) {
    console.error("Error deleting endorsements:", error);
  }
  
  // Step 3: Delete pending skill updates (via user_skill_id)
  try {
    console.log("- Step 3: Deleting pending skill updates (via user_skill_id)");
    const psuResult1 = await pool.query(
      'DELETE FROM pending_skill_updates WHERE user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1) RETURNING id',
      [templateId]
    );
    console.log(`  Deleted ${psuResult1.rowCount} pending skill updates via user_skill_id`);
  } catch (error) {
    console.error("Error deleting pending skill updates (via user_skill_id):", error);
  }
  
  // Step 4: Delete pending skill updates (via skill_template_id)
  try {
    console.log("- Step 4: Deleting pending skill updates (via skill_template_id)");
    const psuResult2 = await pool.query(
      'DELETE FROM pending_skill_updates WHERE skill_template_id = $1 RETURNING id',
      [templateId]
    );
    console.log(`  Deleted ${psuResult2.rowCount} pending skill updates via skill_template_id`);
  } catch (error) {
    console.error("Error deleting pending skill updates (via skill_template_id):", error);
  }
  
  // Step 5: Delete pending skill updates (via skill_id)
  try {
    console.log("- Step 5: Deleting pending skill updates (via skill_id)");
    const psuResult3 = await pool.query(
      'DELETE FROM pending_skill_updates WHERE skill_id = $1 RETURNING id',
      [templateId]
    );
    console.log(`  Deleted ${psuResult3.rowCount} pending skill updates via skill_id`);
  } catch (error) {
    console.error("Error deleting pending skill updates (via skill_id):", error);
  }
  
  // Step 6: Try with pending_skill_updates_v2 if it exists
  console.log("- Step 6: Checking for and deleting from pending_skill_updates_v2");
  try {
    const psuV2Result = await pool.query(
      'DELETE FROM pending_skill_updates_v2 WHERE skill_template_id = $1 RETURNING id',
      [templateId]
    );
    console.log(`  Deleted ${psuV2Result.rowCount} pending skill updates from v2 table`);
  } catch (error) {
    console.log("  Note: Could not delete from pending_skill_updates_v2, table may not exist");
  }
  
  // Step 7: Delete user skills
  try {
    console.log("- Step 7: Deleting user skills referencing this template");
    const userSkillsResult = await pool.query(
      'DELETE FROM user_skills WHERE skill_template_id = $1 RETURNING id',
      [templateId]
    );
    console.log(`  Deleted ${userSkillsResult.rowCount} user skills`);
  } catch (error) {
    console.error("Error deleting user skills:", error);
  }
  
  // Step 8: Delete project skills
  try {
    console.log("- Step 8: Deleting project skills referencing this template");
    const projectSkillsResult = await pool.query(
      'DELETE FROM project_skills WHERE skill_id = $1 RETURNING id',
      [templateId]
    );
    console.log(`  Deleted ${projectSkillsResult.rowCount} project skills`);
  } catch (error) {
    console.error("Error deleting project skills:", error);
  }
  
  // Step 9: Delete the skill template
  try {
    console.log("- Step 9: Deleting the skill template itself");
    const deleteResult = await pool.query(
      'DELETE FROM skill_templates WHERE id = $1 RETURNING id',
      [templateId]
    );
    
    if (deleteResult.rowCount === 0) {
      console.error(`No rows deleted for skill template ${templateId}`);
      await pool.end();
      return {
        success: false,
        error: `Failed to delete skill template ${templateId}`
      };
    }
    
    console.log(`✓ Successfully deleted skill template ${templateId}`);
  } catch (error) {
    console.error("Error deleting skill template:", error);
    await pool.end();
    return {
      success: false,
      error: `Failed to delete skill template: ${error.message}`
    };
  }
  
  // Cleanup and return
  await pool.end();
  
  return {
    success: true,
    message: `Successfully deleted skill template ${templateId}`,
    deletedUserSkills: userSkillCount
  };
}

// Run the test
runNonTransactionTest()
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