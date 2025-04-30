/**
 * Skill History Migration Script
 * 
 * This script handles migrating skill history records from the old skills table
 * to the new user_skills table. Due to foreign key constraints, we need to
 * create new history records rather than updating existing ones.
 * 
 * Prerequisites:
 * - The skills to user_skills migration should have completed successfully
 * - The skill_migration_map table should be populated with mappings
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
  console.log("Starting skill history migration...");
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Get all skill histories that need to be updated
    const { rows: skillHistories } = await client.query(`
      SELECT h.*, m.new_user_skill_id 
      FROM skill_histories h
      JOIN skill_migration_map m ON h.skill_id = m.old_skill_id
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
      console.log(`Processing skill history #${history.id} for skill ${history.skill_id} -> ${history.new_user_skill_id}`);
      
      // Insert new record with updated skill_id (using actual schema)
      const { rows } = await client.query(`
        INSERT INTO skill_histories (
          user_id, skill_id, previous_level, new_level, change_note, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        ) RETURNING id
      `, [
        history.user_id,
        history.new_user_skill_id, // Use the new user_skill_id
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
      
      console.log(`Created new skill history #${newHistoryId} for migrated skill ${history.new_user_skill_id}`);
    }
    
    // 4. Count migrated records
    const { rows: migrationCount } = await client.query(`
      SELECT COUNT(*) FROM skill_history_migration
    `);
    
    console.log(`Successfully migrated ${migrationCount[0].count} skill history records`);
    
    // 5. Optionally: Delete old history records (commented out for safety)
    // await client.query(`
    //   DELETE FROM skill_histories
    //   WHERE id IN (SELECT old_id FROM skill_history_migration)
    // `);
    // console.log(`Deleted ${migrationCount[0].count} old skill history records`);
    
    // Clean up temporary table
    await client.query('DROP TABLE skill_history_migration');
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Skill history migration completed successfully!');
    
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
    console.log('Skill history migration process completed.');
    pool.end();
  })
  .catch(err => {
    console.error('Skill history migration failed:', err);
    pool.end();
    process.exit(1);
  });