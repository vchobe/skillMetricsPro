/**
 * Verify Migration Progress Script
 * 
 * This script checks the progress of the skills migration by:
 * 1. Counting total skills in the original skills table
 * 2. Counting migrated skills in the user_skills table
 * 3. Checking skill_templates and skill_migration_map tables
 * 4. Calculating remaining skills to migrate
 * 5. Verifying history and endorsement migrations
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

async function verifyMigrationProgress() {
  console.log("Verifying migration progress...");
  
  const client = await pool.connect();
  try {
    // Count original skills
    const { rows: skillsCount } = await client.query(`
      SELECT COUNT(*) as count FROM skills
    `);
    
    // Count migrated skills (via mapping)
    const { rows: mappedCount } = await client.query(`
      SELECT COUNT(*) as count FROM skill_migration_map
    `);
    
    // Count user_skills
    const { rows: userSkillsCount } = await client.query(`
      SELECT COUNT(*) as count FROM user_skills
    `);
    
    // Count skill_templates
    const { rows: templatesCount } = await client.query(`
      SELECT COUNT(*) as count FROM skill_templates
    `);
    
    // Count remaining skills to migrate
    const { rows: remainingSkills } = await client.query(`
      SELECT COUNT(*) as count FROM skills s
      WHERE NOT EXISTS (
        SELECT 1 FROM skill_migration_map m
        WHERE m.old_skill_id = s.id
      )
    `);
    
    // History migration progress
    const { rows: originalHistoryCount } = await client.query(`
      SELECT COUNT(*) as count FROM skill_histories
    `);
    
    // Check if skill_histories_v2 exists
    const { rows: historyV2Exists } = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'skill_histories_v2'
      ) as exists
    `);
    
    let migratedHistoryCount = { rows: [{ count: 0 }] };
    if (historyV2Exists[0].exists) {
      migratedHistoryCount = await client.query(`
        SELECT COUNT(*) as count FROM skill_histories_v2
      `);
    }
    
    // Endorsements migration progress
    const { rows: originalEndorsementCount } = await client.query(`
      SELECT COUNT(*) as count FROM endorsements
    `);
    
    // Check if endorsements_v2 exists
    const { rows: endorsementsV2Exists } = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'endorsements_v2'
      ) as exists
    `);
    
    let migratedEndorsementCount = { rows: [{ count: 0 }] };
    if (endorsementsV2Exists[0].exists) {
      migratedEndorsementCount = await client.query(`
        SELECT COUNT(*) as count FROM endorsements_v2
      `);
    }
    
    // Print summary
    console.log("=== MIGRATION PROGRESS SUMMARY ===");
    console.log(`Original skills: ${skillsCount[0].count}`);
    console.log(`Migrated skills: ${mappedCount[0].count}`);
    console.log(`User skills: ${userSkillsCount[0].count}`);
    console.log(`Skill templates: ${templatesCount[0].count}`);
    console.log(`Remaining skills to migrate: ${remainingSkills[0].count}`);
    console.log(`Migration completion: ${Math.round((mappedCount[0].count / skillsCount[0].count) * 100)}%`);
    console.log("\n=== RELATED DATA MIGRATION ===");
    console.log(`Original skill histories: ${originalHistoryCount[0].count}`);
    console.log(`Migrated skill histories: ${migratedHistoryCount.rows[0].count}`);
    console.log(`Original endorsements: ${originalEndorsementCount[0].count}`);
    console.log(`Migrated endorsements: ${migratedEndorsementCount.rows[0].count}`);
    
    console.log("\n=== NEXT STEPS ===");
    if (remainingSkills[0].count > 0) {
      console.log(`Continue running the migrate-to-user-skills.js script to migrate the remaining ${remainingSkills[0].count} skills.`);
    } else {
      console.log("All skills have been migrated successfully!");
    }
    
    if (originalHistoryCount[0].count > migratedHistoryCount.rows[0].count) {
      console.log(`Continue running the migrate-skill-histories-v2.js script to migrate the remaining ${originalHistoryCount[0].count - migratedHistoryCount.rows[0].count} skill histories.`);
    } else {
      console.log("All skill histories have been migrated successfully!");
    }
    
    if (originalEndorsementCount[0].count > migratedEndorsementCount.rows[0].count) {
      console.log(`Continue running the migrate-endorsements-v2.js script to migrate the remaining ${originalEndorsementCount[0].count - migratedEndorsementCount.rows[0].count} endorsements.`);
    } else {
      console.log("All endorsements have been migrated successfully!");
    }
    
  } catch (error) {
    console.error('Error verifying migration progress:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run the verification
verifyMigrationProgress()
  .then(() => {
    console.log('Verification completed.');
    pool.end();
  })
  .catch(err => {
    console.error('Verification failed:', err);
    pool.end();
    process.exit(1);
  });