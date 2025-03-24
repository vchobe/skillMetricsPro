/**
 * Script to verify and fix the project edit functionality
 * 
 * This script performs the following:
 * 1. Creates a test project
 * 2. Attempts to edit the project
 * 3. Verifies the changes were saved correctly
 * 4. Cleans up test data
 * 
 * Run with: node scripts/fix-edit-project.js
 */

import axios from 'axios';
import pg from 'pg';
const { Pool } = pg;
import 'dotenv/config';

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_PREFIX = 'FIX_EDIT_';

// Test data
const testClient = {
  name: `${TEST_PREFIX}Client`,
  contactPerson: 'Test Contact',
  email: 'test@example.com',
  phone: '123-456-7890',
  address: '123 Test St, Test City',
  description: 'Client created for edit fix testing'
};

const initialProject = {
  name: `${TEST_PREFIX}Project Initial`,
  description: 'Initial project description',
  status: 'planning',
  location: 'Initial Location',
  notes: 'Initial project notes'
};

const updatedProject = {
  name: `${TEST_PREFIX}Project Updated`,
  description: 'Updated project description',
  status: 'active',
  location: 'Updated Location',
  notes: 'Updated project notes'
};

// Test state
let authToken = null;
let adminUser = null;
let testClientId = null;
let testProjectId = null;

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

async function createClient() {
  try {
    console.log('Creating test client...');
    const response = await api.post('/clients', testClient);
    testClientId = response.data.id;
    console.log(`Client created with ID: ${testClientId}`);
    return true;
  } catch (error) {
    console.error('Client creation failed:', error.message);
    return false;
  }
}

async function createProject() {
  try {
    console.log('Creating test project...');
    
    // Use the created client ID
    const projectData = {
      ...initialProject,
      clientId: testClientId,
      startDate: new Date().toISOString()
    };
    
    const response = await api.post('/projects', projectData);
    testProjectId = response.data.id;
    console.log(`Project created with ID: ${testProjectId}`);
    return true;
  } catch (error) {
    console.error('Project creation failed:', error.message);
    return false;
  }
}

async function editProject() {
  try {
    console.log(`Editing project with ID: ${testProjectId}...`);
    
    const updatedData = {
      ...updatedProject,
      clientId: testClientId,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };
    
    // First attempt - directly calling API
    console.log('First edit attempt: directly calling API...');
    const response = await api.put(`/projects/${testProjectId}`, updatedData);
    console.log('API call response status:', response.status);
    
    // Verify changes were saved
    console.log('Verifying changes saved successfully...');
    const getResponse = await api.get(`/projects/${testProjectId}`);
    const retrievedProject = getResponse.data;
    
    let success = true;
    
    // Check each field
    for (const [key, value] of Object.entries(updatedProject)) {
      if (retrievedProject[key] !== value) {
        console.error(`Field ${key} not updated correctly. Expected: ${value}, Got: ${retrievedProject[key]}`);
        success = false;
      }
    }
    
    if (success) {
      console.log('Project edit functionality is working correctly!');
      return true;
    } else {
      console.error('Project edit functionality has issues. Some fields were not updated correctly.');
      return false;
    }
  } catch (error) {
    console.error('Project update failed:', error.message);
    
    // Show detailed error response if available
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    }
    
    return false;
  }
}

async function cleanupTestData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    console.log('Cleaning up test data...');
    
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

// Main test sequence
async function runEditTest() {
  console.log('Starting edit functionality test...');
  
  // Login
  if (!await login()) {
    console.error('Aborting test due to login failure');
    return;
  }
  
  await delay(1000);
  
  // Create test client
  if (!await createClient()) {
    console.error('Aborting test due to client creation failure');
    return;
  }
  
  await delay(1000);
  
  // Create test project
  if (!await createProject()) {
    console.error('Aborting test due to project creation failure');
    await cleanupTestData();
    return;
  }
  
  await delay(1000);
  
  // Test edit functionality
  const editSuccess = await editProject();
  console.log('Edit functionality test result:', editSuccess ? 'PASSED' : 'FAILED');
  
  // Clean up
  await cleanupTestData();
}

// Run the test
runEditTest();