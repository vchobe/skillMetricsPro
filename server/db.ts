import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with connection timeout and retry strategy
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // 10 seconds timeout
  max: 20, // Max 20 clients in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  allowExitOnIdle: false // Don't allow the pool to exit on idle
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
testDatabaseConnection();

export const db = drizzle({ client: pool, schema });
