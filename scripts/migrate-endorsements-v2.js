/**
 * Endorsements Migration V2 Script
 * 
 * This script migrates data from the original endorsements table to the new
 * endorsements_v2 table, which references user_skills instead of skills.
 * 
 * Prerequisites:
 * - The skills to user_skills migration should have completed successfully
 * - The skill_migration_map table should be populated with mappings
 * - The endorsements_v2 table should be created
 */

import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false
});

async function migrateEndorsements() {
  console.log("Starting endorsements migration to v2 table...");
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if the endorsements_v2 table exists
    const { rows: tableCheck } = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'endorsements_v2'
      ) as exists
    `);
    
    if (!tableCheck[0].exists) {
      throw new Error("endorsements_v2 table does not exist. Run create-endorsements-v2.js first.");
    }
    
    // Get endorsements column structure
    const { rows: columns } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'endorsements'
    `);
    
    const hasEndorseeIdColumn = columns.some(col => col.column_name === 'endorsee_id');
    
    // 1. Get all endorsements that have a mapping in skill_migration_map
    let query = '';
    if (hasEndorseeIdColumn) {
      query = `
        SELECT e.*, m.new_user_skill_id 
        FROM endorsements e
        JOIN skill_migration_map m ON e.skill_id = m.old_skill_id
        WHERE NOT EXISTS (
          SELECT 1 FROM endorsements_v2 v2
          WHERE v2.user_skill_id = m.new_user_skill_id
          AND v2.endorser_id = e.endorser_id
          AND v2.created_at = e.created_at
        )
        ORDER BY e.id
        LIMIT 100
      `;
    } else {
      query = `
        SELECT e.*, m.new_user_skill_id 
        FROM endorsements e
        JOIN skill_migration_map m ON e.skill_id = m.old_skill_id
        WHERE NOT EXISTS (
          SELECT 1 FROM endorsements_v2 v2
          WHERE v2.user_skill_id = m.new_user_skill_id
          AND v2.endorser_id = e.endorser_id
          AND v2.created_at = e.created_at
        )
        ORDER BY e.id
        LIMIT 100
      `;
    }
    
    const { rows: endorsements } = await client.query(query);
    
    console.log(`Found ${endorsements.length} endorsement records to migrate`);
    
    if (endorsements.length === 0) {
      console.log("No endorsements need migration. Migration complete.");
      await client.query('COMMIT');
      return;
    }
    
    // 2. Create temporary table for migration
    await client.query(`
      CREATE TEMP TABLE endorsement_migration (
        old_id INTEGER,
        new_id INTEGER
      )
    `);
    
    // 3. Create new endorsement records with updated skill_id references
    for (const endorsement of endorsements) {
      console.log(`Processing endorsement #${endorsement.id} for skill ${endorsement.skill_id} -> user_skill ${endorsement.new_user_skill_id}`);
      
      // For user_id, use either endorsee_id if it exists, or user_id if it doesn't
      const userId = hasEndorseeIdColumn ? 
        endorsement.endorsee_id : 
        endorsement.user_id;
      
      // Insert new record with updated skill_id
      const { rows } = await client.query(`
        INSERT INTO endorsements_v2 (
          user_skill_id, user_id, endorser_id, comment, created_at
        ) VALUES (
          $1, $2, $3, $4, $5
        ) RETURNING id
      `, [
        endorsement.new_user_skill_id, // Use the new user_skill_id
        userId,
        endorsement.endorser_id,
        endorsement.comment,
        endorsement.created_at || new Date()
      ]);
      
      const newEndorsementId = rows[0].id;
      
      // Track the migration
      await client.query(`
        INSERT INTO endorsement_migration (old_id, new_id)
        VALUES ($1, $2)
      `, [endorsement.id, newEndorsementId]);
      
      console.log(`Created new endorsement #${newEndorsementId} for migrated user_skill ${endorsement.new_user_skill_id}`);
    }
    
    // 4. Count migrated records
    const { rows: migrationCount } = await client.query(`
      SELECT COUNT(*) FROM endorsement_migration
    `);
    
    console.log(`Successfully migrated ${migrationCount[0].count} endorsement records`);
    
    // Clean up temporary table
    await client.query('DROP TABLE endorsement_migration');
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Endorsements migration to v2 table completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during endorsements migration:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
migrateEndorsements()
  .then(() => {
    console.log('Endorsements migration to v2 table process completed.');
    pool.end();
  })
  .catch(err => {
    console.error('Endorsements migration to v2 table failed:', err);
    pool.end();
    process.exit(1);
  });