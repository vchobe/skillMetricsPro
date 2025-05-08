// Script for a simple template create/delete test
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

async function runSimpleTest() {
  console.log("Starting simple template test...");
  
  // Create a test template
  console.log("\nStep 1: Creating a test template");
  let templateId;
  try {
    const createResult = await pool.query(`
      INSERT INTO skill_templates (name, category, description, is_recommended, category_id, subcategory_id, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, name, category
    `, ['Simple Test Template', 'Test Category', 'Simple template for deletion testing', false, 4, 17]);
    
    templateId = createResult.rows[0].id;
    console.log(`Created template with ID ${templateId}: ${createResult.rows[0].name}`);
  } catch (error) {
    console.error("Failed to create test template:", error);
    await pool.end();
    process.exit(1);
  }
  
  // Now attempt to delete it directly (no transaction)
  console.log("\nStep 2: Deleting the template directly");
  try {
    const deleteResult = await pool.query(
      'DELETE FROM skill_templates WHERE id = $1 RETURNING id',
      [templateId]
    );
    
    if (deleteResult.rowCount === 0) {
      throw new Error(`Failed to delete skill template ${templateId}`);
    }
    
    console.log(`✓ Successfully deleted skill template ${templateId} directly`);
    
    return {
      success: true,
      message: `Successfully deleted skill template ${templateId} directly`
    };
  } catch (error) {
    console.error(`Error directly deleting skill template ${templateId}:`, error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await pool.end();
  }
}

// Run the test
runSimpleTest()
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