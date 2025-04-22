/**
 * Cloud SQL Database Setup Script
 * 
 * This script sets up the database schema and initial data for Cloud SQL
 * using a direct TCP connection instead of Unix sockets.
 */
import pkg from 'pg';
const { Pool } = pkg;
import crypto from 'crypto';
import fs from 'fs';

// Helper function for password hashing
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function setupDatabase() {
  // Get database connection details from environment
  // Use direct TCP connection format for Cloud SQL
  const DB_USER = process.env.DB_USER || 'app_user';
  const DB_PASS = process.env.DB_PASSWORD;
  const DB_NAME = process.env.DB_NAME || 'appdb';
  const DB_HOST = process.env.DB_HOST; // e.g., "34.71.12.34" (public IP of your Cloud SQL instance)
  const DB_PORT = process.env.DB_PORT || 5432;

  // Check if required environment variables are set
  if (!DB_PASS) {
    console.error('Error: DB_PASSWORD environment variable must be set');
    process.exit(1);
  }

  if (!DB_HOST) {
    console.error('Error: DB_HOST environment variable must be set. This should be the public IP of your Cloud SQL instance.');
    process.exit(1);
  }

  // Create PostgreSQL connection string
  // Format: postgresql://user:password@host:port/database
  const connectionString = `postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  console.log(`Connecting to database: postgresql://${DB_USER}:***@${DB_HOST}:${DB_PORT}/${DB_NAME}`);

  let pool;
  try {
    // Create connection pool
    pool = new Pool({ connectionString });
    
    // Test connection
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    client.release();

    // Execute database setup SQL
    console.log('Setting up database schema and initial data...');
    
    // Read and execute SQL from schema.sql file if it exists
    if (fs.existsSync('./schema.sql')) {
      const schemaSql = fs.readFileSync('./schema.sql', 'utf8');
      await pool.query(schemaSql);
      console.log('Schema created from schema.sql');
    } else {
      // Execute inline schema creation SQL
      console.log('Creating schema inline...');
      
      // Create Users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          is_admin BOOLEAN DEFAULT FALSE,
          location VARCHAR(255),
          project VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Users table created');

      // Create Skill Categories table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS skill_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          color VARCHAR(50),
          icon VARCHAR(255),
          parent_id INTEGER REFERENCES skill_categories(id),
          is_visible BOOLEAN DEFAULT TRUE,
          order_index INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Skill Categories table created');
      
      // Create Skill Approvers table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS skill_approvers (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          category_id INTEGER REFERENCES skill_categories(id) ON DELETE CASCADE,
          subcategory_id INTEGER REFERENCES skill_categories(id) ON DELETE CASCADE,
          skill_id INTEGER, -- Will reference skills table
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, category_id, subcategory_id, skill_id)
        );
      `);
      console.log('Skill Approvers table created');
      
      // Create Skills table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS skills (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(255) NOT NULL,
          level VARCHAR(50) NOT NULL,
          description TEXT,
          certification VARCHAR(255),
          credly_link VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Skills table created');
      
      // Add skill_id foreign key constraint to skill_approvers
      await pool.query(`
        ALTER TABLE skill_approvers 
        ADD CONSTRAINT fk_skill 
        FOREIGN KEY (skill_id) 
        REFERENCES skills(id) 
        ON DELETE CASCADE;
      `);
      console.log('Added foreign key constraint to skill_approvers');
      
      // Create Skill History table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS skill_history (
          id SERIAL PRIMARY KEY,
          skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          previous_level VARCHAR(50),
          new_level VARCHAR(50) NOT NULL,
          change_note TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Skill History table created');
      
      // Create Pending Skill Updates table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS pending_skill_updates (
          id SERIAL PRIMARY KEY,
          skill_id INTEGER,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255),
          category VARCHAR(255),
          level VARCHAR(50),
          description TEXT,
          certification VARCHAR(255),
          credly_link VARCHAR(255),
          status VARCHAR(50) DEFAULT 'pending',
          reason TEXT,
          previous_level VARCHAR(50),
          requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          processed_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log('Pending Skill Updates table created');
      
      // Create Endorsements table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS endorsements (
          id SERIAL PRIMARY KEY,
          skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
          endorser_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          comment TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(skill_id, endorser_id)
        );
      `);
      console.log('Endorsements table created');
      
      // Create Profile History table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS profile_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          changed_field VARCHAR(255) NOT NULL,
          previous_value TEXT,
          new_value TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Profile History table created');
      
      // Create Notifications table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          read BOOLEAN DEFAULT FALSE,
          link VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Notifications table created');
    }
    
    // Insert test data
    console.log('Adding initial test data...');
    
    // Create admin user
    const adminPassword = await hashPassword('Admin@123');
    await pool.query(`
      INSERT INTO users (username, email, password, first_name, last_name, is_admin)
      VALUES ('admin', 'admin@atyeti.com', $1, 'Super', 'Admin', TRUE)
      ON CONFLICT (username) DO UPDATE
      SET password = $1, is_admin = TRUE
    `, [adminPassword]);
    console.log('Admin user created');
    
    // Create test users
    const userPassword = await hashPassword('User@123');
    const users = [
      ['john.doe', 'john.doe@example.com', 'John', 'Doe', 'New York', 'Project A'],
      ['jane.smith', 'jane.smith@example.com', 'Jane', 'Smith', 'Chicago', 'Project B'],
      ['bob.johnson', 'bob.johnson@example.com', 'Bob', 'Johnson', 'Los Angeles', 'Project C']
    ];
    
    for (const [username, email, firstName, lastName, location, project] of users) {
      await pool.query(`
        INSERT INTO users (username, email, password, first_name, last_name, location, project, is_admin)
        VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
        ON CONFLICT (username) DO NOTHING
      `, [username, email, userPassword, firstName, lastName, location, project]);
    }
    console.log('Test users created');
    
    // Create skill categories
    const categories = [
      ['Programming Languages', 'Languages used for software development', '#4285F4', 'code', null],
      ['Frameworks', 'Software frameworks', '#EA4335', 'layout', null],
      ['Databases', 'Database systems and technologies', '#34A853', 'database', null],
      ['Cloud Technologies', 'Cloud platforms and services', '#FBBC05', 'cloud', null],
      ['Dev Tools', 'Development tools and utilities', '#673AB7', 'tool', null]
    ];
    
    for (const [name, description, color, icon, parentId] of categories) {
      await pool.query(`
        INSERT INTO skill_categories (name, description, color, icon, parent_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (name) DO NOTHING
      `, [name, description, color, icon, parentId]);
    }
    console.log('Skill categories created');
    
    // Create subcategories
    const subcategories = [
      ['Frontend Frameworks', 'Frameworks for frontend development', '#E91E63', 'layout-dashboard', 2],
      ['Backend Frameworks', 'Frameworks for backend development', '#9C27B0', 'server', 2],
      ['Mobile Frameworks', 'Frameworks for mobile app development', '#FF9800', 'smartphone', 2],
      ['Relational Databases', 'SQL-based database systems', '#009688', 'database', 3],
      ['NoSQL Databases', 'Non-relational database systems', '#607D8B', 'database', 3]
    ];
    
    for (const [name, description, color, icon, parentId] of subcategories) {
      await pool.query(`
        INSERT INTO skill_categories (name, description, color, icon, parent_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (name) DO NOTHING
      `, [name, description, color, icon, parentId]);
    }
    console.log('Skill subcategories created');
    
    // Set up skill approvers
    // First get user IDs and category IDs
    const adminResult = await pool.query("SELECT id FROM users WHERE username = 'admin'");
    const johnResult = await pool.query("SELECT id FROM users WHERE username = 'john.doe'");
    const janeResult = await pool.query("SELECT id FROM users WHERE username = 'jane.smith'");
    
    const adminId = adminResult.rows[0]?.id;
    const johnId = johnResult.rows[0]?.id;
    const janeId = janeResult.rows[0]?.id;
    
    // Get category IDs
    const programmingResult = await pool.query("SELECT id FROM skill_categories WHERE name = 'Programming Languages'");
    const frameworksResult = await pool.query("SELECT id FROM skill_categories WHERE name = 'Frameworks'");
    const databasesResult = await pool.query("SELECT id FROM skill_categories WHERE name = 'Databases'");
    
    const programmingId = programmingResult.rows[0]?.id;
    const frameworksId = frameworksResult.rows[0]?.id;
    const databasesId = databasesResult.rows[0]?.id;
    
    // Get subcategory IDs
    const frontendResult = await pool.query("SELECT id FROM skill_categories WHERE name = 'Frontend Frameworks'");
    const backendResult = await pool.query("SELECT id FROM skill_categories WHERE name = 'Backend Frameworks'");
    
    const frontendId = frontendResult.rows[0]?.id;
    const backendId = backendResult.rows[0]?.id;
    
    // Add approvers
    if (adminId) {
      // Admin is approver for all categories
      await pool.query(`
        INSERT INTO skill_approvers (user_id, category_id, subcategory_id, skill_id)
        VALUES ($1, NULL, NULL, NULL)
        ON CONFLICT (user_id, category_id, subcategory_id, skill_id) DO NOTHING
      `, [adminId]);
    }
    
    if (johnId && programmingId) {
      // John is approver for programming languages
      await pool.query(`
        INSERT INTO skill_approvers (user_id, category_id, subcategory_id, skill_id)
        VALUES ($1, $2, NULL, NULL)
        ON CONFLICT (user_id, category_id, subcategory_id, skill_id) DO NOTHING
      `, [johnId, programmingId]);
    }
    
    if (janeId && frameworksId && frontendId) {
      // Jane is approver for frontend frameworks subcategory
      await pool.query(`
        INSERT INTO skill_approvers (user_id, category_id, subcategory_id, skill_id)
        VALUES ($1, $2, $3, NULL)
        ON CONFLICT (user_id, category_id, subcategory_id, skill_id) DO NOTHING
      `, [janeId, frameworksId, frontendId]);
    }
    
    console.log('Skill approvers created');
    
    // Add some skills for John
    if (johnId) {
      const skills = [
        ['JavaScript', 'Programming Languages', 'Expert', 'Advanced JavaScript including ES6+ features', 'JavaScript Certification', 'https://www.credly.com/js-cert'],
        ['React', 'Frontend Frameworks', 'Intermediate', 'React.js library for building user interfaces', 'React Developer', 'https://www.credly.com/react-cert'],
        ['Node.js', 'Backend Frameworks', 'Advanced', 'Server-side JavaScript runtime', 'Node.js Developer', 'https://www.credly.com/nodejs-cert']
      ];
      
      for (const [name, category, level, description, certification, credlyLink] of skills) {
        const result = await pool.query(`
          INSERT INTO skills (user_id, name, category, level, description, certification, credly_link)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [johnId, name, category, level, description, certification, credlyLink]);
        
        const skillId = result.rows[0]?.id;
        
        // Create skill history entry
        if (skillId) {
          await pool.query(`
            INSERT INTO skill_history (skill_id, user_id, previous_level, new_level, change_note)
            VALUES ($1, $2, NULL, $3, 'Initial skill creation')
          `, [skillId, johnId, level]);
        }
      }
      console.log('Added skills for John Doe');
    }
    
    // Add some skills for Jane
    if (janeId) {
      const skills = [
        ['Java', 'Programming Languages', 'Expert', 'Java programming language', 'Oracle Java Certified', 'https://www.credly.com/java-cert'],
        ['Spring Boot', 'Backend Frameworks', 'Advanced', 'Java-based framework for building microservices', 'Spring Professional', 'https://www.credly.com/spring-cert'],
        ['PostgreSQL', 'Relational Databases', 'Intermediate', 'Open-source relational database', 'PostgreSQL Administrator', 'https://www.credly.com/postgres-cert']
      ];
      
      for (const [name, category, level, description, certification, credlyLink] of skills) {
        const result = await pool.query(`
          INSERT INTO skills (user_id, name, category, level, description, certification, credly_link)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [janeId, name, category, level, description, certification, credlyLink]);
        
        const skillId = result.rows[0]?.id;
        
        // Create skill history entry
        if (skillId) {
          await pool.query(`
            INSERT INTO skill_history (skill_id, user_id, previous_level, new_level, change_note)
            VALUES ($1, $2, NULL, $3, 'Initial skill creation')
          `, [skillId, janeId, level]);
        }
      }
      console.log('Added skills for Jane Smith');
    }
    
    console.log('Database setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the setup function
setupDatabase()
  .then(() => {
    console.log('Database setup script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Database setup failed:', error);
    process.exit(1);
  });