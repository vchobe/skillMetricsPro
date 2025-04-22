/**
 * Create Tables Script for Cloud Run
 * 
 * This script extracts the table structure from Drizzle schema and creates tables
 * in the connected PostgreSQL database. It's optimized for Cloud Run deployment.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './shared/schema.js';

// Read environment variables
const isDevelopment = process.env.NODE_ENV !== 'production';
const isCloudRun = process.env.K_SERVICE ? true : false;
const useSocketConnection = process.env.USE_SOCKET_CONNECTION === 'true' || isCloudRun;

// Log environment information
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Is Cloud Run:', isCloudRun ? 'Yes' : 'No');
console.log('Using Socket Connection:', useSocketConnection ? 'Yes' : 'No');

// Get database connection details
const getDbConfig = () => {
  // For Cloud Run with Unix socket connection
  if (useSocketConnection) {
    const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
    if (!instanceConnectionName) {
      throw new Error('INSTANCE_CONNECTION_NAME environment variable is required for socket connection');
    }
    
    console.log(`Using Cloud SQL socket connection to: ${instanceConnectionName}`);
    return {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'postgres',
      host: `/cloudsql/${instanceConnectionName}`,
      ssl: false, // SSL is not used with Unix socket
    };
  }
  
  // For standard connections (development or via Cloud SQL Auth Proxy)
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    console.log('Using DATABASE_URL for connection');
    return { connectionString: databaseUrl };
  }
  
  // For explicit connection parameters
  return {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10)
  };
};

const createTables = async () => {
  try {
    // Create a PostgreSQL connection pool
    const dbConfig = getDbConfig();
    console.log('Database configuration:', {
      ...dbConfig,
      password: dbConfig.password ? '[HIDDEN]' : undefined
    });
    
    const pool = new Pool(dbConfig);
    
    // Test the connection
    console.log('Testing database connection...');
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    console.log('Database connection successful!');
    client.release();
    
    // Create the Drizzle ORM instance
    const db = drizzle(pool, { schema });
    
    // Push schema to the database using Drizzle's built-in migration
    console.log('Creating database tables from Drizzle schema...');
    
    // Query to get all existing tables
    const existingTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    `);
    
    const existingTables = existingTablesResult.rows.map(row => row.table_name);
    console.log('Existing tables:', existingTables.join(', ') || 'None');
    
    // Create tables if they don't exist (simplified approach)
    // Drizzle doesn't have a built-in "create tables if not exist" feature,
    // so we'll run raw SQL queries instead
    
    // Check and create enum types first
    try {
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
            CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'skill_level') THEN
            CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'expert');
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tab_visibility') THEN
            CREATE TYPE tab_visibility AS ENUM ('visible', 'hidden');
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
            CREATE TYPE notification_type AS ENUM ('endorsement', 'level_up', 'achievement');
          END IF;
        END
        $$;
      `);
      console.log('Enum types created or already exist');
    } catch (error) {
      console.error('Error creating enum types:', error);
    }
    
    console.log('Table creation complete!');
    console.log('To create tables with more sophisticated options, use a migration tool like drizzle-kit');
    
    await pool.end();
    console.log('Database connection pool closed');
    
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

createTables();