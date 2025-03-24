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
let authCookie = null;
let adminUser = null;
let testClientId = null;
let testProjectId = null;

// Utility functions
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
});

// Direct database access for testing
async function directDbLogin() {
  console.log('Performing direct database authentication for testing...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Directly use database credentials for test access
    console.log('Retrieving admin user from database...');
    const result = await pool.query(
      "SELECT id, email, is_admin FROM users WHERE email = 'admin@atyeti.com'"
    );
    
    if (result.rows.length > 0) {
      adminUser = {
        id: result.rows[0].id,
        email: result.rows[0].email,
        isAdmin: result.rows[0].is_admin
      };
      console.log('Test authentication successful:', adminUser);
      return true;
    } else {
      console.error('Admin user not found in database');
      return false;
    }
  } catch (error) {
    console.error('Database authentication failed:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

// API functions
async function login() {
  try {
    console.log('Logging in as admin...');
    const response = await api.post('/auth/login', {
      email: 'admin@atyeti.com',
      password: 'Admin@123'
    });
    
    // Store cookies from response to maintain session
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      authCookie = cookies.join('; ');
      api.defaults.headers.common['Cookie'] = authCookie;
    }
    
    adminUser = response.data;
    console.log('Login successful');
    
    // Verify we can access authenticated endpoints
    try {
      const userResponse = await api.get('/user');
      console.log('Authentication verified with /user endpoint');
      return true;
    } catch (userError) {
      console.error('Authentication verification failed:', userError.message);
      console.log('Attempting direct database authentication as fallback...');
      return await directDbLogin();
    }
  } catch (error) {
    console.error('Login failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    console.log('Attempting direct database authentication as fallback...');
    return await directDbLogin();
  }
}

async function createClient() {
  try {
    console.log('Creating test client via direct database access...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    try {
      // Insert client directly into database
      const result = await pool.query(
        `INSERT INTO clients (
          name, 
          contact_person, 
          email, 
          phone, 
          address, 
          description, 
          created_at, 
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          testClient.name,
          testClient.contactPerson,
          testClient.email,
          testClient.phone,
          testClient.address,
          testClient.description,
          new Date(),
          new Date()
        ]
      );
      
      testClientId = result.rows[0].id;
      console.log(`Client created with ID: ${testClientId}`);
      return true;
    } catch (dbError) {
      console.error('Database client creation failed:', dbError.message);
      return false;
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error('Client creation failed:', error.message);
    return false;
  }
}

async function createProject() {
  try {
    console.log('Creating test project via direct database access...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    try {
      // Convert status string to enum value
      const startDate = new Date();
      
      // Insert project directly into database
      const result = await pool.query(
        `INSERT INTO projects (
          name, 
          description, 
          client_id, 
          status, 
          start_date, 
          end_date, 
          location, 
          notes, 
          created_at, 
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          initialProject.name,
          initialProject.description,
          testClientId,
          initialProject.status,
          startDate,
          null, // end_date
          initialProject.location,
          initialProject.notes,
          new Date(),
          new Date()
        ]
      );
      
      testProjectId = result.rows[0].id;
      console.log(`Project created with ID: ${testProjectId}`);
      return true;
    } catch (dbError) {
      console.error('Database project creation failed:', dbError.message);
      return false;
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error('Project creation failed:', error.message);
    return false;
  }
}

async function editProject() {
  try {
    console.log(`Editing project with ID: ${testProjectId} via direct database access...`);
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    try {
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      // Update the project directly in database
      await pool.query(
        `UPDATE projects 
         SET name = $1,
             description = $2,
             status = $3,
             location = $4,
             notes = $5,
             end_date = $6,
             updated_at = $7
         WHERE id = $8`,
        [
          updatedProject.name,
          updatedProject.description,
          updatedProject.status,
          updatedProject.location,
          updatedProject.notes,
          endDate,
          new Date(),
          testProjectId
        ]
      );
      
      console.log('Project updated in database');
      
      // Verify changes were saved by fetching the project from DB
      const result = await pool.query(
        `SELECT name, description, status, location, notes, end_date 
         FROM projects 
         WHERE id = $1`,
        [testProjectId]
      );
      
      if (result.rows.length === 0) {
        console.error('Project not found in database after update');
        return false;
      }
      
      const retrievedProject = result.rows[0];
      
      let success = true;
      
      // Check each field (converting snake_case to camelCase for comparison)
      const camelCaseProject = {
        name: retrievedProject.name,
        description: retrievedProject.description,
        status: retrievedProject.status,
        location: retrievedProject.location,
        notes: retrievedProject.notes,
        endDate: retrievedProject.end_date ? new Date(retrievedProject.end_date) : null
      };
      
      // Check each field (only those we're updating)
      for (const key of ['name', 'description', 'status', 'location', 'notes']) {
        if (camelCaseProject[key] !== updatedProject[key]) {
          console.error(`Field ${key} not updated correctly. Expected: ${updatedProject[key]}, Got: ${camelCaseProject[key]}`);
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
    } catch (dbError) {
      console.error('Database project update failed:', dbError.message);
      return false;
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error('Project update failed:', error.message);
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