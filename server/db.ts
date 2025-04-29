import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Configuration for database connection
function getDatabaseConfig() {
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Is Cloud Run:', process.env.K_SERVICE ? 'Yes' : 'No');
  
  // First, check if fallback is explicitly enabled
  const fallbackEnabled = process.env.USE_FALLBACK_DB === 'true';
  
  // Get DATABASE_URL (the existing working connection)
  const databaseUrl = process.env.DATABASE_URL || '';
  
  // If fallback is enabled and we have a DATABASE_URL, use it
  if (fallbackEnabled && databaseUrl) {
    console.log('Fallback enabled: Using standard PostgreSQL connection from DATABASE_URL');
    const maskedUrl = databaseUrl.replace(/:[^:@]*@/, ':****@');
    console.log('Database URL:', maskedUrl);
    
    return { 
      connectionString: databaseUrl,
      max: 20, 
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };
  }
  
  // Check for Google Cloud SQL configuration
  const cloudSqlConnectionName = process.env.CLOUD_SQL_CONNECTION_NAME;
  const cloudSqlUser = process.env.CLOUD_SQL_USER;
  const cloudSqlPassword = process.env.CLOUD_SQL_PASSWORD;
  const cloudSqlDatabase = process.env.CLOUD_SQL_DATABASE;
  
  // Check if we have Cloud SQL configuration
  const hasCloudSqlConfig = cloudSqlConnectionName && cloudSqlUser && cloudSqlPassword && cloudSqlDatabase;
  
  // If we don't have Cloud SQL config, fall back to DATABASE_URL
  if (!hasCloudSqlConfig && databaseUrl) {
    console.log('No Cloud SQL config: Using standard PostgreSQL connection from DATABASE_URL');
    const maskedUrl = databaseUrl.replace(/:[^:@]*@/, ':****@');
    console.log('Database URL:', maskedUrl);
    
    return { 
      connectionString: databaseUrl,
      max: 20, 
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };
  }
  
  // If we're here, we have Cloud SQL config and fallback is not enabled
  console.log('Using Google Cloud SQL connection');
  
  // Check if we're in production environment (GCP Cloud Run)
  const isCloudRun = process.env.K_SERVICE || process.env.USE_CLOUD_SQL === 'true';
  
  if (isCloudRun) {
    // In Cloud Run, use Unix socket connection
    console.log(`Using Cloud SQL socket connection to: ${cloudSqlConnectionName}`);
    
    return {
      user: cloudSqlUser,
      password: cloudSqlPassword,
      database: cloudSqlDatabase,
      host: `/cloudsql/${cloudSqlConnectionName}`,
      ssl: false, // SSL is not used with Unix socket
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };
  } else {
    // In development, use TCP connection
    // This requires Cloud SQL Auth Proxy to be running locally
    console.log('Using Cloud SQL TCP connection (requires Cloud SQL Auth Proxy)');
    // If we have a DATABASE_URL, use it as a fallback in development
    if (databaseUrl) {
      console.log('No Cloud SQL Auth Proxy detected, falling back to DATABASE_URL');
      const maskedUrl = databaseUrl.replace(/:[^:@]*@/, ':****@');
      console.log('Database URL:', maskedUrl);
      
      return { 
        connectionString: databaseUrl,
        max: 20, 
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
      };
    }
    
    // No fallback available, return Cloud SQL config
    return {
      user: cloudSqlUser,
      password: cloudSqlPassword,
      database: cloudSqlDatabase,
      host: 'localhost',
      port: 5432, // Default PostgreSQL port used by Cloud SQL Auth Proxy
      ssl: false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };
  }
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
