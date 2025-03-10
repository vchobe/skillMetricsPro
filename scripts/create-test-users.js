import { pool } from '../server/db.ts';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Function to hash password
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

// Skill categories
const skillCategories = [
  'Programming', 'Development', 'Design', 'Marketing', 
  'Leadership', 'Project Management', 'Communication', 'Data Analysis'
];

// Skill names by category
const skillsByCategory = {
  'Programming': ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Rust', 'Go'],
  'Development': ['React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot'],
  'Design': ['UI/UX Design', 'Graphic Design', 'Adobe Photoshop', 'Figma', 'Sketch'],
  'Marketing': ['Content Marketing', 'Social Media Marketing', 'SEO', 'Email Marketing', 'Google Analytics'],
  'Leadership': ['Team Management', 'Strategic Planning', 'Decision Making', 'Conflict Resolution'],
  'Project Management': ['Agile Methodology', 'Scrum', 'Kanban', 'Gantt Charts', 'JIRA', 'Trello'],
  'Communication': ['Public Speaking', 'Technical Writing', 'Presentation Skills'],
  'Data Analysis': ['SQL', 'Excel', 'Tableau', 'Power BI', 'Python for Data Analysis', 'R']
};

// Skill levels
const skillLevels = ['beginner', 'intermediate', 'expert'];

// Random helper functions
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Main function to create test users and skills
async function createTestUsers() {
  try {
    console.log('Starting test user creation...');
    
    // Create 10 test users
    for (let i = 1; i <= 10; i++) {
      const username = `testuser${i}`;
      const email = `testuser${i}@example.com`;
      const password = await hashPassword('password123');
      const firstName = `Test`;
      const lastName = `User ${i}`;
      const is_admin = false;

      // Insert user
      const userResult = await pool.query(
        `INSERT INTO users (username, email, password, "firstName", "lastName", is_admin) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [username, email, password, firstName, lastName, is_admin]
      );
      
      const userId = userResult.rows[0].id;
      console.log(`Created user: ${username} with ID: ${userId}`);
      
      // Create 3-7 skills for each user
      const skillCount = 3 + Math.floor(Math.random() * 5);
      
      for (let j = 0; j < skillCount; j++) {
        const category = getRandomItem(skillCategories);
        const name = getRandomItem(skillsByCategory[category]);
        const level = getRandomItem(skillLevels);
        const isCertification = Math.random() > 0.7; // 30% chance of being a certification
        const lastUpdated = getRandomDate(new Date(2023, 0, 1), new Date());
        
        // Insert skill
        const skillResult = await pool.query(
          `INSERT INTO skills (
            user_id, name, description, category, level, years_of_experience, 
            certification, certification_link, last_updated, endorsement_count
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
          RETURNING id`,
          [
            userId, 
            name, 
            `Experience with ${name}`, 
            category, 
            level, 
            Math.floor(Math.random() * 10) + 1,
            isCertification,
            isCertification ? `https://cert.example.com/${name.toLowerCase().replace(/\s/g, '-')}` : null,
            lastUpdated,
            Math.floor(Math.random() * 5)
          ]
        );
        
        const skillId = skillResult.rows[0].id;
        console.log(`Created skill: ${name} (${level}) for user ${username}`);
        
        // Create skill history entry
        await pool.query(
          `INSERT INTO skill_histories (
            skill_id, user_id, previous_level, new_level, date, note
          ) 
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            skillId,
            userId,
            null,
            level,
            lastUpdated,
            `Initial skill level set to ${level}`
          ]
        );
      }
    }
    
    console.log('Successfully created 10 test users with skills');
    
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await pool.end();
  }
}

// Run the main function
createTestUsers();