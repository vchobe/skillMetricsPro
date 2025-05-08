// Script to test the final improved implementation
const { Pool } = require('pg');
require('dotenv').config();

// Import the improved function
const { deleteSkillTemplate } = require('./improved_delete_function.cjs');

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

// Add the pool to the global context so the imported function can use it
global.pool = pool;

async function runFinalTest() {
  console.log("Starting final implementation test...");
  
  // Create a test template
  console.log("\nStep 1: Creating a test template");
  let templateId;
  try {
    const createResult = await pool.query(`
      INSERT INTO skill_templates (name, category, description, is_recommended, category_id, subcategory_id, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, name, category
    `, ['Final Test Template', 'Test Category', 'Final template for deletion testing', false, 4, 17]);
    
    templateId = createResult.rows[0].id;
    console.log(`Created template with ID ${templateId}: ${createResult.rows[0].name}`);
  } catch (error) {
    console.error("Failed to create test template:", error);
    await pool.end();
    process.exit(1);
  }
  
  // Test the deleteSkillTemplate function with forceCascade=true
  console.log("\nStep 2: Testing deleteSkillTemplate function with forceCascade=true");
  try {
    const result = await deleteSkillTemplate(templateId, true);
    console.log("\nDelete function result:", result);
    
    if (result.success) {
      console.log("✓ Successfully tested the function!");
      await pool.end();
      return {
        success: true,
        message: `Successfully tested deleteSkillTemplate function with template ${templateId}`
      };
    } else {
      console.error("✗ Function returned an error:", result.error);
      await pool.end();
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error("Error running deleteSkillTemplate function:", error);
    await pool.end();
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
runFinalTest()
  .then(result => {
    console.log("\nFinal test result:", result);
    if (result.success) {
      console.log("✓ Final test completed successfully!");
    } else {
      console.log("✗ Final test failed!");
    }
    // Exit process
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error("\nUnexpected error during final test:", error);
    process.exit(1);
  });