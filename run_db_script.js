// Run the database script using the application's existing connection
import { pool } from './server/db.js';

async function runDatabaseScript() {
  try {
    console.log('Starting database script...');
    
    // Check if the column exists
    const checkResult = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'skill_approvers' AND column_name = 'skill_template_id'
    `);
    
    console.log(`Check result: ${JSON.stringify(checkResult.rows)}`);
    
    if (checkResult.rows.length === 0) {
      console.log('Column does not exist, adding it...');
      
      // Add the column if it doesn't exist
      await pool.query(`
        ALTER TABLE skill_approvers 
        ADD COLUMN skill_template_id INTEGER REFERENCES skill_templates(id)
      `);
      
      console.log('Column added successfully!');
      
      // Create an index on the column
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_skill_approvers_skill_template_id 
        ON skill_approvers(skill_template_id)
      `);
      
      console.log('Index created successfully!');
    } else {
      console.log('Column already exists, no changes needed.');
    }
    
    // Verify the column was added
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'skill_approvers' AND column_name = 'skill_template_id'
    `);
    
    console.log('Verification result:');
    console.log(verifyResult.rows);
    
    console.log('Script completed successfully!');
  } catch (error) {
    console.error('Error running database script:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the script
runDatabaseScript();