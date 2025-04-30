/**
 * Targeted Migration Script for Remaining Unmigrated Skills
 * 
 * This script identifies all unmigrated skills and processes them directly.
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

// Connect to database using environment variables
console.log('Database connection settings:');
console.log(`- Host: ${process.env.CLOUD_SQL_HOST || 'localhost'}`);
console.log(`- Port: ${process.env.CLOUD_SQL_PORT || '5432'}`);
console.log(`- Database: ${process.env.CLOUD_SQL_DATABASE}`);
console.log(`- User: ${process.env.CLOUD_SQL_USER}`);
console.log(`- SSL: ${process.env.CLOUD_SQL_USE_SSL === 'true'}`);

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

async function migrateRemainingSkills() {
  const client = await pool.connect();
  
  try {
    // Start a transaction for data migration
    await client.query('BEGIN');
    
    console.log('Analyzing remaining unmigrated skills...');
    
    // Get total skills count for reference
    const { rows: totalSkills } = await client.query(`
      SELECT COUNT(*) FROM skills
    `);
    console.log(`Total skills in database: ${totalSkills[0].count}`);
    
    // Get already migrated skills count
    const { rows: migratedSkills } = await client.query(`
      SELECT COUNT(*) FROM skill_migration_map
    `);
    console.log(`Already migrated skills: ${migratedSkills[0].count}`);
    
    // Get a list of all skill IDs that haven't been migrated yet
    const { rows: unmigrated } = await client.query(`
      SELECT s.id
      FROM skills s
      LEFT JOIN skill_migration_map m ON s.id = m.old_skill_id
      WHERE m.new_user_skill_id IS NULL
      ORDER BY s.id
    `);
    
    console.log(`Found ${unmigrated.length} unmigrated skills`);
    
    if (unmigrated.length === 0) {
      console.log('All skills have been migrated successfully!');
      await client.query('COMMIT');
      return;
    }
    
    // Log the IDs of unmigrated skills for reference
    console.log('Unmigrated skill IDs:', unmigrated.map(s => s.id).join(', '));
    
    // Define the batch size
    const BATCH_SIZE = 5;
    
    // Process each unmigrated skill
    for (let i = 0; i < unmigrated.length; i++) {
      const skillId = unmigrated[i].id;
      
      // Log batch progress
      if (i % BATCH_SIZE === 0) {
        console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(unmigrated.length/BATCH_SIZE)} (skills ${i+1}-${Math.min(i+BATCH_SIZE, unmigrated.length)} of ${unmigrated.length})`);
      }
      
      // Get skill details
      const { rows: skillDetails } = await client.query(`
        SELECT * FROM skills WHERE id = $1
      `, [skillId]);
      
      if (skillDetails.length === 0) {
        console.log(`Warning: Skill ID ${skillId} not found in the database. Skipping...`);
        continue;
      }
      
      const skill = skillDetails[0];
      console.log(`Processing skill #${skill.id}: "${skill.name}" (${skill.category}) for user ${skill.user_id}`);
      
      // First check if a template already exists for this skill
      const { rows: templates } = await client.query(`
        SELECT * FROM skill_templates 
        WHERE name = $1 AND category = $2
        ORDER BY id LIMIT 1
      `, [skill.name, skill.category]);
      
      let templateId;
      
      // If template doesn't exist, create one
      if (templates.length === 0) {
        console.log(`Creating new skill template for "${skill.name}" in category "${skill.category}"`);
        
        const { rows: newTemplate } = await client.query(`
          INSERT INTO skill_templates (
            name, category, category_id, subcategory_id, description, is_recommended
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [
          skill.name, 
          skill.category, 
          skill.category_id, 
          skill.subcategory_id, 
          '', // empty description for migrated templates
          false // not recommended by default
        ]);
        
        templateId = newTemplate[0].id;
      } else {
        templateId = templates[0].id;
        console.log(`Using existing skill template #${templateId} for "${skill.name}"`);
      }
      
      // Check if user_skill already exists
      const { rows: existingUserSkills } = await client.query(`
        SELECT * FROM user_skills
        WHERE user_id = $1 AND skill_template_id = $2
      `, [skill.user_id, templateId]);
      
      if (existingUserSkills.length > 0) {
        console.log(`User skill already exists for user ${skill.user_id} and template ${templateId}, creating mapping only...`);
        
        // Add entry to the mapping table even though the user skill already exists
        await client.query(`
          INSERT INTO skill_migration_map (old_skill_id, new_user_skill_id)
          VALUES ($1, $2)
        `, [skill.id, existingUserSkills[0].id]);
        
        console.log(`Added migration mapping: skill #${skill.id} -> user_skill #${existingUserSkills[0].id}`);
        continue;
      }
      
      // Create user_skill entry
      const { rows: newUserSkill } = await client.query(`
        INSERT INTO user_skills (
          user_id, skill_template_id, level, certification, credly_link,
          notes, endorsement_count, certification_date, expiration_date, last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        skill.user_id,
        templateId,
        skill.level,
        skill.certification,
        skill.credly_link,
        skill.notes,
        skill.endorsement_count || 0,
        skill.certification_date,
        skill.expiration_date,
        skill.last_updated || new Date()
      ]);
      
      const userSkillId = newUserSkill[0].id;
      console.log(`Created user_skill #${userSkillId} for user ${skill.user_id} using template ${templateId}`);
      
      // Add entry to the mapping between old and new IDs
      await client.query(`
        INSERT INTO skill_migration_map (old_skill_id, new_user_skill_id)
        VALUES ($1, $2)
      `, [skill.id, userSkillId]);
      
      console.log(`Added migration mapping: skill #${skill.id} -> user_skill #${userSkillId}`);
    }
    
    // Count how many mappings were created
    const { rows: mappingCount } = await client.query(`
      SELECT COUNT(*) FROM skill_migration_map
    `);
    
    console.log(`Total migration mappings: ${mappingCount[0].count} between skills and user_skills`);
    
    // Get any remaining unmigrated skills
    const { rows: remaining } = await client.query(`
      SELECT COUNT(*) FROM skills s
      LEFT JOIN skill_migration_map m ON s.id = m.old_skill_id
      WHERE m.new_user_skill_id IS NULL
    `);
    
    console.log(`Remaining unmigrated skills: ${remaining[0].count}`);
    
    // Verify table schema before committing
    console.log('Verifying tables before committing...');
    
    // Verify skill_templates content
    const { rows: templateCount } = await client.query(`
      SELECT COUNT(*) FROM skill_templates
    `);
    console.log(`skill_templates table has ${templateCount[0].count} rows`);
    
    try {
      // Verify user_skills content
      const { rows: userSkillsCount } = await client.query(`
        SELECT COUNT(*) FROM user_skills
      `);
      console.log(`user_skills table has ${userSkillsCount[0].count} rows`);
    } catch (e) {
      console.error('Could not query user_skills table:', e.message);
    }
    
    try {
      // Verify migration map content
      const { rows: mapCount } = await client.query(`
        SELECT COUNT(*) FROM skill_migration_map
      `);
      console.log(`skill_migration_map table has ${mapCount[0].count} rows`);
    } catch (e) {
      console.error('Could not query skill_migration_map table:', e.message);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Migration committed successfully!');
    
  } catch (error) {
    console.error('Error during migration, rolling back transaction');
    try {
      await client.query('ROLLBACK');
      console.error('Transaction rolled back successfully');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }
    console.error('Original error details:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
migrateRemainingSkills()
  .then(() => {
    console.log('Migration process completed.');
    pool.end();
  })
  .catch(err => {
    console.error('Migration failed:', err);
    pool.end();
    process.exit(1);
  });