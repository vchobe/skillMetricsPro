// Testing script for client API
import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';

// Determine the base URL of the server
// When running in Replit, default to the current environment URL
const BASE_URL = process.env.REPLIT_ENVIRONMENT === 'true' 
  ? (process.env.REPLIT_URL || 'http://localhost:5000')
  : (process.env.API_URL || 'http://localhost:5000');

// Credentials for login
const credentials = {
  email: 'admin@atyeti.com',
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

// Create a cookie jar to manage cookies
const cookieJar = new CookieJar();
let createdClientId = null;

// Helper function to get cookies as string for fetch
async function getCookiesForUrl(url) {
  return await cookieJar.getCookieString(url);
}

// Helper function to add cookies from response
async function addCookiesFromResponse(response, url) {
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    // Split multiple cookies if needed
    const cookies = setCookieHeader.split(/,\s*/);
    for (const cookie of cookies) {
      await cookieJar.setCookie(cookie, url);
    }
    console.log('Added cookies from response');
    return true;
  }
  return false;
}

async function login() {
  console.log('Attempting to login...');
  
  try {
    // First, get any initial cookies by loading the homepage
    const initialResponse = await fetch(`${BASE_URL}/`, {
      method: 'GET'
    });
    
    // Store any cookies from the initial response
    await addCookiesFromResponse(initialResponse, BASE_URL);
    
    // Get the cookies as a string for the login request
    const cookieString = await getCookiesForUrl(BASE_URL);
    console.log('Initial cookies for login:', cookieString || 'none');
    
    // Now attempt the login
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString
      },
      body: JSON.stringify(credentials),
      credentials: 'include',
      redirect: 'manual'
    });
    
    // Store any session cookies from the login response
    const addedCookies = await addCookiesFromResponse(response, BASE_URL);
    if (addedCookies) {
      console.log('Login successful, stored session cookies');
    } else {
      console.log('No cookies received from login response');
    }
    
    // Print response for debugging
    let data;
    
    try {
      // Clone the response before consuming it
      const responseClone = response.clone();
      try {
        data = await responseClone.json();
        console.log('Login response (JSON):', data);
      } catch (e) {
        const responseText = await response.text();
        if (responseText.includes('DOCTYPE html')) {
          console.log('Login response returned HTML (truncated):', responseText.substring(0, 100) + '...');
        } else {
          console.log('Login response (Text):', responseText);
        }
      }
    } catch (e) {
      console.error('Error parsing response:', e);
    }
    
    // Check if login was successful based on the response status
    const loginSuccess = response.ok;
    console.log('Login success?', loginSuccess, 'Status:', response.status);

    if (loginSuccess) {
      // After login success, verify with /api/user to confirm session is active
      console.log('Verifying session with /api/user...');
      const verifyResponse = await fetch(`${BASE_URL}/api/user`, {
        method: 'GET',
        headers: {
          'Cookie': await getCookiesForUrl(BASE_URL)
        },
        credentials: 'include'
      });
      
      const responseClone = verifyResponse.clone();
      let verifyData;
      try {
        verifyData = await responseClone.json();
        console.log('Session verification:', verifyResponse.status, verifyData);
      } catch (e) {
        console.error('Error parsing user verification response:', e);
      }
      
      const sessionValid = verifyResponse.ok && verifyData && verifyData.id;
      if (sessionValid) {
        console.log('Session is valid, user ID:', verifyData.id);
      } else {
        console.log('Session verification failed');
      }
      
      return sessionValid;
    }
    
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
    const cookieString = await getCookiesForUrl(BASE_URL);
    console.log('Current cookies for create client:', cookieString || 'none');
    
    const authResponse = await fetch(`${BASE_URL}/api/user`, {
      method: 'GET',
      headers: {
        'Cookie': cookieString
      },
      credentials: 'include'
    });
    
    // Store any cookies from the auth response
    await addCookiesFromResponse(authResponse, BASE_URL);
    
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
        'Cookie': await getCookiesForUrl(BASE_URL)
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
    
    // Store any cookies from the create response
    await addCookiesFromResponse(response, BASE_URL);
    
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
        const responseClone = response.clone();
        error = await responseClone.json();
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
    // Get current cookies
    const cookieString = await getCookiesForUrl(BASE_URL);
    console.log('Current cookies for update client:', cookieString || 'none');
    
    // First verify we're still authenticated
    const authCheck = await fetch(`${BASE_URL}/api/user`, {
      method: 'GET',
      headers: {
        'Cookie': cookieString
      },
      credentials: 'include'
    });
    
    // Store any cookies from the auth check
    await addCookiesFromResponse(authCheck, BASE_URL);
    
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
        'Cookie': await getCookiesForUrl(BASE_URL)
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
    
    // Store any cookies from the update response
    await addCookiesFromResponse(response, BASE_URL);
    
    if (response.ok) {
      let client;
      try {
        // Clone the response before consuming it
        const responseClone = response.clone();
        client = await responseClone.json();
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
        // Clone the response before consuming it
        const responseClone = response.clone();
        error = await responseClone.json();
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
    // Get current cookies
    const cookieString = await getCookiesForUrl(BASE_URL);
    console.log('Current cookies for delete client:', cookieString || 'none');
    
    // First verify we're still authenticated
    const authCheck = await fetch(`${BASE_URL}/api/user`, {
      method: 'GET',
      headers: {
        'Cookie': cookieString
      },
      credentials: 'include'
    });
    
    // Store any cookies from the auth check
    await addCookiesFromResponse(authCheck, BASE_URL);
    
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
        'Cookie': await getCookiesForUrl(BASE_URL)
      },
      credentials: 'include'
    });
    
    // Store any cookies from the delete response
    await addCookiesFromResponse(response, BASE_URL);
    
    if (response.ok) {
      console.log('Client deleted successfully');
      return true;
    } else {
      let error;
      try {
        // Clone the response before consuming it
        const responseClone = response.clone();
        error = await responseClone.json();
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