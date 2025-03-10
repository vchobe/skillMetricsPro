// Script to add certification data to existing skills
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Generate a random date within the past 2 years
function getRandomDate() {
  const now = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(now.getFullYear() - 2);
  
  return new Date(twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime()));
}

// Sample certification providers
const certificationProviders = [
  'AWS', 'Microsoft', 'Google', 'Oracle', 'Cisco', 'CompTIA', 
  'PMI', 'Salesforce', 'Adobe', 'RedHat', 'IBM', 'Kubernetes'
];

// Sample certification names by category
const certifications = {
  'Frontend': ['React Developer', 'Angular Expert', 'Vue.js Professional', 'Frontend Architecture', 'UI/UX Specialist'],
  'Backend': ['Node.js Developer', 'Java Enterprise', 'Spring Boot Professional', 'API Design', 'Microservices Expert'],
  'Database': ['PostgreSQL Administration', 'MongoDB Developer', 'SQL Expert', 'Database Architecture', 'Data Modeling'],
  'DevOps': ['Docker Certified', 'Kubernetes Administrator', 'AWS DevOps', 'CI/CD Pipeline Architect', 'Infrastructure as Code'],
  'Mobile': ['iOS Developer', 'Android Specialist', 'React Native Expert', 'Mobile Architecture', 'Flutter Developer'],
  'Security': ['Certified Ethical Hacker', 'Security+', 'CISSP', 'Application Security', 'Penetration Testing'],
  'Data Science': ['Data Science Professional', 'Machine Learning Engineer', 'Data Analytics', 'Big Data Architect', 'AI Specialist'],
  'Cloud': ['AWS Solutions Architect', 'Azure Developer', 'Google Cloud Engineer', 'Cloud Security', 'Multi-cloud Strategy'],
  'Project Management': ['PMP', 'Scrum Master', 'Agile Coach', 'PRINCE2', 'Project Management Professional'],
  'Design': ['UX Design', 'UI Architecture', 'Design Systems', 'Visual Design', 'Interaction Design'],
};

// Generate a random certification name based on skill category
function getCertificationName(category) {
  // Default to 'Frontend' if category doesn't match
  const certCategory = certifications[category] ? category : 'Frontend';
  const certOptions = certifications[certCategory];
  const provider = certificationProviders[Math.floor(Math.random() * certificationProviders.length)];
  const certName = certOptions[Math.floor(Math.random() * certOptions.length)];
  
  return `${provider} ${certName}`;
}

// Generate a random credlyLink
function getCredlyLink() {
  return `https://credly.com/badges/${Math.random().toString(36).substring(2, 10)}`;
}

async function addCertificationsToSkills() {
  const client = await pool.connect();
  
  try {
    console.log('Starting to add certification data to skills...');
    
    // Get all users
    const usersResult = await client.query('SELECT id FROM users');
    const users = usersResult.rows;
    
    console.log(`Found ${users.length} users`);
    
    // Process each user
    for (const user of users) {
      // Get skills for this user
      const skillsResult = await client.query('SELECT id, name, category, level FROM skills WHERE user_id = $1', [user.id]);
      const skills = skillsResult.rows;
      
      console.log(`User ${user.id} has ${skills.length} skills`);
      
      // Add certifications to intermediate and expert skills (50% chance for each)
      for (const skill of skills) {
        if ((skill.level === 'intermediate' || skill.level === 'expert') && Math.random() > 0.5) {
          const acquiredDate = getRandomDate();
          const expirationDate = new Date(acquiredDate);
          expirationDate.setFullYear(expirationDate.getFullYear() + 2); // Expires 2 years after acquisition
          
          const certificationName = getCertificationName(skill.category);
          const credlyLink = getCredlyLink();
          
          // Update the skill with certification data
          await client.query(
            'UPDATE skills SET certification = $1, credlyLink = $2, certification_date = $3, expiration_date = $4 WHERE id = $5',
            [certificationName, credlyLink, acquiredDate, expirationDate, skill.id]
          );
          
          console.log(`Added certification "${certificationName}" to skill ${skill.id} (${skill.name})`);
        }
      }
    }
    
    console.log('Finished adding certification data to skills!');
  } catch (err) {
    console.error('Error adding certifications:', err);
  } finally {
    client.release();
  }
}

// Run the script
addCertificationsToSkills().then(() => {
  console.log('Script completed successfully');
  pool.end();
}).catch(err => {
  console.error('Script failed:', err);
  pool.end();
});