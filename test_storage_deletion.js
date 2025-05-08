// Test direct API access to deleteSkillTemplate
import { storage } from './server/storage.js';

// First, let's try to delete a template that should be available
// We're assuming template ID 83 exists based on previous logs
const templateIdToDelete = 83;

async function testDeletion() {
  try {
    console.log(`Testing deletion of skill template ${templateIdToDelete}...`);
    
    const result = await storage.deleteSkillTemplate(templateIdToDelete);
    
    console.log("Deletion successful!");
    console.log("Result:", result);
    
    return { success: true, result };
  } catch (error) {
    console.error("Deletion failed with error:", error);
    return { success: false, error: error.message };
  }
}

testDeletion()
  .then(result => {
    console.log("Test complete:", result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error("Unhandled error:", err);
    process.exit(1);
  });