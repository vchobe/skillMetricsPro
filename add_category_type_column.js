/**
 * Migration script to add category_type column to skill_categories table
 */
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function addCategoryTypeColumn() {
  console.log('Starting migration to add category_type column to skill_categories table');
  
  // Create a new database client
  const pool = new Pool();
  
  try {
    // Check if the column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'skill_categories' AND column_name = 'category_type'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('The category_type column already exists. No action needed.');
      return;
    }
    
    // First create the enum type if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_type') THEN
          CREATE TYPE category_type AS ENUM ('technical', 'functional');
        END IF;
      END$$;
    `);
    
    console.log('Enum type created or already exists');
    
    // Add the category_type column with a default value
    await pool.query(`
      ALTER TABLE skill_categories
      ADD COLUMN category_type category_type DEFAULT 'technical' NOT NULL
    `);
    
    console.log('Added category_type column to skill_categories table');
    
    // Update existing categories with the appropriate type
    // For now, set "BigData" to technical (since it should be)
    await pool.query(`
      UPDATE skill_categories
      SET category_type = 'technical'
      WHERE name = 'BigData'
    `);
    
    // Set any other categories that should be technical
    const technicalCategories = [
      'Programming', 'Database', 'Cloud', 'DevOps', 'Security', 
      'Data Science', 'AI', 'UI', 'Testing'
    ];
    
    // Set the rest of technical categories
    await pool.query(`
      UPDATE skill_categories
      SET category_type = 'technical'
      WHERE name = ANY($1)
    `, [technicalCategories]);
    
    // Set functional categories
    const functionalCategories = [
      'Design', 'Project Management', 'Leadership', 'Communication',
      'Marketing', 'Messaging & Streaming', 'Metrics and visualization',
      'Log aggregation and search'
    ];
    
    await pool.query(`
      UPDATE skill_categories
      SET category_type = 'functional'
      WHERE name = ANY($1)
    `, [functionalCategories]);
    
    console.log('Updated existing categories with appropriate types');
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

addCategoryTypeColumn();