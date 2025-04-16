// This script pushes the Drizzle schema to the database
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./shared/schema.ts"; // Use .ts extension

// Use the connection string from the environment variable
const connectionString = process.env.DATABASE_URL;

console.log("Connecting to database...");
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql, { schema });

console.log("Running migration...");
try {
  // Perform the migration
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS drizzle`);
  
  // Create clients table
  console.log("Creating clients table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "clients" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "industry" TEXT,
      "contact_name" TEXT,
      "contact_email" TEXT,
      "contact_phone" TEXT,
      "website" TEXT,
      "logo_url" TEXT,
      "notes" TEXT,
      "created_at" TIMESTAMP DEFAULT NOW(),
      "updated_at" TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Create projects table
  console.log("Creating projects table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "projects" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "client_id" INTEGER REFERENCES "clients"("id"),
      "start_date" TIMESTAMP,
      "end_date" TIMESTAMP,
      "location" TEXT,
      "confluence_link" TEXT,
      "lead_id" INTEGER REFERENCES "users"("id"),
      "delivery_lead_id" INTEGER REFERENCES "users"("id"),
      "status" TEXT DEFAULT 'active',
      "created_at" TIMESTAMP DEFAULT NOW(),
      "updated_at" TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Create project resources table
  console.log("Creating project resources table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "project_resources" (
      "id" SERIAL PRIMARY KEY,
      "project_id" INTEGER NOT NULL REFERENCES "projects"("id"),
      "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
      "role" TEXT,
      "allocation" INTEGER DEFAULT 100,
      "start_date" TIMESTAMP,
      "end_date" TIMESTAMP,
      "notes" TEXT,
      "created_at" TIMESTAMP DEFAULT NOW(),
      "updated_at" TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Create project skills table
  console.log("Creating project skills table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "project_skills" (
      "id" SERIAL PRIMARY KEY,
      "project_id" INTEGER NOT NULL REFERENCES "projects"("id"),
      "skill_id" INTEGER NOT NULL REFERENCES "skills"("id"),
      "required_level" TEXT DEFAULT 'beginner',
      "importance" TEXT DEFAULT 'medium',
      "created_at" TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Create project resource histories table
  console.log("Creating project resource histories table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "project_resource_histories" (
      "id" SERIAL PRIMARY KEY,
      "project_id" INTEGER NOT NULL REFERENCES "projects"("id"),
      "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
      "action" TEXT NOT NULL,
      "previous_role" TEXT,
      "new_role" TEXT,
      "previous_allocation" INTEGER,
      "new_allocation" INTEGER,
      "date" TIMESTAMP DEFAULT NOW(),
      "performed_by_id" INTEGER REFERENCES "users"("id"),
      "note" TEXT
    )
  `);
  
  console.log("Migration completed successfully!");
} catch (error) {
  console.error("Migration failed:", error);
} finally {
  await sql.end();
}