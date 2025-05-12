import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function checkSkills() {
  const pool = new Pool({
    host: process.env.CLOUD_SQL_HOST,
    port: process.env.CLOUD_SQL_PORT,
    user: process.env.CLOUD_SQL_USER,
    password: process.env.CLOUD_SQL_PASSWORD,
    database: process.env.CLOUD_SQL_DATABASE
  });

  try {
    console.log('Checking skill templates in Database category...');
    
    // Check skill templates
    const templatesResult = await pool.query(`
      SELECT id, name, category, subcategory_id 
      FROM skill_templates 
      WHERE LOWER(category) = 'database'
      ORDER BY id DESC
      LIMIT 20;
    `);
    
    console.log(`Found ${templatesResult.rows.length} skill templates in Database category:`);
    templatesResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Category: ${row.category}, Subcategory ID: ${row.subcategory_id || 'None'}`);
    });
    
    // Check user skills with template relation
    console.log('\nChecking user skills related to Database category...');
    const userSkillsResult = await pool.query(`
      SELECT us.id, us.user_id, us.name, us.category, us.skill_template_id, us.level,
             st.name as template_name, st.category as template_category
      FROM user_skills us
      LEFT JOIN skill_templates st ON us.skill_template_id = st.id
      WHERE LOWER(us.category) = 'database' OR LOWER(st.category) = 'database'
      ORDER BY us.id DESC
      LIMIT 20;
    `);
    
    console.log(`Found ${userSkillsResult.rows.length} user skills related to Database category:`);
    userSkillsResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, User ID: ${row.user_id}, Name: ${row.name}, Category: ${row.category}, Template ID: ${row.skill_template_id || 'None'}, Level: ${row.level}`);
      if (row.template_name) {
        console.log(`    From template: ${row.template_name} (${row.template_category})`);
      }
    });
    
    // Check project skills
    console.log('\nChecking project skills related to Database category...');
    const projectSkillsResult = await pool.query(`
      SELECT ps.id, ps.project_id, ps.skill_id, ps.skill_template_id, ps.required_level, ps.importance,
             st.name as template_name, st.category as template_category,
             us.name as skill_name, us.category as skill_category
      FROM project_skills ps
      LEFT JOIN skill_templates st ON ps.skill_template_id = st.id
      LEFT JOIN user_skills us ON ps.skill_id = us.id
      WHERE LOWER(st.category) = 'database' OR LOWER(us.category) = 'database'
      ORDER BY ps.id DESC
      LIMIT 20;
    `);
    
    console.log(`Found ${projectSkillsResult.rows.length} project skills related to Database category:`);
    projectSkillsResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Project ID: ${row.project_id}, Skill ID: ${row.skill_id || 'None'}, Template ID: ${row.skill_template_id || 'None'}, Level: ${row.required_level}`);
      if (row.template_name) {
        console.log(`    From template: ${row.template_name} (${row.template_category})`);
      }
      if (row.skill_name) {
        console.log(`    From user skill: ${row.skill_name} (${row.skill_category})`);
      }
    });
    
    // Check if there are any skill templates in the Database category
    if (templatesResult.rows.length === 0) {
      console.log('\nNo skill templates found in Database category. Checking recent skill templates:');
      const recentTemplatesResult = await pool.query(`
        SELECT id, name, category, subcategory 
        FROM skill_templates 
        ORDER BY id DESC
        LIMIT 10;
      `);
      
      console.log(`Found ${recentTemplatesResult.rows.length} recent skill templates:`);
      recentTemplatesResult.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Name: ${row.name}, Category: ${row.category}, Subcategory: ${row.subcategory || 'None'}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking skills:', error);
  } finally {
    await pool.end();
  }
}

checkSkills();