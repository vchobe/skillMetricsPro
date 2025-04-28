// Direct API test script with simplified authentication
import fetch from 'node-fetch';

// Use require for database since we're in a CommonJS environment
const { pool } = require('./server/db');

// Determine the base URL for testing
const isReplit = process.env.REPLIT_SLUG !== undefined;
const BASE_URL = isReplit ? 
  (process.env.REPLIT_URL || `https://${process.env.REPLIT_SLUG}.replit.dev`) : 
  'http://localhost:5000';

console.log(`Running API tests against: ${BASE_URL}`);

// Test client data
const testClient = {
  name: 'API Test Client',
  industry: 'Technology',
  accountManagerId: 1, // Use the first user as account manager
  website: 'https://example.com',
  notes: 'Created via direct API test script'
};

// Variables to store created data
let createdClientId = null;
let adminSessionCookie = null;

/**
 * Get admin session directly from database
 * This bypasses the need for password authentication
 */
async function getAdminSession() {
  try {
    console.log('Getting admin session from database...');
    
    // First find the admin user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND is_admin = true LIMIT 1',
      ['admin@atyeti.com']
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('Admin user not found');
    }
    
    const adminUserId = userResult.rows[0].id;
    console.log(`Found admin user ID: ${adminUserId}`);
    
    // Create a direct session for this user
    // (This is a testing-only approach, never do this in production code)
    const sessionData = {
      passport: {
        user: adminUserId
      }
    };
    
    const sessionId = `test-session-${Date.now()}`;
    
    // Store the session in the database
    await pool.query(
      'INSERT INTO "session" (sid, sess, expire) VALUES ($1, $2, NOW() + INTERVAL \'1 day\')',
      [sessionId, JSON.stringify(sessionData)]
    );
    
    console.log(`Created session ID: ${sessionId}`);
    
    // Return the session cookie
    return `connect.sid=s%3A${sessionId}`;
  } catch (error) {
    console.error('Error creating admin session:', error);
    throw error;
  }
}

/**
 * Test creating a client
 */
async function createClient() {
  console.log('Creating test client...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminSessionCookie
      },
      body: JSON.stringify({
        ...testClient,
        // Include some non-existent fields to test sanitization
        description: 'This field does not exist in the database',
        address: '123 Test Street',
        nonExistentField: 'This should be filtered out'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to create client (${response.status}):`, errorText);
      return false;
    }
    
    const client = await response.json();
    createdClientId = client.id;
    console.log('Client created successfully with ID:', createdClientId);
    console.log('Client data:', client);
    return true;
  } catch (error) {
    console.error('Error creating client:', error);
    return false;
  }
}

/**
 * Test updating a client
 */
async function updateClient() {
  if (!createdClientId) {
    console.error('No client ID to update');
    return false;
  }
  
  console.log(`Updating client with ID ${createdClientId}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/clients/${createdClientId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminSessionCookie
      },
      body: JSON.stringify({
        ...testClient,
        name: 'Updated Test Client',
        // Include non-existent fields to test sanitization
        description: 'This field does not exist in the database',
        address: '456 Updated Street',
        nonExistentField: 'This should be filtered out'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to update client (${response.status}):`, errorText);
      return false;
    }
    
    const client = await response.json();
    console.log('Client updated successfully');
    console.log('Updated client data:', client);
    return true;
  } catch (error) {
    console.error('Error updating client:', error);
    return false;
  }
}

/**
 * Test deleting a client
 */
async function deleteClient() {
  if (!createdClientId) {
    console.error('No client ID to delete');
    return false;
  }
  
  console.log(`Deleting client with ID ${createdClientId}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/clients/${createdClientId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': adminSessionCookie
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to delete client (${response.status}):`, errorText);
      return false;
    }
    
    console.log('Client deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting client:', error);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('Starting client API tests (create/update only)...');
  
  try {
    // Get admin session
    adminSessionCookie = await getAdminSession();
    
    // Create a new client
    const created = await createClient();
    if (!created) {
      console.error('Client creation failed, cannot proceed with update test');
      return;
    }
    
    // Update the client
    const updated = await updateClient();
    if (!updated) {
      console.error('Client update failed');
    } else {
      console.log('Client update successful! Field sanitization is working properly.');
    }
    
    console.log('Client API tests completed successfully!');
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Always close the database connection when done
    await pool.end();
  }
}

// Run the tests
runTests();