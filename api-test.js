// This script directly calls the application APIs to test our fixes
// First, we'll log in to get a session cookie, then we'll test the skill template creation

import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import fs from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env file to get credentials
async function loadEnvironment() {
  try {
    const envPath = resolve(__dirname, '.env');
    const envFile = await fs.readFile(envPath, 'utf8');
    
    const envVars = {};
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
        envVars[key] = value;
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Failed to load environment variables:', error);
    return {};
  }
}

// Setup cookie jar for session management
const cookieJar = new CookieJar();
const setCookie = promisify(cookieJar.setCookie.bind(cookieJar));
const getCookies = promisify(cookieJar.getCookieString.bind(cookieJar));

// API client wrapper
async function apiRequest(method, endpoint, body = null) {
  const baseUrl = 'http://localhost:5000';
  const url = `${baseUrl}${endpoint}`;
  
  const cookies = await getCookies(url);
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  // Save any cookies from the response
  const responseCookies = response.headers.raw()['set-cookie'];
  if (responseCookies) {
    for (const cookie of responseCookies) {
      await setCookie(cookie, url);
    }
  }
  
  return response;
}

async function testSkillTemplateCreation() {
  try {
    console.log('Starting API test for skill template creation...');
    
    // Step 1: Login to get a session
    const env = await loadEnvironment();
    const testUsername = env.TEST_USERNAME || 'adminatyeti';
    const testPassword = env.TEST_PASSWORD || 'adminpassword';
    
    console.log(`Logging in as ${testUsername}...`);
    
    const loginResponse = await apiRequest('POST', '/api/login', {
      username: testUsername,
      password: testPassword
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    console.log('Login successful!');
    
    // Step 2: Get categories
    console.log('Fetching categories...');
    const categoriesResponse = await apiRequest('GET', '/api/skill-categories');
    const categories = await categoriesResponse.json();
    
    if (!categories || categories.length === 0) {
      throw new Error('No categories found');
    }
    
    console.log(`Found ${categories.length} categories`);
    const testCategory = categories[0]; // Using the first category for testing
    console.log(`Using category: ${testCategory.name} (ID: ${testCategory.id})`);
    
    // Step 3: Get subcategories for the selected category
    console.log(`Fetching subcategories for category ID ${testCategory.id}...`);
    const subcategoriesResponse = await apiRequest('GET', `/api/skill-categories/${testCategory.id}/subcategories`);
    const subcategories = await subcategoriesResponse.json();
    
    let testSubcategory = null;
    if (subcategories && subcategories.length > 0) {
      testSubcategory = subcategories[0];
      console.log(`Using subcategory: ${testSubcategory.name} (ID: ${testSubcategory.id})`);
    } else {
      console.log('No subcategories found for this category');
    }
    
    // Step 4: Create a new skill template with both category and subcategory
    const templateData = {
      name: `Test Skill ${Date.now()}`,
      category: testCategory.name,
      categoryId: testCategory.id,
      subcategoryId: testSubcategory ? testSubcategory.id : null,
      description: 'Test skill with category and subcategory',
      isRecommended: true
    };
    
    console.log('Creating new skill template with data:', templateData);
    
    const createResponse = await apiRequest('POST', '/api/admin/skill-templates', templateData);
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create template: ${errorText}`);
    }
    
    const newTemplate = await createResponse.json();
    console.log('Successfully created template:', newTemplate);
    
    // Step 5: Verify the created template
    console.log('Verification:');
    console.log(`- Category name: ${newTemplate.category} (expected: ${testCategory.name})`);
    console.log(`- Category ID set: ${newTemplate.categoryId !== null && newTemplate.categoryId !== undefined}`);
    console.log(`- Category ID value: ${newTemplate.categoryId} (expected: ${testCategory.id})`);
    
    if (testSubcategory) {
      console.log(`- Subcategory ID set: ${newTemplate.subcategoryId !== null && newTemplate.subcategoryId !== undefined}`);
      console.log(`- Subcategory ID value: ${newTemplate.subcategoryId} (expected: ${testSubcategory.id})`);
    }
    
    console.log('Template creation test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSkillTemplateCreation();