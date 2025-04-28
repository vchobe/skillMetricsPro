// Testing script for client API
import fetch from 'node-fetch';

// The base URL of the server
const BASE_URL = 'http://localhost:5000';

// Credentials for login
const credentials = {
  username: 'admin@atyeti.com',
  password: 'Admin@123'
};

// Test client data
const testClient = {
  name: 'API Test Client',
  industry: 'Technology',
  website: 'https://example.com',
  notes: 'Created via API test',
  accountManagerId: 1 // Using ID 1 which should exist in most systems
};

// Storage for cookies and client ID
let cookies = '';
let createdClientId = null;

async function login() {
  console.log('Attempting to login...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials),
      redirect: 'manual'
    });
    
    // Get cookies from response
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      cookies = setCookieHeader;
      console.log('Login successful, received cookies');
    } else {
      console.log('No cookies received, login might have failed');
    }
    
    // Print response for debugging
    const data = await response.text();
    console.log('Login response:', data);
    
    return response.ok;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

async function createClient() {
  console.log('Creating test client...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        ...testClient,
        // Include some non-existent fields to test sanitization
        description: 'This field does not exist in the database',
        address: '123 Test Street',
        nonExistentField: 'This should be filtered out'
      })
    });
    
    if (response.ok) {
      const client = await response.json();
      createdClientId = client.id;
      console.log('Client created successfully with ID:', createdClientId);
      console.log('Client data:', client);
      return true;
    } else {
      const error = await response.text();
      console.error('Failed to create client:', error);
      return false;
    }
  } catch (error) {
    console.error('Error creating client:', error);
    return false;
  }
}

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
        'Cookie': cookies
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
    
    if (response.ok) {
      const client = await response.json();
      console.log('Client updated successfully');
      console.log('Updated client data:', client);
      return true;
    } else {
      const error = await response.text();
      console.error('Failed to update client:', error);
      return false;
    }
  } catch (error) {
    console.error('Error updating client:', error);
    return false;
  }
}

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
        'Cookie': cookies
      }
    });
    
    if (response.ok) {
      console.log('Client deleted successfully');
      return true;
    } else {
      const error = await response.text();
      console.error('Failed to delete client:', error);
      return false;
    }
  } catch (error) {
    console.error('Error deleting client:', error);
    return false;
  }
}

async function run() {
  console.log('Starting API test...');
  
  // Login first to get authenticated
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('Login failed, cannot proceed with tests');
    return;
  }
  
  // Create a new client
  const created = await createClient();
  if (!created) {
    console.error('Client creation failed, cannot proceed with update/delete tests');
    return;
  }
  
  // Update the client
  const updated = await updateClient();
  if (!updated) {
    console.error('Client update failed');
  }
  
  // Delete the client (cleanup)
  const deleted = await deleteClient();
  if (!deleted) {
    console.error('Client deletion failed');
  }
  
  console.log('API test completed!');
}

// Run the tests
run().catch(console.error);