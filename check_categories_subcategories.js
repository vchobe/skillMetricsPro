import pg from 'pg';
const { Client } = pg;

async function checkCategoriesAndSubcategories() {
  const client = new Client({
    host: process.env.CLOUD_SQL_HOST || '34.30.6.95',
    port: process.env.CLOUD_SQL_PORT || 5432,
    database: process.env.CLOUD_SQL_DATABASE || 'neondb',
    user: process.env.CLOUD_SQL_USER || 'app_user',
    password: process.env.CLOUD_SQL_PASSWORD
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Get all categories
    const categoriesResult = await client.query(
      `SELECT * FROM skill_categories ORDER BY id`
    );
    console.log(`Found ${categoriesResult.rows.length} categories`);
    
    // Get all subcategories
    const subcategoriesResult = await client.query(
      `SELECT * FROM skill_subcategories ORDER BY id`
    );
    console.log(`Found ${subcategoriesResult.rows.length} subcategories`);
    
    // Print out the category structure
    console.log('\nCategory structure:');
    for (const category of categoriesResult.rows) {
      console.log(`\nCategory ID ${category.id}: ${category.name}`);
      
      const subCats = subcategoriesResult.rows.filter(
        sc => sc.category_id === category.id
      );
      
      if (subCats.length > 0) {
        console.log('  Subcategories:');
        for (const subCat of subCats) {
          console.log(`    - ID ${subCat.id}: ${subCat.name}`);
        }
      } else {
        console.log('  No subcategories');
      }
    }
    
    // Check skill templates with categoryId but no subcategoryId
    const templatesResult = await client.query(
      `SELECT * FROM skill_templates 
       WHERE category_id IS NOT NULL 
       AND subcategory_id IS NULL
       ORDER BY id`
    );
    
    console.log(`\nFound ${templatesResult.rows.length} skill templates with category_id but no subcategory_id:`);
    for (const template of templatesResult.rows) {
      const category = categoriesResult.rows.find(c => c.id === template.category_id);
      console.log(`Template ID ${template.id}: ${template.name} (Category: ${category?.name || 'Unknown'} ID: ${template.category_id})`);
    }
    
  } catch (error) {
    console.error('Error checking categories and subcategories:', error);
  } finally {
    await client.end();
  }
}

checkCategoriesAndSubcategories();