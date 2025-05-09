import pkg from 'pg';
const { Pool } = pkg;
type PoolType = typeof Pool;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

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
  const dbUser = process.env.CLOUD_SQL_USER || process.env.PGUSER;
  const dbPassword = process.env.CLOUD_SQL_PASSWORD || process.env.PGPASSWORD;
  const dbName = process.env.CLOUD_SQL_DATABASE || process.env.PGDATABASE;
  const dbHost = process.env.CLOUD_SQL_HOST || process.env.PGHOST || 'localhost';
  const dbPort = parseInt(process.env.CLOUD_SQL_PORT || process.env.PGPORT || '5432', 10);
  
  // Cloud SQL specific connection for Unix socket
  const cloudSqlConnectionName = process.env.CLOUD_SQL_CONNECTION_NAME;
  
  // First check if we have sufficient credentials from either format
  const hasBasicCredentials = dbUser && dbPassword && dbName;
  
  // Verify required credentials
  if (!hasBasicCredentials) {
    throw new Error('Database credentials are missing. Please set either CLOUD_SQL_USER, CLOUD_SQL_PASSWORD, CLOUD_SQL_DATABASE or PGUSER, PGPASSWORD, PGDATABASE environment variables.');
  }
  
  // Prioritize DATABASE_URL if available (complete connection string)
  if (process.env.DATABASE_URL) {
    console.log('CONFIGURATION: Using DATABASE_URL connection string');
    return {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
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
// Check if we're using in-memory mode
const isDevelopment = process.env.NODE_ENV !== 'production';
const disableDbForDev = process.env.DISABLE_DB_FOR_DEV === 'true';
const useMemoryStore = process.env.USE_MEMORY_STORE === 'true';
const skipDbConnection = isDevelopment && (disableDbForDev || useMemoryStore);

// Create a mock Pool for memory-only mode, or real Pool for database mode
export const pool = skipDbConnection 
  ? {
      query: async () => ({ rows: [], rowCount: 0 }),
      connect: async () => ({ 
        query: async () => ({ rows: [], rowCount: 0 }),
        release: () => {} 
      }),
      on: () => {},
      end: async () => {}
    } as any
  : new Pool(getDatabaseConfig());

// Setup event handlers for connection issues (if using real pool)
if (!skipDbConnection) {
  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });
}

// Test connection function for health checks
export async function testDatabaseConnection() {
  // Skip test in memory-only mode
  if (skipDbConnection) {
    console.log('Database connection test skipped (using in-memory mode)');
    return true;
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1'); // Simple health check query
    console.log('Database connection successful');
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    if (isDevelopment) {
      console.log('In development environment - consider enabling in-memory mode:');
      console.log('Set DISABLE_DB_FOR_DEV=true in .env to use in-memory storage');
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
