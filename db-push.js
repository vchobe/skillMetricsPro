// This script pushes the Drizzle schema to the database
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import pkg from 'pg';

// Use the connection string from the environment variable
const connectionString = process.env.DATABASE_URL;

console.log("Connecting to database...");
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql, { schema });

console.log("Running migration...");
try {
  // Perform the migration
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS drizzle`);
  
  // Create all tables from schema
  console.log("Creating skill templates table...");
  await db.execute(sql`
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
    )
  `);
  
  console.log("Creating skill targets table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "skill_targets" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "target_level" skill_level NOT NULL,
      "target_date" DATE,
      "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  console.log("Creating skill target skills table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "skill_target_skills" (
      "id" SERIAL PRIMARY KEY,
      "target_id" INTEGER NOT NULL,
      "skill_id" INTEGER NOT NULL
    )
  `);
  
  console.log("Creating skill target users table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "skill_target_users" (
      "id" SERIAL PRIMARY KEY,
      "target_id" INTEGER NOT NULL,
      "user_id" INTEGER NOT NULL
    )
  `);
  
  // Create project status enum if it doesn't exist
  console.log("Creating project_status enum type...");
  try {
    await db.execute(sql`
      CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled')
    `);
    console.log("Created project_status enum type");
  } catch (error) {
    // If enum already exists, continue
    console.log("project_status enum type already exists");
  }

  // Create new project management tables
  console.log("Creating clients table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "clients" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "contact_person" TEXT,
      "email" TEXT,
      "phone" TEXT,
      "address" TEXT,
      "description" TEXT,
      "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  console.log("Creating projects table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "projects" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "client_id" INTEGER NOT NULL,
      "status" project_status DEFAULT 'planning' NOT NULL,
      "start_date" DATE,
      "end_date" DATE,
      "location" TEXT,
      "notes" TEXT,
      "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  console.log("Creating project resources table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "project_resources" (
      "id" SERIAL PRIMARY KEY,
      "project_id" INTEGER NOT NULL,
      "user_id" INTEGER NOT NULL,
      "role" TEXT,
      "assigned_date" DATE DEFAULT NOW() NOT NULL,
      "removed_date" DATE,
      "notes" TEXT,
      "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  console.log("Creating project skills table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "project_skills" (
      "id" SERIAL PRIMARY KEY,
      "project_id" INTEGER NOT NULL,
      "skill_id" INTEGER NOT NULL,
      "required_level" skill_level NOT NULL,
      "notes" TEXT,
      "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  console.log("Migration completed successfully!");
} catch (error) {
  console.error("Migration failed:", error);
} finally {
  await sql.end();
}