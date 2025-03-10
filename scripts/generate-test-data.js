// Test data generator for Employee Skills Management
const { pool } = require('../server/db');
const crypto = require('crypto');

// Skill categories
const skillCategories = [
  'Programming Languages',
  'Frameworks & Libraries',
  'Databases',
  'Cloud Services',
  'DevOps',
  'Design',
  'Project Management',
  'Soft Skills',
  'Quality Assurance',
  'Security'
];

// Common skills by category
const skillsByCategory = {
  'Programming Languages': ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Ruby', 'PHP', 'Go', 'Swift', 'Kotlin'],
  'Frameworks & Libraries': ['React', 'Angular', 'Vue', 'Express', 'Django', 'Spring Boot', 'Laravel', 'Ruby on Rails', 'ASP.NET', 'Flutter'],
  'Databases': ['PostgreSQL', 'MySQL', 'MongoDB', 'SQL Server', 'Oracle', 'Redis', 'Cassandra', 'DynamoDB', 'Firebase', 'Elasticsearch'],
  'Cloud Services': ['AWS', 'Azure', 'Google Cloud', 'Heroku', 'Digital Ocean', 'Firebase', 'Netlify', 'Vercel', 'OVH', 'IBM Cloud'],
  'DevOps': ['Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'Terraform', 'Ansible', 'Chef', 'Puppet', 'CircleCI'],
  'Design': ['UI/UX', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'InVision', 'Zeplin', 'After Effects', 'Wireframing'],
  'Project Management': ['Agile', 'Scrum', 'Kanban', 'JIRA', 'Confluence', 'Trello', 'Asana', 'Monday', 'ClickUp', 'Microsoft Project'],
  'Soft Skills': ['Communication', 'Leadership', 'Teamwork', 'Problem-solving', 'Critical thinking', 'Adaptability', 'Time management', 'Creativity', 'Emotional intelligence', 'Conflict resolution'],
  'Quality Assurance': ['Selenium', 'Cypress', 'Jest', 'Mocha', 'Jasmine', 'Postman', 'JUnit', 'TestNG', 'Robot Framework', 'Manual Testing'],
  'Security': ['OWASP', 'Penetration Testing', 'Security Auditing', 'Network Security', 'Encryption', 'Authentication', 'Authorization', 'Vulnerability Assessment', 'Identity Management', 'Security Compliance']
};

// Skill levels
const skillLevels = ['beginner', 'intermediate', 'expert'];

// Certification examples
const certifications = [
  'AWS Certified Solutions Architect',
  'Microsoft Certified: Azure Developer Associate', 
  'Google Professional Cloud Architect',
  'Certified Kubernetes Administrator',
  'Certified Scrum Master',
  'PMI Project Management Professional',
  'Certified Information Systems Security Professional',
  'Oracle Certified Professional',
  'Cisco Certified Network Associate',
  'CompTIA Security+',
  'Certified Ethical Hacker',
  'Salesforce Certified Administrator',
  'Certified Data Professional',
  'Adobe Certified Expert',
  ''  // Empty for no certification
];

// Projects for users
const projects = [
  'Frontend Team',
  'Backend Development',
  'Mobile App Division',
  'Data Science Group',
  'Cloud Infrastructure',
  'DevOps Team',
  'Security Team',
  'UX Research',
  'Project Management Office',
  'Quality Assurance',
  'AI Research',
  'Customer Success',
  'Product Management',
  'Technical Support',
  'Internal Tools'
];

// Roles
const roles = [
  'Software Engineer',
  'Senior Developer',
  'Technical Lead',
  'Product Manager',
  'UX Designer',
  'QA Engineer',
  'DevOps Engineer',
  'Database Administrator',
  'Systems Architect',
  'Data Scientist',
  'Scrum Master',
  'Technical Writer',
  'UI Designer',
  'Security Analyst',
  'Cloud Engineer'
];

// Locations
const locations = [
  'San Francisco',
  'New York',
  'London',
  'Berlin',
  'Singapore',
  'Tokyo',
  'Paris',
  'Sydney',
  'Toronto',
  'Bangalore',
  'Amsterdam',
  'Remote',
  'Hybrid (SF)',
  'Hybrid (NY)',
  'Hybrid (London)'
];

// Common domains for email generation
const emailDomains = [
  'example.com',
  'company.org',
  'techfirm.io',
  'devteam.net',
  'enterprise.co'
];

// Endorsement comments
const endorsementComments = [
  'Great skills in this technology!',
  'Highly proficient and knowledgeable.',
  'Has helped me learn this skill effectively.',
  'Excellent problem-solver using this skill.',
  'Demonstrated exceptional expertise in this area.',
  'Always delivers quality results with this skill.',
  'Consistently shows deep understanding.',
  'Impressed by the mastery of this skill.',
  'Has mentored team members on this technology.',
  'Reliable expert in this field.'
];

// Change notes for skill history
const changeNotes = [
  'Completed advanced training course',
  'Finished a major project using this skill',
  'Received certification',
  'Implemented a complex feature',
  'Mentored junior team members',
  'Led a technical workshop',
  'Contributed to open source project',
  'Resolved critical bugs using this skill',
  'Optimized performance significantly',
  'Mastered new aspects of this technology',
  ''  // Empty for no note
];

// Generate random string for username
function generateUsername(firstName, lastName) {
  return `${firstName.toLowerCase()}${Math.floor(Math.random() * 100)}.${lastName.toLowerCase()}`;
}

// Generate a random date within the past 2 years
function getRandomDate() {
  const now = new Date();
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
  return new Date(twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime()));
}

// Generate random hash for password simulation
function generateHash() {
  return crypto.randomBytes(32).toString('hex');
}

// Random selection from array
function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate random email
function generateEmail(firstName, lastName, domain) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

// First names and last names for generating user data
const firstNames = [
  'John', 'Emma', 'Michael', 'Sophia', 'William', 'Olivia', 'James', 'Ava', 'Alexander', 'Isabella',
  'Daniel', 'Mia', 'Matthew', 'Charlotte', 'David', 'Amelia', 'Joseph', 'Harper', 'Andrew', 'Evelyn',
  'Samuel', 'Abigail', 'Benjamin', 'Emily', 'Christopher', 'Elizabeth', 'Jacob', 'Sofia', 'Ryan', 'Avery',
  'Ethan', 'Ella', 'Tyler', 'Madison', 'Aiden', 'Scarlett', 'Nathan', 'Victoria', 'Jackson', 'Aria',
  'Thomas', 'Grace', 'Caleb', 'Chloe', 'Mason', 'Camila', 'Logan', 'Penelope', 'Nicholas', 'Riley'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor',
  'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson',
  'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King',
  'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter',
  'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins'
];

// Generate users data
async function generateUsers(count) {
  console.log(`Generating ${count} test users...`);
  
  const users = [];
  const adminIndex = Math.floor(Math.random() * count); // One random admin
  
  for (let i = 0; i < count; i++) {
    const firstName = randomFromArray(firstNames);
    const lastName = randomFromArray(lastNames);
    const username = generateUsername(firstName, lastName);
    const email = generateEmail(firstName, lastName, randomFromArray(emailDomains));
    const isAdmin = i === adminIndex;
    const password = `${generateHash()}.${generateHash()}`;
    const project = randomFromArray(projects);
    const role = randomFromArray(roles);
    const location = randomFromArray(locations);
    
    users.push({
      username,
      email,
      password,
      isAdmin,
      firstName,
      lastName,
      project,
      role,
      location
    });
  }
  
  return users;
}

// Generate skills for users
async function generateSkills(users) {
  console.log(`Generating skills for ${users.length} users...`);
  
  const skills = [];
  
  for (const user of users) {
    // Random number of skills (2-8) per user
    const skillCount = 2 + Math.floor(Math.random() * 7);
    const userSkillCategories = [];
    
    // Select random categories for user
    while (userSkillCategories.length < skillCount && userSkillCategories.length < skillCategories.length) {
      const category = randomFromArray(skillCategories);
      if (!userSkillCategories.includes(category)) {
        userSkillCategories.push(category);
      }
    }
    
    // Create skills for each category
    for (const category of userSkillCategories) {
      const skillName = randomFromArray(skillsByCategory[category]);
      const level = randomFromArray(skillLevels);
      const certification = Math.random() > 0.7 ? randomFromArray(certifications) : null;
      const credlyLink = certification ? `https://credly.com/badge/${Math.random().toString(36).substring(2, 15)}` : null;
      const notes = Math.random() > 0.6 ? `Notes for ${skillName} skill` : null;
      
      skills.push({
        userId: user.id,
        name: skillName,
        category,
        level,
        certification,
        credlyLink,
        notes
      });
    }
  }
  
  return skills;
}

// Generate skill history
async function generateSkillHistories(skills) {
  console.log(`Generating skill histories...`);
  
  const histories = [];
  
  for (const skill of skills) {
    // 70% chance of having skill history
    if (Math.random() > 0.3) {
      // 1-3 history entries per skill
      const historyCount = 1 + Math.floor(Math.random() * 3);
      let currentLevel = skill.level;
      
      for (let i = 0; i < historyCount; i++) {
        // Find previous level (different from current)
        let previousLevel;
        do {
          previousLevel = randomFromArray(skillLevels);
        } while (previousLevel === currentLevel);
        
        const date = getRandomDate();
        const changeNote = randomFromArray(changeNotes);
        
        histories.push({
          skillId: skill.id,
          userId: skill.userId,
          previousLevel,
          newLevel: currentLevel,
          updatedAt: date,
          changeNote
        });
        
        // For next iteration
        currentLevel = previousLevel;
      }
    }
  }
  
  return histories;
}

// Generate endorsements
async function generateEndorsements(users, skills) {
  console.log(`Generating endorsements...`);
  
  const endorsements = [];
  
  // 40% of skills will have endorsements
  const endorsableSkills = skills.filter(() => Math.random() > 0.6);
  
  for (const skill of endorsableSkills) {
    // 1-3 endorsements per endorsable skill
    const endorsementCount = 1 + Math.floor(Math.random() * 3);
    
    // Get potential endorsers (not the skill owner)
    const potentialEndorsers = users.filter(user => user.id !== skill.userId);
    
    // If we have potential endorsers
    if (potentialEndorsers.length > 0) {
      // Select random endorsers
      const endorsers = [];
      while (endorsers.length < endorsementCount && endorsers.length < potentialEndorsers.length) {
        const endorser = randomFromArray(potentialEndorsers);
        if (!endorsers.find(e => e.id === endorser.id)) {
          endorsers.push(endorser);
        }
      }
      
      // Create endorsements
      for (const endorser of endorsers) {
        const comment = randomFromArray(endorsementComments);
        const date = getRandomDate();
        
        endorsements.push({
          skillId: skill.id,
          endorserId: endorser.id,
          endorseeId: skill.userId,
          comment,
          createdAt: date
        });
      }
    }
  }
  
  return endorsements;
}

// Generate notifications
async function generateNotifications(users, skills, endorsements, skillHistories) {
  console.log(`Generating notifications...`);
  
  const notifications = [];
  
  // Endorsement notifications
  for (const endorsement of endorsements) {
    const endorser = users.find(u => u.id === endorsement.endorserId);
    const skill = skills.find(s => s.id === endorsement.skillId);
    
    if (endorser && skill) {
      const content = `${endorser.firstName} ${endorser.lastName} endorsed your "${skill.name}" skill`;
      const isRead = Math.random() > 0.5;
      
      notifications.push({
        userId: endorsement.endorseeId,
        type: 'endorsement',
        content,
        isRead,
        relatedSkillId: skill.id,
        relatedUserId: endorser.id,
        createdAt: endorsement.createdAt
      });
    }
  }
  
  // Skill level up notifications
  for (const history of skillHistories) {
    if (history.previousLevel && history.newLevel) {
      const skill = skills.find(s => s.id === history.skillId);
      
      if (skill) {
        // Only create notification if level went up
        const levelValues = { beginner: 1, intermediate: 2, expert: 3 };
        if (levelValues[history.newLevel] > levelValues[history.previousLevel]) {
          const content = `Your "${skill.name}" skill level upgraded from ${history.previousLevel} to ${history.newLevel}`;
          const isRead = Math.random() > 0.5;
          
          notifications.push({
            userId: history.userId,
            type: 'level_up',
            content,
            isRead,
            relatedSkillId: skill.id,
            createdAt: history.updatedAt
          });
        }
      }
    }
  }
  
  // Achievement notifications (for experts)
  const expertSkills = skills.filter(s => s.level === 'expert');
  for (const skill of expertSkills) {
    if (Math.random() > 0.7) { // 30% of expert skills get achievement
      const content = `Congratulations! You achieved expert status in "${skill.name}"`;
      const isRead = Math.random() > 0.5;
      
      notifications.push({
        userId: skill.userId,
        type: 'achievement',
        content,
        isRead,
        relatedSkillId: skill.id,
        createdAt: getRandomDate()
      });
    }
  }
  
  return notifications;
}

// Generate profile histories
async function generateProfileHistories(users) {
  console.log(`Generating profile histories...`);
  
  const histories = [];
  
  for (const user of users) {
    // 50% chance of having profile history
    if (Math.random() > 0.5) {
      // 1-3 profile updates
      const updateCount = 1 + Math.floor(Math.random() * 3);
      
      // Fields that can be updated
      const fields = ['role', 'project', 'firstName', 'lastName', 'location'];
      
      for (let i = 0; i < updateCount; i++) {
        const field = randomFromArray(fields);
        const oldValue = field === 'firstName' ? 'Previous' : 
                          field === 'lastName' ? 'Name' : 
                          randomFromArray(field === 'role' ? roles : 
                                          field === 'project' ? projects : 
                                          field === 'location' ? locations : ['Old Value']);
        const newValue = user[field] || 'New Value';
        
        if (oldValue !== newValue) {
          histories.push({
            userId: user.id,
            field,
            oldValue,
            newValue,
            updatedAt: getRandomDate()
          });
        }
      }
    }
  }
  
  return histories;
}

// Insert data into database
async function insertTestData() {
  // Connect to database
  
  try {
    console.log('Starting test data generation...');
    
    // Generate users
    const users = await generateUsers(100);
    console.log(`Generated ${users.length} users.`);
    
    // Insert users and save the inserted records
    const usersInserted = [];
    for (const user of users) {
      try {
        const result = await pool.query(
          `INSERT INTO users (username, email, password, is_admin, first_name, last_name, project, role, location) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [user.username, user.email, user.password, user.isAdmin, user.firstName, user.lastName, user.project, user.role, user.location]
        );
        usersInserted.push(result.rows[0]);
      } catch (err) {
        console.error(`Error inserting user ${user.email}:`, err.message);
      }
    }
    console.log(`Inserted ${usersInserted.length} users.`);
    
    // Generate skills for users
    const skills = await generateSkills(usersInserted);
    console.log(`Generated ${skills.length} skills.`);
    
    // Insert skills and save the inserted records
    const skillsInserted = [];
    for (const skill of skills) {
      try {
        const result = await pool.query(
          `INSERT INTO skills (user_id, name, category, level, certification, credly_link, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [skill.userId, skill.name, skill.category, skill.level, skill.certification, skill.credlyLink, skill.notes]
        );
        skillsInserted.push(result.rows[0]);
      } catch (err) {
        console.error(`Error inserting skill ${skill.name}:`, err.message);
      }
    }
    console.log(`Inserted ${skillsInserted.length} skills.`);
    
    // Generate skill histories
    const skillHistories = await generateSkillHistories(skillsInserted);
    console.log(`Generated ${skillHistories.length} skill histories.`);
    
    // Insert skill histories
    let skillHistoriesInserted = 0;
    for (const history of skillHistories) {
      try {
        await pool.query(
          `INSERT INTO skill_histories (skill_id, user_id, previous_level, new_level, updated_at, change_note) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [history.skillId, history.userId, history.previousLevel, history.newLevel, history.updatedAt, history.changeNote]
        );
        skillHistoriesInserted++;
      } catch (err) {
        console.error(`Error inserting skill history:`, err.message);
      }
    }
    console.log(`Inserted ${skillHistoriesInserted} skill histories.`);
    
    // Generate endorsements
    const endorsements = await generateEndorsements(usersInserted, skillsInserted);
    console.log(`Generated ${endorsements.length} endorsements.`);
    
    // Insert endorsements
    let endorsementsInserted = 0;
    for (const endorsement of endorsements) {
      try {
        await pool.query(
          `INSERT INTO endorsements (skill_id, endorser_id, endorsee_id, comment, created_at) 
           VALUES ($1, $2, $3, $4, $5)`,
          [endorsement.skillId, endorsement.endorserId, endorsement.endorseeId, endorsement.comment, endorsement.createdAt]
        );
        endorsementsInserted++;
        
        // Update endorsement count in skills table
        await pool.query(
          `UPDATE skills SET endorsement_count = endorsement_count + 1 WHERE id = $1`,
          [endorsement.skillId]
        );
      } catch (err) {
        console.error(`Error inserting endorsement:`, err.message);
      }
    }
    console.log(`Inserted ${endorsementsInserted} endorsements.`);
    
    // Generate profile histories
    const profileHistories = await generateProfileHistories(usersInserted);
    console.log(`Generated ${profileHistories.length} profile histories.`);
    
    // Insert profile histories
    let profileHistoriesInserted = 0;
    for (const history of profileHistories) {
      try {
        await pool.query(
          `INSERT INTO profile_histories (user_id, field, old_value, new_value, updated_at) 
           VALUES ($1, $2, $3, $4, $5)`,
          [history.userId, history.field, history.oldValue, history.newValue, history.updatedAt]
        );
        profileHistoriesInserted++;
      } catch (err) {
        console.error(`Error inserting profile history:`, err.message);
      }
    }
    console.log(`Inserted ${profileHistoriesInserted} profile histories.`);
    
    // Generate notifications
    const notifications = await generateNotifications(usersInserted, skillsInserted, endorsements, skillHistories);
    console.log(`Generated ${notifications.length} notifications.`);
    
    // Insert notifications
    let notificationsInserted = 0;
    for (const notification of notifications) {
      try {
        await pool.query(
          `INSERT INTO notifications (user_id, type, content, is_read, related_skill_id, related_user_id, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [notification.userId, notification.type, notification.content, 
           notification.isRead, notification.relatedSkillId, notification.relatedUserId, 
           notification.createdAt]
        );
        notificationsInserted++;
      } catch (err) {
        console.error(`Error inserting notification:`, err.message);
      }
    }
    console.log(`Inserted ${notificationsInserted} notifications.`);
    
    console.log('Test data generation completed successfully.');
    
  } catch (err) {
    console.error('Error generating test data:', err);
  } finally {
    pool.end();
  }
}

// Run the data generation
insertTestData().catch(err => {
  console.error('Fatal error during test data generation:', err);
  process.exit(1);
});