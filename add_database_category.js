import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function addDatabaseCategory() {
  const pool = new Pool({
    host: process.env.CLOUD_SQL_HOST,
    port: process.env.CLOUD_SQL_PORT,
    user: process.env.CLOUD_SQL_USER,
    password: process.env.CLOUD_SQL_PASSWORD,
    database: process.env.CLOUD_SQL_DATABASE
  });

  try {
    console.log('Adding Database category to skill templates...');
    
    // First check if we already have database-related skill templates
    const checkResult = await pool.query(`
      SELECT id, name, category 
      FROM skill_templates 
      WHERE LOWER(category) = 'database' OR 
            LOWER(name) LIKE '%sql%' OR 
            LOWER(name) LIKE '%database%'
      ORDER BY id;
    `);
    
    if (checkResult.rows.length > 0) {
      console.log(`Found ${checkResult.rows.length} existing database-related skill templates:`);
      checkResult.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Name: ${row.name}, Category: ${row.category}`);
      });
    } else {
      console.log('No existing database-related skill templates found.');
    }
    
    // Add a sample database skill template if needed
    if (!checkResult.rows.some(row => row.category.toLowerCase() === 'database')) {
      console.log('\nAdding a Database category skill template...');
      
      const insertResult = await pool.query(`
        INSERT INTO skill_templates (name, category) 
        VALUES ($1, $2)
        RETURNING id, name, category
      `, ['PostgreSQL', 'Database']);
      
      console.log('Successfully added new template:');
      insertResult.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Name: ${row.name}, Category: ${row.category}`);
      });
    } else {
      console.log('\nDatabase category already exists, no need to add.');
    }
    
    // Verify all skill templates categories
    const categoriesResult = await pool.query(`
      SELECT DISTINCT category 
      FROM skill_templates 
      ORDER BY category;
    `);
    
    console.log(`\nVerified ${categoriesResult.rows.length} distinct categories in skill_templates:`);
    categoriesResult.rows.forEach(row => {
      console.log(`  ${row.category}`);
    });
    
  } catch (error) {
    console.error('Error adding database category:', error);
  } finally {
    await pool.end();
  }
}

addDatabaseCategory();