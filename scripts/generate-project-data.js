/**
 * Script to generate project management test data
 * - Creates test clients
 * - Creates projects for each client
 * - Assigns resources to projects
 * - Adds required skills to projects
 */

import pg from 'pg';
import { faker } from '@faker-js/faker';
import { format, addMonths, subMonths } from 'date-fns';

const { Pool } = pg;
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Project statuses
const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

// Skill levels
const SKILL_LEVELS = ['beginner', 'intermediate', 'expert'];

// Format date for database
const formatDate = (date) => {
  return format(date, 'yyyy-MM-dd');
};

// Generate random date within the last 6 months
const getRandomPastDate = () => {
  return formatDate(subMonths(new Date(), Math.floor(Math.random() * 6)));
};

// Generate random date within the next 6 months
const getRandomFutureDate = () => {
  return formatDate(addMonths(new Date(), Math.floor(Math.random() * 6) + 1));
};

// Create test clients
async function createClients(count = 5) {
  console.log(`Creating ${count} test clients...`);
  const clients = [];

  for (let i = 0; i < count; i++) {
    const name = faker.company.name();
    const contactPerson = faker.person.fullName();
    const email = faker.internet.email();
    const phone = faker.phone.number();
    const address = faker.location.streetAddress() + ', ' + faker.location.city() + ', ' + faker.location.state() + ' ' + faker.location.zipCode();
    const description = faker.company.catchPhrase();

    const result = await pool.query(`
      INSERT INTO clients (name, contact_person, email, phone, address, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [name, contactPerson, email, phone, address, description]);

    clients.push({
      id: result.rows[0].id,
      name
    });
    console.log(`  - Created client: ${name}`);
  }

  return clients;
}

// Create projects for each client
async function createProjects(clients, projectsPerClient = 2) {
  console.log(`Creating ${projectsPerClient} projects per client...`);
  const projects = [];

  for (const client of clients) {
    for (let i = 0; i < projectsPerClient; i++) {
      const name = faker.company.catchPhrase();
      const description = faker.lorem.paragraph();
      const status = PROJECT_STATUSES[Math.floor(Math.random() * PROJECT_STATUSES.length)];
      const location = faker.location.city() + ', ' + faker.location.country();
      const notes = faker.lorem.sentences(2);
      
      // Set dates based on status
      let startDate, endDate;
      
      switch (status) {
        case 'planning':
          startDate = getRandomFutureDate();
          endDate = formatDate(addMonths(new Date(startDate), Math.floor(Math.random() * 6) + 3));
          break;
        case 'active':
          startDate = getRandomPastDate();
          endDate = getRandomFutureDate();
          break;
        case 'on_hold':
          startDate = getRandomPastDate();
          endDate = getRandomFutureDate();
          break;
        case 'completed':
          startDate = getRandomPastDate();
          endDate = formatDate(new Date());
          break;
        case 'cancelled':
          startDate = getRandomPastDate();
          endDate = getRandomPastDate();
          break;
        default:
          startDate = getRandomPastDate();
          endDate = getRandomFutureDate();
      }

      const result = await pool.query(`
        INSERT INTO projects (name, description, client_id, status, start_date, end_date, location, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [name, description, client.id, status, startDate, endDate, location, notes]);

      projects.push({
        id: result.rows[0].id,
        name,
        status,
        clientId: client.id
      });
      console.log(`  - Created project: ${name} (Status: ${status}) for client: ${client.name}`);
    }
  }

  return projects;
}

// Get all users for resource assignment
async function getUsers() {
  const result = await pool.query('SELECT id, username, email, first_name, last_name, role FROM users WHERE is_admin = false');
  return result.rows;
}

// Get all skills for project skill requirements
async function getSkills() {
  const result = await pool.query('SELECT id, name, category FROM skills');
  return result.rows;
}

// Assign resources to projects
async function assignResourcesToProjects(projects, users) {
  console.log('Assigning resources to projects...');
  
  for (const project of projects) {
    // Randomly select 2-5 users for each project
    const resourceCount = Math.floor(Math.random() * 4) + 2;
    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    const selectedUsers = shuffledUsers.slice(0, resourceCount);
    
    for (const user of selectedUsers) {
      const assignedDate = project.status === 'planning' ? getRandomFutureDate() : getRandomPastDate();
      let removedDate = null;
      
      // If project is completed or cancelled, some resources might have been removed
      if (project.status === 'completed' || project.status === 'cancelled') {
        // 50% chance of having a removal date
        if (Math.random() > 0.5) {
          removedDate = formatDate(new Date(project.endDate));
        }
      }
      
      const role = ['Developer', 'Tester', 'Designer', 'Project Manager', 'Business Analyst'][Math.floor(Math.random() * 5)];
      const notes = faker.lorem.sentence();
      
      await pool.query(`
        INSERT INTO project_resources (project_id, user_id, role, assigned_date, removed_date, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [project.id, user.id, role, assignedDate, removedDate, notes]);
      
      console.log(`  - Assigned ${user.username} as ${role} to project: ${project.name}`);
    }
  }
}

// Add required skills to projects
async function addSkillsToProjects(projects, skills) {
  console.log('Adding required skills to projects...');
  
  for (const project of projects) {
    // Randomly select 3-7 skills for each project
    const skillCount = Math.floor(Math.random() * 5) + 3;
    const shuffledSkills = [...skills].sort(() => 0.5 - Math.random());
    const selectedSkills = shuffledSkills.slice(0, skillCount);
    
    for (const skill of selectedSkills) {
      const requiredLevel = SKILL_LEVELS[Math.floor(Math.random() * SKILL_LEVELS.length)];
      const notes = faker.lorem.sentence();
      
      await pool.query(`
        INSERT INTO project_skills (project_id, skill_id, required_level, notes)
        VALUES ($1, $2, $3, $4)
      `, [project.id, skill.id, requiredLevel, notes]);
      
      console.log(`  - Added required skill: ${skill.name} (${requiredLevel}) to project: ${project.name}`);
    }
  }
}

// Main function to generate all project data
async function generateProjectData() {
  try {
    console.log('Starting project data generation...');
    
    // First create the admin user to ensure we have one
    try {
      const adminCheck = await pool.query("SELECT * FROM users WHERE email = 'admin@atyeti.com'");
      
      if (adminCheck.rows.length === 0) {
        console.log('Creating admin user...');
        await pool.query(`
          INSERT INTO users (email, username, password, first_name, last_name, role, is_admin)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          'admin@atyeti.com',
          'admin',
          // Pre-hashed password for 'Admin@123'
          '5bb2998b3e8a8a057c0bd9c657efcb2bb13c42aae210ef50bc37f3ffc8fecdaec4c4a2f1ad2be861b14c3a3136bd01f3c4e7d70f95054fc4f21c5805f8490aa3.87249f85909fa7b7f36107c24befd90e',
          'Admin',
          'User',
          'Administrator',
          true
        ]);
        console.log('Admin user created.');
      } else {
        console.log('Admin user already exists.');
      }
    } catch (error) {
      console.error('Error checking/creating admin user:', error);
    }
    
    // Get users and skills
    const users = await getUsers();
    
    if (users.length === 0) {
      console.log('No non-admin users found. Please run scripts/create-test-users.js first.');
      return;
    }
    
    const skills = await getSkills();
    
    if (skills.length === 0) {
      console.log('No skills found. Please run scripts/regenerate-data.js first.');
      return;
    }
    
    // Create test data
    const clients = await createClients(5);
    const projects = await createProjects(clients, 3);
    await assignResourcesToProjects(projects, users);
    await addSkillsToProjects(projects, skills);
    
    console.log('Project data generation completed successfully!');
    
  } catch (error) {
    console.error('Error generating project data:', error);
  } finally {
    await pool.end();
  }
}

// Run the function
generateProjectData();