/**
 * Test script to create a skill template via the API
 */
import fetch from 'node-fetch';

async function testSkillTemplateAPI() {
  try {
    console.log('Starting API test...');
    
    // First, log in as an admin user
    console.log('Logging in as admin...');
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin@atyeti.com',
        password: 'admin123'
      }),
      redirect: 'manual'
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} - ${await loginResponse.text()}`);
    }
    
    console.log('Login successful. Status:', loginResponse.status);
    
    // Extract cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Received cookies:', cookies);
    
    // Create a skill template
    console.log('Creating NoSQL skill template...');
    const createTemplateResponse = await fetch('http://localhost:5000/api/admin/skill-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        name: 'CouchDB',
        category: 'Database',
        categoryId: 2, // Database
        subcategoryId: 76, // NoSQL Databases
        description: 'Experience with Apache CouchDB document-oriented database',
        isRecommended: true,
        targetLevel: 'intermediate'
      })
    });
    
    if (!createTemplateResponse.ok) {
      const errorText = await createTemplateResponse.text();
      throw new Error(`Failed to create skill template: ${createTemplateResponse.status} - ${errorText}`);
    }
    
    const template = await createTemplateResponse.json();
    console.log('Successfully created skill template:', template);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testSkillTemplateAPI().catch(error => {
  console.error('Unhandled error:', error);
});