# Cloud SQL Connection Setup

This document outlines the steps needed to connect the application to Cloud SQL when deploying to Google Cloud Run.

## Database Connection String Format

For Cloud SQL connections in Cloud Run, the connection string should be in this format:
```
postgresql://USER:PASSWORD@localhost/DB_NAME?host=/cloudsql/PROJECT:REGION:INSTANCE
```

The current configuration is:
```
postgresql://neondb_owner:npg_6SNPYmkEt5pa@localhost/neondb?host=/cloudsql/imposing-elixir-440911-u9:us-central1:skillmetrics-db
```

## Configuration Steps

1. **Set Environment Variables in Cloud Run**:
   - Set `DATABASE_URL` to the Cloud SQL connection string
   - Set `NODE_ENV` to "production"
   - Set `USE_CLOUD_SQL` to "true"

2. **Service Account Permissions**:
   - Ensure the service account has the "Cloud SQL Client" role

3. **Cloud Run Configuration**:
   - Add the Cloud SQL connection in the Cloud Run service configuration
   - Set connection name to: `imposing-elixir-440911-u9:us-central1:skillmetrics-db`

## Local Development Testing

To test the Cloud SQL connection locally, you need to:

1. Install the Cloud SQL Auth Proxy
2. Run the proxy to connect to your Cloud SQL instance
3. Set the database URL to use the proxy

## Deployment

During deployment, the application will automatically detect the Cloud SQL connection string format and use Unix socket connections instead of TCP/IP.

The detection logic is in `server/db.ts` and looks for `host=/cloudsql/` in the connection string.