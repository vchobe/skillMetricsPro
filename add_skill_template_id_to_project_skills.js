import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function addSkillTemplateIdColumn() {
  const pool = new Pool({
    host: process.env.CLOUD_SQL_HOST,
    port: process.env.CLOUD_SQL_PORT,
    user: process.env.CLOUD_SQL_USER,
    password: process.env.CLOUD_SQL_PASSWORD,
    database: process.env.CLOUD_SQL_DATABASE
  });

  try {
    console.log('Adding skill_template_id column to project_skills table...');
    
    // Check if column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project_skills' AND column_name = 'skill_template_id';
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('Column skill_template_id already exists.');
      return;
    }
    
    // Add the column
    await pool.query(`
      ALTER TABLE project_skills 
      ADD COLUMN skill_template_id INTEGER;
    `);
    
    console.log('Column skill_template_id added successfully.');
    
    // Update existing records to populate skill_template_id from user_skills
    await pool.query(`
      UPDATE project_skills ps
      SET skill_template_id = us.skill_template_id
      FROM user_skills us
      WHERE ps.skill_id = us.id AND ps.skill_template_id IS NULL;
    `);
    
    console.log('Updated existing records with skill_template_id from user_skills');
    
    // Verify the schema again
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'project_skills';
    `);
    
    console.log('Updated Project Skills table columns:');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });
  } catch (error) {
    console.error('Error updating table:', error);
  } finally {
    await pool.end();
  }
}

addSkillTemplateIdColumn();