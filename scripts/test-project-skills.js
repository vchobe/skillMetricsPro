/**
 * Test script to verify the getProjectSkillsV2 function is working properly
 */
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function getProjectIds() {
  try {
    console.log("Fetching all project IDs...");
    const result = await pool.query(`
      SELECT id, name 
      FROM projects 
      ORDER BY id 
      LIMIT 10
    `);
    
    console.log(`Found ${result.rows.length} projects:`);
    result.rows.forEach(p => {
      console.log(`Project ID: ${p.id}, Name: ${p.name}`);
    });
    
    return result.rows;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

async function testProjectSkills(projectId) {
  try {
    console.log(`\nTesting project skills for project ID ${projectId}...`);
    
    // Test project_skills table (legacy)
    const legacyResult = await pool.query(`
      SELECT 
        ps.id, 
        ps.project_id, 
        ps.skill_id as skill_template_id, 
        ps.required_level,
        st.name as skill_name, 
        st.category as skill_category
      FROM project_skills ps
      JOIN skill_templates st ON ps.skill_id = st.id
      WHERE ps.project_id = $1
    `, [projectId]);
    
    console.log(`\nFound ${legacyResult.rows.length} legacy project skills:`);
    legacyResult.rows.forEach(s => {
      console.log(`  Skill: ${s.skill_name} (${s.skill_category}), Level: ${s.required_level}, ID: ${s.id}`);
    });
    
    // Test if project_skills_v2 table exists
    try {
      const v2Result = await pool.query(`
        SELECT 
          ps.id, 
          ps.project_id, 
          ps.skill_template_id, 
          ps.required_level,
          st.name as skill_name, 
          st.category as skill_category
        FROM project_skills_v2 ps
        JOIN skill_templates st ON ps.skill_template_id = st.id
        WHERE ps.project_id = $1
      `, [projectId]);
      
      console.log(`\nFound ${v2Result.rows.length} v2 project skills:`);
      v2Result.rows.forEach(s => {
        console.log(`  Skill: ${s.skill_name} (${s.skill_category}), Level: ${s.required_level}, ID: ${s.id}`);
      });
    } catch (error) {
      console.log(`\nproject_skills_v2 table may not exist: ${error.message}`);
    }
    
    // Test direct API endpoint (simulates browser request)
    // We can't do this directly from Node but we can show what data would be available to the API
    const templateResult = await pool.query(`
      SELECT id, name, category 
      FROM skill_templates 
      WHERE id IN (
        SELECT skill_id FROM project_skills WHERE project_id = $1
      )
    `, [projectId]);
    
    console.log(`\nFound ${templateResult.rows.length} skill templates for this project:`);
    templateResult.rows.forEach(t => {
      console.log(`  Template: ${t.name} (${t.category}), ID: ${t.id}`);
    });
    
  } catch (error) {
    console.error(`Error testing project skills for project ${projectId}:`, error);
  }
}

async function main() {
  try {
    const projects = await getProjectIds();
    
    if (projects.length > 0) {
      // Test the first project
      await testProjectSkills(projects[0].id);
    } else {
      console.log("No projects found to test");
    }
  } catch (error) {
    console.error("Error in main function:", error);
  } finally {
    await pool.end();
  }
}

main();