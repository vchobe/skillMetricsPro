/**
 * Script to verify migration success
 */

import pg from 'pg';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect using DATABASE_URL directly from environment
let connectionConfig;
if (process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL for connection');
  connectionConfig = { connectionString: process.env.DATABASE_URL };
} else {
  console.log('Using individual connection parameters');
  connectionConfig = {
    user: process.env.CLOUD_SQL_USER,
    password: process.env.CLOUD_SQL_PASSWORD,
    database: process.env.CLOUD_SQL_DATABASE,
    host: process.env.CLOUD_SQL_HOST || 'localhost',
    port: parseInt(process.env.CLOUD_SQL_PORT || '5432', 10),
    ssl: process.env.CLOUD_SQL_USE_SSL === 'true'
  };
}

const pool = new Pool(connectionConfig);

async function verifyMigration() {
  const client = await pool.connect();
  try {
    console.log('======= SKILL MIGRATION VERIFICATION =======');
    
    // Get total skills
    const { rows: totalSkills } = await client.query('SELECT COUNT(*) FROM skills');
    console.log(`Total skills in original table: ${totalSkills[0].count}`);
    
    // Get total user_skills
    const { rows: totalUserSkills } = await client.query('SELECT COUNT(*) FROM user_skills');
    console.log(`Total user_skills in new table: ${totalUserSkills[0].count}`);
    
    // Get total skill templates
    const { rows: totalTemplates } = await client.query('SELECT COUNT(*) FROM skill_templates');
    console.log(`Total skill templates created: ${totalTemplates[0].count}`);
    
    // Get total migration mappings
    const { rows: totalMappings } = await client.query('SELECT COUNT(*) FROM skill_migration_map');
    console.log(`Total migration mappings: ${totalMappings[0].count}`);
    
    // Verify unmigrated skills
    const { rows: unmigrated } = await client.query(`
      SELECT COUNT(*) FROM skills s
      LEFT JOIN skill_migration_map m ON s.id = m.old_skill_id
      WHERE m.new_user_skill_id IS NULL
    `);
    console.log(`Unmigrated skills: ${unmigrated[0].count}`);
    
    // Get top skill templates by usage
    const { rows: topTemplates } = await client.query(`
      SELECT t.name, t.category, COUNT(u.*) as usage_count
      FROM skill_templates t
      JOIN user_skills u ON t.id = u.skill_template_id
      GROUP BY t.id, t.name, t.category
      ORDER BY usage_count DESC
      LIMIT 10
    `);
    console.log('\nTop 10 skill templates by usage:');
    topTemplates.forEach((t, i) => {
      console.log(`${i+1}. ${t.name} (${t.category}): ${t.usage_count} skills`);
    });
    
    const migrationComplete = parseInt(unmigrated[0].count, 10) === 0;
    console.log('\nMigration status: ' + (migrationComplete ? 'COMPLETE ✅' : 'INCOMPLETE ⚠️'));
    
    // Get skill history migration status
    try {
      const { rows: historyCount } = await client.query(`
        SELECT COUNT(*) FROM skill_histories
      `);
      
      console.log(`\nSkill histories to migrate: ${historyCount[0].count}`);
      
      const { rows: historiesV2Count } = await client.query(`
        SELECT COUNT(*) FROM skill_histories_v2
      `).catch(() => ({ rows: [{ count: '0' }] }));
      
      console.log(`Skill histories migrated: ${historiesV2Count[0].count}`);
    } catch (err) {
      console.warn('Could not check skill history migration status:', err.message);
    }
  } finally {
    client.release();
    pool.end();
  }
}

verifyMigration().catch(e => console.error(e));