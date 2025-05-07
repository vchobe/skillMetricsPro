import pkg from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const { Pool } = pkg;

// Use the same database configuration as the main application
function getDatabaseConfig() {
  // Use Cloud SQL configuration (Google Cloud SQL only)
  // Check for Google Cloud SQL configuration
  const cloudSqlConnectionName = process.env.CLOUD_SQL_CONNECTION_NAME;
  const cloudSqlUser = process.env.CLOUD_SQL_USER;
  const cloudSqlPassword = process.env.CLOUD_SQL_PASSWORD;
  const cloudSqlDatabase = process.env.CLOUD_SQL_DATABASE;
  
  // Check if we have Cloud SQL configuration
  const hasCloudSqlConfig = cloudSqlConnectionName && cloudSqlUser && cloudSqlPassword && cloudSqlDatabase;
  
  // Verify required credentials
  if (!hasCloudSqlConfig) {
    throw new Error('Database configuration is missing. Please set CLOUD_SQL_CONNECTION_NAME, CLOUD_SQL_USER, CLOUD_SQL_PASSWORD, and CLOUD_SQL_DATABASE environment variables.');
  }
  
  console.log('Using Google Cloud SQL configuration');
  
  // Force TCP connection for migrations/scripts
  // Always use direct TCP connection for this script
  const useSocketConnection = false;
  
  if (useSocketConnection) {
    // In Cloud Run, use Unix socket connection
    console.log(`Using Cloud SQL socket connection to: ${cloudSqlConnectionName}`);
    
    return {
      user: cloudSqlUser,
      password: cloudSqlPassword,
      database: cloudSqlDatabase,
      host: `/cloudsql/${cloudSqlConnectionName}`,
      ssl: false, // SSL is not used with Unix socket
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };
  } else {
    // In development or direct connection mode, use TCP connection
    
    // Check if we have host and port override - useful for direct connections
    const dbHost = process.env.CLOUD_SQL_HOST || 'localhost';
    const dbPort = parseInt(process.env.CLOUD_SQL_PORT || '5432', 10);
    
    console.log(`Using direct TCP connection to: ${dbHost}:${dbPort}`);
    console.log('SSL Enabled:', process.env.CLOUD_SQL_USE_SSL === 'true' ? 'Yes' : 'No');
    
    return {
      user: cloudSqlUser,
      password: cloudSqlPassword,
      database: cloudSqlDatabase,
      host: dbHost,
      port: dbPort,
      ssl: process.env.CLOUD_SQL_USE_SSL === 'true',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };
  }
}

// Create the database connection pool using the same config as the server
const pool = new Pool(getDatabaseConfig());

async function fixProjectSkillsConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('Starting constraint fix process...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Check for existing constraints
    const constraintQuery = `
      SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) as constraint_def
      FROM pg_constraint 
      WHERE conname = 'project_skills_skill_id_fkey' OR 
        (conrelid = 'project_skills'::regclass AND contype = 'f' AND conname LIKE '%skill%');
    `;
    
    const { rows: constraints } = await client.query(constraintQuery);
    
    console.log('Current constraints:', constraints);
    
    // If the constraint exists, drop it
    if (constraints.some(con => con.conname === 'project_skills_skill_id_fkey')) {
      console.log('Dropping existing skill_id foreign key constraint...');
      await client.query('ALTER TABLE project_skills DROP CONSTRAINT project_skills_skill_id_fkey');
      console.log('Constraint dropped successfully.');
    } else {
      console.log('No existing "project_skills_skill_id_fkey" constraint found.');
    }
    
    // Check if skill_templates table exists
    const { rows: tableCheck } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'skill_templates'
      );
    `);
    
    const skillTemplatesExists = tableCheck[0].exists;
    
    if (skillTemplatesExists) {
      console.log('Skill templates table exists, adding new constraint...');
      
      // Add new constraint referencing skill_templates table
      await client.query(`
        ALTER TABLE project_skills 
        ADD CONSTRAINT project_skills_skill_template_id_fkey 
        FOREIGN KEY (skill_id) 
        REFERENCES skill_templates(id) 
        ON DELETE CASCADE;
      `);
      
      console.log('New constraint added successfully.');
    } else {
      console.log('WARNING: skill_templates table not found. Cannot add new constraint.');
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Constraint update process completed successfully.');
    
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error during constraint update:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixProjectSkillsConstraint().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});