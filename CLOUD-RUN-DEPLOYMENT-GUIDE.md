# Cloud Run Deployment Guide

This guide provides step-by-step instructions for deploying the SkillMetrics application to Google Cloud Run with a direct connection to Cloud SQL.

## Prerequisites

- Google Cloud SDK (gcloud) installed and configured
- Access to the Google Cloud Console and Cloud Run
- Docker installed locally for testing (optional)
- Git repository access

## 1. Database Connection Configuration

The application can connect to the database using two methods:

### Method 1: Direct IP Connection (Recommended)

This method connects directly to the PostgreSQL database IP address without using the Cloud SQL Auth Proxy.

**Environment Variables:**
```
DATABASE_URL=postgresql://neondb_owner:npg_6SNPYmkEt5pa@34.30.6.95/neondb
PGHOST=34.30.6.95
PGUSER=neondb_owner
PGPASSWORD=npg_6SNPYmkEt5pa
PGDATABASE=neondb
```

**Benefits:**
- Simpler configuration without the need for Cloud SQL Auth Proxy
- Works in all environments including development, staging, and production

### Method 2: Unix Socket Connection (Alternative)

This method uses Unix socket connections via the Cloud SQL Auth Proxy.

**Environment Variables:**
```
DATABASE_URL=postgresql://neondb_owner:npg_6SNPYmkEt5pa@localhost/neondb?host=/cloudsql/imposing-elixir-440911-u9:us-central1:skillmetrics-db
```

**Benefits:**
- Enhanced security without exposing database IP
- Automatic IAM authentication and SSL encryption

## 2. Building the Container Image

### Option 1: Build and Deploy Locally

```bash
# Build the container image
gcloud builds submit --tag gcr.io/imposing-elixir-440911-u9/skillmetrics

# Deploy to Cloud Run
gcloud run deploy skillmetrics \
  --image gcr.io/imposing-elixir-440911-u9/skillmetrics \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,PGHOST=34.30.6.95,PGUSER=neondb_owner,PGPASSWORD=npg_6SNPYmkEt5pa,PGDATABASE=neondb,DATABASE_URL=postgresql://neondb_owner:npg_6SNPYmkEt5pa@34.30.6.95/neondb"
```

### Option 2: Automated Deployment with Cloud Build

Create a trigger in Cloud Build to automatically deploy when changes are pushed to the repository.

1. Create a Cloud Build trigger in the Google Cloud Console
2. Set the source repository
3. Configure the build to use the `cloudbuild.direct-db.yaml` configuration file

## 3. Testing the Deployment

After deployment, you can verify the application and database connection:

1. Access the deployed application at the Cloud Run URL
2. Test the API endpoints
3. Verify database connectivity using the logs

## 4. Debugging Connection Issues

If you encounter database connection issues:

1. Check the Cloud Run logs for connection errors
2. Verify the environment variables are set correctly
3. Test the database connection directly using the helper script:
   ```bash
   node cloud-sql-connection-helper.mjs
   ```
4. Run the database schema check script:
   ```bash
   node check-report-settings.mjs
   ```

## 5. Updating Database Schema

When schema changes are needed, run the migration script to update the database:

```bash
node apply-report-settings-migration.mjs
```

This script handles:
- Adding new columns (base_url, description)
- Creating compatibility columns (recipient_email, active)
- Setting default values for existing records

## 6. Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| DATABASE_URL | Full database connection string | Yes | - |
| PGHOST | Database host IP address | Yes | 34.30.6.95 |
| PGUSER | Database username | Yes | neondb_owner |
| PGPASSWORD | Database password | Yes | - |
| PGDATABASE | Database name | Yes | neondb |
| NODE_ENV | Environment (production, development) | Yes | production |
| PORT | Server port (Cloud Run sets to 8080) | No | 8080 |
| MAILJET_API_KEY | Mailjet API key for email sending | Yes | - |
| MAILJET_SECRET_KEY | Mailjet secret key | Yes | - |
| SALES_TEAM_EMAIL | Email to receive weekly reports | Yes | - |

## 7. Deployment Scripts

The repository includes several helper scripts for deployment:

- `deploy-cloud-run-direct-ip.sh`: Deploys with direct IP connection
- `cloudbuild.direct-db.yaml`: Cloud Build configuration file
- `test-cloud-sql-connection.sh`: Tests database connectivity
- `check-report-settings.mjs`: Verifies report settings schema
- `apply-report-settings-migration.mjs`: Updates database schema

## 8. Monitoring and Maintenance

- Set up Cloud Monitoring to track application performance
- Configure alerts for database connection failures
- Schedule regular database backups

## 9. Troubleshooting

### Common Issues

1. **Connection Timeout**:
   - Check if the database IP address is correct
   - Verify that the Cloud SQL instance is running
   - Ensure network firewall rules allow the connection

2. **Authentication Errors**:
   - Verify database credentials
   - Check if the user has appropriate permissions

3. **Port Conflicts**:
   - Cloud Run automatically uses port 8080
   - In the Dockerfile, ensure PORT is set to 8080
   - Application should listen on process.env.PORT || 8080

4. **Schema Migration Errors**:
   - Run the schema check script first
   - Apply migrations in a maintenance window
   - Back up the database before major schema changes