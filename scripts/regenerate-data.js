/**
 * Script to regenerate all test data in the database
 * - Deletes all existing data except admin users
 * - Creates test users
 * - Adds skills and certifications to each user
 * - Creates endorsements and notifications
 */

const { Pool } = require('pg');
const { faker } = require('@faker-js/faker');
const { hash } = require('../server/auth');

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Categories for skills
const SKILL_CATEGORIES = [
  'Programming',
  'DevOps',
  'Design',
  'Project Management',
  'Marketing',
  'Leadership',
  'Communication',
  'Data Science',
  'Cloud',
  'Security',
];

// Skill level probabilities (for a realistic distribution)
const LEVEL_PROBABILITIES = {
  beginner: 0.4,
  intermediate: 0.4,
  expert: 0.2,
};

// Certification providers 
const CERTIFICATION_PROVIDERS = [
  'AWS',
  'Microsoft',
  'Google',
  'Oracle',
  'Cisco',
  'CompTIA',
  'RedHat',
  'Salesforce',
  'IBM',
  'Adobe',
];

// Common certification names by category
const CERTIFICATION_NAMES = {
  'Programming': ['Certified Developer', 'Code Professional', 'Programming Expert'],
  'DevOps': ['DevOps Professional', 'CI/CD Expert', 'Infrastructure Automation'],
  'Design': ['UX/UI Specialist', 'Design Systems Expert', 'Visual Design Professional'],
  'Project Management': ['PMP', 'Agile Coach', 'Scrum Master'],
  'Marketing': ['Digital Marketing', 'Content Strategy', 'SEO Expert'],
  'Leadership': ['Leadership Excellence', 'Executive Management', 'Team Leadership'],
  'Communication': ['Public Speaking', 'Business Communication', 'Technical Writing'],
  'Data Science': ['Data Scientist', 'ML Expert', 'Analytics Professional'],
  'Cloud': ['Cloud Architect', 'Solutions Architect', 'Cloud Security'],
  'Security': ['Security+', 'Ethical Hacker', 'Security Professional'],
};

// Skill names by category
const SKILL_NAMES = {
  'Programming': ['JavaScript', 'Python', 'Java', 'C#', 'Go', 'Ruby', 'Rust', 'TypeScript', 'PHP', 'Swift'],
  'DevOps': ['Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Git', 'Ansible', 'CI/CD', 'Monitoring', 'ELK Stack'],
  'Design': ['Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'UI Design', 'UX Research', 'Design Systems'],
  'Project Management': ['Agile', 'Scrum', 'Kanban', 'JIRA', 'MS Project', 'Risk Management', 'Budgeting'],
  'Marketing': ['SEO', 'Content Marketing', 'Social Media', 'Analytics', 'Email Marketing', 'CRM', 'Ad Campaigns'],
  'Leadership': ['Team Leadership', 'Coaching', 'Strategic Planning', 'Decision Making', 'Change Management'],
  'Communication': ['Public Speaking', 'Technical Writing', 'Presentations', 'Negotiation', 'Client Communication'],
  'Data Science': ['Python', 'R', 'SQL', 'Machine Learning', 'Data Visualization', 'Statistics', 'BigQuery', 'Tableau'],
  'Cloud': ['AWS', 'Azure', 'GCP', 'Cloud Architecture', 'Serverless', 'Containerization', 'IaC'],
  'Security': ['Penetration Testing', 'Security Auditing', 'Encryption', 'Authentication', 'Network Security'],
};

// Test users to create
const NUM_USERS = 20;

/**
 * Generate a random date between start and end dates
 */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generate a Credly badge link
 */
function generateCredlyLink() {
  return `https://credly.com/badges/${faker.string.alphanumeric(8).toLowerCase()}`;
}

/**
 * Reset all data in the database
 */
async function resetDatabase() {
  console.log('Resetting database...');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete data from all tables except users table
    await client.query('DELETE FROM endorsements');
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM profile_histories');
    await client.query('DELETE FROM skill_histories');
    await client.query('DELETE FROM skills');
    
    // Delete regular users but keep admin users
    await client.query('DELETE FROM users WHERE is_admin = false');
    
    await client.query('COMMIT');
    console.log('Database reset complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error resetting database:', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Create test users
 */
async function createTestUsers() {
  console.log(`Creating ${NUM_USERS} test users...`);
  
  const users = [];
  for (let i = 0; i < NUM_USERS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const password = await hash('password123'); // Use a common password for testing
    
    // Assign a project and role
    const project = faker.helpers.arrayElement([
      'Customer Portal', 'Data Analytics Platform', 'Mobile App', 
      'Infrastructure Migration', 'E-commerce Website', 'HR System',
      'CRM Implementation', 'Internal Tools', 'Reporting Dashboard'
    ]);
    
    const role = faker.helpers.arrayElement([
      'Software Developer', 'Project Manager', 'Designer',
      'QA Engineer', 'DevOps Engineer', 'Data Scientist',
      'Product Manager', 'Scrum Master', 'Business Analyst',
      'Marketing Specialist', 'Team Lead'
    ]);
    
    // Insert user into database
    const result = await pool.query(
      `INSERT INTO users (email, username, password, is_admin, role, project, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [email, username, password, false, role, project, new Date(), new Date()]
    );
    
    const userId = result.rows[0].id;
    users.push({ 
      id: userId, 
      email, 
      username, 
      role, 
      project 
    });
  }
  
  console.log(`Created ${users.length} test users`);
  return users;
}

/**
 * Create skills for users
 */
async function createSkills(users) {
  console.log('Creating skills for users...');
  
  const skills = [];
  for (const user of users) {
    // Create 10 skills per user
    const userSkillCategories = new Set();
    while (userSkillCategories.size < 5) {
      userSkillCategories.add(faker.helpers.arrayElement(SKILL_CATEGORIES));
    }
    
    const userSkillCategories1 = [...userSkillCategories];
    
    // Generate 10 skills per user
    for (let i = 0; i < 10; i++) {
      const category = faker.helpers.arrayElement(userSkillCategories1);
      
      // Get skill name from the category, ensure unique skills for a user
      const skillNames = SKILL_NAMES[category];
      const name = faker.helpers.arrayElement(skillNames);
      
      // Determine skill level based on probabilities
      const levelRoll = Math.random();
      let level;
      if (levelRoll < LEVEL_PROBABILITIES.beginner) {
        level = 'beginner';
      } else if (levelRoll < LEVEL_PROBABILITIES.beginner + LEVEL_PROBABILITIES.intermediate) {
        level = 'intermediate';
      } else {
        level = 'expert';
      }
      
      // 30% of skills will have certifications
      const hasCertification = Math.random() < 0.3;
      
      let certification = null;
      let credlyLink = null;
      let certificationDate = null;
      let expirationDate = null;
      
      if (hasCertification) {
        const provider = faker.helpers.arrayElement(CERTIFICATION_PROVIDERS);
        const certNames = CERTIFICATION_NAMES[category];
        const certName = faker.helpers.arrayElement(certNames);
        certification = `${provider} ${certName}`;
        credlyLink = generateCredlyLink();
        
        // Set certification date in the past (1-2 years ago)
        const now = new Date();
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(now.getFullYear() - 2);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        
        certificationDate = randomDate(twoYearsAgo, oneYearAgo);
        
        // Set expiration date 2 years after certification date
        expirationDate = new Date(certificationDate);
        expirationDate.setFullYear(certificationDate.getFullYear() + 2);
      }
      
      const endorsementCount = Math.floor(Math.random() * 5);
      const createdAt = new Date();
      const notes = `Experience with ${name}`;
      
      const result = await pool.query(
        `INSERT INTO skills (
          user_id, name, category, level, certification, credly_link, 
          notes, endorsement_count, last_updated, created_at,
          certification_date, expiration_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [
          user.id, name, category, level, certification, credlyLink, 
          notes, endorsementCount, createdAt, createdAt,
          certificationDate, expirationDate
        ]
      );
      
      const skillId = result.rows[0].id;
      skills.push({
        id: skillId,
        userId: user.id,
        name,
        category,
        level,
        certification,
        credlyLink,
        notes,
        endorsementCount,
        lastUpdated: createdAt,
        createdAt,
        certificationDate,
        expirationDate
      });
    }
  }
  
  console.log(`Created ${skills.length} skills`);
  return skills;
}

/**
 * Create skill histories
 */
async function createSkillHistories(skills, users) {
  console.log('Creating skill histories...');
  
  const histories = [];
  // Create histories for 50% of skills
  const skillsForHistory = faker.helpers.shuffle(skills).slice(0, Math.floor(skills.length * 0.5));
  
  for (const skill of skillsForHistory) {
    const levels = ['beginner', 'intermediate', 'expert'];
    const currentLevelIndex = levels.indexOf(skill.level);
    let previousLevel;
    
    if (currentLevelIndex === 0) {
      // If beginner, only option is no previous level (new skill)
      previousLevel = null;
    } else {
      // Get a level before the current one
      previousLevel = levels[currentLevelIndex - 1];
    }
    
    const updatedAt = randomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date());
    const changeNote = previousLevel 
      ? `Upgraded from ${previousLevel} to ${skill.level}` 
      : `Added new skill at ${skill.level} level`;
    
    const result = await pool.query(
      `INSERT INTO skill_histories (
        skill_id, user_id, previous_level, new_level, updated_at, change_note
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [skill.id, skill.userId, previousLevel, skill.level, updatedAt, changeNote]
    );
    
    histories.push({
      id: result.rows[0].id,
      skillId: skill.id,
      userId: skill.userId,
      previousLevel,
      newLevel: skill.level,
      updatedAt,
      changeNote
    });
  }
  
  console.log(`Created ${histories.length} skill histories`);
  return histories;
}

/**
 * Create endorsements between users
 */
async function createEndorsements(skills, users) {
  console.log('Creating endorsements...');
  
  const endorsements = [];
  // Create endorsements for 40% of skills
  const skillsForEndorsement = faker.helpers.shuffle(skills).slice(0, Math.floor(skills.length * 0.4));
  
  for (const skill of skillsForEndorsement) {
    // Find users other than the skill owner to make endorsements
    const potentialEndorsers = users.filter(user => user.id !== skill.userId);
    
    // Each skill gets 1-3 endorsements
    const endorsementCount = faker.number.int({ min: 1, max: 3 });
    const endorsers = faker.helpers.shuffle(potentialEndorsers).slice(0, endorsementCount);
    
    for (const endorser of endorsers) {
      const comment = faker.helpers.arrayElement([
        `${endorser.username} has excellent ${skill.name} skills!`,
        `I've worked with ${skill.name} alongside this person, very knowledgeable.`,
        `Strong ${skill.category} abilities, especially in ${skill.name}.`,
        `One of the best ${skill.name} practitioners I know.`,
        `Highly recommended for ${skill.name} work.`
      ]);
      
      const createdAt = randomDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), new Date());
      
      const result = await pool.query(
        `INSERT INTO endorsements (
          skill_id, endorser_id, endorsee_id, comment, created_at
        ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [skill.id, endorser.id, skill.userId, comment, createdAt]
      );
      
      endorsements.push({
        id: result.rows[0].id,
        skillId: skill.id,
        endorserId: endorser.id,
        endorseeId: skill.userId,
        comment,
        createdAt
      });
      
      // Create a notification for each endorsement
      await pool.query(
        `INSERT INTO notifications (
          user_id, type, content, is_read, related_skill_id, related_user_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          skill.userId,
          'endorsement',
          `Your ${skill.name} skill was endorsed by ${endorser.username}`,
          Math.random() > 0.7, // 30% chance of being unread
          skill.id,
          endorser.id,
          createdAt
        ]
      );
    }
  }
  
  console.log(`Created ${endorsements.length} endorsements`);
  return endorsements;
}

/**
 * Create notifications for level ups
 */
async function createLevelUpNotifications(skills, skillHistories) {
  console.log('Creating level up notifications...');
  
  const notifications = [];
  // Create level-up notifications for histories that show improvement
  const levelUpHistories = skillHistories.filter(history => history.previousLevel !== null);
  
  for (const history of levelUpHistories) {
    const skill = skills.find(s => s.id === history.skillId);
    
    if (!skill) continue;
    
    const content = `Your ${skill.name} skill has been upgraded to ${history.newLevel}`;
    const createdAt = history.updatedAt;
    
    await pool.query(
      `INSERT INTO notifications (
        user_id, type, content, is_read, related_skill_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        history.userId,
        'level_up',
        content,
        Math.random() > 0.5, // 50% chance of being unread
        history.skillId,
        createdAt
      ]
    );
    
    notifications.push({
      userId: history.userId,
      type: 'level_up',
      content,
      relatedSkillId: history.skillId,
      createdAt
    });
  }
  
  console.log(`Created ${notifications.length} level-up notifications`);
  return notifications;
}

/**
 * Create achievement notifications (for expert skills)
 */
async function createAchievementNotifications(skills) {
  console.log('Creating achievement notifications...');
  
  const notifications = [];
  // Create achievement notifications for expert-level skills
  const expertSkills = skills.filter(skill => skill.level === 'expert');
  
  for (const skill of expertSkills) {
    const content = `Congratulations on reaching expert level in ${skill.name}!`;
    const createdAt = randomDate(new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), new Date());
    
    await pool.query(
      `INSERT INTO notifications (
        user_id, type, content, is_read, related_skill_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        skill.userId,
        'achievement',
        content,
        Math.random() > 0.3, // 70% chance of being read
        skill.id,
        createdAt
      ]
    );
    
    notifications.push({
      userId: skill.userId,
      type: 'achievement',
      content,
      relatedSkillId: skill.id,
      createdAt
    });
  }
  
  console.log(`Created ${notifications.length} achievement notifications`);
  return notifications;
}

/**
 * Main function to regenerate all data
 */
async function regenerateData() {
  try {
    // First reset the database
    await resetDatabase();
    
    // Create new test data
    const users = await createTestUsers();
    const skills = await createSkills(users);
    const histories = await createSkillHistories(skills, users);
    const endorsements = await createEndorsements(skills, users);
    await createLevelUpNotifications(skills, histories);
    await createAchievementNotifications(skills);
    
    console.log('✅ Data regeneration complete!');
    
    // Print summary
    console.log('\nSummary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Skills: ${skills.length}`);
    console.log(`- Certified Skills: ${skills.filter(s => s.certification !== null).length}`);
    console.log(`- Skill Histories: ${histories.length}`);
    console.log(`- Endorsements: ${endorsements.length}`);
    
    // Output some example data
    const certifiedSkills = skills.filter(s => s.certification !== null);
    console.log('\nSample certified skills:');
    certifiedSkills.slice(0, 3).forEach(skill => {
      console.log(`- ${skill.name} (${skill.level}) - ${skill.certification}`);
      console.log(`  Certified on: ${skill.certificationDate?.toISOString().split('T')[0]}`);
      console.log(`  Expires on: ${skill.expirationDate?.toISOString().split('T')[0]}`);
      console.log(`  Credly Link: ${skill.credlyLink}`);
    });
    
  } catch (err) {
    console.error('Error during data regeneration:', err);
  } finally {
    await pool.end();
  }
}

// Execute the main function
regenerateData();