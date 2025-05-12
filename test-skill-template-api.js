/**
 * Test script for skill template creation through the API
 * 
 * This script tests the API endpoint for creating a skill template
 * to diagnose and fix issues with the createSkillTemplate function.
 */
import fetch from 'node-fetch';

async function login() {
  try {
    console.log("Logging in as admin...");
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@atyeti.com',
        password: 'admin123'
      })
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Login failed: ${response.status} ${response.statusText} - ${text}`);
    }
    
    // Get the cookie from the response
    const setCookie = response.headers.get('set-cookie');
    if (!setCookie) {
      throw new Error("No cookie returned from login");
    }
    
    console.log('Login successful! Cookie received.');
    return setCookie;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
}

async function createSkillTemplateViaAPI(cookie) {
  try {
    console.log("Creating skill template via API...");
    
    // Define a test skill template
    const templateName = "API Test Oracle DBA " + new Date().toISOString().substring(0, 16);
    
    // Create the template data
    const templateData = {
      name: templateName,
      category: "Database",
      categoryId: 2,  // The category ID for "Database" from our previous test
      subcategoryId: 77, // The subcategory ID for "Relational Databases" from our previous test
      description: "Experience with Oracle database through API test",
      isRecommended: true,
      targetLevel: "intermediate"
    };
    
    console.log("Template data:", JSON.stringify(templateData, null, 2));
    
    // Make the API call
    const response = await fetch('http://localhost:5000/api/admin/skill-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify(templateData)
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to create skill template: ${response.status} ${response.statusText} - ${text}`);
    }
    
    // Parse the response
    const result = await response.json();
    console.log(`✅ Successfully created skill template with ID ${result.id}`);
    console.log(`Template data:`, result);
    
    return result;
  } catch (error) {
    console.error("❌ Error creating skill template via API:", error);
    throw error;
  }
}

async function getSkillTemplates(cookie) {
  try {
    console.log("Getting all skill templates...");
    const response = await fetch('http://localhost:5000/api/admin/skill-templates', {
      headers: {
        'Cookie': cookie
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get skill templates: ${response.status} ${response.statusText}`);
    }
    
    const templates = await response.json();
    console.log(`Got ${templates.length} skill templates`);
    
    // Find our new template
    return templates;
  } catch (error) {
    console.error("Error getting skill templates:", error);
    throw error;
  }
}

// Run the test
async function run() {
  try {
    // Log in to get a cookie
    const cookie = await login();
    
    // Create a skill template via the API
    const newTemplate = await createSkillTemplateViaAPI(cookie);
    
    // Get all templates to verify
    const allTemplates = await getSkillTemplates(cookie);
    
    // Check if our new template is in the list
    const found = allTemplates.some(template => template.id === newTemplate.id);
    if (found) {
      console.log(`✅ Successfully verified the new template exists in the templates list`);
    } else {
      console.warn(`⚠️ Could not find the new template (ID: ${newTemplate.id}) in the templates list`);
    }
    
    console.log("Test completed successfully!");
    return newTemplate;
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

// Execute the test
run();