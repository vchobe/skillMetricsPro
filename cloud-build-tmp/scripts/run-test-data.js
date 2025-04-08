import { pool } from '../server/db.js';
import fs from 'fs';
import path from 'path';

async function runTestDataScript() {
  try {
    console.log('Starting to execute test data SQL script...');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'add-test-data.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL script
    await pool.query(sqlContent);
    
    console.log('Successfully executed test data SQL script');
  } catch (error) {
    console.error('Error executing test data script:', error);
  } finally {
    await pool.end();
  }
}

runTestDataScript();