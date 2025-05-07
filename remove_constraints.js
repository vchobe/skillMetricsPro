/**
 * Script to remove constraints from skill_histories table
 * This script removes constraints that are referencing the legacy skills table
 * to complete the transition to the V2 architecture using user_skills.
 */

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

// Create a new pool using the DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function removeConstraints() {
  const client = await pool.connect();
  
  try {
    console.log("Starting constraint removal process...");
    
    // Start a transaction
    await client.query('BEGIN');
    
    // 1. First find any foreign key constraints on skill_histories
    console.log("Checking for foreign key constraints on skill_histories table...");
    const fkQuery = `
      SELECT conname, conrelid::regclass, confrelid::regclass 
      FROM pg_constraint 
      WHERE conrelid = 'skill_histories'::regclass 
      AND contype = 'f' 
      AND confrelid = 'skills'::regclass;
    `;
    
    const fkResult = await client.query(fkQuery);
    
    if (fkResult.rows.length > 0) {
      console.log(`Found ${fkResult.rows.length} foreign key constraints to drop:`);
      for (const constraint of fkResult.rows) {
        console.log(`- Dropping foreign key constraint: ${constraint.conname}`);
        await client.query(`ALTER TABLE skill_histories DROP CONSTRAINT ${constraint.conname};`);
      }
    } else {
      console.log("No foreign key constraints found on skill_histories table.");
    }
    
    // 2. Drop NOT NULL constraint on skill_id
    console.log("Removing NOT NULL constraint from skill_histories.skill_id");
    await client.query('ALTER TABLE skill_histories ALTER COLUMN skill_id DROP NOT NULL;');
    
    // 3. Check for foreign key constraints on endorsements
    console.log("Checking for foreign key constraints on endorsements table...");
    const endorsementFkQuery = `
      SELECT conname, conrelid::regclass, confrelid::regclass 
      FROM pg_constraint 
      WHERE conrelid = 'endorsements'::regclass 
      AND contype = 'f' 
      AND confrelid = 'skills'::regclass;
    `;
    
    const endorsementFkResult = await client.query(endorsementFkQuery);
    
    if (endorsementFkResult.rows.length > 0) {
      console.log(`Found ${endorsementFkResult.rows.length} foreign key constraints to drop on endorsements:`);
      for (const constraint of endorsementFkResult.rows) {
        console.log(`- Dropping foreign key constraint: ${constraint.conname}`);
        await client.query(`ALTER TABLE endorsements DROP CONSTRAINT ${constraint.conname};`);
      }
    } else {
      console.log("No foreign key constraints found on endorsements table.");
    }
    
    // 4. Drop NOT NULL constraint on endorsements.skill_id if it exists
    console.log("Removing NOT NULL constraint from endorsements.skill_id");
    await client.query('ALTER TABLE endorsements ALTER COLUMN skill_id DROP NOT NULL;');
    
    // 5. Check for constraints on pending_skill_updates
    console.log("Checking for constraints on pending_skill_updates table...");
    const pendingFkQuery = `
      SELECT conname, conrelid::regclass, confrelid::regclass 
      FROM pg_constraint 
      WHERE conrelid = 'pending_skill_updates'::regclass 
      AND contype = 'f' 
      AND confrelid = 'skills'::regclass;
    `;
    
    const pendingFkResult = await client.query(pendingFkQuery);
    
    if (pendingFkResult.rows.length > 0) {
      console.log(`Found ${pendingFkResult.rows.length} foreign key constraints to drop on pending_skill_updates:`);
      for (const constraint of pendingFkResult.rows) {
        console.log(`- Dropping foreign key constraint: ${constraint.conname}`);
        await client.query(`ALTER TABLE pending_skill_updates DROP CONSTRAINT ${constraint.conname};`);
      }
    } else {
      console.log("No foreign key constraints found on pending_skill_updates table.");
    }
    
    // 6. Drop NOT NULL constraint on pending_skill_updates.skill_id if it exists
    console.log("Removing NOT NULL constraint from pending_skill_updates.skill_id if it exists");
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'pending_skill_updates' 
          AND column_name = 'skill_id' 
          AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE pending_skill_updates ALTER COLUMN skill_id DROP NOT NULL;
        END IF;
      END
      $$;
    `);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log("Successfully removed constraints from all relevant tables.");
    console.log("The system should now be able to operate fully on the V2 architecture.");
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error removing constraints:", error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

// Execute the function
removeConstraints()
  .then(() => console.log("Constraint removal completed successfully."))
  .catch(err => {
    console.error("Failed to remove constraints:", err);
    process.exit(1);
  });