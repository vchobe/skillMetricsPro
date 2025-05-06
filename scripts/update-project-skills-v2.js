/**
 * Migration script to update project_skills_v2 table with skill_template_id values
 * 
 * This script fetches all existing project_skills_v2 records, gets the corresponding 
 * skill_template_id from the user_skills table, and updates the project_skills_v2 records
 * with the correct skill_template_id.
 */
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const dbConnectionString = process.env.DATABASE_URL;
if (!dbConnectionString) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbConnectionString,
});

/**
 * Update all records in project_skills_v2 table to include skill_template_id
 */
async function updateProjectSkillsV2() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration of project_skills_v2 records...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Get all project_skills_v2 records that have a valid user_skill_id (not 0)
    // and don't have a skill_template_id yet
    const projectSkillsResult = await client.query(`
      SELECT id, project_id, user_skill_id 
      FROM project_skills_v2 
      WHERE user_skill_id > 0 
      AND (skill_template_id IS NULL OR skill_template_id = 0)
    `);
    
    const projectSkills = projectSkillsResult.rows;
    console.log(`Found ${projectSkills.length} project skills to update`);
    
    if (projectSkills.length === 0) {
      console.log('No project skills need to be updated.');
      return;
    }
    
    // Update each project skill with the corresponding skill_template_id
    for (const ps of projectSkills) {
      try {
        // Get the skill_template_id from the user_skills table
        const userSkillResult = await client.query(
          'SELECT skill_template_id FROM user_skills WHERE id = $1',
          [ps.user_skill_id]
        );
        
        if (userSkillResult.rows.length === 0) {
          console.warn(`Warning: No user skill found with ID ${ps.user_skill_id} for project skill ${ps.id}`);
          continue;
        }
        
        const skillTemplateId = userSkillResult.rows[0].skill_template_id;
        
        // Update the project_skills_v2 record
        const updateResult = await client.query(
          'UPDATE project_skills_v2 SET skill_template_id = $1 WHERE id = $2',
          [skillTemplateId, ps.id]
        );
        
        console.log(`Updated project skill ${ps.id} with skill_template_id ${skillTemplateId}`);
      } catch (error) {
        console.error(`Error updating project skill ${ps.id}:`, error);
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error during migration:', error);
  } finally {
    client.release();
  }
}

updateProjectSkillsV2()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });