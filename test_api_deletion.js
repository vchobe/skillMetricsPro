// Test script to directly interact with the API

import fetch from 'node-fetch';

// Template ID to delete
const templateId = 83;  // Replace with an actual template ID that exists

async function loginAdmin() {
  const loginResponse = await fetch('http://localhost:5000/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'admin@atyeti.com',
      password: 'admin'
    }),
    redirect: 'manual'
  });

  const cookies = loginResponse.headers.raw()['set-cookie'];
  
  if (!cookies) {
    throw new Error('Login failed - no session cookie received');
  }
  
  console.log('Login successful, got session cookie');
  return cookies;
}

async function deleteTemplate(cookies, templateId) {
  console.log(`Attempting to delete template ${templateId}...`);
  
  const deleteResponse = await fetch(`http://localhost:5000/api/super-admin/skill-templates/${templateId}`, {
    method: 'DELETE',
    headers: {
      'Cookie': cookies
    }
  });
  
  if (!deleteResponse.ok) {
    const errorText = await deleteResponse.text();
    throw new Error(`Delete request failed with status ${deleteResponse.status}: ${errorText}`);
  }
  
  const result = await deleteResponse.json();
  return result;
}

async function verifyDeletion(cookies, templateId) {
  const checkResponse = await fetch(`http://localhost:5000/api/skill-templates/${templateId}`, {
    headers: {
      'Cookie': cookies
    }
  });
  
  if (checkResponse.status === 404) {
    return { success: true, message: `Template ${templateId} no longer exists` };
  } else {
    const data = await checkResponse.json();
    return { 
      success: false, 
      message: `Template ${templateId} still exists`, 
      template: data 
    };
  }
}

async function runTest() {
  try {
    // Step 1: Login as admin
    const cookies = await loginAdmin();
    
    // Step 2: Delete the template
    const deleteResult = await deleteTemplate(cookies, templateId);
    console.log('Delete result:', deleteResult);
    
    // Step 3: Verify the deletion
    const verifyResult = await verifyDeletion(cookies, templateId);
    console.log('Verification result:', verifyResult);
    
    return {
      success: true,
      deleteResult,
      verifyResult
    };
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
runTest()
  .then(result => {
    console.log('Test complete:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });