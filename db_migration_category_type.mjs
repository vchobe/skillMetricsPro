/**
 * Database migration to add category_type column to skill_categories table
 * 
 * This script:
 * 1. Creates a category_type enum if it doesn't exist
 * 2. Adds the category_type column to skill_categories table
 * 3. Sets default values for existing categories
 */
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrateCategoryType() {
  console.log('Starting category_type migration...');
  
  // Create database connection with SSL settings
  const pool = new Pool({
    ssl: process.env.NODE_ENV === 'production' ? 
      { rejectUnauthorized: false } : 
      undefined
  });
  
  try {
    // First check if the column already exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'skill_categories' AND column_name = 'category_type'
    `;
    
    const checkResult = await pool.query(checkQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('Column category_type already exists, skipping creation.');
    } else {
      console.log('Column category_type does not exist, creating it now...');
      
      // Begin transaction
      await pool.query('BEGIN');
      
      try {
        // First check if the enum type exists
        const enumCheckQuery = `
          SELECT typname FROM pg_type WHERE typname = 'category_type'
        `;
        
        const enumResult = await pool.query(enumCheckQuery);
        
        if (enumResult.rows.length === 0) {
          console.log('Creating category_type enum type...');
          await pool.query(`
            CREATE TYPE category_type AS ENUM ('technical', 'functional')
          `);
        } else {
          console.log('Enum category_type already exists.');
        }
        
        // Add the column
        console.log('Adding category_type column to skill_categories table...');
        await pool.query(`
          ALTER TABLE skill_categories
          ADD COLUMN category_type category_type NOT NULL DEFAULT 'technical'
        `);
        
        // Commit the transaction
        await pool.query('COMMIT');
        console.log('Column added successfully!');
      } catch (error) {
        // Rollback on error
        await pool.query('ROLLBACK');
        console.error('Error during transaction, rolling back:', error);
        throw error;
      }
    }
    
    // Now update existing categories with appropriate types
    // List known technical categories
    const technicalCategories = [
      'Programming', 'Database', 'Cloud', 'DevOps', 'Security', 
      'Data Science', 'AI', 'UI', 'Testing'
    ];
    
    // List known functional categories
    const functionalCategories = [
      'Design', 'Project Management', 'Leadership', 'Communication',
      'Marketing', 'Messaging & Streaming', 'Metrics and visualization',
      'Log aggregation and search', 'BigData'
    ];
    
    // Set technical categories
    console.log('Setting technical categories...');
    const techResult = await pool.query(`
      UPDATE skill_categories 
      SET category_type = 'technical' 
      WHERE name = ANY($1)
      RETURNING id, name
    `, [technicalCategories]);
    
    console.log(`Updated ${techResult.rowCount} technical categories`);
    
    // Set functional categories
    console.log('Setting functional categories...');
    const funcResult = await pool.query(`
      UPDATE skill_categories 
      SET category_type = 'functional' 
      WHERE name = ANY($1)
      RETURNING id, name
    `, [functionalCategories]);
    
    console.log(`Updated ${funcResult.rowCount} functional categories`);
    
    // Get all categories to verify
    const allCategories = await pool.query(`
      SELECT id, name, category_type FROM skill_categories ORDER BY name
    `);
    
    console.log('\nCategory type assignments:');
    allCategories.rows.forEach(category => {
      console.log(`- ${category.name}: ${category.category_type}`);
    });
    
    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await pool.end();
  }
}

migrateCategoryType()
  .then(() => console.log('Migration script execution complete'))
  .catch(err => {
    console.error('Fatal error in migration script:', err);
    process.exit(1);
  });