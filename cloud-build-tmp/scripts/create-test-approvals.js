// Create test approval data for the Skills Management Platform
import { pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { faker } from '@faker-js/faker';
import * as schema from '../shared/schema.js';

// Create a Drizzle instance with the appropriate schema
const db = drizzle({ client: pool, schema });
import { eq, ne, and } from 'drizzle-orm';

async function getRandomNonAdminUser() {
  const allUsers = await db.select().from(schema.users).where(eq(schema.users.is_admin, false));
  if (allUsers.length === 0) {
    throw new Error('No non-admin users found in the database');
  }
  return allUsers[Math.floor(Math.random() * allUsers.length)];
}

async function getRandomUserSkill(userId) {
  const userSkills = await db.select().from(schema.skills).where(eq(schema.skills.userId, userId));
  if (userSkills.length === 0) {
    return null; // User has no skills yet
  }
  return userSkills[Math.floor(Math.random() * userSkills.length)];
}

function getRandomSkillLevel() {
  const levels = ['beginner', 'intermediate', 'expert'];
  return levels[Math.floor(Math.random() * levels.length)];
}

function getRandomCategory() {
  const categories = [
    'Programming Languages',
    'Frameworks',
    'Cloud',
    'DevOps',
    'Databases',
    'Testing',
    'Project Management',
    'Design',
    'Machine Learning',
    'Security'
  ];
  return categories[Math.floor(Math.random() * categories.length)];
}

function getRandomSkillName(category) {
  const skillsByCategory = {
    'Programming Languages': ['JavaScript', 'Python', 'Java', 'C#', 'Go', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'TypeScript'],
    'Frameworks': ['React', 'Angular', 'Vue.js', 'Spring Boot', 'Django', 'Flask', 'Express.js', 'Laravel', 'ASP.NET', 'Ruby on Rails'],
    'Cloud': ['AWS', 'Azure', 'Google Cloud', 'DigitalOcean', 'Heroku', 'Kubernetes', 'Docker', 'Terraform', 'CloudFormation'],
    'DevOps': ['Jenkins', 'CircleCI', 'GitLab CI', 'GitHub Actions', 'Ansible', 'Chef', 'Puppet', 'Nagios', 'Prometheus', 'Grafana'],
    'Databases': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB', 'Elasticsearch', 'SQL Server', 'Oracle', 'Neo4j'],
    'Testing': ['Jest', 'Mocha', 'Selenium', 'Cypress', 'JUnit', 'pytest', 'TestNG', 'Playwright', 'WebdriverIO'],
    'Project Management': ['Jira', 'Trello', 'Asana', 'Monday.com', 'ClickUp', 'Microsoft Project', 'Scrum', 'Kanban', 'Agile', 'Waterfall'],
    'Design': ['Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'InDesign', 'UI Design', 'UX Design', 'Prototyping'],
    'Machine Learning': ['TensorFlow', 'PyTorch', 'scikit-learn', 'Keras', 'NLTK', 'Computer Vision', 'NLP', 'Deep Learning'],
    'Security': ['Penetration Testing', 'OWASP', 'Security Auditing', 'Encryption', 'Network Security', 'Web Security', 'Ethical Hacking']
  };
  
  const defaultSkills = ['Technical Writing', 'Communication', 'Teamwork', 'Problem Solving'];
  const skillsForCategory = skillsByCategory[category] || defaultSkills;
  
  return skillsForCategory[Math.floor(Math.random() * skillsForCategory.length)];
}

function randomCertificationName(skillName) {
  const certificationsBySkill = {
    'JavaScript': ['JavaScript Developer Certification', 'Advanced JavaScript', 'JS Master Certification'],
    'Python': ['Python Developer Certification', 'Certified Python Associate', 'Python Data Science Certification'],
    'Java': ['Oracle Certified Java Programmer', 'Java EE Developer', 'Spring Certified Professional'],
    'AWS': ['AWS Certified Solutions Architect', 'AWS Certified Developer', 'AWS Certified SysOps Administrator'],
    'Azure': ['Microsoft Certified: Azure Developer', 'Microsoft Certified: Azure Administrator', 'Azure Security Engineer'],
    'Google Cloud': ['Google Cloud Certified - Professional Cloud Architect', 'Google Cloud Professional Data Engineer'],
    'Kubernetes': ['Certified Kubernetes Administrator (CKA)', 'Certified Kubernetes Application Developer (CKAD)'],
    'Docker': ['Docker Certified Associate'],
    'React': ['React Developer Certification', 'Advanced React Patterns'],
    'Angular': ['Angular Certified Developer', 'Angular Advanced Topics'],
    'MongoDB': ['MongoDB Certified Developer', 'MongoDB Certified DBA'],
    'PostgreSQL': ['PostgreSQL Certified Associate', 'PostgreSQL Administration Certification'],
    'TensorFlow': ['TensorFlow Developer Certificate', 'TensorFlow Advanced Techniques'],
  };
  
  if (certificationsBySkill[skillName]) {
    return certificationsBySkill[skillName][Math.floor(Math.random() * certificationsBySkill[skillName].length)];
  }
  
  // Generic certification names
  const genericCertifications = [
    `Certified ${skillName} Professional`,
    `Advanced ${skillName}`,
    `${skillName} Specialist Certification`,
    `Professional ${skillName} Developer`
  ];
  
  return genericCertifications[Math.floor(Math.random() * genericCertifications.length)];
}

function getRandomCredlyLink() {
  return `https://credly.com/badges/${faker.string.alphanumeric(10)}/${faker.string.alphanumeric(8)}`;
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function createPendingSkillUpdates() {
  console.log('Creating pending skill approval test data...');
  
  // Clear existing pending updates
  await db.delete(schema.pendingSkillUpdates);
  console.log('Cleared existing pending skill updates');
  
  const insertedUpdates = [];
  const totalUpdates = 15; // Create 15 pending updates
  
  // First create some new skill submissions
  for (let i = 0; i < 8; i++) {
    try {
      const user = await getRandomNonAdminUser();
      const category = getRandomCategory();
      const skillName = getRandomSkillName(category);
      const level = getRandomSkillLevel();
      const hasCertification = Math.random() > 0.5;
      const certification = hasCertification ? randomCertificationName(skillName) : null;
      const credlyLink = hasCertification ? getRandomCredlyLink() : null;
      
      const certificationDate = hasCertification ? 
        getRandomDate(new Date(2023, 0, 1), new Date()) : null;
      
      const expirationDate = hasCertification && Math.random() > 0.3 ? 
        getRandomDate(new Date(), new Date(2026, 11, 31)) : null;
        
      const submittedAt = getRandomDate(
        new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date()
      );
      
      const pendingUpdate = {
        userId: user.id,
        skillId: null, // null for new skills
        name: skillName,
        category,
        level,
        certification,
        credlyLink,
        notes: faker.lorem.sentence(),
        certificationDate,
        expirationDate,
        status: "pending",
        submittedAt,
        isUpdate: false // New skill
      };
      
      const [inserted] = await db.insert(pendingSkillUpdates).values(pendingUpdate).returning();
      insertedUpdates.push(inserted);
      console.log(`Created new skill pending update: ${skillName} for user ${user.email}`);
    } catch (error) {
      console.error('Error creating new skill pending update:', error);
    }
  }
  
  // Now create some skill update submissions
  for (let i = 0; i < 7; i++) {
    try {
      const user = await getRandomNonAdminUser();
      const skill = await getRandomUserSkill(user.id);
      
      if (!skill) {
        console.log(`User ${user.email} has no skills to update, skipping`);
        continue;
      }
      
      // Determine what to update (level, certification, or both)
      const updateLevel = Math.random() > 0.3;
      const updateCertification = Math.random() > 0.5;
      
      // Get a different level than the current one
      let newLevel = skill.level;
      if (updateLevel) {
        const levels = ['beginner', 'intermediate', 'expert'].filter(l => l !== skill.level);
        newLevel = levels[Math.floor(Math.random() * levels.length)];
      }
      
      // Maybe add or update certification
      const hasCertification = updateCertification ? Math.random() > 0.3 : !!skill.certification;
      const certification = hasCertification ? 
        (skill.certification || randomCertificationName(skill.name)) : null;
      
      const credlyLink = hasCertification ? 
        (skill.credlyLink || getRandomCredlyLink()) : null;
      
      const certificationDate = hasCertification ? 
        (skill.certificationDate || getRandomDate(new Date(2023, 0, 1), new Date())) : null;
      
      const expirationDate = hasCertification && Math.random() > 0.3 ? 
        getRandomDate(new Date(), new Date(2026, 11, 31)) : null;
        
      const submittedAt = getRandomDate(
        new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date()
      );
      
      const pendingUpdate = {
        userId: user.id,
        skillId: skill.id,
        name: skill.name,
        category: skill.category,
        level: newLevel,
        certification,
        credlyLink,
        notes: faker.lorem.sentence(),
        certificationDate,
        expirationDate,
        status: "pending",
        submittedAt,
        isUpdate: true // Updating existing skill
      };
      
      const [inserted] = await db.insert(pendingSkillUpdates).values(pendingUpdate).returning();
      insertedUpdates.push(inserted);
      console.log(`Created skill update pending approval: ${skill.name} for user ${user.email}`);
    } catch (error) {
      console.error('Error creating skill update pending approval:', error);
    }
  }
  
  console.log(`Successfully created ${insertedUpdates.length} pending skill updates`);
  return insertedUpdates;
}

// Run the script
createPendingSkillUpdates().then(() => {
  console.log('✅ Test approval data creation complete!');
  process.exit(0);
}).catch(err => {
  console.error('Error creating test approval data:', err);
  process.exit(1);
});