import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

neonConfig.webSocketConstructor = ws;

// Check for the database URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Database connection cannot be established."
  );
}

// Clean up the DATABASE_URL to handle the special format
let connectionString = process.env.DATABASE_URL;
if (connectionString.includes('/DB3kdibkXMAw@')) {
  console.log('Detected Cloud Run connection string format, fixing...');
  connectionString = connectionString.replace('/DB3kdibkXMAw@', '@');
}

// Create the database connection pool
export const pool = new Pool({ 
  connectionString,
  max: 20, 
  idleTimeoutMillis: 30000, 
  connectionTimeoutMillis: 10000 
});

// Export the drizzle ORM instance
export const db = drizzle(pool, { schema });