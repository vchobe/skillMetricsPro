import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function checkTable() {
  const pool = new Pool({
    host: process.env.CLOUD_SQL_HOST,
    port: process.env.CLOUD_SQL_PORT,
    user: process.env.CLOUD_SQL_USER,
    password: process.env.CLOUD_SQL_PASSWORD,
    database: process.env.CLOUD_SQL_DATABASE
  });

  try {
    console.log('Connecting to:', process.env.CLOUD_SQL_HOST);
    const result = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'project_skills';"
    );
    
    console.log('Project Skills table columns:');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });
  } catch (error) {
    console.error('Error checking table:', error);
  } finally {
    await pool.end();
  }
}

checkTable();