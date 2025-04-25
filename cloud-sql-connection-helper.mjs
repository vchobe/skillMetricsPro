/**
 * Cloud SQL Connection Helper
 * 
 * This utility provides functions for connecting to Cloud SQL using either:
 * 1. Direct IP connection (preferred for Cloud Run deployment)
 * 2. Unix socket connection (for Cloud Run with cloudsql-proxy)
 * 
 * The helper automatically selects the appropriate connection method
 * based on environment variables and available connection options.
 */

import pkg from 'pg';
const { Pool } = pkg;

/**
 * Creates a database connection pool with appropriate configuration
 * based on environment variables and deployment context
 */
export function createConnectionPool() {
  // Determine if we're running in Cloud Run
  const isCloudRun = process.env.K_SERVICE !== undefined;
  
  // Get database configuration from environment variables
  const dbConfig = getDbConfig(isCloudRun);
  
  // Log connection info (with masked password)
  console.log('Database connection mode:', dbConfig.connectionMode);
  console.log('Connection config:', {
    ...dbConfig.config,
    password: '****'
  });
  
  // Create and return the connection pool
  return new Pool(dbConfig.config);
}

/**
 * Gets the appropriate database configuration based on environment and context
 */
function getDbConfig(isCloudRun) {
  // Check for direct database URL with IP
  const databaseUrl = process.env.DATABASE_URL || '';
  const usesDirectIp = databaseUrl.includes('@34.30.6.95') || databaseUrl.includes('@35.184.28.222');
  
  // Check for Unix socket path in database URL
  const usesUnixSocket = databaseUrl.includes('host=/cloudsql/');
  
  // Check for individual environment variables
  const hasPgConfig = process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE;
  
  // For Cloud Run, prefer Unix socket if available
  if (isCloudRun && usesUnixSocket) {
    return getUnixSocketConfig(databaseUrl);
  }
  
  // For direct IP connection with PG environment variables
  if (hasPgConfig) {
    return getDirectIpConfigFromEnv();
  }
  
  // For direct IP connection with DATABASE_URL
  if (usesDirectIp) {
    return getDirectIpConfigFromUrl(databaseUrl);
  }
  
  // For any other DATABASE_URL
  if (databaseUrl) {
    return {
      connectionMode: 'Standard connection from DATABASE_URL',
      config: {
        connectionString: databaseUrl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
      }
    };
  }
  
  // Fallback to default configuration
  console.warn('No database configuration found, using hardcoded defaults. This is not recommended for production.');
  return getDefaultConfig();
}

/**
 * Gets database configuration for Unix socket connection
 */
function getUnixSocketConfig(databaseUrl) {
  try {
    // Parse the Cloud SQL connection string for PostgreSQL socket connection
    // Format expected: postgresql://USER:PASSWORD@localhost/DB_NAME?host=/cloudsql/PROJECT:REGION:INSTANCE
    const regex = /postgresql:\/\/([^:]+):([^@]+)@[^\/]+\/([^?]+)\?host=\/cloudsql\/([^&]+)/;
    const match = databaseUrl.match(regex);
    
    if (match) {
      const [_, user, password, dbName, instanceConnectionName] = match;
      
      return {
        connectionMode: `Unix socket to Cloud SQL instance: ${instanceConnectionName}`,
        config: {
          user,
          password,
          database: dbName,
          host: `/cloudsql/${instanceConnectionName}`,
          ssl: false, // SSL is not used with Unix socket
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000
        }
      };
    } else {
      throw new Error('Could not parse Unix socket connection string');
    }
  } catch (error) {
    console.error('Error parsing Unix socket connection string:', error);
    return getDefaultConfig();
  }
}

/**
 * Gets database configuration from PG environment variables
 */
function getDirectIpConfigFromEnv() {
  return {
    connectionMode: `Direct IP connection to: ${process.env.PGHOST}`,
    config: {
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: process.env.PGSSLMODE === 'require' ? true : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    }
  };
}

/**
 * Gets database configuration from a direct IP DATABASE_URL
 */
function getDirectIpConfigFromUrl(databaseUrl) {
  // Extract the host from the URL
  const hostMatch = databaseUrl.match(/@([^:\/]+)/);
  const host = hostMatch ? hostMatch[1] : 'unknown';
  
  return {
    connectionMode: `Direct IP connection to: ${host}`,
    config: {
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    }
  };
}

/**
 * Gets default database configuration (fallback)
 */
function getDefaultConfig() {
  return {
    connectionMode: 'Default configuration (fallback)',
    config: {
      host: '34.30.6.95',
      port: 5432,
      database: 'neondb',
      user: 'neondb_owner',
      password: 'npg_6SNPYmkEt5pa',
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    }
  };
}

/**
 * Tests the database connection
 */
export async function testConnection(pool) {
  let client;
  try {
    client = await pool.connect();
    console.log('Database connection successful');
    
    // Run a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Query result:', result.rows[0]);
    
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
  } finally {
    if (client) client.release();
  }
}

// Example usage:
// import { createConnectionPool, testConnection } from './cloud-sql-connection-helper.mjs';
// 
// const pool = createConnectionPool();
// testConnection(pool)
//   .then(success => console.log('Connection test:', success ? 'PASSED' : 'FAILED'))
//   .catch(err => console.error('Error testing connection:', err));