import fetch from 'node-fetch';
import { pool } from './server/db.js';

// API endpoint URL
const BASE_URL = 'http://localhost:5000/api';
let authCookies = null;

// Login credentials
const admin = {
  email: 'admin@atyeti.com',
  password: 'Admin@123'
};

async function login() {
  console.log("Logging in as admin...");
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(admin),
  });

  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  // Extract session cookie
  authCookies = response.headers.get('set-cookie');
  
  const userData = await response.json();
  console.log(`Login successful. Status: ${response.status}`);
  console.log(`Logged in as: ${userData.email} (admin: ${userData.isAdmin})`);
  
  return userData;
}

async function createProjectSkill(projectId, templateId) {
  console.log(`Creating project skill for template ID ${templateId} in project ${projectId}...`);
  
  const projectSkillData = {
    projectId: projectId,
    skillTemplateId: templateId,
    requiredLevel: "intermediate",
    importance: "high"
  };
  
  const response = await fetch(`${BASE_URL}/admin/project-skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookies
    },
    body: JSON.stringify(projectSkillData),
  });
  
  if (response.status !== 201) {
    console.error(`Failed to create project skill: ${response.status} ${response.statusText}`);
    const errorText = await response.text();
    console.error(`Error details: ${errorText}`);
    return null;
  }
  
  const projectSkill = await response.json();
  console.log("Successfully created project skill:", projectSkill);
  return projectSkill;
}

async function testWorkflow() {
  try {
    console.log("Starting project skill test...");
    
    // 1. Login as admin
    await login();
    
    // 2. Create project skill with the newly created skill template ID
    const projectId = 2; // Use an existing project
    const skillTemplateId = 98; // Use the template ID created in test-skill-template-api.js
    
    await createProjectSkill(projectId, skillTemplateId);
    
    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Error during test:", error.message);
  } finally {
    // Close the database pool
    await pool.end();
  }
}

// Run the test
testWorkflow();