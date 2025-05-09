import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// Configure websocket for Neon
neonConfig.webSocketConstructor = ws;

// Create the DATABASE_URL with the provided PostgreSQL credentials
const DATABASE_URL = 'postgresql://app_user:EjsUgkhcd@34.30.6.95:5432/neondb';
console.log('Connecting to database with connection string');

// Create the database connection pool
export const pool = new Pool({
  connectionString: DATABASE_URL,
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

// Ensure the connection is valid at startup
testDatabaseConnection().catch(err => {
  console.error('Initial database connection test failed:', err);
  console.error('Please check your database connection configuration.');
});

// Export the drizzle ORM instance
export const db = drizzle(pool, { schema });