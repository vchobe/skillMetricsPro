/**
 * Migration script to add category_type column to skill_categories table
 * This script adds proper type classification to skill categories
 */
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? 
    { rejectUnauthorized: false } : 
    undefined
};

async function addCategoryTypeColumn() {
  console.log('Starting migration: Adding category_type column to skill_categories table');
  
  // Create connection pool
  const pool = new pg.Pool(dbConfig);
  
  try {
    // Check if column already exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'skill_categories' AND column_name = 'category_type'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('Column category_type already exists. Skipping column creation.');
    } else {
      console.log('Creating category_type enum and column...');
      
      // Start a transaction
      await pool.query('BEGIN');
      
      try {
        // Create the enum type if it doesn't exist
        await pool.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_type') THEN
              CREATE TYPE category_type AS ENUM ('technical', 'functional');
            END IF;
          END$$;
        `);
        
        // Add the column with a default value
        await pool.query(`
          ALTER TABLE skill_categories
          ADD COLUMN category_type category_type NOT NULL DEFAULT 'technical'
        `);
        
        // Commit the transaction
        await pool.query('COMMIT');
        console.log('Successfully added category_type column to skill_categories table');
      } catch (error) {
        // Rollback on error
        await pool.query('ROLLBACK');
        console.error('Error during transaction, changes rolled back:', error);
        throw error;
      }
    }

    // Update existing records with correct category types
    console.log('Updating existing categories with appropriate types...');
    
    // List of categories that should be classified as 'technical'
    const technicalCategories = [
      'Programming', 'Database', 'Cloud', 'DevOps', 'Security', 
      'Data Science', 'AI', 'UI', 'Testing'
    ];
    
    // List of categories that should be classified as 'functional'
    const functionalCategories = [
      'Design', 'Project Management', 'Leadership', 'Communication',
      'Marketing', 'Messaging & Streaming', 'Metrics and visualization',
      'Log aggregation and search', 'BigData'
    ];
    
    // Update technical categories
    if (technicalCategories.length > 0) {
      const techResult = await pool.query(`
        UPDATE skill_categories
        SET category_type = 'technical'
        WHERE name = ANY($1)
        RETURNING id, name, category_type
      `, [technicalCategories]);
      
      console.log(`Updated ${techResult.rowCount} technical categories:`);
      techResult.rows.forEach(row => {
        console.log(`  - ${row.name}: ${row.category_type}`);
      });
    }
    
    // Update functional categories
    if (functionalCategories.length > 0) {
      const funcResult = await pool.query(`
        UPDATE skill_categories
        SET category_type = 'functional'
        WHERE name = ANY($1)
        RETURNING id, name, category_type
      `, [functionalCategories]);
      
      console.log(`Updated ${funcResult.rowCount} functional categories:`);
      funcResult.rows.forEach(row => {
        console.log(`  - ${row.name}: ${row.category_type}`);
      });
    }
    
    // Verify all categories have a type assigned
    const categoriesResult = await pool.query(`
      SELECT id, name, category_type 
      FROM skill_categories 
      ORDER BY name
    `);
    
    console.log('\nAll categories with their assigned types:');
    categoriesResult.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.category_type}`);
    });
    
    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
addCategoryTypeColumn()
  .then(() => {
    console.log('Migration script finished execution');
  })
  .catch(err => {
    console.error('Fatal error in migration script:', err);
    process.exit(1);
  });