// This script creates the missing tables in the database
import pkg from 'pg';
const { Pool } = pkg;

// Use the connection string from the environment variable
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
});

async function createTables() {
  try {
    const client = await pool.connect();
    try {
      console.log('Connected to database');
      
      // Check if skill_level enum exists
      const checkEnumQuery = `
        SELECT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'skill_level'
        );
      `;
      const enumResult = await client.query(checkEnumQuery);
      
      if (!enumResult.rows[0].exists) {
        console.log('Creating skill_level enum type...');
        await client.query(`
          CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'expert');
        `);
      }
      
      // Create skill templates table
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
      
      // Create skill targets table
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
      
      // Create skill target skills table
      console.log('Creating skill_target_skills table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "skill_target_skills" (
          "id" SERIAL PRIMARY KEY,
          "target_id" INTEGER NOT NULL,
          "skill_id" INTEGER NOT NULL
        );
      `);
      
      // Create skill target users table
      console.log('Creating skill_target_users table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "skill_target_users" (
          "id" SERIAL PRIMARY KEY,
          "target_id" INTEGER NOT NULL,
          "user_id" INTEGER NOT NULL
        );
      `);
      
      console.log('Tables created successfully');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await pool.end();
  }
}

createTables();