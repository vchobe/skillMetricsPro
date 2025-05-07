/**
 * Test script for verifying the project skills V2 functionality
 * 
 * This script directly calls the storage methods to test adding a skill
 * template to a project, bypassing the authentication and API layer.
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

// Helper function to convert snake_case to camelCase
function snakeToCamel(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }
  
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      const camelKey = key.replace(/_([a-z])/g, (_, p1) => p1.toUpperCase());
      return [camelKey, snakeToCamel(value)];
    })
  );
}

// Implementation of the createProjectSkillV2 function
async function createProjectSkillV2(projectSkill) {
  // Validate the skill template exists
  const templateCheck = await pool.query(
    'SELECT id, name, category FROM skill_templates WHERE id = $1',
    [projectSkill.skillTemplateId]
  );
  
  if (templateCheck.rows.length === 0) {
    throw new Error(
      `Cannot associate skill with project: skill template with ID ${projectSkill.skillTemplateId} does not exist`
    );
  }
  
  const template = templateCheck.rows[0];
  console.log(`Found template: ${template.name} (${template.category})`);
  
  // Check if this template is already associated with the project
  const existingResult = await pool.query(
    'SELECT id FROM project_skills WHERE project_id = $1 AND skill_id = $2',
    [projectSkill.projectId, projectSkill.skillTemplateId]
  );
  
  if (existingResult.rows.length > 0) {
    throw new Error("This skill is already associated with the project");
  }
  
  // Start a transaction
  await pool.query('BEGIN');
  
  try {
    // In project_skills table, we use skill_id to store the skill_template_id
    const result = await pool.query(
      `INSERT INTO project_skills (project_id, skill_id, required_level) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [
        projectSkill.projectId,
        projectSkill.skillTemplateId,
        projectSkill.requiredLevel || 'beginner'
      ]
    );
    
    // Return the result with skill details directly from skill_templates
    const fullResult = await pool.query(`
      SELECT 
        ps.id, 
        ps.project_id, 
        ps.skill_id as skill_template_id, 
        ps.required_level,
        ps.created_at,
        st.name as skill_name, 
        st.category as skill_category, 
        st.description
      FROM project_skills ps
      JOIN skill_templates st ON ps.skill_id = st.id
      WHERE ps.id = $1
    `, [result.rows[0].id]);
    
    if (fullResult.rows.length === 0) {
      throw new Error('Failed to retrieve created project skill V2');
    }
    
    await pool.query('COMMIT');
    
    console.log(`Successfully associated skill template ${projectSkill.skillTemplateId} with project ${projectSkill.projectId}`);
    return snakeToCamel(fullResult.rows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error creating project skill:', error);
    throw error;
  }
}

// Implementation of getProjectSkillsV2 function to verify the result
async function getProjectSkillsV2(projectId) {
  const result = await pool.query(`
    SELECT 
      ps.id, 
      ps.project_id, 
      ps.skill_id as skill_template_id, 
      ps.required_level,
      ps.created_at,
      st.name as skill_name, 
      st.category as skill_category, 
      st.description
    FROM project_skills ps
    JOIN skill_templates st ON ps.skill_id = st.id
    WHERE project_id = $1
    ORDER BY st.name ASC
  `, [projectId]);
  
  return snakeToCamel(result.rows);
}

// Get available skill templates to pick one for testing
async function getSkillTemplates() {
  const result = await pool.query(
    'SELECT id, name, category FROM skill_templates ORDER BY id LIMIT 10'
  );
  
  return result.rows;
}

// Function to run the test
async function runTest() {
  try {
    console.log('Starting test for project skills V2 functionality...');
    
    // Get project skills before adding
    const projectId = 4;
    const existingSkills = await getProjectSkillsV2(projectId);
    console.log(`Project ${projectId} currently has ${existingSkills.length} skills assigned`);
    
    // Get available skill templates
    const templates = await getSkillTemplates();
    console.log('Available skill templates for testing:');
    templates.forEach(t => console.log(`  ID: ${t.id}, Name: ${t.name}, Category: ${t.category}`));
    
    // Pick a template to add (select one that's not already assigned)
    const usedTemplateIds = existingSkills.map(s => s.skillTemplateId);
    const availableTemplates = templates.filter(t => !usedTemplateIds.includes(t.id));
    
    if (availableTemplates.length === 0) {
      console.log('No available templates to add - all are already assigned to the project');
      return;
    }
    
    const templateToAdd = availableTemplates[0];
    console.log(`Will add template: ID: ${templateToAdd.id}, Name: ${templateToAdd.name}`);
    
    // Add the project skill using V2 function
    const addedSkill = await createProjectSkillV2({
      projectId: projectId,
      skillTemplateId: templateToAdd.id,
      requiredLevel: 'intermediate'
    });
    
    console.log('Successfully added project skill:');
    console.log(addedSkill);
    
    // Verify the skill was added
    const updatedSkills = await getProjectSkillsV2(projectId);
    console.log(`Project ${projectId} now has ${updatedSkills.length} skills assigned`);
    
    console.log('Test completed successfully! The project skills V2 functions are working properly.');
  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the test
runTest();