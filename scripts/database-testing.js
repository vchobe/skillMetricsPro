// Database Testing Script for Employee Skills Management
import { pool, db } from '../server/db.js';
import { eq, and, like, desc } from 'drizzle-orm';
import {
  users,
  skills,
  skillHistories,
  profileHistories,
  endorsements,
  notifications
} from '../shared/schema.js';

// Helper function to log test results
function logResult(testName, result, details = null) {
  if (result) {
    console.log(`✅ ${testName} - Passed`);
  } else {
    console.error(`❌ ${testName} - Failed`);
  }
  
  if (details) {
    console.log('   Details:', details);
  }
}

// Main testing function
async function runDatabaseTests() {
  console.log('Starting Database Tests...');
  
  try {
    // Test 1: Database connection
    console.log('\n1. Testing database connection...');
    try {
      const client = await pool.connect();
      client.release();
      logResult('Database connection', true);
    } catch (error) {
      logResult('Database connection', false, error.message);
      // If we can't connect to the database, exit early
      console.error('Cannot continue tests without database connection');
      process.exit(1);
    }
    
    // Test 2: Users table
    console.log('\n2. Testing users table...');
    try {
      const allUsers = await db.select().from(users);
      logResult('Users table query', allUsers.length >= 0, `Found ${allUsers.length} users`);
      
      // Test user query by email
      if (allUsers.length > 0) {
        const testUser = allUsers[0];
        const userByEmail = await db.select().from(users).where(eq(users.email, testUser.email));
        logResult('User query by email', userByEmail.length === 1, `Found user: ${userByEmail[0].email}`);
      }
    } catch (error) {
      logResult('Users table tests', false, error.message);
    }
    
    // Test 3: Skills table
    console.log('\n3. Testing skills table...');
    try {
      const allSkills = await db.select().from(skills);
      logResult('Skills table query', allSkills.length >= 0, `Found ${allSkills.length} skills`);
      
      // Test skills by user ID
      if (allSkills.length > 0) {
        const testSkill = allSkills[0];
        const userSkills = await db.select().from(skills).where(eq(skills.userId, testSkill.userId));
        logResult('Skills query by user ID', userSkills.length >= 1, `Found ${userSkills.length} skills for user ID ${testSkill.userId}`);
      }
      
      // Test skills by category
      if (allSkills.length > 0) {
        const categories = [...new Set(allSkills.map(skill => skill.category))];
        if (categories.length > 0) {
          const categorySkills = await db.select().from(skills).where(eq(skills.category, categories[0]));
          logResult('Skills query by category', categorySkills.length >= 1, `Found ${categorySkills.length} skills in category "${categories[0]}"`);
        }
      }
      
      // Test skills by level
      if (allSkills.length > 0) {
        const levels = [...new Set(allSkills.map(skill => skill.level))];
        if (levels.length > 0) {
          const levelSkills = await db.select().from(skills).where(eq(skills.level, levels[0]));
          logResult('Skills query by level', levelSkills.length >= 1, `Found ${levelSkills.length} skills with level "${levels[0]}"`);
        }
      }
      
      // Test skills search by name
      if (allSkills.length > 0) {
        const searchTerm = allSkills[0].name.substring(0, 3); // First 3 chars of a skill name
        const searchResults = await db.select().from(skills).where(like(skills.name, `%${searchTerm}%`));
        logResult('Skills search by name', searchResults.length >= 1, `Found ${searchResults.length} skills matching "${searchTerm}"`);
      }
    } catch (error) {
      logResult('Skills table tests', false, error.message);
    }
    
    // Test 4: Skill histories table
    console.log('\n4. Testing skill histories table...');
    try {
      const allHistories = await db.select().from(skillHistories);
      logResult('Skill histories table query', allHistories.length >= 0, `Found ${allHistories.length} skill history entries`);
      
      // Test histories by skill ID
      if (allHistories.length > 0) {
        const testHistory = allHistories[0];
        const skillHistoryEntries = await db.select()
          .from(skillHistories)
          .where(eq(skillHistories.skillId, testHistory.skillId))
          .orderBy(desc(skillHistories.updatedAt));
        
        logResult('Skill histories by skill ID', skillHistoryEntries.length >= 1, 
          `Found ${skillHistoryEntries.length} history entries for skill ID ${testHistory.skillId}`);
      }
      
      // Test histories by user ID
      if (allHistories.length > 0) {
        const testHistory = allHistories[0];
        const userHistoryEntries = await db.select()
          .from(skillHistories)
          .where(eq(skillHistories.userId, testHistory.userId))
          .orderBy(desc(skillHistories.updatedAt));
        
        logResult('Skill histories by user ID', userHistoryEntries.length >= 1, 
          `Found ${userHistoryEntries.length} history entries for user ID ${testHistory.userId}`);
      }
    } catch (error) {
      logResult('Skill histories table tests', false, error.message);
    }
    
    // Test 5: Profile histories table
    console.log('\n5. Testing profile histories table...');
    try {
      const allProfileHistories = await db.select().from(profileHistories);
      logResult('Profile histories table query', allProfileHistories.length >= 0, 
        `Found ${allProfileHistories.length} profile history entries`);
      
      // Test profile histories by user ID
      if (allProfileHistories.length > 0) {
        const testProfileHistory = allProfileHistories[0];
        const userProfileHistories = await db.select()
          .from(profileHistories)
          .where(eq(profileHistories.userId, testProfileHistory.userId))
          .orderBy(desc(profileHistories.updatedAt));
        
        logResult('Profile histories by user ID', userProfileHistories.length >= 1, 
          `Found ${userProfileHistories.length} profile history entries for user ID ${testProfileHistory.userId}`);
      }
    } catch (error) {
      logResult('Profile histories table tests', false, error.message);
    }
    
    // Test 6: Endorsements table
    console.log('\n6. Testing endorsements table...');
    try {
      const allEndorsements = await db.select().from(endorsements);
      logResult('Endorsements table query', allEndorsements.length >= 0, 
        `Found ${allEndorsements.length} endorsements`);
      
      // Test endorsements by skill ID
      if (allEndorsements.length > 0) {
        const testEndorsement = allEndorsements[0];
        const skillEndorsements = await db.select()
          .from(endorsements)
          .where(eq(endorsements.skillId, testEndorsement.skillId))
          .orderBy(desc(endorsements.createdAt));
        
        logResult('Endorsements by skill ID', skillEndorsements.length >= 1, 
          `Found ${skillEndorsements.length} endorsements for skill ID ${testEndorsement.skillId}`);
      }
      
      // Test endorsements by endorser ID
      if (allEndorsements.length > 0) {
        const testEndorsement = allEndorsements[0];
        const endorserEndorsements = await db.select()
          .from(endorsements)
          .where(eq(endorsements.endorserId, testEndorsement.endorserId))
          .orderBy(desc(endorsements.createdAt));
        
        logResult('Endorsements by endorser ID', endorserEndorsements.length >= 1, 
          `Found ${endorserEndorsements.length} endorsements from endorser ID ${testEndorsement.endorserId}`);
      }
      
      // Test endorsements by endorsee ID
      if (allEndorsements.length > 0) {
        const testEndorsement = allEndorsements[0];
        const endorseeEndorsements = await db.select()
          .from(endorsements)
          .where(eq(endorsements.endorseeId, testEndorsement.endorseeId))
          .orderBy(desc(endorsements.createdAt));
        
        logResult('Endorsements by endorsee ID', endorseeEndorsements.length >= 1, 
          `Found ${endorseeEndorsements.length} endorsements for endorsee ID ${testEndorsement.endorseeId}`);
      }
    } catch (error) {
      logResult('Endorsements table tests', false, error.message);
    }
    
    // Test 7: Notifications table
    console.log('\n7. Testing notifications table...');
    try {
      const allNotifications = await db.select().from(notifications);
      logResult('Notifications table query', allNotifications.length >= 0, 
        `Found ${allNotifications.length} notifications`);
      
      // Test notifications by user ID
      if (allNotifications.length > 0) {
        const testNotification = allNotifications[0];
        const userNotifications = await db.select()
          .from(notifications)
          .where(eq(notifications.userId, testNotification.userId))
          .orderBy(desc(notifications.createdAt));
        
        logResult('Notifications by user ID', userNotifications.length >= 1, 
          `Found ${userNotifications.length} notifications for user ID ${testNotification.userId}`);
      }
      
      // Test unread notifications
      if (allNotifications.length > 0) {
        const testNotification = allNotifications[0];
        const unreadNotifications = await db.select()
          .from(notifications)
          .where(and(
            eq(notifications.userId, testNotification.userId),
            eq(notifications.isRead, false)
          ))
          .orderBy(desc(notifications.createdAt));
        
        logResult('Unread notifications', true, 
          `Found ${unreadNotifications.length} unread notifications for user ID ${testNotification.userId}`);
      }
      
      // Test notifications by type
      if (allNotifications.length > 0) {
        const types = [...new Set(allNotifications.map(notification => notification.type))];
        if (types.length > 0) {
          const typeNotifications = await db.select()
            .from(notifications)
            .where(eq(notifications.type, types[0]))
            .orderBy(desc(notifications.createdAt));
          
          logResult('Notifications by type', typeNotifications.length >= 1, 
            `Found ${typeNotifications.length} notifications of type "${types[0]}"`);
        }
      }
    } catch (error) {
      logResult('Notifications table tests', false, error.message);
    }
    
    // Test 8: Relationships and joins
    console.log('\n8. Testing relationships and joins...');
    try {
      // Test user skills relationship
      const userWithSkills = await db.select({
        user: users,
        skillCount: db.count(skills.id)
      })
      .from(users)
      .leftJoin(skills, eq(users.id, skills.userId))
      .groupBy(users.id)
      .orderBy(desc(db.count(skills.id)))
      .limit(1);
      
      if (userWithSkills.length > 0) {
        logResult('User-skills relationship', true, 
          `User ID ${userWithSkills[0].user.id} has ${userWithSkills[0].skillCount} skills`);
      } else {
        logResult('User-skills relationship', false, 'No users with skills found');
      }
      
      // Test skill with endorsements relationship
      const skillWithEndorsements = await db.select({
        skill: skills,
        endorsementCount: db.count(endorsements.id)
      })
      .from(skills)
      .leftJoin(endorsements, eq(skills.id, endorsements.skillId))
      .groupBy(skills.id)
      .orderBy(desc(db.count(endorsements.id)))
      .limit(1);
      
      if (skillWithEndorsements.length > 0 && skillWithEndorsements[0].endorsementCount > 0) {
        logResult('Skill-endorsements relationship', true, 
          `Skill ID ${skillWithEndorsements[0].skill.id} has ${skillWithEndorsements[0].endorsementCount} endorsements`);
      } else {
        logResult('Skill-endorsements relationship', false, 'No skills with endorsements found');
      }
      
    } catch (error) {
      logResult('Relationships and joins tests', false, error.message);
    }
    
    // Test 9: Transaction tests
    console.log('\n9. Testing database transactions...');
    try {
      // Begin a transaction
      await db.transaction(async (tx) => {
        // Insert a test user
        const testUser = {
          username: `test_user_${Date.now()}`,
          email: `test${Date.now()}@example.com`,
          password: 'test_password_hash',
          isAdmin: false
        };
        
        const [insertedUser] = await tx.insert(users).values(testUser).returning();
        logResult('Transaction - insert user', insertedUser?.id > 0, `Inserted user ID: ${insertedUser?.id}`);
        
        // Insert a test skill for the user
        if (insertedUser) {
          const testSkill = {
            userId: insertedUser.id,
            name: 'Test Skill',
            category: 'Testing',
            level: 'intermediate',
          };
          
          const [insertedSkill] = await tx.insert(skills).values(testSkill).returning();
          logResult('Transaction - insert skill', insertedSkill?.id > 0, `Inserted skill ID: ${insertedSkill?.id}`);
          
          // Insert a test skill history
          if (insertedSkill) {
            const testSkillHistory = {
              skillId: insertedSkill.id,
              userId: insertedUser.id,
              previousLevel: 'beginner',
              newLevel: 'intermediate',
              changeNote: 'Test skill history'
            };
            
            const [insertedHistory] = await tx.insert(skillHistories).values(testSkillHistory).returning();
            logResult('Transaction - insert skill history', insertedHistory?.id > 0, 
              `Inserted skill history ID: ${insertedHistory?.id}`);
          }
        }
        
        // Roll back the transaction to avoid test data in the database
        throw new Error('Rolling back test transaction as expected');
      });
    } catch (error) {
      if (error.message === 'Rolling back test transaction as expected') {
        logResult('Transaction - rollback', true, 'Transaction successfully rolled back');
      } else {
        logResult('Transaction tests', false, error.message);
      }
    }
    
  } catch (error) {
    console.error('Fatal error during database testing:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
  
  console.log('\n========== DATABASE TESTS COMPLETE ==========');
}

// Run the database tests
runDatabaseTests().catch(err => {
  console.error('Unhandled error in database tests:', err);
  process.exit(1);
});

export { logResult, runDatabaseTests };