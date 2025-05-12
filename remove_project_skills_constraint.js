import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function removeSkillIdConstraint() {
  const pool = new Pool({
    host: process.env.CLOUD_SQL_HOST,
    port: process.env.CLOUD_SQL_PORT,
    user: process.env.CLOUD_SQL_USER,
    password: process.env.CLOUD_SQL_PASSWORD,
    database: process.env.CLOUD_SQL_DATABASE
  });

  try {
    console.log('Removing not-null constraint from skill_id in project_skills table...');
    
    // Alter the column to allow NULL values
    await pool.query(`
      ALTER TABLE project_skills 
      ALTER COLUMN skill_id DROP NOT NULL;
    `);
    
    console.log('Successfully removed not-null constraint from skill_id column.');
    
    // Verify the change
    const result = await pool.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns 
      WHERE table_name = 'project_skills' AND column_name = 'skill_id';
    `);
    
    console.log('Updated skill_id column status:');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}, Nullable: ${row.is_nullable}`);
    });
  } catch (error) {
    console.error('Error updating table constraint:', error);
  } finally {
    await pool.end();
  }
}

removeSkillIdConstraint();