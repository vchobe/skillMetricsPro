/**
 * User Skills Migration Script
 * 
 * This script handles migrating data from the legacy 'skills' table to the new 'user_skills' table
 * which references skill templates instead of storing skill definitions inline.
 * 
 * Process:
 * 1. Find or create skill templates for each unique skill in the skills table
 * 2. Create new user_skills entries that point to these templates
 * 3. Migrate any existing endorsements and skill histories to reference new user_skill ids
 * 
 * Run with: node scripts/migrate-to-user-skills.js
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Connect to database using environment variables
const pool = new Pool({
  user: process.env.CLOUD_SQL_USER,
  password: process.env.CLOUD_SQL_PASSWORD,
  database: process.env.CLOUD_SQL_DATABASE,
  host: process.env.CLOUD_SQL_HOST || 'localhost',
  port: parseInt(process.env.CLOUD_SQL_PORT || '5432', 10),
  ssl: process.env.CLOUD_SQL_USE_SSL === 'true'
});

async function migrateSkillsToUserSkills() {
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    console.log('Beginning migration from skills to user_skills...');
    
    // 1. Get all existing skills
    const { rows: skills } = await client.query(`
      SELECT * FROM skills ORDER BY user_id, category, name
    `);
    
    console.log(`Found ${skills.length} skills to migrate`);
    
    // 2. Process each skill to find or create corresponding skill template
    for (const skill of skills) {
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
        console.log(`User skill already exists for user ${skill.user_id} and template ${templateId}, skipping...`);
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
      
      // Update endorsements to reference the new user_skill instead of the old skill
      await client.query(`
        UPDATE endorsements
        SET skill_id = $1
        WHERE skill_id = $2
      `, [userSkillId, skill.id]);
      
      // Update skill histories to reference the new user_skill
      await client.query(`
        UPDATE skill_histories
        SET skill_id = $1
        WHERE skill_id = $2
      `, [userSkillId, skill.id]);
    }
    
    // Create a mapping table that records the relationship between old skill ids and new user_skill ids
    await client.query(`
      CREATE TABLE IF NOT EXISTS skill_migration_map (
        old_skill_id INTEGER NOT NULL,
        new_user_skill_id INTEGER NOT NULL,
        migrated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Populate the mapping table
    await client.query(`
      INSERT INTO skill_migration_map (old_skill_id, new_user_skill_id)
      SELECT s.id as old_skill_id, us.id as new_user_skill_id
      FROM skills s
      JOIN skill_templates st ON s.name = st.name AND s.category = st.category
      JOIN user_skills us ON s.user_id = us.user_id AND st.id = us.skill_template_id
    `);
    
    // Count how many mappings were created
    const { rows: mappingCount } = await client.query(`
      SELECT COUNT(*) FROM skill_migration_map
    `);
    
    console.log(`Created ${mappingCount[0].count} migration mappings between skills and user_skills`);
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
migrateSkillsToUserSkills()
  .then(() => {
    console.log('Migration process completed.');
    pool.end();
  })
  .catch(err => {
    console.error('Migration failed:', err);
    pool.end();
    process.exit(1);
  });