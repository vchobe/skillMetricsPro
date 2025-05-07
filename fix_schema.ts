// Script to add the skill_template_id column to skill_approvers table
import { pool } from './server/db';

async function fixSchema() {
  try {
    console.log('Starting schema fix script...');
    
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
    // End the pool 
    pool.end();
  }
}

// Run the script
fixSchema();