// API Testing Script for Employee Skills Management
const axios = require('axios');
const assert = require('assert');

// Base URL for API requests
const API_BASE_URL = 'http://localhost:5000/api';

// Test credentials
let testEmail = `test${Date.now()}@example.com`;
let testPassword = '';
let userId = null;
let skillIds = [];
let testSkillId = null;

// Test data
const testSkill = {
  name: 'JavaScript',
  category: 'Programming Languages',
  level: 'intermediate',
  certification: 'JavaScript Developer',
  notes: 'Test notes for JavaScript',
  credlyLink: 'https://credly.com/example'
};

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null) {
  try {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      data,
      headers,
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`API Error (${error.response.status}):`, error.response.data);
      return { error: error.response.data, status: error.response.status };
    } else {
      console.error('API Error:', error.message);
      return { error: error.message };
    }
  }
}

// Main test function
async function runTests() {
  console.log('Starting API Tests...');
  let success = true;
  
  try {
    // Test 1: Register a new user
    console.log('\n1. Testing user registration...');
    const registerResponse = await apiRequest('post', '/register', { email: testEmail });
    
    if (registerResponse.error) {
      console.error('❌ Registration failed:', registerResponse.error);
      success = false;
    } else {
      console.log('✅ Registration successful');
      userId = registerResponse.id;
      console.log(`   User ID: ${userId}`);
      console.log(`   Email: ${testEmail}`);
      
      // Get the generated password from response or console logs
      console.log('   Check server logs for generated password');
    }
    
    // Test 2: Login
    console.log('\n2. Testing login...');
    console.log('   Please enter the password from the server logs:');
    // In an actual automated test, we would extract this from logs or have a known password
    // This is a placeholder for manual testing
    testPassword = '<PASSWORD_FROM_LOGS>';
    
    const loginResponse = await apiRequest('post', '/login', { 
      email: testEmail, 
      password: testPassword 
    });
    
    if (loginResponse.error) {
      console.error('❌ Login failed:', loginResponse.error);
      success = false;
    } else {
      console.log('✅ Login successful');
      console.log(`   User data received: ${loginResponse.email}`);
    }
    
    // Test 3: Get current user
    console.log('\n3. Testing get current user...');
    const userResponse = await apiRequest('get', '/user');
    
    if (userResponse.error) {
      console.error('❌ Get user failed:', userResponse.error);
      success = false;
    } else {
      console.log('✅ Get user successful');
      console.log(`   User email: ${userResponse.email}`);
      userId = userResponse.id; // Ensure we have the correct user ID
    }
    
    // Test 4: Create a skill
    console.log('\n4. Testing create skill...');
    const createSkillResponse = await apiRequest('post', '/skills', {
      ...testSkill,
      userId
    });
    
    if (createSkillResponse.error) {
      console.error('❌ Create skill failed:', createSkillResponse.error);
      success = false;
    } else {
      console.log('✅ Create skill successful');
      console.log(`   Skill name: ${createSkillResponse.name}`);
      console.log(`   Skill level: ${createSkillResponse.level}`);
      testSkillId = createSkillResponse.id;
    }
    
    // Test 5: Get user skills
    console.log('\n5. Testing get user skills...');
    const userSkillsResponse = await apiRequest('get', '/skills');
    
    if (userSkillsResponse.error) {
      console.error('❌ Get user skills failed:', userSkillsResponse.error);
      success = false;
    } else {
      console.log('✅ Get user skills successful');
      console.log(`   Number of skills: ${userSkillsResponse.length}`);
      skillIds = userSkillsResponse.map(skill => skill.id);
    }
    
    // Test 6: Get specific skill
    if (testSkillId) {
      console.log('\n6. Testing get specific skill...');
      const skillResponse = await apiRequest('get', `/skills/${testSkillId}`);
      
      if (skillResponse.error) {
        console.error('❌ Get skill failed:', skillResponse.error);
        success = false;
      } else {
        console.log('✅ Get skill successful');
        console.log(`   Skill name: ${skillResponse.name}`);
        console.log(`   Skill category: ${skillResponse.category}`);
      }
    }
    
    // Test 7: Update skill
    if (testSkillId) {
      console.log('\n7. Testing update skill...');
      const updateSkillResponse = await apiRequest('patch', `/skills/${testSkillId}`, {
        level: 'expert',
        notes: 'Updated notes for JavaScript skill'
      });
      
      if (updateSkillResponse.error) {
        console.error('❌ Update skill failed:', updateSkillResponse.error);
        success = false;
      } else {
        console.log('✅ Update skill successful');
        console.log(`   New level: ${updateSkillResponse.level}`);
      }
    }
    
    // Test 8: Create skill history
    if (testSkillId) {
      console.log('\n8. Testing create skill history...');
      const createHistoryResponse = await apiRequest('post', '/skill-histories', {
        skillId: testSkillId,
        userId,
        previousLevel: 'intermediate',
        newLevel: 'expert',
        changeNote: 'Completed advanced course'
      });
      
      if (createHistoryResponse.error) {
        console.error('❌ Create skill history failed:', createHistoryResponse.error);
        success = false;
      } else {
        console.log('✅ Create skill history successful');
        console.log(`   Previous level: ${createHistoryResponse.previousLevel}`);
        console.log(`   New level: ${createHistoryResponse.newLevel}`);
      }
    }
    
    // Test 9: Get skill history
    if (testSkillId) {
      console.log('\n9. Testing get skill history...');
      const getHistoryResponse = await apiRequest('get', `/skill-histories/${testSkillId}`);
      
      if (getHistoryResponse.error) {
        console.error('❌ Get skill history failed:', getHistoryResponse.error);
        success = false;
      } else {
        console.log('✅ Get skill history successful');
        console.log(`   Number of history entries: ${getHistoryResponse.length}`);
      }
    }
    
    // Test 10: Update user profile
    console.log('\n10. Testing update user profile...');
    const updateProfileResponse = await apiRequest('patch', '/user', {
      firstName: 'Test',
      lastName: 'User',
      role: 'Developer',
      location: 'Remote'
    });
    
    if (updateProfileResponse.error) {
      console.error('❌ Update profile failed:', updateProfileResponse.error);
      success = false;
    } else {
      console.log('✅ Update profile successful');
      console.log(`   Updated first name: ${updateProfileResponse.firstName}`);
    }
    
    // Test 11: Get profile history
    console.log('\n11. Testing get profile history...');
    const profileHistoryResponse = await apiRequest('get', '/user/profile/history');
    
    if (profileHistoryResponse.error) {
      console.error('❌ Get profile history failed:', profileHistoryResponse.error);
      success = false;
    } else {
      console.log('✅ Get profile history successful');
      console.log(`   Number of profile changes: ${profileHistoryResponse.length}`);
    }
    
    // Test 12: Create endorsement (would need another user in a real scenario)
    if (testSkillId) {
      console.log('\n12. Testing create endorsement (simulated)...');
      console.log('   Note: Creating an endorsement requires another user');
      console.log('   This test is simulated for demonstration');
      
      // In a real test, we would:
      // 1. Create another test user
      // 2. Login as that user
      // 3. Create an endorsement for the first user's skill
    }
    
    // Test 13: Get notifications
    console.log('\n13. Testing get notifications...');
    const notificationsResponse = await apiRequest('get', '/notifications');
    
    if (notificationsResponse.error) {
      console.error('❌ Get notifications failed:', notificationsResponse.error);
      success = false;
    } else {
      console.log('✅ Get notifications successful');
      console.log(`   Number of notifications: ${notificationsResponse.length}`);
    }
    
    // Test 14: Mark notification as read (if notifications exist)
    if (notificationsResponse && notificationsResponse.length > 0) {
      console.log('\n14. Testing mark notification as read...');
      const notificationId = notificationsResponse[0].id;
      
      const markReadResponse = await apiRequest('patch', `/notifications/${notificationId}`, {
        isRead: true
      });
      
      if (markReadResponse.error) {
        console.error('❌ Mark notification as read failed:', markReadResponse.error);
        success = false;
      } else {
        console.log('✅ Mark notification as read successful');
      }
    }
    
    // Test 15: Delete skill
    if (testSkillId) {
      console.log('\n15. Testing delete skill...');
      const deleteSkillResponse = await apiRequest('delete', `/skills/${testSkillId}`);
      
      if (deleteSkillResponse.error) {
        console.error('❌ Delete skill failed:', deleteSkillResponse.error);
        success = false;
      } else {
        console.log('✅ Delete skill successful');
      }
    }
    
    // Test 16: Reset password (if implemented)
    console.log('\n16. Testing password reset...');
    const resetPasswordResponse = await apiRequest('post', '/reset-password', {
      email: testEmail
    });
    
    if (resetPasswordResponse.error) {
      console.error('❌ Password reset failed:', resetPasswordResponse.error);
      success = false;
    } else {
      console.log('✅ Password reset request successful');
      console.log('   Check server logs for reset password email');
    }
    
    // Test 17: Logout
    console.log('\n17. Testing logout...');
    const logoutResponse = await apiRequest('post', '/logout');
    
    if (logoutResponse.error) {
      console.error('❌ Logout failed:', logoutResponse.error);
      success = false;
    } else {
      console.log('✅ Logout successful');
    }
    
    // Test 18: Verify logged out
    console.log('\n18. Testing access after logout...');
    const verifyLogoutResponse = await apiRequest('get', '/user');
    
    if (verifyLogoutResponse.error && verifyLogoutResponse.status === 401) {
      console.log('✅ Successfully verified logout (got 401 as expected)');
    } else {
      console.error('❌ Failed to verify logout, still has access:', verifyLogoutResponse);
      success = false;
    }
    
  } catch (error) {
    console.error('Test execution error:', error);
    success = false;
  }
  
  // Summary
  console.log('\n========== TEST SUMMARY ==========');
  if (success) {
    console.log('✅ All tests completed successfully!');
  } else {
    console.log('❌ Some tests failed. See logs above for details.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error during testing:', error);
});