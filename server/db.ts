import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check for database URL
const databaseUrl = process.env.DATABASE_URL || process.env.CLOUD_SQL_URL || '';

if (!databaseUrl) {
  throw new Error(
    "No database connection string found. Set DATABASE_URL or CLOUD_SQL_URL environment variable.",
  );
}

// Log database URL (with password masked) and environment info
const maskedUrl = databaseUrl.replace(/:[^:@]*@/, ':****@');
console.log('Database URL:', maskedUrl);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Is Cloud Run:', process.env.K_SERVICE ? 'Yes' : 'No');
console.log('DB Connection Mode:', databaseUrl.includes('host=/cloudsql/') ? 'Cloud SQL Socket' : 'Standard Connection');

// Check if we're in production environment (GCP Cloud Run)
const isProduction = process.env.NODE_ENV === 'production' || process.env.USE_CLOUD_SQL === 'true';

// Parse connection configuration
function parseConnectionConfig() {
  let config: any;
  
  // Check if we're in Cloud Run and have a DATABASE_URL with host=/cloudsql/
  if (isProduction && databaseUrl.includes('host=/cloudsql/')) {
    try {
      // Parse the Cloud SQL connection string for PostgreSQL socket connection
      // Format expected: postgresql://USER:PASSWORD@localhost/DB_NAME?host=/cloudsql/PROJECT:REGION:INSTANCE
      const regex = /postgresql:\/\/([^:]+):([^@]+)@[^\/]+\/([^?]+)\?host=\/cloudsql\/([^&]+)/;
      const match = databaseUrl.match(regex);
      
      if (match) {
        const [_, user, password, dbName, instanceConnectionName] = match;
        console.log(`Using Cloud SQL socket connection to: ${instanceConnectionName}`);
        
        return {
          user,
          password,
          database: dbName,
          host: `/cloudsql/${instanceConnectionName}`,
          ssl: false, // SSL is not used with Unix socket
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000
        };
      } else {
        console.warn('DATABASE_URL includes host=/cloudsql/ but could not be parsed correctly');
      }
    } catch (error) {
      console.error('Error parsing Cloud SQL connection string:', error);
      console.log('Falling back to standard connection');
    }
  }
  
  // For development or fallback: use standard PostgreSQL connection
  console.log('Using standard PostgreSQL connection');
  return { 
    connectionString: databaseUrl,
    max: 20, 
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  };
}

// Configure pool with parsed connection config
export const pool = new Pool(parseConnectionConfig());

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
});

export const db = drizzle(pool, { schema });
