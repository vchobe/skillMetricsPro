// This script sets up the database schema and creates test users
import pkg from 'pg';
const { Pool } = pkg;
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

// Use the connection string from the environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function setupDatabase() {
  try {
    const client = await pool.connect();
    try {
      console.log('Connected to database');
      
      // Create skill_level enum type
      console.log('Creating skill_level enum type...');
      try {
        await client.query(`CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'expert');`);
        console.log('Created skill_level enum type');
      } catch (err) {
        // Type might already exist
        console.log('Note: skill_level enum type might already exist');
      }
      
      try {
        await client.query(`CREATE TYPE notification_type AS ENUM ('endorsement', 'level_up', 'achievement');`);
        console.log('Created notification_type enum type');
      } catch (err) {
        // Type might already exist
        console.log('Note: notification_type enum type might already exist');
      }
      
      // Create users table
      console.log('Creating users table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" SERIAL PRIMARY KEY,
          "email" TEXT NOT NULL UNIQUE,
          "is_admin" BOOLEAN DEFAULT false NOT NULL,
          "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
          "username" TEXT DEFAULT '',
          "password" TEXT DEFAULT '',
          "first_name" TEXT DEFAULT '',
          "last_name" TEXT DEFAULT '',
          "project" TEXT DEFAULT '',
          "role" TEXT DEFAULT '',
          "location" TEXT DEFAULT ''
        );
      `);
      
      // Create skills table
      console.log('Creating skills table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "skills" (
          "id" SERIAL PRIMARY KEY,
          "user_id" INTEGER NOT NULL,
          "name" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "level" skill_level NOT NULL,
          "last_updated" TIMESTAMP DEFAULT NOW() NOT NULL,
          "certification" TEXT,
          "credly_link" TEXT,
          "notes" TEXT,
          "endorsement_count" INTEGER DEFAULT 0,
          "certification_date" TIMESTAMP,
          "expiration_date" TIMESTAMP
        );
      `);
      
      // Create skill_histories table
      console.log('Creating skill_histories table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "skill_histories" (
          "id" SERIAL PRIMARY KEY,
          "skill_id" INTEGER NOT NULL,
          "user_id" INTEGER NOT NULL,
          "previous_level" skill_level,
          "new_level" skill_level NOT NULL,
          "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
          "change_note" TEXT
        );
      `);
      
      // Create profile_histories table
      console.log('Creating profile_histories table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "profile_histories" (
          "id" SERIAL PRIMARY KEY,
          "user_id" INTEGER NOT NULL,
          "changed_field" TEXT NOT NULL,
          "previous_value" TEXT,
          "new_value" TEXT NOT NULL,
          "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      
      // Create notifications table
      console.log('Creating notifications table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "notifications" (
          "id" SERIAL PRIMARY KEY,
          "user_id" INTEGER NOT NULL,
          "type" notification_type NOT NULL,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "is_read" BOOLEAN DEFAULT false NOT NULL,
          "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
          "related_id" INTEGER
        );
      `);
      
      // Create endorsements table
      console.log('Creating endorsements table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "endorsements" (
          "id" SERIAL PRIMARY KEY,
          "skill_id" INTEGER NOT NULL,
          "endorser_id" INTEGER NOT NULL,
          "user_id" INTEGER NOT NULL,
          "comment" TEXT,
          "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      
      // Create skill_templates table
      console.log('Creating skill_templates table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "skill_templates" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "description" TEXT,
          "is_recommended" BOOLEAN DEFAULT false,
          "target_level" skill_level,
          "target_date" DATE,
          "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
          "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      
      // Create skill_targets table
      console.log('Creating skill_targets table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "skill_targets" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "target_level" skill_level NOT NULL,
          "target_date" DATE,
          "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
          "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      
      // Create skill_target_skills table
      console.log('Creating skill_target_skills table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "skill_target_skills" (
          "id" SERIAL PRIMARY KEY,
          "target_id" INTEGER NOT NULL,
          "skill_id" INTEGER NOT NULL
        );
      `);
      
      // Create skill_target_users table
      console.log('Creating skill_target_users table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "skill_target_users" (
          "id" SERIAL PRIMARY KEY,
          "target_id" INTEGER NOT NULL,
          "user_id" INTEGER NOT NULL
        );
      `);
      
      // Create sessions table for express-session
      console.log('Creating session table for express-session...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default" PRIMARY KEY,
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL
        );
      `);
      
      // Create test admin user
      const adminEmail = 'admin@skillsplatform.com';
      const adminPassword = await hashPassword('adminpass');
      
      // Check if admin user already exists
      const checkAdmin = await client.query(`SELECT * FROM users WHERE email = $1`, [adminEmail]);
      
      if (checkAdmin.rows.length === 0) {
        console.log('Creating admin user...');
        await client.query(`
          INSERT INTO users (email, is_admin, username, password, role) 
          VALUES ($1, true, 'admin', $2, 'Administrator')
        `, [adminEmail, adminPassword]);
        console.log(`Created admin user: ${adminEmail}`);
      } else {
        console.log('Admin user already exists');
      }
      
      // Create test user
      const testEmail = 'test@example.com';
      const testPassword = await hashPassword('testpass');
      
      // Check if test user already exists
      const checkTest = await client.query(`SELECT * FROM users WHERE email = $1`, [testEmail]);
      
      if (checkTest.rows.length === 0) {
        console.log('Creating test user...');
        await client.query(`
          INSERT INTO users (email, is_admin, username, password, role, first_name, last_name) 
          VALUES ($1, true, 'testuser', $2, 'Developer', 'Test', 'User')
        `, [testEmail, testPassword]);
        console.log(`Created test user: ${testEmail}`);
      } else {
        console.log('Test user already exists');
      }
      
      console.log('Database setup completed successfully');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await pool.end();
  }
}

setupDatabase();