import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function checkUserSkillsSchema() {
  const pool = new Pool({
    host: process.env.CLOUD_SQL_HOST,
    port: process.env.CLOUD_SQL_PORT,
    user: process.env.CLOUD_SQL_USER,
    password: process.env.CLOUD_SQL_PASSWORD,
    database: process.env.CLOUD_SQL_DATABASE
  });

  try {
    console.log('Checking user_skills table schema...');
    
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_skills'
      ORDER BY ordinal_position;
    `);
    
    console.log(`Found ${columnsResult.rows.length} columns in user_skills table:`);
    columnsResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    // Check recent user skills
    console.log('\nChecking recent entries in user_skills...');
    const recentResult = await pool.query(`
      SELECT * 
      FROM user_skills 
      ORDER BY id DESC
      LIMIT 5;
    `);
    
    console.log(`Found ${recentResult.rows.length} recent entries in user_skills table:`);
    recentResult.rows.forEach(row => {
      console.log(JSON.stringify(row, null, 2));
    });
    
  } catch (error) {
    console.error('Error checking user_skills schema:', error);
  } finally {
    await pool.end();
  }
}

checkUserSkillsSchema();