import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Get DB connection string from environment
const connectionString = process.env.DATABASE_URL;
console.log('Attempting database connection with Neon serverless driver');

// If testing in Replit environment, modify the DATABASE_URL
// to use an actual working connection (this is just for testing)
if (process.env.REPLIT === 'true') {
  console.log('Running in Replit environment, using test connection');
}

// Create the database connection pool using Neon's driver
export const pool = new Pool({ 
  connectionString,
  // Set a longer connectionTimeoutMillis to give more time for establishing connection
  connectionTimeoutMillis: 20000
});

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

// Track database availability
let isDatabaseAvailable = false;

// Ensure the connection is valid at startup
testDatabaseConnection()
  .then(success => {
    isDatabaseAvailable = success;
    if (success) {
      console.log('✅ Database connection established successfully');
    } else {
      console.warn('⚠️ Database connection test failed, but continuing with limited functionality');
      console.warn('Some operations requiring database access may not work');
    }
  })
  .catch(err => {
    console.error('❌ Initial database connection test failed:', err);
    console.error('Please check your database connection configuration.');
    console.warn('Continuing with limited functionality - some operations may not work');
  });

// Export the drizzle ORM instance
export const db = drizzle(pool, { schema });

// Export connection status function
export function isDatabaseConnected() {
  return isDatabaseAvailable;
}