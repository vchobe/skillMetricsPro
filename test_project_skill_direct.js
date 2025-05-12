import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function testProjectSkillCreation() {
  const pool = new Pool({
    host: process.env.CLOUD_SQL_HOST,
    port: process.env.CLOUD_SQL_PORT,
    user: process.env.CLOUD_SQL_USER,
    password: process.env.CLOUD_SQL_PASSWORD,
    database: process.env.CLOUD_SQL_DATABASE
  });

  try {
    console.log('Testing direct creation of project skill with skill template...');
    
    // Get a valid project ID
    const projectResult = await pool.query('SELECT id FROM projects LIMIT 1');
    if (projectResult.rows.length === 0) {
      console.error('No projects found to test with');
      return;
    }
    const projectId = projectResult.rows[0].id;
    
    // Get a valid skill template ID
    const templateResult = await pool.query('SELECT id, name, category FROM skill_templates LIMIT 1');
    if (templateResult.rows.length === 0) {
      console.error('No skill templates found to test with');
      return;
    }
    const skillTemplateId = templateResult.rows[0].id;
    const templateName = templateResult.rows[0].name;
    const templateCategory = templateResult.rows[0].category;
    
    console.log(`Testing with project ID: ${projectId} and skill template: ${templateName} (${templateCategory}) - ID: ${skillTemplateId}`);
    
    // Create the project skill directly in the database
    const insertResult = await pool.query(
      `INSERT INTO project_skills (project_id, skill_id, skill_template_id, required_level, importance) 
       VALUES ($1, NULL, $2, $3, $4) 
       RETURNING id`,
      [projectId, skillTemplateId, 'intermediate', 'high']
    );
    
    if (insertResult.rows.length === 0) {
      console.error('Failed to insert project skill');
      return;
    }
    
    const newSkillId = insertResult.rows[0].id;
    console.log(`Successfully created project skill with ID: ${newSkillId}`);
    
    // Verify the new project skill with a join
    const verifyResult = await pool.query(
      `SELECT 
        ps.id, 
        ps.project_id, 
        ps.skill_id,
        ps.skill_template_id, 
        ps.required_level,
        ps.importance,
        st.name as template_name, 
        st.category as template_category
      FROM project_skills ps
      JOIN skill_templates st ON ps.skill_template_id = st.id
      WHERE ps.id = $1`,
      [newSkillId]
    );
    
    if (verifyResult.rows.length === 0) {
      console.error('Could not verify the newly created project skill');
      return;
    }
    
    const projectSkill = verifyResult.rows[0];
    console.log('Verification successful! Project skill details:');
    console.log(JSON.stringify(projectSkill, null, 2));
    
    // Clean up the test data
    await pool.query('DELETE FROM project_skills WHERE id = $1', [newSkillId]);
    console.log(`Test data cleaned up. Deleted project skill with ID: ${newSkillId}`);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await pool.end();
  }
}

testProjectSkillCreation();