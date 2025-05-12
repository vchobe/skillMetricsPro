// This script directly queries the database to verify our fixes
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

// Load environment variables
dotenv.config();

// Create connection using the Cloud SQL configuration since we're having issues with DATABASE_URL
const pool = new Pool({
  host: process.env.CLOUD_SQL_HOST,
  port: process.env.CLOUD_SQL_PORT,
  user: process.env.CLOUD_SQL_USER,
  password: process.env.CLOUD_SQL_PASSWORD,
  database: process.env.CLOUD_SQL_DATABASE
});

async function verifySkillTemplates() {
  console.log('Verifying skill templates with category and subcategory IDs...');
  
  try {
    // Query templates with MongoDB name to verify our fix
    const result = await pool.query(`
      SELECT * FROM skill_templates 
      WHERE name = 'MongoDB'
    `);
    
    if (result.rows.length === 0) {
      console.log('No MongoDB template found');
    } else {
      const template = result.rows[0];
      console.log('MongoDB template found:');
      console.log(template);
      console.log('\nVerification:');
      console.log(`- Has category_id: ${template.category_id !== null}`);
      console.log(`- Has subcategory_id: ${template.subcategory_id !== null}`);
      console.log(`- Category: ${template.category}`);
      console.log(`- Category ID: ${template.category_id}`);
      console.log(`- Subcategory ID: ${template.subcategory_id}`);
    }
    
    // Now check PostgreSQL which might be missing one or both IDs
    const pgResult = await pool.query(`
      SELECT * FROM skill_templates 
      WHERE name = 'PostgreSQL'
    `);
    
    if (pgResult.rows.length === 0) {
      console.log('\nNo PostgreSQL template found');
    } else {
      const pgTemplate = pgResult.rows[0];
      console.log('\nPostgreSQL template found:');
      console.log(pgTemplate);
      console.log('\nVerification:');
      console.log(`- Has category_id: ${pgTemplate.category_id !== null}`);
      console.log(`- Has subcategory_id: ${pgTemplate.subcategory_id !== null}`);
      console.log(`- Category: ${pgTemplate.category}`);
      console.log(`- Category ID: ${pgTemplate.category_id}`);
      console.log(`- Subcategory ID: ${pgTemplate.subcategory_id}`);
    }
    
    // Let's count how many templates have proper category_id and subcategory_id
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN category_id IS NOT NULL THEN 1 END) as with_category_id,
        COUNT(CASE WHEN subcategory_id IS NOT NULL THEN 1 END) as with_subcategory_id,
        COUNT(CASE WHEN category_id IS NOT NULL AND subcategory_id IS NOT NULL THEN 1 END) as with_both
      FROM skill_templates
    `);
    
    const stats = statsResult.rows[0];
    console.log('\nOverall statistics:');
    console.log(`- Total templates: ${stats.total}`);
    console.log(`- Templates with category_id: ${stats.with_category_id} (${Math.round(stats.with_category_id/stats.total*100)}%)`);
    console.log(`- Templates with subcategory_id: ${stats.with_subcategory_id} (${Math.round(stats.with_subcategory_id/stats.total*100)}%)`);
    console.log(`- Templates with both: ${stats.with_both} (${Math.round(stats.with_both/stats.total*100)}%)`);
    
    console.log('\nVerification completed!');
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await pool.end();
  }
}

verifySkillTemplates();