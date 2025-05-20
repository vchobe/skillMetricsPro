/**
 * Migration script to add category_type column to skill_categories table
 */
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function addCategoryTypeColumn() {
  console.log('Starting migration to add category_type column to skill_categories table');
  
  // Create a new database client with SSL enabled
  const pool = new Pool({
    ssl: {
      rejectUnauthorized: false
    }
  });
  
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

    // Create the categoryType enum type and column
    console.log('Creating category_type column...');
    
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_type') THEN
          CREATE TYPE category_type AS ENUM ('technical', 'functional');
        END IF;
      END$$;
    `);
    
    await pool.query(`
      ALTER TABLE skill_categories 
      ADD COLUMN category_type category_type NOT NULL DEFAULT 'technical'
    `);
    
    console.log('Column added successfully');
    
    // Update existing categories to the correct type
    const technicalCategories = [
      'Programming', 'Database', 'Cloud', 'DevOps', 'Security', 
      'Data Science', 'AI', 'UI', 'Testing'
    ];
    
    const functionalCategories = [
      'Design', 'Project Management', 'Leadership', 'Communication',
      'Marketing', 'Messaging & Streaming', 'Metrics and visualization',
      'Log aggregation and search', 'BigData'
    ];
    
    // Set technical categories
    if (technicalCategories.length > 0) {
      await pool.query(`
        UPDATE skill_categories
        SET category_type = 'technical'
        WHERE name = ANY($1)
      `, [technicalCategories]);
      console.log('Updated technical categories');
    }
    
    // Set functional categories
    if (functionalCategories.length > 0) {
      await pool.query(`
        UPDATE skill_categories
        SET category_type = 'functional'
        WHERE name = ANY($1)
      `, [functionalCategories]);
      console.log('Updated functional categories');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

addCategoryTypeColumn();