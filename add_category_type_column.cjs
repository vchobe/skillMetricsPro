/**
 * Script to add the category_type column to the skill_categories table
 */
const { Pool } = require('pg');
require('dotenv').config();

// Create a database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addCategoryTypeColumn() {
  console.log('Starting migration: Adding category_type column to skill_categories table');
  
  try {
    // Start a transaction
    await pool.query('BEGIN');
    
    try {
      // Check if the enum type exists
      const typeCheckResult = await pool.query(`
        SELECT 1 FROM pg_type WHERE typname = 'category_type'
      `);
      
      if (typeCheckResult.rows.length === 0) {
        console.log('Creating category_type enum...');
        await pool.query(`
          CREATE TYPE category_type AS ENUM ('technical', 'functional')
        `);
      } else {
        console.log('Enum type category_type already exists');
      }
      
      // Check if the column exists
      const columnCheckResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'skill_categories' AND column_name = 'category_type'
      `);
      
      if (columnCheckResult.rows.length === 0) {
        console.log('Adding category_type column to skill_categories table...');
        await pool.query(`
          ALTER TABLE skill_categories
          ADD COLUMN category_type category_type NOT NULL DEFAULT 'technical'
        `);
      } else {
        console.log('Column category_type already exists');
      }
      
      // Update technical categories
      const technicalCategories = [
        'Programming', 'Database', 'Cloud', 'DevOps', 'Security', 
        'Data Science', 'AI', 'UI', 'Testing'
      ];
      
      const techResult = await pool.query(`
        UPDATE skill_categories 
        SET category_type = 'technical' 
        WHERE name = ANY($1)
        RETURNING id, name
      `, [technicalCategories]);
      
      console.log(`Updated ${techResult.rowCount} technical categories`);
      
      // Update functional categories
      const functionalCategories = [
        'Design', 'Project Management', 'Leadership', 'Communication',
        'Marketing', 'Messaging & Streaming', 'Metrics and visualization',
        'Log aggregation and search', 'BigData'
      ];
      
      const funcResult = await pool.query(`
        UPDATE skill_categories 
        SET category_type = 'functional' 
        WHERE name = ANY($1)
        RETURNING id, name
      `, [functionalCategories]);
      
      console.log(`Updated ${funcResult.rowCount} functional categories`);
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      // Get all categories to verify
      const allCategories = await pool.query(`
        SELECT id, name, category_type FROM skill_categories ORDER BY name
      `);
      
      console.log('\nAll categories with their types:');
      allCategories.rows.forEach(cat => {
        console.log(`- ${cat.name}: ${cat.category_type}`);
      });
      
      console.log('\nMigration completed successfully!');
    } catch (error) {
      // Rollback on error
      await pool.query('ROLLBACK');
      console.error('Error during transaction, rolling back:', error);
      throw error;
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
addCategoryTypeColumn()
  .then(() => console.log('Migration script completed'))
  .catch(err => {
    console.error('Fatal error in migration script:', err);
    process.exit(1);
  });