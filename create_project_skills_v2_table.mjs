/**
 * Execute SQL script to create project_skills_v2 table
 * Using the same connection parameters as the server
 */

import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

function getDatabaseConfig() {
  // Use Cloud SQL configuration (Google Cloud SQL only)
  const cloudSqlUser = process.env.CLOUD_SQL_USER;
  const cloudSqlPassword = process.env.CLOUD_SQL_PASSWORD;
  const cloudSqlDatabase = process.env.CLOUD_SQL_DATABASE;
  
  // In development or direct connection mode, use TCP connection
  const dbHost = process.env.CLOUD_SQL_HOST || 'localhost';
  const dbPort = parseInt(process.env.CLOUD_SQL_PORT || '5432', 10);
  
  console.log(`Using direct TCP connection to: ${dbHost}:${dbPort}`);
  console.log(`Database: ${cloudSqlDatabase}, User: ${cloudSqlUser}`);
  
  return {
    user: cloudSqlUser,
    password: cloudSqlPassword,
    database: cloudSqlDatabase,
    host: dbHost,
    port: dbPort,
    ssl: process.env.CLOUD_SQL_USE_SSL === 'true',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  };
}

async function executeSQL() {
  // Create a new pool using the same config as server/db.ts
  const pool = new Pool(getDatabaseConfig());

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected successfully');

    console.log('Creating project_skills_v2 table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_skills_v2 (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        skill_template_id INTEGER NOT NULL REFERENCES skill_templates(id),
        user_skill_id INTEGER,
        required_level VARCHAR(20) DEFAULT 'beginner',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Table created successfully');

    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_project_skills_v2_project_id ON project_skills_v2(project_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_project_skills_v2_skill_template_id ON project_skills_v2(skill_template_id);
    `);
    console.log('Indexes created successfully');

    client.release();
    console.log('Script completed successfully');
  } catch (error) {
    console.error('Error executing SQL:', error);
  } finally {
    await pool.end();
  }
}

executeSQL();