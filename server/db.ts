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
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const disableDbForDev = process.env.DISABLE_DB_FOR_DEV === 'true';
  
  // Debug output for environment variables
  console.log('DATABASE DEBUG - Environment Variables:');
  console.log('PGUSER:', process.env.PGUSER);
  console.log('PGHOST:', process.env.PGHOST);
  console.log('PGDATABASE:', process.env.PGDATABASE);
  console.log('PGPORT:', process.env.PGPORT);
  console.log('CLOUD_SQL_USER:', process.env.CLOUD_SQL_USER);
  console.log('CLOUD_SQL_HOST:', process.env.CLOUD_SQL_HOST);
  console.log('CLOUD_SQL_DATABASE:', process.env.CLOUD_SQL_DATABASE);
  console.log('CLOUD_SQL_PORT:', process.env.CLOUD_SQL_PORT);
  console.log('DATABASE_URL format:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@'));
  console.log('NEON_DB_PASSWORD exists:', process.env.NEON_DB_PASSWORD ? 'Yes' : 'No');
  console.log('CORRECT_NEON_DB_PASSWORD exists:', process.env.CORRECT_NEON_DB_PASSWORD ? 'Yes' : 'No');
  
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Is Cloud Run:', process.env.K_SERVICE ? 'Yes' : 'No');
  console.log('Database disabled for dev:', disableDbForDev ? 'Yes' : 'No');
  
  // If we're in development mode and database is disabled, use a mock connection
  if (isDevelopment && disableDbForDev) {
    console.log('CONFIGURATION: Using mock database connection for development');
    // Return a minimal config that won't try to connect
    return {
      host: 'localhost',
      port: 5432,
      user: 'mock_user',
      password: 'mock_password',
      database: 'mock_db',
      // Set a very short timeout for quick failure
      connectionTimeoutMillis: 1
    };
  }
  
  // Check for both Cloud SQL and standard PG environment variables
  // Handle various environment variable formats with fallbacks
  
  // User credentials - check both CLOUD_SQL_* and PG* variables
  const dbUser = process.env.PGUSER || process.env.CLOUD_SQL_USER;
  const dbPassword = process.env.NEON_DB_PASSWORD || process.env.PGPASSWORD || process.env.CLOUD_SQL_PASSWORD;
  const dbName = process.env.PGDATABASE || process.env.CLOUD_SQL_DATABASE;
  const dbHost = process.env.PGHOST || process.env.CLOUD_SQL_HOST || 'localhost';
  const dbPort = parseInt(process.env.PGPORT || process.env.CLOUD_SQL_PORT || '5432', 10);
  
  // Cloud SQL specific connection for Unix socket
  const cloudSqlConnectionName = process.env.CLOUD_SQL_CONNECTION_NAME;
  
  // First check if we have sufficient credentials from either format
  const hasBasicCredentials = dbUser && dbPassword && dbName;
  
  // Verify required credentials
  if (!hasBasicCredentials) {
    throw new Error('Database credentials are missing. Please set either CLOUD_SQL_USER, CLOUD_SQL_PASSWORD, CLOUD_SQL_DATABASE or PGUSER, PGPASSWORD, PGDATABASE environment variables.');
  }
  
  // Check if environment is for Cloud SQL
  const isCloudSql = dbHost?.includes('34.30.6.95');
  
  if (isCloudSql) {
    // Use app_user for Google Cloud SQL as required
    const cloudSqlUser = 'app_user';
    // Use the correct password for Cloud SQL
    const cloudSqlPassword = process.env.CLOUD_SQL_PASSWORD;
    
    console.log('CONFIGURATION: Using Google Cloud SQL connection exclusively');
    console.log('Database host:', dbHost);
    console.log('Database user:', cloudSqlUser);
    console.log('Database name:', 'skillmetrics');
    
    console.log('Cloud SQL connection with app_user as required');
    // Use the connection string with the Cloud SQL password
    const connectionString = `postgresql://${cloudSqlUser}:${cloudSqlPassword}@${dbHost}:${dbPort}/skillmetrics`;
    
    return {
      connectionString,
      ssl: false, // Cloud SQL direct connection doesn't require SSL
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000
    };
  }
  
  // Use DATABASE_URL if available (for non-Neon databases)
  if (process.env.DATABASE_URL) {
    // Database URL could use environment variable expansion
    const dbUrl = process.env.DATABASE_URL;
    console.log('CONFIGURATION: Using DATABASE_URL connection string');
    console.log('Database host:', dbHost);
    console.log('Database user:', dbUser);
    console.log('Database name:', dbName);
    
    return {
      connectionString: dbUrl,
      ssl: process.env.CLOUD_SQL_USE_SSL === 'true',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000
    };
  }
  
  // For GCP Cloud Run with Cloud SQL Connection Name, use Unix socket
  const isCloudRun = process.env.K_SERVICE || process.env.USE_CLOUD_SQL === 'true';
  
  if (isCloudRun && cloudSqlConnectionName) {
    // In Cloud Run, use Unix socket connection when connection name is available
    console.log('CONFIGURATION: Using Cloud SQL Unix socket');
    console.log(`Using Cloud SQL socket connection to: ${cloudSqlConnectionName}`);
    
    return {
      user: dbUser,
      password: dbPassword,
      database: dbName,
      host: `/cloudsql/${cloudSqlConnectionName}`,
      ssl: false, // SSL is not used with Unix socket
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };
  } else {
    // Use direct TCP connection with available credentials
    console.log('CONFIGURATION: Using direct TCP connection');
    console.log(`Using direct TCP connection to: ${dbHost}:${dbPort}`);
    console.log('SSL Enabled:', process.env.CLOUD_SQL_USE_SSL === 'true' ? 'Yes' : 'No');
    
    return {
      user: dbUser,
      password: dbPassword,
      database: dbName,
      host: dbHost,
      port: dbPort,
      ssl: process.env.CLOUD_SQL_USE_SSL === 'true',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };
  }
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
