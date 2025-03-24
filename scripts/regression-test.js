/**
 * Automated Regression Test Suite for Project Management Functionality
 * 
 * This script tests the following functionality:
 * 1. Create a client
 * 2. Edit a client
 * 3. Create a project
 * 4. Edit a project
 * 5. Associate project with client
 * 6. Associate resources with project
 * 7. Remove resources from project
 * 
 * Run with: node scripts/regression-test.js
 */

import axios from 'axios';
import pg from 'pg';
const { Pool } = pg;
import 'dotenv/config';

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_PREFIX = 'REGRESSION_';
const TIMEOUT = 2000;

// Test data
const testClient = {
  name: `${TEST_PREFIX}Test Client`,
  contactPerson: 'Test Contact',
  email: 'test@example.com',
  phone: '123-456-7890',
  address: '123 Test St, Test City',
  description: 'Client created for regression testing'
};

const testProject = {
  name: `${TEST_PREFIX}Test Project`,
  description: 'Project created for regression testing',
  status: 'planning',
  location: 'Test Location',
  notes: 'Test notes for regression testing'
};

// Test state
let authToken = null;
let adminUser = null;
let testClientId = null;
let testProjectId = null;
let testUserId = null;
let testResourceId = null;

// Test results
const testResults = {
  createClient: { status: 'pending', details: null },
  editClient: { status: 'pending', details: null },
  createProject: { status: 'pending', details: null },
  editProject: { status: 'pending', details: null },
  projectClientAssociation: { status: 'pending', details: null },
  addResource: { status: 'pending', details: null },
  removeResource: { status: 'pending', details: null }
};

// Utility functions
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
});

// API functions
async function login() {
  try {
    console.log('Logging in as admin...');
    const response = await api.post('/auth/login', {
      email: 'admin@atyeti.com',
      password: 'Admin@123'
    });
    
    authToken = response.data?.token;
    adminUser = response.data;
    console.log('Login successful');
    return true;
  } catch (error) {
    console.error('Login failed:', error.message);
    return false;
  }
}

async function getCurrentUser() {
  try {
    const response = await api.get('/user');
    return response.data;
  } catch (error) {
    console.error('Failed to get current user:', error.message);
    return null;
  }
}

async function getRandomUser() {
  try {
    const response = await api.get('/users');
    const users = response.data.filter(user => user.id !== adminUser.id);
    return users[Math.floor(Math.random() * users.length)];
  } catch (error) {
    console.error('Failed to get random user:', error.message);
    return null;
  }
}

async function createClient() {
  try {
    console.log('Creating test client...');
    const response = await api.post('/clients', testClient);
    testClientId = response.data.id;
    console.log(`Client created with ID: ${testClientId}`);
    testResults.createClient = { 
      status: 'passed', 
      details: `Client created with ID: ${testClientId}` 
    };
    return true;
  } catch (error) {
    console.error('Client creation failed:', error.message);
    testResults.createClient = { 
      status: 'failed', 
      details: `Error: ${error.message}` 
    };
    return false;
  }
}

async function editClient() {
  try {
    console.log(`Editing client with ID: ${testClientId}...`);
    const updatedClient = {
      ...testClient,
      name: `${testClient.name} (Edited)`,
      contactPerson: 'Updated Contact'
    };
    
    const response = await api.put(`/clients/${testClientId}`, updatedClient);
    console.log('Client updated successfully');
    testResults.editClient = { 
      status: 'passed', 
      details: 'Client was successfully updated' 
    };
    return true;
  } catch (error) {
    console.error('Client update failed:', error.message);
    testResults.editClient = { 
      status: 'failed', 
      details: `Error: ${error.message}` 
    };
    return false;
  }
}

async function createProject() {
  try {
    console.log('Creating test project...');
    
    // Use the created client ID
    const projectData = {
      ...testProject,
      clientId: testClientId,
      startDate: new Date().toISOString()
    };
    
    const response = await api.post('/projects', projectData);
    testProjectId = response.data.id;
    console.log(`Project created with ID: ${testProjectId}`);
    testResults.createProject = { 
      status: 'passed', 
      details: `Project created with ID: ${testProjectId}` 
    };
    testResults.projectClientAssociation = { 
      status: 'passed', 
      details: `Project ${testProjectId} successfully associated with client ${testClientId}` 
    };
    return true;
  } catch (error) {
    console.error('Project creation failed:', error.message);
    testResults.createProject = { 
      status: 'failed', 
      details: `Error: ${error.message}` 
    };
    testResults.projectClientAssociation = {
      status: 'failed',
      details: 'Failed due to project creation failure'
    };
    return false;
  }
}

async function editProject() {
  try {
    console.log(`Editing project with ID: ${testProjectId}...`);
    const updatedProject = {
      name: `${testProject.name} (Edited)`,
      description: 'Updated project description',
      status: 'active',
      location: 'Updated Location',
      notes: 'Updated notes for regression testing'
    };
    
    const response = await api.put(`/projects/${testProjectId}`, updatedProject);
    console.log('Project updated successfully');
    testResults.editProject = { 
      status: 'passed', 
      details: 'Project was successfully updated' 
    };
    return true;
  } catch (error) {
    console.error('Project update failed:', error.message);
    testResults.editProject = { 
      status: 'failed', 
      details: `Error: ${error.message}` 
    };
    return false;
  }
}

async function addResourceToProject() {
  try {
    console.log('Adding resource to project...');
    
    // Get a random user to add as a resource
    const randomUser = await getRandomUser();
    testUserId = randomUser.id;
    
    const resourceData = {
      userId: testUserId,
      role: 'Developer',
      notes: 'Added during regression testing'
    };
    
    const response = await api.post(`/projects/${testProjectId}/resources`, resourceData);
    testResourceId = response.data.id;
    console.log(`Resource added with ID: ${testResourceId}`);
    testResults.addResource = { 
      status: 'passed', 
      details: `Resource (user ID: ${testUserId}) added to project with resource ID: ${testResourceId}` 
    };
    return true;
  } catch (error) {
    console.error('Resource addition failed:', error.message);
    testResults.addResource = { 
      status: 'failed', 
      details: `Error: ${error.message}` 
    };
    return false;
  }
}

async function removeResourceFromProject() {
  try {
    console.log(`Removing resource with ID: ${testResourceId} from project...`);
    const response = await api.delete(`/projects/${testProjectId}/resources/${testResourceId}`);
    console.log('Resource removed successfully');
    testResults.removeResource = { 
      status: 'passed', 
      details: 'Resource was successfully removed from project' 
    };
    return true;
  } catch (error) {
    console.error('Resource removal failed:', error.message);
    testResults.removeResource = { 
      status: 'failed', 
      details: `Error: ${error.message}` 
    };
    return false;
  }
}

async function cleanupTestData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    console.log('Cleaning up test data...');
    
    // Delete project resources
    if (testProjectId) {
      await pool.query('DELETE FROM project_resources WHERE project_id = $1', [testProjectId]);
    }
    
    // Delete project skills
    if (testProjectId) {
      await pool.query('DELETE FROM project_skills WHERE project_id = $1', [testProjectId]);
    }
    
    // Delete projects
    if (testProjectId) {
      await pool.query('DELETE FROM projects WHERE id = $1', [testProjectId]);
    }
    
    // Delete clients
    if (testClientId) {
      await pool.query('DELETE FROM clients WHERE id = $1', [testClientId]);
    }
    
    console.log('Test data cleanup completed');
    return true;
  } catch (error) {
    console.error('Cleanup failed:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

function generateTestReport() {
  console.log('\n==================================');
  console.log('REGRESSION TEST REPORT');
  console.log('==================================\n');
  
  let passCount = 0;
  let failCount = 0;
  
  for (const [testName, result] of Object.entries(testResults)) {
    const statusIcon = result.status === 'passed' ? '✓' : '✗';
    const statusColor = result.status === 'passed' ? '\x1b[32m' : '\x1b[31m';
    console.log(`${statusColor}${statusIcon}\x1b[0m ${testName}: ${result.status.toUpperCase()}`);
    console.log(`   Details: ${result.details || 'No details'}\n`);
    
    if (result.status === 'passed') passCount++;
    else failCount++;
  }
  
  const totalTests = Object.keys(testResults).length;
  const passPercentage = (passCount / totalTests * 100).toFixed(2);
  
  console.log('==================================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Tests Passed: ${passCount} (${passPercentage}%)`);
  console.log(`Tests Failed: ${failCount}`);
  console.log('==================================');
  
  return {
    totalTests,
    passCount,
    failCount,
    passPercentage
  };
}

// Main test sequence
async function runTests() {
  console.log('Starting regression tests...');
  
  await delay(TIMEOUT);
  
  // Login
  if (!await login()) {
    console.error('Aborting tests due to login failure');
    return;
  }
  
  await delay(TIMEOUT);
  
  // Get current user to ensure we're authenticated
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    console.error('User is not authenticated or not an admin, aborting tests');
    return;
  }
  
  await delay(TIMEOUT);
  
  // Run tests sequentially
  await createClient();
  await delay(TIMEOUT);
  
  await editClient();
  await delay(TIMEOUT);
  
  await createProject();
  await delay(TIMEOUT);
  
  await editProject();
  await delay(TIMEOUT);
  
  await addResourceToProject();
  await delay(TIMEOUT);
  
  await removeResourceFromProject();
  await delay(TIMEOUT);
  
  // Generate and print test report
  generateTestReport();
  
  // Clean up test data
  await cleanupTestData();
  
  console.log('\nRegression testing completed');
}

// Run the tests
runTests();