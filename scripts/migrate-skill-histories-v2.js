/**
 * Skill History Migration V2 Script
 * 
 * This script migrates data from the original skill_histories table to the new
 * skill_histories_v2 table, which references user_skills instead of skills.
 * 
 * Prerequisites:
 * - The skills to user_skills migration should have completed successfully
 * - The skill_migration_map table should be populated with mappings
 * - The skill_histories_v2 table should be created
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

async function migrateSkillHistories() {
  console.log("Starting skill history migration to v2 table...");
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if the skill_histories_v2 table exists
    const { rows: tableCheck } = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'skill_histories_v2'
      ) as exists
    `);
    
    if (!tableCheck[0].exists) {
      throw new Error("skill_histories_v2 table does not exist. Run create-history-table-v2.js first.");
    }
    
    // 1. Get all skill histories that have a mapping in skill_migration_map
    const { rows: skillHistories } = await client.query(`
      SELECT h.*, m.new_user_skill_id 
      FROM skill_histories h
      JOIN skill_migration_map m ON h.skill_id = m.old_skill_id
      WHERE NOT EXISTS (
        SELECT 1 FROM skill_histories_v2 v2
        WHERE v2.user_skill_id = m.new_user_skill_id
        AND v2.created_at = h.created_at
      )
      ORDER BY h.id
      LIMIT 100
    `);
    
    console.log(`Found ${skillHistories.length} skill history records to migrate`);
    
    if (skillHistories.length === 0) {
      console.log("No skill histories need migration. Migration complete.");
      await client.query('COMMIT');
      return;
    }
    
    // 2. Create temporary table for migration
    await client.query(`
      CREATE TEMP TABLE skill_history_migration (
        old_id INTEGER,
        new_id INTEGER
      )
    `);
    
    // 3. Create new history records with updated skill_id references
    for (const history of skillHistories) {
      console.log(`Processing skill history #${history.id} for skill ${history.skill_id} -> user_skill ${history.new_user_skill_id}`);
      
      // Insert new record with updated skill_id (using actual schema)
      const { rows } = await client.query(`
        INSERT INTO skill_histories_v2 (
          user_skill_id, user_id, previous_level, new_level, change_note, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        ) RETURNING id
      `, [
        history.new_user_skill_id, // Use the new user_skill_id
        history.user_id,
        history.previous_level,
        history.new_level,
        'Migrated from skill #' + history.skill_id + (history.change_note ? ': ' + history.change_note : ''),
        history.created_at || new Date()
      ]);
      
      const newHistoryId = rows[0].id;
      
      // Track the migration
      await client.query(`
        INSERT INTO skill_history_migration (old_id, new_id)
        VALUES ($1, $2)
      `, [history.id, newHistoryId]);
      
      console.log(`Created new skill history #${newHistoryId} for migrated user_skill ${history.new_user_skill_id}`);
    }
    
    // 4. Count migrated records
    const { rows: migrationCount } = await client.query(`
      SELECT COUNT(*) FROM skill_history_migration
    `);
    
    console.log(`Successfully migrated ${migrationCount[0].count} skill history records`);
    
    // Clean up temporary table
    await client.query('DROP TABLE skill_history_migration');
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Skill history migration to v2 table completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during skill history migration:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
migrateSkillHistories()
  .then(() => {
    console.log('Skill history migration to v2 table process completed.');
    pool.end();
  })
  .catch(err => {
    console.error('Skill history migration to v2 table failed:', err);
    pool.end();
    process.exit(1);
  });