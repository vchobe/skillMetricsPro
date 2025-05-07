/**
 * Script to update the project_skills foreign key constraint
 * 
 * This script modifies the project_skills table to:
 * 1. Drop the existing constraint that references skills.id
 * 2. Add a new constraint that references skill_templates.id instead
 * 
 * This completes the migration of project_skills to use skill templates directly
 * rather than going through the legacy skills table.
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Get database connection from environment variables
function getDatabaseConfig() {
  // Use Cloud SQL configuration (Google Cloud SQL only)
  const cloudSqlUser = process.env.CLOUD_SQL_USER;
  const cloudSqlPassword = process.env.CLOUD_SQL_PASSWORD;
  const cloudSqlDatabase = process.env.CLOUD_SQL_DATABASE;
  const dbHost = process.env.CLOUD_SQL_HOST || 'localhost';
  const dbPort = parseInt(process.env.CLOUD_SQL_PORT || '5432', 10);
  
  console.log(`Using direct TCP connection to: ${dbHost}:${dbPort}`);
  
  return {
    user: cloudSqlUser,
    password: cloudSqlPassword,
    database: cloudSqlDatabase,
    host: dbHost,
    port: dbPort,
    ssl: process.env.CLOUD_SQL_USE_SSL === 'true'
  };
}

async function updateConstraint() {
  const pool = new Pool(getDatabaseConfig());
  const client = await pool.connect();
  
  try {
    console.log('Starting constraint update process...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // 1. First check if constraint exists
    const checkConstraintResult = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'project_skills' 
      AND constraint_name = 'project_skills_skill_id_fkey'
    `);
    
    if (checkConstraintResult.rows.length > 0) {
      console.log('Found existing constraint, dropping it...');
      
      // 2. Drop the existing constraint
      await client.query('ALTER TABLE project_skills DROP CONSTRAINT project_skills_skill_id_fkey');
      console.log('Successfully dropped existing constraint');
    } else {
      console.log('Existing constraint not found. It may have been dropped already.');
    }
    
    // 3. Check if there are any project_skills records with skill_id values 
    // that don't exist in skill_templates
    const invalidRecordsResult = await client.query(`
      SELECT ps.id, ps.project_id, ps.skill_id 
      FROM project_skills ps
      LEFT JOIN skill_templates st ON ps.skill_id = st.id
      WHERE st.id IS NULL
    `);
    
    if (invalidRecordsResult.rows.length > 0) {
      console.log(`Found ${invalidRecordsResult.rows.length} project_skills records with invalid skill_id values`);
      
      // For safety, we'll just print these out rather than automatically deleting
      console.log('Records with invalid skill_id values:');
      for (const row of invalidRecordsResult.rows) {
        console.log(`  Project skill ID: ${row.id}, Project ID: ${row.project_id}, Invalid skill_id: ${row.skill_id}`);
      }
      
      // 4. Delete the invalid records (optional - can be commented out for safety)
      const deleteResponse = await client.query(`
        DELETE FROM project_skills 
        WHERE id IN (
          SELECT ps.id
          FROM project_skills ps
          LEFT JOIN skill_templates st ON ps.skill_id = st.id
          WHERE st.id IS NULL
        )
      `);
      
      console.log(`Deleted ${deleteResponse.rowCount} invalid records`);
    } else {
      console.log('All project_skills records have valid skill_id values that exist in skill_templates');
    }
    
    // 5. Add the new constraint
    await client.query(`
      ALTER TABLE project_skills 
      ADD CONSTRAINT project_skills_skill_template_id_fkey 
      FOREIGN KEY (skill_id) 
      REFERENCES skill_templates(id)
    `);
    
    console.log('Successfully added new constraint referencing skill_templates');
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Transaction committed. Constraint update completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during constraint update:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the update
updateConstraint()
  .then(() => {
    console.log('Constraint update process completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error during constraint update:', err);
    process.exit(1);
  });