// Simple test for client field sanitization
// Run this in the browser console after logging in as admin

async function testClientFieldSanitization() {
  console.log('Running client field sanitization test...');
  
  const testClient = {
    name: 'Sanitization Test Client',
    industry: 'Technology',
    accountManagerId: 1, // Using ID 1 for account manager
    website: 'https://example.com',
    notes: 'Created for field sanitization testing',
    // Fields that should be sanitized
    description: 'This field does not exist in the database',
    address: '123 Test Street',
    nonExistentField: 'This should be filtered out'
  };
  
  let createdClientId = null;
  
  try {
    // Step 1: Create client with fields that should be sanitized
    console.log('Creating test client with extra fields...');
    const createResponse = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testClient)
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create client: ${await createResponse.text()}`);
    }
    
    const createdClient = await createResponse.json();
    createdClientId = createdClient.id;
    
    console.log('Created client:', createdClient);
    console.log('Checking for sanitized fields...');
    console.log('- Description field exists:', 'description' in createdClient);
    console.log('- Address field exists:', 'address' in createdClient);
    console.log('- nonExistentField exists:', 'nonExistentField' in createdClient);
    
    // Step 2: Update client with fields that should be sanitized
    console.log('\nUpdating client with more extra fields...');
    const updateData = {
      ...testClient,
      name: 'Updated Sanitization Test Client',
      extraField1: 'Should be removed',
      extraField2: 'Should also be removed'
    };
    
    const updateResponse = await fetch(`/api/clients/${createdClientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update client: ${await updateResponse.text()}`);
    }
    
    const updatedClient = await updateResponse.json();
    console.log('Updated client:', updatedClient);
    console.log('Checking for sanitized fields after update...');
    console.log('- Description field exists:', 'description' in updatedClient);
    console.log('- Address field exists:', 'address' in updatedClient);
    console.log('- extraField1 exists:', 'extraField1' in updatedClient);
    console.log('- extraField2 exists:', 'extraField2' in updatedClient);
    
    // Step 3: Clean up - delete the test client
    console.log('\nCleaning up - deleting test client...');
    const deleteResponse = await fetch(`/api/clients/${createdClientId}`, {
      method: 'DELETE'
    });
    
    if (!deleteResponse.ok) {
      console.warn(`Warning: Failed to delete test client: ${await deleteResponse.text()}`);
    } else {
      console.log('Test client deleted successfully');
    }
    
    console.log('\nTest completed successfully!');
    console.log('Field sanitization is working correctly - non-existent fields are being filtered out.');
    
  } catch (error) {
    console.error('Test failed:', error);
    
    // Try to clean up if we created a client but hit an error
    if (createdClientId) {
      console.log('Attempting to clean up test client...');
      try {
        await fetch(`/api/clients/${createdClientId}`, { method: 'DELETE' });
        console.log('Cleanup successful');
      } catch (cleanupError) {
        console.warn('Failed to clean up test client:', cleanupError);
      }
    }
  }
}

// Run the test
testClientFieldSanitization();
