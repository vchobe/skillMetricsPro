/**
 * Test script for the Project Skills V2 API
 * 
 * This script tests the /api/projects/:id/skills endpoint with the new V2 implementation
 * that uses only skill templates and not user skills.
 */
import fetch from 'node-fetch';

async function login() {
  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@atyeti.com',
        password: 'password123'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }
    
    // Get the cookie from the response
    const setCookie = response.headers.get('set-cookie');
    
    console.log('Login successful!');
    return setCookie;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
}

async function getSkillTemplates(cookie) {
  try {
    const response = await fetch('http://localhost:5000/api/admin/skill-templates', {
      method: 'GET',
      headers: {
        'Cookie': cookie
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get skill templates: ${response.status} ${response.statusText}`);
    }
    
    const templates = await response.json();
    console.log(`Got ${templates.length} skill templates`);
    
    // Return the first few templates
    return templates.slice(0, 3);
  } catch (error) {
    console.error('Error getting skill templates:', error);
    throw error;
  }
}

async function getProjects(cookie) {
  try {
    const response = await fetch('http://localhost:5000/api/projects', {
      method: 'GET',
      headers: {
        'Cookie': cookie
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get projects: ${response.status} ${response.statusText}`);
    }
    
    const projects = await response.json();
    console.log(`Got ${projects.length} projects`);
    
    // Return the first project
    return projects[0];
  } catch (error) {
    console.error('Error getting projects:', error);
    throw error;
  }
}

async function addSkillToProject(cookie, projectId, skillTemplateId) {
  try {
    console.log(`Adding skill template ${skillTemplateId} to project ${projectId}`);
    
    const response = await fetch(`http://localhost:5000/api/projects/${projectId}/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify({
        skillTemplateId,
        requiredLevel: 'intermediate',
        importance: 'high'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add skill to project: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Successfully added skill to project!', result);
    return result;
  } catch (error) {
    console.error('Error adding skill to project:', error);
    throw error;
  }
}

async function run() {
  try {
    console.log('Starting test...');
    
    // Login to get a cookie
    const cookie = await login();
    
    // Get some skill templates
    const templates = await getSkillTemplates(cookie);
    console.log('Available templates:');
    templates.forEach(template => {
      console.log(`- ${template.id}: ${template.name} (${template.category})`);
    });
    
    // Get a project
    const project = await getProjects(cookie);
    console.log(`Using project: ${project.id} - ${project.name}`);
    
    // Try to add each template to the project
    for (const template of templates) {
      try {
        console.log(`\nAttempting to add ${template.name} to project ${project.name}...`);
        const result = await addSkillToProject(cookie, project.id, template.id);
        console.log(`Success! Added template ${template.name} (ID: ${template.id}) to project ${project.name}`);
      } catch (error) {
        console.log(`Could not add template ${template.name} (ID: ${template.id}): ${error.message}`);
      }
    }
    
    console.log('\nTest completed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
run();