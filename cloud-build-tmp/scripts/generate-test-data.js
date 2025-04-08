// Test Data Generation Script for Employee Skills Management
import { faker } from '@faker-js/faker';
import { pool, db } from '../server/db.js';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import {
  users,
  skills,
  skillHistories,
  profileHistories,
  endorsements,
  notifications,
  insertUserSchema,
  skillLevelEnum
} from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

// Configuration for data generation
const CONFIG = {
  USERS: {
    COUNT: 100,
    ADMINS: 5
  },
  SKILLS: {
    MIN_PER_USER: 5,
    MAX_PER_USER: 15,
    CATEGORIES: [
      'Programming Languages',
      'Frameworks',
      'Databases',
      'Cloud Technologies',
      'DevOps',
      'Mobile Development',
      'Web Development',
      'UI/UX Design',
      'Data Science',
      'Machine Learning',
      'Artificial Intelligence',
      'Network Security',
      'Blockchain',
      'IoT',
      'Project Management',
      'Agile Methodologies',
      'Quality Assurance',
      'Technical Writing',
      'System Administration',
      'Business Analysis',
      'Soft Skills',
      'Leadership',
      'Communication',
      'Problem Solving'
    ],
    NAMES: {
      'Programming Languages': [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 
        'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'Dart', 'Perl', 'Haskell'
      ],
      'Frameworks': [
        'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask',
        'Spring Boot', 'ASP.NET Core', 'Laravel', 'Ruby on Rails', 'Next.js',
        'NestJS', 'Svelte', 'FastAPI', 'TensorFlow', 'PyTorch'
      ],
      'Databases': [
        'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Cassandra',
        'DynamoDB', 'Elasticsearch', 'Oracle', 'SQL Server', 'Firebase',
        'Neo4j', 'CouchDB', 'MariaDB'
      ],
      'Cloud Technologies': [
        'AWS', 'Azure', 'Google Cloud', 'Heroku', 'DigitalOcean', 'Linode',
        'IBM Cloud', 'Alibaba Cloud', 'Oracle Cloud', 'Cloudflare', 'Vercel',
        'Netlify', 'AWS Lambda', 'Azure Functions', 'GCP Cloud Functions'
      ],
      'DevOps': [
        'Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions', 'CircleCI',
        'Travis CI', 'Ansible', 'Terraform', 'Puppet', 'Chef', 'Prometheus',
        'Grafana', 'ELK Stack', 'ArgoCD', 'Flux'
      ],
      'Mobile Development': [
        'React Native', 'Flutter', 'iOS Development', 'Android Development',
        'Xamarin', 'Ionic', 'Cordova', 'Swift UI', 'Jetpack Compose',
        'Unity Mobile', 'PWA', 'Capacitor'
      ],
      'Web Development': [
        'HTML', 'CSS', 'SASS/SCSS', 'Bootstrap', 'Tailwind CSS', 'Material UI',
        'Webpack', 'Vite', 'Rollup', 'Parcel', 'GraphQL', 'REST API',
        'WebSockets', 'Service Workers', 'Web Components'
      ],
      'UI/UX Design': [
        'Figma', 'Sketch', 'Adobe XD', 'InVision', 'Prototyping', 
        'User Research', 'Wireframing', 'Accessibility', 'Color Theory',
        'Typography', 'Usability Testing', 'Information Architecture'
      ],
      'Data Science': [
        'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Jupyter', 'R',
        'Data Visualization', 'ETL', 'Data Mining', 'Statistical Analysis',
        'Data Modeling', 'Big Data', 'Apache Spark', 'Hadoop', 'Tableau', 'Power BI'
      ],
      'Machine Learning': [
        'Scikit-learn', 'Neural Networks', 'Deep Learning', 'NLP',
        'Computer Vision', 'Reinforcement Learning', 'MLOps', 'Model Deployment',
        'Feature Engineering', 'Hyperparameter Tuning', 'GANs', 'Transfer Learning'
      ],
      'Artificial Intelligence': [
        'Machine Learning', 'Computer Vision', 'NLP', 'Chatbots',
        'Recommendation Systems', 'Expert Systems', 'Knowledge Graphs',
        'Genetic Algorithms', 'Decision Trees', 'Robotics', 'Autonomous Systems'
      ],
      'Network Security': [
        'Penetration Testing', 'Ethical Hacking', 'Cryptography',
        'Security Auditing', 'Threat Modeling', 'SIEM', 'Firewall Configuration',
        'Identity Management', 'OAuth', 'JWT', 'SSL/TLS', 'VPN', 'Zero Trust'
      ],
      'Blockchain': [
        'Ethereum', 'Smart Contracts', 'Solidity', 'Web3.js', 'Hyperledger',
        'Cryptocurrency', 'DeFi', 'NFTs', 'Blockchain Architecture',
        'Consensus Algorithms', 'dApps', 'Tokens'
      ],
      'IoT': [
        'Arduino', 'Raspberry Pi', 'Embedded Systems', 'MQTT',
        'Sensor Networks', 'Edge Computing', 'IoT Security',
        'Home Automation', 'Industrial IoT', 'IoT Protocols', 'Smart Devices'
      ],
      'Project Management': [
        'Scrum', 'Kanban', 'Agile', 'Waterfall', 'JIRA', 'Trello',
        'Asana', 'Microsoft Project', 'Risk Management', 'Stakeholder Management',
        'Resource Planning', 'Gantt Charts', 'Critical Path Method'
      ],
      'Agile Methodologies': [
        'Scrum', 'Kanban', 'Lean', 'XP', 'SAFe', 'Agile Ceremonies',
        'User Stories', 'Sprint Planning', 'Retrospectives', 'Stand-ups',
        'Story Points', 'Velocity Tracking', 'Product Backlog'
      ],
      'Quality Assurance': [
        'Manual Testing', 'Automated Testing', 'Test Planning',
        'Test Cases', 'Selenium', 'Cypress', 'Jest', 'Mocha', 'Chai',
        'JUnit', 'TestNG', 'Cucumber', 'BDD', 'TDD', 'Load Testing', 'Stress Testing'
      ],
      'Technical Writing': [
        'API Documentation', 'User Manuals', 'Release Notes',
        'Knowledge Bases', 'Style Guides', 'Markdown', 'Docusaurus',
        'MkDocs', 'Swagger', 'OpenAPI', 'Technical Blogging'
      ],
      'System Administration': [
        'Linux', 'Windows Server', 'Bash Scripting', 'PowerShell',
        'Active Directory', 'Network Configuration', 'Server Monitoring',
        'Backup & Recovery', 'Patch Management', 'System Hardening'
      ],
      'Business Analysis': [
        'Requirements Gathering', 'Process Modeling', 'Use Cases',
        'User Stories', 'UML', 'BPMN', 'Data Analysis', 'Stakeholder Management',
        'Gap Analysis', 'SWOT Analysis', 'Cost-Benefit Analysis'
      ],
      'Soft Skills': [
        'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
        'Time Management', 'Adaptability', 'Creativity', 'Emotional Intelligence',
        'Conflict Resolution', 'Active Listening', 'Negotiation'
      ],
      'Leadership': [
        'Team Management', 'Mentoring', 'Coaching', 'Strategic Planning',
        'Decision Making', 'Delegation', 'Performance Reviews',
        'Motivation', 'Change Management', 'Vision Setting'
      ],
      'Communication': [
        'Technical Presentations', 'Public Speaking', 'Technical Writing',
        'Client Communication', 'Cross-team Collaboration', 'Active Listening',
        'Nonverbal Communication', 'Email Etiquette', 'Meeting Facilitation'
      ],
      'Problem Solving': [
        'Analytical Thinking', 'Root Cause Analysis', 'Troubleshooting',
        'Debugging', 'Systems Thinking', 'Design Thinking',
        'Creative Problem Solving', 'Decision Analysis'
      ]
    }
  },
  ENDORSEMENTS: {
    TOTAL: 200,
    MAX_PER_SKILL: 5
  },
  SKILL_HISTORIES: {
    AVG_PER_SKILL: 2
  },
  PROFILE_HISTORIES: {
    AVG_PER_USER: 3
  },
  NOTIFICATIONS: {
    MIN_PER_USER: 0,
    MAX_PER_USER: 20,
    UNREAD_PERCENTAGE: 0.3
  }
};

// Helper function to generate a username from first and last name
function generateUsername(firstName, lastName) {
  const randomNum = Math.floor(Math.random() * 10);
  return (firstName.toLowerCase() + '.' + lastName.toLowerCase() + (randomNum > 0 ? randomNum : '')).replace(/[^a-z0-9.]/g, '');
}

// Helper function to get a random date within the last year
function getRandomDate() {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  return new Date(oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime()));
}

// Helper function to generate a hashed password
async function generateHash(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

// Helper function to get a random item from an array
function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper function to generate a random email
function generateEmail(firstName, lastName, domain = null) {
  const domains = domain ? [domain] : ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'example.com', 'company.com'];
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomDomain}`.replace(/[^a-z0-9.@]/g, '');
}

// Generate user data
async function generateUsers(count) {
  console.log(`Generating ${count} users...`);
  const userData = [];
  
  // Generate admin users first
  for (let i = 0; i < CONFIG.USERS.ADMINS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = generateUsername(firstName, lastName);
    const email = generateEmail(firstName, lastName, 'company.com');
    
    // Generate a deterministic password for testing
    const password = 'Admin@123';
    const hashedPassword = await generateHash(password);
    
    userData.push({
      username,
      email,
      password: hashedPassword,
      is_admin: true,
      firstName,
      lastName,
      role: randomFromArray(['IT Manager', 'CTO', 'IT Director', 'VP of Engineering', 'Chief Security Officer']),
      department: randomFromArray(['IT', 'Engineering', 'Security', 'Operations', 'R&D']),
      location: randomFromArray(['Headquarters', 'Remote', 'Branch Office', 'Regional Office'])
    });
    
    console.log(`Created admin user: ${email} with password: ${password}`);
  }
  
  // Generate regular users
  for (let i = CONFIG.USERS.ADMINS; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = generateUsername(firstName, lastName);
    const email = generateEmail(firstName, lastName);
    
    // Generate a simple password for testing
    const password = 'User@123';
    const hashedPassword = await generateHash(password);
    
    userData.push({
      username,
      email,
      password: hashedPassword,
      is_admin: false,
      firstName: Math.random() > 0.2 ? firstName : undefined, // Some users have incomplete profiles
      lastName: Math.random() > 0.2 ? lastName : undefined,
      role: Math.random() > 0.3 ? randomFromArray([
        'Software Engineer', 'Frontend Developer', 'Backend Developer', 
        'Full Stack Developer', 'DevOps Engineer', 'QA Engineer', 
        'Data Scientist', 'Product Manager', 'UI/UX Designer',
        'System Administrator', 'Database Administrator', 'Mobile Developer',
        'Project Manager', 'Scrum Master', 'Business Analyst'
      ]) : undefined,
      department: Math.random() > 0.4 ? randomFromArray([
        'Engineering', 'Product', 'Design', 'QA', 'DevOps', 
        'Data Science', 'Research', 'IT Support', 'Infrastructure',
        'Security', 'Operations', 'Mobile', 'Web Development'
      ]) : undefined,
      location: Math.random() > 0.5 ? randomFromArray([
        'Remote', 'Headquarters', 'East Office', 'West Office', 
        'North Office', 'South Office', 'Overseas', 'Client Site'
      ]) : undefined
    });
    
    if (i % 10 === 0) {
      console.log(`Created ${i} of ${count} users...`);
    }
  }
  
  // Insert users into database
  const insertedUsers = [];
  for (const user of userData) {
    try {
      const [insertedUser] = await db.insert(users).values(user).returning();
      insertedUsers.push(insertedUser);
    } catch (error) {
      console.error(`Error inserting user ${user.email}:`, error.message);
    }
  }
  
  console.log(`Successfully inserted ${insertedUsers.length} users.`);
  return insertedUsers;
}

// Generate skills for users
async function generateSkills(users) {
  console.log(`Generating skills for ${users.length} users...`);
  const skillsData = [];
  
  for (const user of users) {
    const numSkills = Math.floor(Math.random() * 
      (CONFIG.SKILLS.MAX_PER_USER - CONFIG.SKILLS.MIN_PER_USER + 1)) + 
      CONFIG.SKILLS.MIN_PER_USER;
    
    const userCategories = [];
    // Select random categories for this user
    while (userCategories.length < Math.min(numSkills, CONFIG.SKILLS.CATEGORIES.length)) {
      const category = randomFromArray(CONFIG.SKILLS.CATEGORIES);
      if (!userCategories.includes(category)) {
        userCategories.push(category);
      }
    }
    
    // Generate skills for each category
    for (const category of userCategories) {
      const skillsInCategory = CONFIG.SKILLS.NAMES[category];
      const numSkillsInCategory = Math.min(
        Math.floor(Math.random() * 3) + 1, 
        skillsInCategory.length
      );
      
      // Select random skills from this category
      const selectedSkills = [];
      while (selectedSkills.length < numSkillsInCategory) {
        const skill = randomFromArray(skillsInCategory);
        if (!selectedSkills.includes(skill)) {
          selectedSkills.push(skill);
        }
      }
      
      // Create skill entries
      for (const skillName of selectedSkills) {
        const level = randomFromArray(['beginner', 'intermediate', 'expert']);
        
        skillsData.push({
          userId: user.id,
          name: skillName,
          category,
          level,
          certification: Math.random() > 0.7 ? `${skillName} Certification` : undefined,
          credlyLink: Math.random() > 0.8 ? `https://credly.com/badges/${skillName.toLowerCase().replace(/\s/g, '-')}` : undefined,
          notes: Math.random() > 0.6 ? faker.lorem.paragraph() : undefined,
          yearsOfExperience: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : undefined
        });
      }
    }
  }
  
  // Insert skills into database
  const insertedSkills = [];
  for (const skill of skillsData) {
    try {
      const [insertedSkill] = await db.insert(skills).values(skill).returning();
      insertedSkills.push(insertedSkill);
    } catch (error) {
      console.error(`Error inserting skill ${skill.name} for user ${skill.userId}:`, error.message);
    }
  }
  
  console.log(`Successfully inserted ${insertedSkills.length} skills.`);
  return insertedSkills;
}

// Generate skill histories
async function generateSkillHistories(skills) {
  console.log(`Generating skill histories for ${skills.length} skills...`);
  const historiesData = [];
  
  for (const skill of skills) {
    // Determine how many history entries to create
    const numHistories = Math.floor(Math.random() * 3) + 1; // 1-3 entries
    
    // Create a progression of levels
    const levels = ['beginner', 'intermediate', 'expert'];
    const currentLevelIndex = levels.indexOf(skill.level);
    
    // Generate history entries
    for (let i = 0; i < numHistories; i++) {
      // For the first entry, make sure it's for a previous level
      let previousLevelIndex = currentLevelIndex;
      let newLevelIndex = currentLevelIndex;
      
      if (i === 0 && currentLevelIndex > 0) {
        // First entry should be improvement from a previous level
        previousLevelIndex = Math.max(0, currentLevelIndex - 1);
        newLevelIndex = currentLevelIndex;
      } else if (i > 0) {
        // Subsequent entries can be any progression
        previousLevelIndex = Math.floor(Math.random() * 3);
        newLevelIndex = Math.min(2, previousLevelIndex + 1);
      }
      
      const previousLevel = levels[previousLevelIndex];
      const newLevel = levels[newLevelIndex];
      
      // Only add history if there's a level change
      if (previousLevel !== newLevel) {
        const updateDate = new Date(
          skill.updatedAt.getTime() - (numHistories - i) * 30 * 24 * 60 * 60 * 1000
        ); // Go back in time by months
        
        historiesData.push({
          skillId: skill.id,
          userId: skill.userId,
          previousLevel,
          newLevel,
          changeNote: faker.lorem.sentence(),
          updatedAt: updateDate
        });
      }
    }
  }
  
  // Insert histories into database
  const insertedHistories = [];
  for (const history of historiesData) {
    try {
      const [insertedHistory] = await db.insert(skillHistories).values(history).returning();
      insertedHistories.push(insertedHistory);
    } catch (error) {
      console.error(`Error inserting skill history for skill ${history.skillId}:`, error.message);
    }
  }
  
  console.log(`Successfully inserted ${insertedHistories.length} skill histories.`);
  return insertedHistories;
}

// Generate endorsements
async function generateEndorsements(users, skills) {
  console.log(`Generating endorsements for ${skills.length} skills...`);
  const endorsementsData = [];
  
  // Determine how many endorsements to create in total
  const totalEndorsements = Math.min(CONFIG.ENDORSEMENTS.TOTAL, skills.length * CONFIG.ENDORSEMENTS.MAX_PER_SKILL);
  
  // Create a set to track which user-skill pairs have been used
  const endorsementPairs = new Set();
  
  // Generate random endorsements
  while (endorsementsData.length < totalEndorsements) {
    const endorser = randomFromArray(users);
    const skill = randomFromArray(skills);
    
    // Make sure users don't endorse their own skills and don't endorse the same skill twice
    if (endorser.id !== skill.userId) {
      const pairKey = `${endorser.id}-${skill.id}`;
      
      if (!endorsementPairs.has(pairKey)) {
        endorsementPairs.add(pairKey);
        
        endorsementsData.push({
          skillId: skill.id,
          endorserId: endorser.id,
          endorseeId: skill.userId,
          comment: faker.lorem.sentences(Math.floor(Math.random() * 3) + 1),
          createdAt: getRandomDate()
        });
      }
    }
  }
  
  // Insert endorsements into database
  const insertedEndorsements = [];
  for (const endorsement of endorsementsData) {
    try {
      const [insertedEndorsement] = await db.insert(endorsements).values(endorsement).returning();
      insertedEndorsements.push(insertedEndorsement);
    } catch (error) {
      console.error(`Error inserting endorsement from ${endorsement.endorserId} for skill ${endorsement.skillId}:`, error.message);
    }
  }
  
  console.log(`Successfully inserted ${insertedEndorsements.length} endorsements.`);
  return insertedEndorsements;
}

// Generate notifications
async function generateNotifications(users, skills, endorsements, skillHistories) {
  console.log(`Generating notifications for ${users.length} users...`);
  const notificationsData = [];
  
  // Endorsement notifications
  for (const endorsement of endorsements) {
    notificationsData.push({
      userId: endorsement.endorseeId,
      type: 'endorsement',
      content: `Someone endorsed your skill`,
      relatedId: endorsement.id,
      isRead: Math.random() > CONFIG.NOTIFICATIONS.UNREAD_PERCENTAGE,
      createdAt: endorsement.createdAt
    });
  }
  
  // Level up notifications
  for (const history of skillHistories) {
    if (history.previousLevel !== history.newLevel) {
      notificationsData.push({
        userId: history.userId,
        type: 'level_up',
        content: `You leveled up in a skill`,
        relatedId: history.id,
        isRead: Math.random() > CONFIG.NOTIFICATIONS.UNREAD_PERCENTAGE,
        createdAt: history.updatedAt
      });
    }
  }
  
  // Achievement notifications
  for (const user of users) {
    const userSkills = skills.filter(skill => skill.userId === user.id);
    
    if (userSkills.length >= 5) {
      notificationsData.push({
        userId: user.id,
        type: 'achievement',
        content: `Achievement unlocked: Skill Collector`,
        relatedId: null,
        isRead: Math.random() > CONFIG.NOTIFICATIONS.UNREAD_PERCENTAGE,
        createdAt: getRandomDate()
      });
    }
    
    const expertSkills = userSkills.filter(skill => skill.level === 'expert');
    if (expertSkills.length >= 3) {
      notificationsData.push({
        userId: user.id,
        type: 'achievement',
        content: `Achievement unlocked: Expert Status`,
        relatedId: null,
        isRead: Math.random() > CONFIG.NOTIFICATIONS.UNREAD_PERCENTAGE,
        createdAt: getRandomDate()
      });
    }
  }
  
  // Insert notifications into database
  const insertedNotifications = [];
  for (const notification of notificationsData) {
    try {
      const [insertedNotification] = await db.insert(notifications).values(notification).returning();
      insertedNotifications.push(insertedNotification);
    } catch (error) {
      console.error(`Error inserting notification for user ${notification.userId}:`, error.message);
    }
  }
  
  console.log(`Successfully inserted ${insertedNotifications.length} notifications.`);
  return insertedNotifications;
}

// Generate profile histories
async function generateProfileHistories(users) {
  console.log(`Generating profile histories for ${users.length} users...`);
  const profileHistoriesData = [];
  
  for (const user of users) {
    // Skip users with incomplete profiles
    if (!user.firstName || !user.lastName) continue;
    
    const numHistories = Math.floor(Math.random() * 3) + 1; // 1-3 history entries
    
    for (let i = 0; i < numHistories; i++) {
      const fieldNames = ['firstName', 'lastName', 'role', 'department', 'location'];
      const changedField = randomFromArray(fieldNames);
      
      // Generate previous and new values
      let previousValue, newValue;
      
      switch (changedField) {
        case 'firstName':
        case 'lastName':
          previousValue = faker.person.firstName();
          newValue = user[changedField];
          break;
        case 'role':
          previousValue = randomFromArray([
            'Junior Developer', 'Intern', 'Associate Engineer',
            'Support Specialist', 'Technical Associate'
          ]);
          newValue = user.role;
          break;
        case 'department':
          previousValue = randomFromArray([
            'Support', 'Training', 'Internship Program',
            'Customer Success', 'Sales Engineering'
          ]);
          newValue = user.department;
          break;
        case 'location':
          previousValue = randomFromArray([
            'Training Center', 'Satellite Office', 'Co-working Space',
            'University Program', 'Incubator'
          ]);
          newValue = user.location;
          break;
      }
      
      profileHistoriesData.push({
        userId: user.id,
        fieldName: changedField,
        previousValue,
        newValue,
        updatedAt: getRandomDate()
      });
    }
  }
  
  // Insert profile histories into database
  const insertedProfileHistories = [];
  for (const history of profileHistoriesData) {
    try {
      const [insertedHistory] = await db.insert(profileHistories).values(history).returning();
      insertedProfileHistories.push(insertedHistory);
    } catch (error) {
      console.error(`Error inserting profile history for user ${history.userId}:`, error.message);
    }
  }
  
  console.log(`Successfully inserted ${insertedProfileHistories.length} profile histories.`);
  return insertedProfileHistories;
}

// Main function to insert test data
async function insertTestData() {
  try {
    console.log('Starting test data generation...');
    
    // Check if users already exist
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log(`Database already contains ${existingUsers.length} users.`);
      const response = 'Y'; // Auto confirm for scripting
      
      if (response.toUpperCase() === 'Y') {
        // delete all existing data in reverse order of dependencies
        await db.delete(notifications);
        await db.delete(endorsements);
        await db.delete(profileHistories);
        await db.delete(skillHistories);
        await db.delete(skills);
        await db.delete(users);
        console.log('Existing data cleared.');
      } else {
        console.log('Aborting data generation.');
        return;
      }
    }
    
    // Generate data in correct order to maintain relationships
    const generatedUsers = await generateUsers(CONFIG.USERS.COUNT);
    const generatedSkills = await generateSkills(generatedUsers);
    const generatedSkillHistories = await generateSkillHistories(generatedSkills);
    const generatedEndorsements = await generateEndorsements(generatedUsers, generatedSkills);
    const generatedProfileHistories = await generateProfileHistories(generatedUsers);
    const generatedNotifications = await generateNotifications(
      generatedUsers, 
      generatedSkills, 
      generatedEndorsements, 
      generatedSkillHistories
    );
    
    console.log('\nTest data generation complete!');
    console.log(`Generated:`);
    console.log(`- ${generatedUsers.length} users`);
    console.log(`- ${generatedSkills.length} skills`);
    console.log(`- ${generatedSkillHistories.length} skill histories`);
    console.log(`- ${generatedEndorsements.length} endorsements`);
    console.log(`- ${generatedProfileHistories.length} profile histories`);
    console.log(`- ${generatedNotifications.length} notifications`);
    
    // Log admin user credentials for testing
    const adminUsers = generatedUsers.filter(user => user.is_admin);
    console.log('\nAdmin user credentials for testing:');
    for (const admin of adminUsers) {
      console.log(`Email: ${admin.email}, Password: Admin@123`);
    }
    
    // Log regular user credentials for testing
    console.log('\nRegular user credentials for testing:');
    console.log(`All regular users have password: User@123`);
    console.log(`Sample regular users:`);
    for (let i = 0; i < Math.min(5, generatedUsers.length - adminUsers.length); i++) {
      const user = generatedUsers.find(u => !u.is_admin && u.email.includes('@'));
      if (user) {
        console.log(`Email: ${user.email}, Password: User@123`);
      }
    }
    
  } catch (error) {
    console.error('Error during test data generation:', error);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the data insertion
insertTestData().catch(err => {
  console.error('Fatal error during test data generation:', err);
  process.exit(1);
});

export { 
  generateUsers, 
  generateSkills,
  generateSkillHistories,
  generateEndorsements,
  generateNotifications,
  generateProfileHistories,
  insertTestData
};