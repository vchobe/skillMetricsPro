/**
 * Endorsements Migration Script
 * 
 * This script handles migrating endorsement records from the old skills table
 * to the new user_skills table.
 * 
 * Prerequisites:
 * - The skills to user_skills migration should have completed successfully
 * - The skill_migration_map table should be populated with mappings
 */

require('dotenv').config();
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false
});

async function migrateEndorsements() {
  console.log("Starting endorsements migration...");
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Get all endorsements that need to be updated
    const { rows: endorsements } = await client.query(`
      SELECT e.*, m.new_user_skill_id 
      FROM endorsements e
      JOIN skill_migration_map m ON e.skill_id = m.old_skill_id
      ORDER BY e.id
      LIMIT 100
    `);
    
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
      console.log(`Processing endorsement #${endorsement.id} for skill ${endorsement.skill_id} -> ${endorsement.new_user_skill_id}`);
      
      // Insert new record with updated skill_id
      const { rows } = await client.query(`
        INSERT INTO endorsements (
          user_id, skill_id, endorser_id, comment, created_at
        ) VALUES (
          $1, $2, $3, $4, $5
        ) RETURNING id
      `, [
        endorsement.user_id,
        endorsement.new_user_skill_id, // Use the new user_skill_id
        endorsement.endorser_id,
        endorsement.comment,
        endorsement.created_at
      ]);
      
      const newEndorsementId = rows[0].id;
      
      // Track the migration
      await client.query(`
        INSERT INTO endorsement_migration (old_id, new_id)
        VALUES ($1, $2)
      `, [endorsement.id, newEndorsementId]);
      
      console.log(`Created new endorsement #${newEndorsementId} for migrated skill ${endorsement.new_user_skill_id}`);
    }
    
    // 4. Count migrated records
    const { rows: migrationCount } = await client.query(`
      SELECT COUNT(*) FROM endorsement_migration
    `);
    
    console.log(`Successfully migrated ${migrationCount[0].count} endorsement records`);
    
    // 5. Optionally: Delete old endorsement records (commented out for safety)
    // await client.query(`
    //   DELETE FROM endorsements
    //   WHERE id IN (SELECT old_id FROM endorsement_migration)
    // `);
    // console.log(`Deleted ${migrationCount[0].count} old endorsement records`);
    
    // Clean up temporary table
    await client.query('DROP TABLE endorsement_migration');
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Endorsements migration completed successfully!');
    
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
    console.log('Endorsements migration process completed.');
    pool.end();
  })
  .catch(err => {
    console.error('Endorsements migration failed:', err);
    pool.end();
    process.exit(1);
  });