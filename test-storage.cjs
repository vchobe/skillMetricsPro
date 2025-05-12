const { storage } = require('./server/storage');

async function testDbFunctions() {
  try {
    console.log('Testing skill template creation with proper category and subcategory values...');
    
    // Get all categories
    const categories = await storage.getSkillCategories();
    console.log(`Found ${categories.length} categories`);
    
    if (categories.length === 0) {
      throw new Error('No categories found');
    }
    
    // Select a category for testing
    const testCategory = categories[0];
    console.log(`Using category: ${testCategory.name} (ID: ${testCategory.id})`);
    
    // Get subcategories for the selected category
    const subcategories = await storage.getSkillSubcategories(testCategory.id);
    console.log(`Found ${subcategories.length} subcategories for category ${testCategory.name}`);
    
    let testSubcategory = null;
    if (subcategories.length > 0) {
      testSubcategory = subcategories[0];
      console.log(`Using subcategory: ${testSubcategory.name} (ID: ${testSubcategory.id})`);
    } else {
      console.log('No subcategories found for this category, will create a template without subcategory');
    }
    
    // Create a test skill template
    const templateData = {
      name: `Test Skill ${Date.now()}`,
      category: testCategory.name,
      categoryId: testCategory.id,
      subcategoryId: testSubcategory ? testSubcategory.id : null,
      description: 'Test skill with proper category information',
      isRecommended: true
    };
    
    console.log('Creating template with data:', templateData);
    
    // Create the template
    const newTemplate = await storage.createSkillTemplate(templateData);
    console.log('Created new template:', newTemplate);
    
    // Verify the template has the correct category and subcategory
    console.log('Verification:');
    console.log(`- Category name set: ${newTemplate.category === testCategory.name}`);
    console.log(`- Category ID set: ${newTemplate.categoryId === testCategory.id}`);
    
    if (testSubcategory) {
      console.log(`- Subcategory ID set: ${newTemplate.subcategoryId === testSubcategory.id}`);
    }
    
    // Get the template by ID to verify it was saved correctly
    const retrievedTemplate = await storage.getSkillTemplate(newTemplate.id);
    console.log('Retrieved template from database:', retrievedTemplate);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDbFunctions();