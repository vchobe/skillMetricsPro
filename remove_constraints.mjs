/**
 * Script to remove constraints from skill_histories table
 * This removes constraints that are referencing the legacy skills table
 */

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Use the same database connection logic as the server
function getDatabaseConfig() {
  console.log('Environment:', process.env.NODE_ENV || 'development');
  
  // Use Cloud SQL configuration (Google Cloud SQL only)
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
  
  console.log('CONFIGURATION: Using Google Cloud SQL only');
  
  // We need to force using the TCP connection for this script
  // Always use the direct TCP connection when running from Replit
  const isCloudRun = false; // Force TCP connection
  
  if (isCloudRun) {
    // This branch won't execute, but keeping it for reference
    console.log(`Using Cloud SQL socket connection to: ${cloudSqlConnectionName}`);
    
    return {
      user: cloudSqlUser,
      password: cloudSqlPassword,
      database: cloudSqlDatabase,
      host: `/cloudsql/${cloudSqlConnectionName}`,
      ssl: false, // SSL is not used with Unix socket
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
    };
  }
}

// Create a new connection pool with our config
const pool = new Pool(getDatabaseConfig());

// Function to remove constraints
async function removeConstraints() {
  const client = await pool.connect();
  
  try {
    console.log('Starting constraint removal process...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Step 1: First let's check for skill_id NOT NULL constraint in skill_histories
    console.log('Checking skill_histories.skill_id constraint...');
    const skillHistoryNullabilityResult = await client.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'skill_histories' AND column_name = 'skill_id';
    `);
    
    if (skillHistoryNullabilityResult.rows.length > 0 && 
        skillHistoryNullabilityResult.rows[0].is_nullable === 'NO') {
      console.log('Found NOT NULL constraint on skill_histories.skill_id. Removing it...');
      await client.query('ALTER TABLE skill_histories ALTER COLUMN skill_id DROP NOT NULL;');
      console.log('Successfully removed NOT NULL constraint from skill_histories.skill_id');
    } else {
      console.log('No NOT NULL constraint found on skill_histories.skill_id or field already nullable');
    }
    
    // Step 2: Check for FK constraints from skill_histories to skills
    console.log('Checking for foreign key constraints from skill_histories to skills...');
    const skillHistoryFkResult = await client.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'skill_histories'::regclass 
      AND contype = 'f' 
      AND confrelid = 'skills'::regclass;
    `);
    
    if (skillHistoryFkResult.rows.length > 0) {
      for (const row of skillHistoryFkResult.rows) {
        console.log(`Dropping foreign key constraint ${row.conname} from skill_histories...`);
        await client.query(`ALTER TABLE skill_histories DROP CONSTRAINT IF EXISTS ${row.conname};`);
      }
      console.log(`Dropped ${skillHistoryFkResult.rows.length} foreign key constraints from skill_histories`);
    } else {
      console.log('No foreign key constraints found from skill_histories to skills');
    }
    
    // Step 3: Check endorsements.skill_id NOT NULL constraint
    console.log('Checking endorsements.skill_id constraint...');
    const endorsementNullabilityResult = await client.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'endorsements' AND column_name = 'skill_id';
    `);
    
    if (endorsementNullabilityResult.rows.length > 0 && 
        endorsementNullabilityResult.rows[0].is_nullable === 'NO') {
      console.log('Found NOT NULL constraint on endorsements.skill_id. Removing it...');
      await client.query('ALTER TABLE endorsements ALTER COLUMN skill_id DROP NOT NULL;');
      console.log('Successfully removed NOT NULL constraint from endorsements.skill_id');
    } else {
      console.log('No NOT NULL constraint found on endorsements.skill_id or field already nullable');
    }
    
    // Step 4: Check for FK constraints from endorsements to skills
    console.log('Checking for foreign key constraints from endorsements to skills...');
    const endorsementFkResult = await client.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'endorsements'::regclass 
      AND contype = 'f' 
      AND confrelid = 'skills'::regclass;
    `);
    
    if (endorsementFkResult.rows.length > 0) {
      for (const row of endorsementFkResult.rows) {
        console.log(`Dropping foreign key constraint ${row.conname} from endorsements...`);
        await client.query(`ALTER TABLE endorsements DROP CONSTRAINT IF EXISTS ${row.conname};`);
      }
      console.log(`Dropped ${endorsementFkResult.rows.length} foreign key constraints from endorsements`);
    } else {
      console.log('No foreign key constraints found from endorsements to skills');
    }
    
    // Step 5: Check pending_skill_updates.skill_id NOT NULL constraint
    console.log('Checking pending_skill_updates.skill_id constraint...');
    const pendingSkillNullabilityResult = await client.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'pending_skill_updates' AND column_name = 'skill_id';
    `);
    
    if (pendingSkillNullabilityResult.rows.length > 0 && 
        pendingSkillNullabilityResult.rows[0].is_nullable === 'NO') {
      console.log('Found NOT NULL constraint on pending_skill_updates.skill_id. Removing it...');
      await client.query('ALTER TABLE pending_skill_updates ALTER COLUMN skill_id DROP NOT NULL;');
      console.log('Successfully removed NOT NULL constraint from pending_skill_updates.skill_id');
    } else {
      console.log('No NOT NULL constraint found on pending_skill_updates.skill_id or field already nullable');
    }
    
    // Step 6: Check for FK constraints from pending_skill_updates to skills
    console.log('Checking for foreign key constraints from pending_skill_updates to skills...');
    const pendingSkillFkResult = await client.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'pending_skill_updates'::regclass 
      AND contype = 'f' 
      AND confrelid = 'skills'::regclass;
    `);
    
    if (pendingSkillFkResult.rows.length > 0) {
      for (const row of pendingSkillFkResult.rows) {
        console.log(`Dropping foreign key constraint ${row.conname} from pending_skill_updates...`);
        await client.query(`ALTER TABLE pending_skill_updates DROP CONSTRAINT IF EXISTS ${row.conname};`);
      }
      console.log(`Dropped ${pendingSkillFkResult.rows.length} foreign key constraints from pending_skill_updates`);
    } else {
      console.log('No foreign key constraints found from pending_skill_updates to skills');
    }
    
    // Commit all changes
    await client.query('COMMIT');
    console.log('Successfully committed all constraint changes');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing constraints, rolling back changes:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the function and exit
(async () => {
  try {
    await removeConstraints();
    console.log('Successfully removed all constraints from skill_id references');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Failed to remove constraints:', error);
    await pool.end();
    process.exit(1);
  }
})();