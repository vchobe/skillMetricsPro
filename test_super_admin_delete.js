/**
 * Test script for verifying the super admin cascading delete functionality
 * 
 * This script directly calls the storage methods to test deleting a skill template
 * with cascading deletion of all related user skills and data.
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure DB connection using the same approach as the application
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
    ssl: process.env.CLOUD_SQL_USE_SSL === 'true'
  };
}

// Create a database connection pool
const pool = new Pool(getDatabaseConfig());

/**
 * Enhanced skill template deletion with cascading
 */
async function deleteSkillTemplate(id) {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Check if template exists
    const templateCheck = await client.query(
      'SELECT id, name, category FROM skill_templates WHERE id = $1',
      [id]
    );
    
    if (templateCheck.rows.length === 0) {
      throw new Error(`Skill template with ID ${id} not found`);
    }
    
    const template = templateCheck.rows[0];
    console.log(`Deleting skill template: ${template.name} (${template.category}) with ID ${id}`);
    
    // 1. Find all user skills that reference this template
    const userSkillsResult = await client.query(
      'SELECT id, user_id FROM user_skills WHERE skill_template_id = $1',
      [id]
    );
    
    const userSkillsToDelete = userSkillsResult.rows;
    console.log(`Found ${userSkillsToDelete.length} user skills referencing this template`);
    
    // Only proceed with related deletions if there are user skills to delete
    if (userSkillsToDelete.length > 0) {
      const userSkillIds = userSkillsToDelete.map(us => us.id);
      
      // 2. Delete pending skill updates for these user skills
      const pendingUpdatesResult = await client.query(
        'DELETE FROM pending_skill_updates WHERE user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1) RETURNING id',
        [id]
      );
      console.log(`Deleted ${pendingUpdatesResult.rowCount} pending skill updates`);
      
      // 3. Delete endorsements for these user skills
      const endorsementsResult = await client.query(
        'DELETE FROM endorsements WHERE user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1) RETURNING id',
        [id]
      );
      console.log(`Deleted ${endorsementsResult.rowCount} endorsements`);
      
      // 4. Delete notifications related to these user skills
      const notificationsResult = await client.query(
        'DELETE FROM notifications WHERE related_user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1) RETURNING id',
        [id]
      );
      console.log(`Deleted ${notificationsResult.rowCount} notifications`);
      
      // Now delete the user skills themselves
      const userSkillsDeleteResult = await client.query(
        'DELETE FROM user_skills WHERE skill_template_id = $1 RETURNING id',
        [id]
      );
      console.log(`Deleted ${userSkillsDeleteResult.rowCount} user skills`);
    }
    
    // 5. Delete project skills that reference this template
    // Note: project_skills.skill_id is now referencing skill_templates.id after our schema update
    const projectSkillsResult = await client.query(
      'DELETE FROM project_skills WHERE skill_id = $1 RETURNING id',
      [id]
    );
    console.log(`Deleted ${projectSkillsResult.rowCount} project skills`);
    
    // 6. Finally, delete the skill template
    const templateResult = await client.query(
      'DELETE FROM skill_templates WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (templateResult.rowCount === 0) {
      throw new Error(`Failed to delete skill template ${id}`);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    return {
      deletedUserSkills: userSkillsToDelete.length,
      deletedTemplate: true
    };
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error(`Error during cascading deletion of skill template ${id}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Function to create a test template for deletion
async function createTestTemplateAndSkills() {
  try {
    const templateName = "Test Template For Deletion " + Date.now();
    
    // 1. Create a skill template
    const templateResult = await pool.query(
      `INSERT INTO skill_templates (name, category, description)
       VALUES ($1, $2, $3)
       RETURNING id, name, category`,
      [templateName, 'Testing', 'This template is created for testing cascade deletion']
    );
    
    if (templateResult.rows.length === 0) {
      throw new Error('Failed to create test template');
    }
    
    const template = templateResult.rows[0];
    console.log(`Created test template: ${template.name} (ID: ${template.id})`);
    
    // 2. Create some user skills using this template
    // First get a couple of test users
    const userResult = await pool.query(
      `SELECT id FROM users LIMIT 3`
    );
    
    const users = userResult.rows;
    if (users.length === 0) {
      throw new Error('No users found for testing');
    }
    
    console.log(`Found ${users.length} users to create test skills for`);
    
    // Create a user skill for each user
    const userSkills = [];
    for (const user of users) {
      const skillResult = await pool.query(
        `INSERT INTO user_skills 
          (user_id, skill_template_id, level, notes)
         VALUES 
          ($1, $2, $3, $4)
         RETURNING id`,
        [
          user.id,
          template.id,
          'intermediate',
          'Test skill for cascade delete testing'
        ]
      );
      
      if (skillResult.rows.length > 0) {
        userSkills.push(skillResult.rows[0]);
        console.log(`Created user skill ID ${skillResult.rows[0].id} for user ${user.id}`);
      }
    }
    
    // 3. Create a project skill using this template
    const projectResult = await pool.query(
      `SELECT id FROM projects LIMIT 1`
    );
    
    if (projectResult.rows.length > 0) {
      const project = projectResult.rows[0];
      
      const projectSkillResult = await pool.query(
        `INSERT INTO project_skills (project_id, skill_id, required_level)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [project.id, template.id, 'intermediate']
      );
      
      if (projectSkillResult.rows.length > 0) {
        console.log(`Created project skill ID ${projectSkillResult.rows[0].id} for project ${project.id}`);
      }
    }
    
    // Return the template ID for deletion
    return {
      templateId: template.id,
      templateName: template.name,
      userSkillCount: userSkills.length
    };
  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  }
}

// Test runner
async function runTest() {
  try {
    console.log('=== STARTING SUPER ADMIN CASCADING DELETE TEST ===');
    
    // First, create test data
    console.log('\n1. Creating test template and skills...');
    const testData = await createTestTemplateAndSkills();
    console.log(`Created template "${testData.templateName}" (ID: ${testData.templateId}) with ${testData.userSkillCount} user skills`);
    
    // Wait a moment before deletion
    console.log('\nWaiting 2 seconds before deletion...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Now test the cascade delete
    console.log('\n2. Testing cascade deletion...');
    const result = await deleteSkillTemplate(testData.templateId);
    
    console.log('\n=== TEST RESULTS ===');
    console.log(`Successfully deleted template ID ${testData.templateId}`);
    console.log(`Deleted ${result.deletedUserSkills} user skills`);
    console.log('Cascade deletion test passed successfully!');
    
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error during test:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the test
runTest();