/**
 * Script to fix database constraints for V2 migration
 * This removes constraints referencing the legacy skills table from skill_histories table
 */

import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

// Create a connection pool using the same connection string as the server
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres',
});

async function fixConstraints() {
  console.log('Starting to fix constraints for V2 migration...');
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // 1. First, drop the NOT NULL constraint on skill_histories.skill_id
    console.log('Removing NOT NULL constraint from skill_histories.skill_id...');
    try {
      await client.query('ALTER TABLE skill_histories ALTER COLUMN skill_id DROP NOT NULL;');
      console.log('Successfully removed NOT NULL constraint from skill_histories.skill_id');
    } catch (error) {
      console.error('Error removing NOT NULL constraint from skill_histories.skill_id:', error);
      // Continue with other operations
    }
    
    // 2. Check for foreign key constraints from skill_histories to skills table
    console.log('Checking for foreign key constraints from skill_histories to skills table...');
    const fkConstraintsQuery = `
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'skill_histories'::regclass 
      AND contype = 'f' 
      AND confrelid = 'skills'::regclass;
    `;
    
    const fkResult = await client.query(fkConstraintsQuery);
    
    // Drop any foreign key constraints from skill_histories to skills
    if (fkResult.rows.length > 0) {
      for (const row of fkResult.rows) {
        console.log(`Dropping foreign key constraint ${row.conname} from skill_histories table...`);
        await client.query(`ALTER TABLE skill_histories DROP CONSTRAINT IF EXISTS ${row.conname};`);
      }
      console.log(`Dropped ${fkResult.rows.length} foreign key constraints from skill_histories table`);
    } else {
      console.log('No foreign key constraints found from skill_histories to skills table');
    }
    
    // 3. Drop the NOT NULL constraint on endorsements.skill_id
    console.log('Removing NOT NULL constraint from endorsements.skill_id...');
    try {
      await client.query('ALTER TABLE endorsements ALTER COLUMN skill_id DROP NOT NULL;');
      console.log('Successfully removed NOT NULL constraint from endorsements.skill_id');
    } catch (error) {
      console.error('Error removing NOT NULL constraint from endorsements.skill_id:', error);
      // Continue with other operations
    }
    
    // 4. Check for foreign key constraints from endorsements to skills table
    console.log('Checking for foreign key constraints from endorsements to skills table...');
    const endorsementFkQuery = `
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'endorsements'::regclass 
      AND contype = 'f' 
      AND confrelid = 'skills'::regclass;
    `;
    
    const endorsementFkResult = await client.query(endorsementFkQuery);
    
    // Drop any foreign key constraints from endorsements to skills
    if (endorsementFkResult.rows.length > 0) {
      for (const row of endorsementFkResult.rows) {
        console.log(`Dropping foreign key constraint ${row.conname} from endorsements table...`);
        await client.query(`ALTER TABLE endorsements DROP CONSTRAINT IF EXISTS ${row.conname};`);
      }
      console.log(`Dropped ${endorsementFkResult.rows.length} foreign key constraints from endorsements table`);
    } else {
      console.log('No foreign key constraints found from endorsements to skills table');
    }
    
    // 5. Check for skill_id NOT NULL constraint on pending_skill_updates
    const pendingSkillNullConstraintQuery = `
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'pending_skill_updates' AND column_name = 'skill_id';
    `;
    
    const pendingSkillNullResult = await client.query(pendingSkillNullConstraintQuery);
    
    if (pendingSkillNullResult.rows.length > 0 && pendingSkillNullResult.rows[0].is_nullable === 'NO') {
      console.log('Removing NOT NULL constraint from pending_skill_updates.skill_id...');
      try {
        await client.query('ALTER TABLE pending_skill_updates ALTER COLUMN skill_id DROP NOT NULL;');
        console.log('Successfully removed NOT NULL constraint from pending_skill_updates.skill_id');
      } catch (error) {
        console.error('Error removing NOT NULL constraint from pending_skill_updates.skill_id:', error);
        // Continue with other operations
      }
    } else {
      console.log('No NOT NULL constraint found on pending_skill_updates.skill_id or column does not exist');
    }
    
    // 6. Check for foreign key constraints from pending_skill_updates to skills table
    console.log('Checking for foreign key constraints from pending_skill_updates to skills table...');
    const pendingFkQuery = `
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'pending_skill_updates'::regclass 
      AND contype = 'f' 
      AND confrelid = 'skills'::regclass;
    `;
    
    const pendingFkResult = await client.query(pendingFkQuery);
    
    // Drop any foreign key constraints from pending_skill_updates to skills
    if (pendingFkResult.rows.length > 0) {
      for (const row of pendingFkResult.rows) {
        console.log(`Dropping foreign key constraint ${row.conname} from pending_skill_updates table...`);
        await client.query(`ALTER TABLE pending_skill_updates DROP CONSTRAINT IF EXISTS ${row.conname};`);
      }
      console.log(`Dropped ${pendingFkResult.rows.length} foreign key constraints from pending_skill_updates table`);
    } else {
      console.log('No foreign key constraints found from pending_skill_updates to skills table');
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
    await pool.end();
  }
  
  console.log('Constraint fixing complete!');
}

// Run the function
fixConstraints()
  .then(() => {
    console.log('Successfully updated database constraints for V2 migration');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to update database constraints:', error);
    process.exit(1);
  });