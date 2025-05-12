// This script fixes the PostgreSQL template to have category_id and subcategory_id
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

// Load environment variables
dotenv.config();

// Create connection using Cloud SQL configuration
const pool = new Pool({
  host: process.env.CLOUD_SQL_HOST,
  port: process.env.CLOUD_SQL_PORT,
  user: process.env.CLOUD_SQL_USER,
  password: process.env.CLOUD_SQL_PASSWORD,
  database: process.env.CLOUD_SQL_DATABASE
});

async function fixPostgreSQLTemplate() {
  console.log('Fixing PostgreSQL template...');
  
  try {
    // Step 1: Get Database category ID
    console.log('Looking up Database category ID...');
    const categoryResult = await pool.query(`
      SELECT id FROM skill_categories 
      WHERE name = 'Database'
    `);
    
    if (categoryResult.rows.length === 0) {
      throw new Error('Database category not found');
    }
    
    const categoryId = categoryResult.rows[0].id;
    console.log(`Found Database category ID: ${categoryId}`);
    
    // Step 2: Find or create a Relational Database subcategory
    console.log('Looking for Relational Databases subcategory...');
    let subcategoryResult = await pool.query(`
      SELECT id FROM skill_subcategories 
      WHERE name = 'Relational Databases' AND category_id = $1
    `, [categoryId]);
    
    let subcategoryId;
    
    if (subcategoryResult.rows.length === 0) {
      console.log('Relational Databases subcategory not found, creating it...');
      const newSubcategoryResult = await pool.query(`
        INSERT INTO skill_subcategories (name, display_name, category_id, color, icon)
        VALUES ('Relational Databases', 'Relational Databases', $1, '#3B82F6', 'database')
        RETURNING id
      `, [categoryId]);
      
      subcategoryId = newSubcategoryResult.rows[0].id;
      console.log(`Created Relational Databases subcategory with ID: ${subcategoryId}`);
    } else {
      subcategoryId = subcategoryResult.rows[0].id;
      console.log(`Found Relational Databases subcategory with ID: ${subcategoryId}`);
    }
    
    // Step 3: Update the PostgreSQL template
    console.log('Updating PostgreSQL template...');
    const updateResult = await pool.query(`
      UPDATE skill_templates
      SET category_id = $1, 
          subcategory_id = $2,
          description = 'Relational database management system',
          is_recommended = true
      WHERE name = 'PostgreSQL'
      RETURNING *
    `, [categoryId, subcategoryId]);
    
    if (updateResult.rows.length === 0) {
      throw new Error('Failed to update PostgreSQL template');
    }
    
    const updatedTemplate = updateResult.rows[0];
    console.log('PostgreSQL template updated successfully:');
    console.log(updatedTemplate);
    
    // Step 4: Verify all templates have category_id and subcategory_id
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN category_id IS NOT NULL THEN 1 END) as with_category_id,
        COUNT(CASE WHEN subcategory_id IS NOT NULL THEN 1 END) as with_subcategory_id,
        COUNT(CASE WHEN category_id IS NOT NULL AND subcategory_id IS NOT NULL THEN 1 END) as with_both
      FROM skill_templates
    `);
    
    const stats = statsResult.rows[0];
    console.log('\nUpdated statistics:');
    console.log(`- Total templates: ${stats.total}`);
    console.log(`- Templates with category_id: ${stats.with_category_id} (${Math.round(stats.with_category_id/stats.total*100)}%)`);
    console.log(`- Templates with subcategory_id: ${stats.with_subcategory_id} (${Math.round(stats.with_subcategory_id/stats.total*100)}%)`);
    console.log(`- Templates with both: ${stats.with_both} (${Math.round(stats.with_both/stats.total*100)}%)`);
    
    console.log('\nFix completed successfully!');
  } catch (error) {
    console.error('Fix failed:', error);
  } finally {
    await pool.end();
  }
}

fixPostgreSQLTemplate();