import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

neonConfig.webSocketConstructor = ws;

/**
 * Database Configuration
 * 
 * This module handles connecting to the database for the application.
 * It supports multiple connection methods:
 * 1. CUSTOM_DATABASE_URL environment variable (highest priority)
 * 2. Environment-specific configurations (Cloud Run vs Replit)
 * 3. Individual connection parameters (PGUSER, PGPASSWORD, etc.)
 */
function getDatabaseConfig() {
  const isCloudRun = process.env.K_SERVICE || process.env.USE_CLOUD_RUN === 'true';
  const isReplit = process.env.REPLIT_ENVIRONMENT === 'true';
  
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Is Cloud Run:', isCloudRun ? 'Yes' : 'No');
  console.log('Is Replit Environment:', isReplit ? 'Yes' : 'No');
  
  // PRIORITY 0: If CUSTOM_DATABASE_URL is set, it takes precedence over all other configurations
  if (process.env.CUSTOM_DATABASE_URL) {
    const dbUrlForLogging = process.env.CUSTOM_DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//[MASKED_USER]:[MASKED_PASSWORD]@');
    console.log(`CONFIGURATION: Using CUSTOM_DATABASE_URL: ${dbUrlForLogging}`);
    
    try {
      // For Cloud Run, handle the special format from screenshot with DB3kdibkXMAw before the @
      let connectionString = process.env.CUSTOM_DATABASE_URL;
      if (connectionString.includes('/DB3kdibkXMAw@')) {
        console.log('INFO: Detected special Cloud Run connection string format');
        connectionString = connectionString.replace('/DB3kdibkXMAw@', '@');
      }
      
      return {
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        statement_timeout: 15000
      };
    } catch (error) {
      console.error('ERROR parsing CUSTOM_DATABASE_URL:', error);
      throw new Error('Invalid CUSTOM_DATABASE_URL format. Please check your configuration.');
    }
  }
  
  // PRIORITY 1: Handle deployment environment specific configurations
  
  // For Cloud Run deployment, use the specific Cloud Run connection format
  if (isCloudRun) {
    const connectionString = 'postgresql://app_user:EjsUgkhcd@34.30.6.95/neondb';
    console.log('CONFIGURATION: Using Cloud Run specific DATABASE_URL format');
    
    return {
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 15000
    };
  }
  
  // For development on Replit, use the provided DATABASE_URL
  if (isReplit && process.env.DATABASE_URL && process.env.DATABASE_URL_DISABLED !== 'true') {
    const dbUrlForLogging = process.env.DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//[MASKED_USER]:[MASKED_PASSWORD]@');
    console.log(`CONFIGURATION: Using Replit DATABASE_URL: ${dbUrlForLogging}`);
    
    return {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };
  }
  
  // PRIORITY 2: Check for separate database credentials (fallback approach)
  // User credentials - check both CLOUD_SQL_* and PG* variables
  const dbUser = process.env.CLOUD_SQL_USER || process.env.PGUSER;
  const dbPassword = process.env.CLOUD_SQL_PASSWORD || process.env.PGPASSWORD;
  const dbName = process.env.CLOUD_SQL_DATABASE || process.env.PGDATABASE;
  const dbHost = process.env.CLOUD_SQL_HOST || process.env.PGHOST || 'localhost';
  const dbPort = parseInt(process.env.CLOUD_SQL_PORT || process.env.PGPORT || '5432', 10);
  
  // Cloud SQL specific connection for Unix socket
  const cloudSqlConnectionName = process.env.CLOUD_SQL_CONNECTION_NAME;
  
  // Check if we have sufficient credentials for direct connection
  const hasBasicCredentials = dbUser && dbPassword && dbName;
  
  // If no credentials are available, we cannot connect
  if (!hasBasicCredentials && !process.env.DATABASE_URL) {
    throw new Error('Database configuration is missing. Please set DATABASE_URL environment variable or provide individual connection parameters.');
  }
  
  // For GCP Cloud Run with Cloud SQL Connection Name, use Unix socket
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
  } 
  
  // Default: Use direct TCP connection with available credentials
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

// Configure pool with our database config
export const pool = new Pool(getDatabaseConfig());

// Setup event handlers for connection issues
pool.on('error', (err) => {
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
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
  } finally {
    if (client) client.release();
  }
}

// Ensure the connection is valid at startup
testDatabaseConnection().catch(err => {
  console.error('Initial database connection test failed:', err);
  console.error('Please check your database connection configuration.');
});

export const db = drizzle(pool, { schema });