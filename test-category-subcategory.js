import fetch from 'node-fetch';

async function testCategorySubcategory() {
  try {
    console.log('Testing skill template creation with category and subcategory...');
    
    // Step 1: Get categories
    console.log('Fetching categories...');
    const categoriesResponse = await fetch('http://localhost:5000/api/skill-categories');
    const categories = await categoriesResponse.json();
    
    if (!categories || categories.length === 0) {
      throw new Error('No categories found');
    }
    
    console.log(`Found ${categories.length} categories`);
    const testCategory = categories[0]; // Using the first category for testing
    console.log(`Using category: ${testCategory.name} (ID: ${testCategory.id})`);
    
    // Step 2: Get subcategories for the selected category
    console.log(`Fetching subcategories for category ID ${testCategory.id}...`);
    const subcategoriesResponse = await fetch(`http://localhost:5000/api/skill-categories/${testCategory.id}/subcategories`);
    const subcategories = await subcategoriesResponse.json();
    
    if (!subcategories || subcategories.length === 0) {
      console.log(`No subcategories found for category ${testCategory.id}. Creating a test template with just the category.`);
      
      // Create a template with just the category
      const templateData = {
        name: `Test Skill ${Date.now()}`,
        category: testCategory.name,
        categoryId: testCategory.id,
        description: 'Test skill with category only',
        isRecommended: true
      };
      
      const createResponse = await fetch('http://localhost:5000/api/admin/skill-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create template: ${errorText}`);
      }
      
      const newTemplate = await createResponse.json();
      console.log('Successfully created template with category only:', newTemplate);
      console.log(`Category ID set: ${newTemplate.categoryId !== null && newTemplate.categoryId !== undefined}`);
      
      return;
    }
    
    console.log(`Found ${subcategories.length} subcategories`);
    const testSubcategory = subcategories[0]; // Using the first subcategory for testing
    console.log(`Using subcategory: ${testSubcategory.name} (ID: ${testSubcategory.id})`);
    
    // Step 3: Create a new skill template with both category and subcategory
    const templateData = {
      name: `Test Skill ${Date.now()}`,
      category: testCategory.name,
      categoryId: testCategory.id,
      subcategoryId: testSubcategory.id,
      description: 'Test skill with category and subcategory',
      isRecommended: true
    };
    
    console.log('Creating new skill template with data:', templateData);
    
    const createResponse = await fetch('http://localhost:5000/api/admin/skill-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create template: ${errorText}`);
    }
    
    const newTemplate = await createResponse.json();
    console.log('Successfully created template:', newTemplate);
    console.log(`Category ID set: ${newTemplate.categoryId !== null && newTemplate.categoryId !== undefined}`);
    console.log(`Subcategory ID set: ${newTemplate.subcategoryId !== null && newTemplate.subcategoryId !== undefined}`);
    
    // Step 4: Verify the template was created properly
    console.log(`Fetching created template with ID ${newTemplate.id}...`);
    const verifyResponse = await fetch(`http://localhost:5000/api/admin/skill-templates/${newTemplate.id}`);
    
    if (!verifyResponse.ok) {
      throw new Error('Failed to fetch created template');
    }
    
    const verifiedTemplate = await verifyResponse.json();
    console.log('Verified template from database:', verifiedTemplate);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCategorySubcategory();