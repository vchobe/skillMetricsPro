import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.CLOUD_SQL_HOST,
  port: process.env.CLOUD_SQL_PORT,
  database: process.env.CLOUD_SQL_DATABASE,
  user: process.env.CLOUD_SQL_USER,
  password: process.env.CLOUD_SQL_PASSWORD
});

async function listTables() {
  try {
    const result = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
    console.log('Database Tables:');
    for(let row of result.rows) {
      console.log(`- ${row.table_name}`);
    }
    
    // Check for tables with _v2 suffix
    const v2Tables = result.rows.filter(row => row.table_name.endsWith('_v2'));
    console.log('\nTables with _v2 suffix:');
    for(let row of v2Tables) {
      console.log(`- ${row.table_name}`);
    }

    // Check the specific tables we're using
    await checkTableColumns('pending_skill_updates');
    await checkTableColumns('pending_skill_updates_v2');
    await checkTableColumns('skill_histories');
    await checkTableColumns('skill_histories_v2');
    await checkTableColumns('endorsements');
    await checkTableColumns('endorsements_v2');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

async function checkTableColumns(tableName) {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `);
    
    console.log(`\nColumns for table ${tableName}:`);
    if (result.rows.length === 0) {
      console.log(`Table ${tableName} does not exist`);
      return;
    }
    
    for(let row of result.rows) {
      console.log(`- ${row.column_name} (${row.data_type}, ${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    }
  } catch (err) {
    console.error(`Error checking columns for ${tableName}:`, err);
  }
}

listTables();