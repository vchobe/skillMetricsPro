import pkg from 'pg';
const { Pool } = pkg;
type PoolType = typeof Pool;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Database Configuration
 * 
 * This module handles connecting to the database for the application.
 * Supports both Cloud SQL and standard PostgreSQL connections.
 * 
 * In development mode, can be configured to use in-memory storage instead
 * by setting DISABLE_DB_FOR_DEV=true in .env
 */
function getDatabaseConfig() {
  // Hardcoded Cloud SQL connection parameters with app_user
  const cloudSqlUser = 'app_user';
  const cloudSqlPassword = process.env.CLOUD_SQL_PASSWORD;
  const cloudSqlHost = '34.30.6.95';
  const cloudSqlPort = 5432;
  const cloudSqlDatabase = 'neondb';
  
  console.log('CONFIGURATION: Using Cloud SQL exclusively with app_user');
  console.log('Database host:', cloudSqlHost);
  console.log('Database user:', cloudSqlUser);
  console.log('Database name:', cloudSqlDatabase);
  
  // Verify required credentials
  if (!cloudSqlPassword) {
    throw new Error('Cloud SQL password is missing. Please set the CLOUD_SQL_PASSWORD environment variable.');
  }
  
  // Use direct TCP connection with app_user credentials
  // No fallbacks, no in-memory options, strictly Cloud SQL only
  return {
    user: cloudSqlUser,
    password: cloudSqlPassword,
    database: cloudSqlDatabase,
    host: cloudSqlHost,
    port: cloudSqlPort,
    ssl: false, // Cloud SQL direct connection doesn't require SSL
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000
  };
}

// Configure pool with our database config
// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';
console.log('Cloud SQL Database Connection Mode');
console.log('Environment:', process.env.NODE_ENV || 'development');

// Create the database pool with the proper configuration
export const pool = new Pool(getDatabaseConfig());

// Setup event handlers for connection issues
pool.on('error', (err: Error) => {
  console.error('Unexpected database error:', err);
});

// Test connection function for health checks
export async function testDatabaseConnection() {

  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1'); // Simple health check query
    console.log('Database connection successful');
    return true;
  } catch (err: any) {
    console.error('Database connection failed:', err);
    if (isDevelopment) {
      console.log('Connection failed in development environment');
    }
    return false;
  } finally {
    if (client) client.release();
  }
}

// Ensure the connection is valid at startup (but don't crash if it fails)
testDatabaseConnection().catch(err => {
  console.error('Initial database connection test failed:', err);
  console.error('Please check your database connection configuration.');
  if (isDevelopment) {
    console.log('Running in development mode - continuing anyway');
  }
});

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema });
