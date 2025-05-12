import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function checkCategories() {
  const pool = new Pool({
    host: process.env.CLOUD_SQL_HOST,
    port: process.env.CLOUD_SQL_PORT,
    user: process.env.CLOUD_SQL_USER,
    password: process.env.CLOUD_SQL_PASSWORD,
    database: process.env.CLOUD_SQL_DATABASE
  });

  try {
    console.log('Checking all distinct categories in skill_templates...');
    
    // Check all available categories
    const categoriesResult = await pool.query(`
      SELECT DISTINCT category 
      FROM skill_templates 
      ORDER BY category;
    `);
    
    console.log(`Found ${categoriesResult.rows.length} distinct categories in skill_templates:`);
    categoriesResult.rows.forEach(row => {
      console.log(`  ${row.category}`);
    });
    
    // Check recently added skill templates
    console.log('\nChecking recent skill templates...');
    const recentTemplatesResult = await pool.query(`
      SELECT id, name, category, created_at 
      FROM skill_templates 
      ORDER BY id DESC
      LIMIT 10;
    `);
    
    console.log(`Found ${recentTemplatesResult.rows.length} recent skill templates:`);
    recentTemplatesResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Category: ${row.category}, Created: ${row.created_at || 'Unknown'}`);
    });
    
    // Check distinct categories in user skills
    console.log('\nChecking all distinct categories in user_skills...');
    const userCategoriesResult = await pool.query(`
      SELECT DISTINCT category 
      FROM user_skills 
      ORDER BY category;
    `);
    
    console.log(`Found ${userCategoriesResult.rows.length} distinct categories in user_skills:`);
    userCategoriesResult.rows.forEach(row => {
      console.log(`  ${row.category}`);
    });
    
    // Check recently added user skills
    console.log('\nChecking recent user skills...');
    const recentSkillsResult = await pool.query(`
      SELECT id, user_id, name, category, level, created_at 
      FROM user_skills 
      ORDER BY id DESC
      LIMIT 10;
    `);
    
    console.log(`Found ${recentSkillsResult.rows.length} recent user skills:`);
    recentSkillsResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, User ID: ${row.user_id}, Name: ${row.name}, Category: ${row.category}, Level: ${row.level}, Created: ${row.created_at || 'Unknown'}`);
    });
    
  } catch (error) {
    console.error('Error checking categories:', error);
  } finally {
    await pool.end();
  }
}

checkCategories();