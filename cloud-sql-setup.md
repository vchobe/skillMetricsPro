# Cloud SQL Setup Guide

This document provides instructions for setting up and connecting to Cloud SQL for the SkillMetrics application.

> **Important Note**: When running the application locally, you may encounter port conflicts. In that case, modify the PORT environment variable in .env to use a different port such as 5001 or 3000.

## Cloud SQL Instance Details

- **Project ID**: imposing-elixir-440911-u9
- **Region**: us-central1
- **Instance Name**: skillmetrics-db
- **Database Name**: neondb
- **User**: neondb_owner
- **Direct IP Connection**: 34.30.6.95

## Environment Variables

The following environment variables should be set for database connections:

```
DATABASE_URL=postgresql://neondb_owner:npg_6SNPYmkEt5pa@34.30.6.95/neondb
PGHOST=34.30.6.95
PGUSER=neondb_owner
PGPASSWORD=npg_6SNPYmkEt5pa
PGDATABASE=neondb
```

## Connection Methods

### Method 1: Direct Connection (IP-based)

This method uses a direct IP connection to the database.

#### Environment variables:
```
DATABASE_URL=postgresql://neondb_owner:npg_6SNPYmkEt5pa@34.30.6.95/neondb
```

#### Connection code:
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

### Method 2: Cloud SQL Auth Proxy (Local Development)

For local development, you can use the Cloud SQL Auth Proxy.

1. Install the Cloud SQL Auth Proxy:
   ```
   curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.0.0/cloud-sql-proxy.linux.amd64
   chmod +x cloud-sql-proxy
   ```

2. Start the proxy:
   ```
   ./cloud-sql-proxy imposing-elixir-440911-u9:us-central1:skillmetrics-db
   ```

3. Connect using localhost:
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_6SNPYmkEt5pa@localhost/neondb
   ```

### Method 3: Cloud Run with Cloud SQL Integration

When deploying to Cloud Run, use the Cloud SQL integration.

1. Deploy with the following configuration:
   ```
   gcloud run deploy skillmetrics \
     --image gcr.io/imposing-elixir-440911-u9/skillmetrics \
     --add-cloudsql-instances imposing-elixir-440911-u9:us-central1:skillmetrics-db \
     --set-env-vars="DATABASE_URL=postgresql://neondb_owner:npg_6SNPYmkEt5pa@34.30.6.95/neondb" \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated
   ```

## Verifying Connection

To verify your connection to the database:

```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Connection successful:', result.rows[0]);
    client.release();
  } catch (err) {
    console.error('Connection error:', err);
  }
}

testConnection();
```

## Troubleshooting

1. **Connection Timeout**:
   - Check if the IP address is correct
   - Verify that the database instance is running
   - Confirm that the network allows connections from your IP

2. **Authentication Errors**:
   - Verify username and password are correct
   - Check if the user has appropriate permissions

3. **Port Conflicts**:
   - If you encounter `EADDRINUSE: address already in use` errors, change the PORT in your .env file
   - Use `ps aux | grep node` to identify running processes
   - For Cloud Run deployment, the port will automatically be set to 8080 regardless of environment settings

4. **Cloud Run Integration Issues**:
   - Make sure the Cloud SQL Admin API is enabled
   - Verify the service account has the necessary permissions
   - Confirm the correct instance connection name is used
   - In the Dockerfile, ensure NODE_ENV is set to 'production'