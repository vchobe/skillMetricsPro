import fetch from 'node-fetch';
import fs from 'fs';

// Base URL for our API
const API_BASE_URL = 'http://localhost:5000/api';

// Store session cookies
let cookies = [];

async function login() {
  console.log('Attempting to login...');
  const response = await fetch(`${API_BASE_URL}/login`, {
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

  if (response.status === 200) {
    console.log('Login successful!');
    
    // Extract and save cookies
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      cookies = setCookieHeader.split(',').map(cookie => cookie.split(';')[0]);
      console.log('Cookies saved:', cookies);
    }
    
    return true;
  } else {
    console.error('Login failed with status:', response.status);
    return false;
  }
}

async function getUser() {
  console.log('Getting current user...');
  const response = await fetch(`${API_BASE_URL}/user`, {
    headers: {
      Cookie: cookies.join('; ')
    }
  });
  
  if (response.status === 200) {
    const user = await response.json();
    console.log('Current user:', user);
    return user;
  } else {
    console.error('Failed to get user with status:', response.status);
    return null;
  }
}

async function addSkillToProject(projectId, skillData) {
  console.log(`Adding skill to project ${projectId}...`);
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies.join('; ')
    },
    body: JSON.stringify(skillData)
  });
  
  if (response.status === 200 || response.status === 201) {
    const result = await response.json();
    console.log('Skill added successfully:', result);
    return result;
  } else {
    const errorText = await response.text();
    console.error(`Failed to add skill with status: ${response.status}`);
    console.error('Error details:', errorText);
    return null;
  }
}

async function getProjectSkills(projectId) {
  console.log(`Getting skills for project ${projectId}...`);
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/skills`, {
    headers: {
      Cookie: cookies.join('; ')
    }
  });
  
  if (response.status === 200) {
    const skills = await response.json();
    console.log(`Found ${skills.length} skills for project ${projectId}`);
    return skills;
  } else {
    console.error(`Failed to get project skills with status: ${response.status}`);
    return null;
  }
}

async function run() {
  try {
    // Login first
    const loggedIn = await login();
    if (!loggedIn) {
      console.error('Aborting due to login failure');
      return;
    }
    
    // Verify we're logged in by getting the user
    const user = await getUser();
    if (!user) {
      console.error('Aborting due to authentication failure');
      return;
    }
    
    // Project to test with
    const projectId = 4;
    
    // Get current skills for reference
    const existingSkills = await getProjectSkills(projectId);
    
    // Add a new skill to the project
    const skillData = {
      skillTemplateId: 59, // Using a known skill template ID
      projectId: projectId,
      requiredLevel: "intermediate"
    };
    
    const addedSkill = await addSkillToProject(projectId, skillData);
    
    // Verify the skill was added by getting the updated list
    if (addedSkill) {
      const updatedSkills = await getProjectSkills(projectId);
      
      if (updatedSkills && existingSkills) {
        console.log(`Skills before: ${existingSkills.length}, Skills after: ${updatedSkills.length}`);
      }
    }
    
    console.log('Test completed!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
run();