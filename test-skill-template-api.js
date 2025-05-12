/**
 * Test script to create a skill template via the API
 */
import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';

// Create a fetch wrapper that handles cookies
async function fetchWithCookies(url, options) {
  const jar = new CookieJar();
  const setCookie = promisify(jar.setCookie.bind(jar));
  const getCookies = promisify(jar.getCookieString.bind(jar));
  
  // First request
  const response = await fetch(url, options);
  
  // Get and store cookies
  const cookies = response.headers.raw()['set-cookie'];
  if (cookies) {
    for (const cookie of cookies) {
      await setCookie(cookie, url);
    }
  }
  
  // Return the response and a function to make authenticated requests
  return {
    response,
    async fetch(url, options = {}) {
      const cookieString = await getCookies(url);
      const newOptions = {
        ...options,
        headers: {
          ...options.headers,
          Cookie: cookieString
        }
      };
      return fetch(url, newOptions);
    }
  };
}

async function testSkillTemplateAPI() {
  try {
    console.log('Starting API test...');
    
    // First, log in as an admin user
    console.log('Logging in as admin...');
    
    // Login and get a cookie-enabled fetch function
    const { response: loginResponse, fetch: authenticatedFetch } = await fetchWithCookies(
      'http://localhost:5000/api/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@atyeti.com',
          password: 'Admin@123'  // Using the correct password from auth.ts
        })
      }
    );
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} - ${await loginResponse.text()}`);
    }
    
    console.log('Login successful. Status:', loginResponse.status);
    
    // Store the user data
    let userData;
    try {
      const text = await loginResponse.text();
      
      // Check if the response is HTML (which would indicate an error)
      if (text.startsWith('<!DOCTYPE html>') || text.startsWith('<html>')) {
        console.log('Received HTML response instead of JSON. This usually means there was a redirect or error page.');
        // Extract the login info from the page or just continue without the detailed user info
        userData = { email: 'admin@atyeti.com', isAdmin: true };
      } else {
        // Try to parse as JSON
        userData = JSON.parse(text);
      }
      console.log('Logged in as:', userData.email, `(admin: ${userData.isAdmin})`);
    } catch (error) {
      console.warn('Could not parse login response as JSON:', error.message);
      // Continue anyway since we know we're logged in
      userData = { email: 'admin@atyeti.com', isAdmin: true };
    }
    
    // Create a skill template
    console.log('Creating NoSQL skill template...');
    const createTemplateResponse = await authenticatedFetch('http://localhost:5000/api/admin/skill-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
    
    // Save the raw response for debugging
    const responseText = await createTemplateResponse.text();
    await writeFile('template-response.txt', responseText);
    
    if (!createTemplateResponse.ok) {
      throw new Error(`Failed to create skill template: ${createTemplateResponse.status} - ${responseText}`);
    }
    
    try {
      const template = JSON.parse(responseText);
      console.log('Successfully created skill template:', template);
    } catch (e) {
      console.log('Response was not valid JSON:', responseText);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testSkillTemplateAPI().catch(error => {
  console.error('Unhandled error:', error);
});