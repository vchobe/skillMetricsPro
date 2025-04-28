// Testing script for client API
import fetch from 'node-fetch';

// The base URL of the server
const BASE_URL = 'https://b67a8223-ba73-4896-8b24-a3f11658d6d4-00-2b630wghr12ay.janeway.replit.dev';

// Credentials for login
const credentials = {
  username: 'adminatyeti',
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
    // First, get the CSRF token by loading the login page
    const initialResponse = await fetch(`${BASE_URL}/`, {
      method: 'GET'
    });
    
    // Extract any cookies from the initial response
    const initialCookies = initialResponse.headers.get('set-cookie');
    if (initialCookies) {
      cookies = initialCookies;
      console.log('Got initial cookies');
    }
    
    // Now attempt the login
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies // Include any cookies we got from the initial request
      },
      body: JSON.stringify(credentials),
      credentials: 'include',
      redirect: 'manual'
    });
    
    // Get cookies from response
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      cookies = setCookieHeader;
      console.log('Login successful, received cookies');
    } else {
      console.log('No cookies received from login response');
    }
    
    // Print response for debugging
    let data;
    let responseText;
    
    try {
      // Clone the response before consuming it
      const responseClone = response.clone();
      try {
        data = await responseClone.json();
        console.log('Login response (JSON):', data);
      } catch (e) {
        responseText = await response.text();
        console.log('Login response (Text):', responseText);
        data = responseText;
      }
    } catch (e) {
      console.error('Error parsing response:', e);
      data = null;
    }
    
    // Check if login was successful based on the response status
    const loginSuccess = response.ok;
    
    console.log('Login success?', loginSuccess);
    
    return loginSuccess;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

async function createClient() {
  console.log('Creating test client...');
  
  try {
    // First, get the authenticated user info to test if our session is valid
    const authResponse = await fetch(`${BASE_URL}/api/user`, {
      method: 'GET',
      headers: {
        'Cookie': cookies
      },
      credentials: 'include'
    });
    
    let authData;
    try {
      // Clone the response before consuming it
      const responseClone = authResponse.clone();
      authData = await responseClone.json();
      console.log('Authentication status:', authResponse.status, authData);
    } catch (e) {
      console.error('Error parsing auth response:', e);
      return false;
    }
    
    if (!authResponse.ok) {
      console.error('Not authenticated or session expired, cannot create client');
      return false;
    }
    
    // Now create the client
    const response = await fetch(`${BASE_URL}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      credentials: 'include',
      body: JSON.stringify({
        ...testClient,
        // Include some non-existent fields to test sanitization
        description: 'This field does not exist in the database',
        address: '123 Test Street',
        nonExistentField: 'This should be filtered out'
      })
    });
    
    // Check for any new cookies
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      cookies = setCookieHeader;
      console.log('Received new cookies from create client response');
    }
    
    if (response.ok) {
      let client;
      try {
        client = await response.json();
      } catch (e) {
        console.warn('Could not parse client as JSON:', e);
        const text = await response.text();
        console.log('Response text:', text);
        return false;
      }
      
      createdClientId = client.id;
      console.log('Client created successfully with ID:', createdClientId);
      console.log('Client data:', client);
      return true;
    } else {
      let error;
      try {
        error = await response.json();
      } catch (e) {
        error = await response.text();
      }
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
    // First verify we're still authenticated
    const authCheck = await fetch(`${BASE_URL}/api/user`, {
      method: 'GET',
      headers: {
        'Cookie': cookies
      },
      credentials: 'include'
    });
    
    let authCheckData;
    try {
      // Clone the response before consuming it
      const responseClone = authCheck.clone();
      authCheckData = await responseClone.json();
      console.log('Auth check status:', authCheck.status, authCheckData);
    } catch (e) {
      console.error('Error parsing auth check response:', e);
      return false;
    }
    
    if (!authCheck.ok) {
      console.error('Not authenticated or session expired, cannot update client');
      return false;
    }
    
    const response = await fetch(`${BASE_URL}/api/clients/${createdClientId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      credentials: 'include',
      body: JSON.stringify({
        ...testClient,
        name: 'Updated Test Client',
        // Include non-existent fields to test sanitization
        description: 'This field does not exist in the database',
        address: '456 Updated Street',
        nonExistentField: 'This should be filtered out'
      })
    });
    
    // Check for any new cookies
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      cookies = setCookieHeader;
      console.log('Received new cookies from update client response');
    }
    
    if (response.ok) {
      let client;
      try {
        client = await response.json();
        console.log('Client updated successfully');
        console.log('Updated client data:', client);
      } catch (e) {
        console.log('Client update successful, but no JSON response');
        return true;
      }
      return true;
    } else {
      let error;
      try {
        error = await response.json();
      } catch (e) {
        error = await response.text();
      }
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
    // First verify we're still authenticated
    const authCheck = await fetch(`${BASE_URL}/api/user`, {
      method: 'GET',
      headers: {
        'Cookie': cookies
      },
      credentials: 'include'
    });
    
    let authCheckData;
    try {
      // Clone the response before consuming it
      const responseClone = authCheck.clone();
      authCheckData = await responseClone.json();
      console.log('Auth check status:', authCheck.status, authCheckData);
    } catch (e) {
      console.error('Error parsing auth check response:', e);
      return false;
    }
    
    if (!authCheck.ok) {
      console.error('Not authenticated or session expired, cannot delete client');
      return false;
    }
    
    const response = await fetch(`${BASE_URL}/api/clients/${createdClientId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': cookies
      },
      credentials: 'include'
    });
    
    // Check for any new cookies
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      cookies = setCookieHeader;
      console.log('Received new cookies from delete client response');
    }
    
    if (response.ok) {
      console.log('Client deleted successfully');
      return true;
    } else {
      let error;
      try {
        error = await response.json();
      } catch (e) {
        error = await response.text();
      }
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