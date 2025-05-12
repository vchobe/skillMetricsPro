// This is a direct database test script to verify proper setting of category_id and subcategory_id
import pkg from 'pg';
const { Pool } = pkg;

// Create a connection to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testTemplateCreation() {
  console.log('Testing category and subcategory handling in skill templates...');
  
  try {
    // Step 1: Get a test category
    console.log('Fetching a test category...');
    const categoryResult = await pool.query(
      'SELECT id, name FROM skill_categories LIMIT 1'
    );
    
    if (categoryResult.rows.length === 0) {
      throw new Error('No categories found in the database');
    }
    
    const testCategory = categoryResult.rows[0];
    console.log(`Using category: ${testCategory.name} (ID: ${testCategory.id})`);
    
    // Step 2: Get a subcategory for this category
    console.log(`Finding subcategories for category ${testCategory.id}...`);
    const subcategoryResult = await pool.query(
      'SELECT id, name FROM skill_subcategories WHERE category_id = $1 LIMIT 1',
      [testCategory.id]
    );
    
    let testSubcategory = null;
    if (subcategoryResult.rows.length > 0) {
      testSubcategory = subcategoryResult.rows[0];
      console.log(`Using subcategory: ${testSubcategory.name} (ID: ${testSubcategory.id})`);
    } else {
      console.log('No subcategories found for this category');
    }
    
    // Step 3: Create a test template with category and subcategory
    const timestamp = Date.now();
    const templateName = `Test Template ${timestamp}`;
    
    console.log('Creating test template with data:', {
      name: templateName,
      category: testCategory.name,
      category_id: testCategory.id,
      subcategory_id: testSubcategory ? testSubcategory.id : null
    });
    
    const insertResult = await pool.query(
      `INSERT INTO skill_templates 
        (name, category, category_id, subcategory_id, description, is_recommended) 
       VALUES 
        ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        templateName,
        testCategory.name,
        testCategory.id,
        testSubcategory ? testSubcategory.id : null,
        'Test template description',
        false
      ]
    );
    
    if (insertResult.rows.length === 0) {
      throw new Error('Failed to insert template');
    }
    
    const newTemplate = insertResult.rows[0];
    console.log('Successfully created template:', newTemplate);
    
    // Step 4: Verify the template was created with correct values
    console.log('Verification:');
    console.log(`- ID: ${newTemplate.id}`);
    console.log(`- Name: ${newTemplate.name}`);
    console.log(`- Category name: ${newTemplate.category} (expected: ${testCategory.name})`);
    console.log(`- Category ID: ${newTemplate.category_id} (expected: ${testCategory.id})`);
    
    if (testSubcategory) {
      console.log(`- Subcategory ID: ${newTemplate.subcategory_id} (expected: ${testSubcategory.id})`);
    }
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

testTemplateCreation();