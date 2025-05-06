/**
 * Script to create the project_skills_v2 table and migrate data from project_skills
 */

import pg from 'pg';
const { Pool } = pg;

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createProjectSkillsV2Table() {
  console.log('Creating project_skills_v2 table...');
  
  try {
    // Check if the table already exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'project_skills_v2'
      );
    `);
    
    const tableExists = checkResult.rows[0].exists;
    
    if (tableExists) {
      console.log('Table project_skills_v2 already exists.');
      return;
    }
    
    // Create the table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_skills_v2 (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_skill_id INTEGER NOT NULL REFERENCES user_skills(id) ON DELETE CASCADE,
        required_level TEXT DEFAULT 'beginner' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Table project_skills_v2 created successfully!');
  } catch (error) {
    console.error('Error creating project_skills_v2 table:', error);
    throw error;
  }
}

async function migrateDataFromProjectSkills() {
  console.log('Migrating data from project_skills to project_skills_v2...');
  
  try {
    // First, check if there's data to migrate
    const countResult = await pool.query('SELECT COUNT(*) FROM project_skills');
    const count = parseInt(countResult.rows[0].count);
    
    if (count === 0) {
      console.log('No data to migrate from project_skills.');
      return;
    }
    
    // To migrate, we need to find the corresponding user_skill_id for each skill_id
    // We'll join skills with user_skills based on user_id and name (or other identifiers)
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get all project skills
      const projectSkills = await client.query(`
        SELECT ps.*, s.user_id, s.name 
        FROM project_skills ps
        JOIN skills s ON ps.skill_id = s.id
      `);
      
      let migratedCount = 0;
      
      // For each project skill, find the corresponding user_skill and insert into project_skills_v2
      for (const ps of projectSkills.rows) {
        // Find the corresponding user_skill by joining with skill_templates
        const userSkillResult = await client.query(`
          SELECT us.id 
          FROM user_skills us
          JOIN skill_templates st ON us.skill_template_id = st.id
          WHERE us.user_id = $1 AND st.name = $2
          LIMIT 1
        `, [ps.user_id, ps.name]);
        
        if (userSkillResult.rows.length > 0) {
          const userSkillId = userSkillResult.rows[0].id;
          
          // Insert into project_skills_v2
          await client.query(`
            INSERT INTO project_skills_v2 (project_id, user_skill_id, required_level)
            VALUES ($1, $2, $3)
          `, [ps.project_id, userSkillId, ps.required_level || 'beginner']);
          
          migratedCount++;
        } else {
          console.log(`Could not find corresponding user_skill for skill '${ps.name}' and user_id ${ps.user_id}`);
        }
      }
      
      await client.query('COMMIT');
      console.log(`✅ Migrated ${migratedCount} of ${projectSkills.rows.length} project skills.`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error during migration, transaction rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error migrating data from project_skills:', error);
    throw error;
  }
}

async function main() {
  try {
    await createProjectSkillsV2Table();
    await migrateDataFromProjectSkills();
    console.log('✅ Project skills migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);