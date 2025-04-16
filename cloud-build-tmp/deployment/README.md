# Deployment Scripts

This directory contains scripts to deploy the Skills Management Platform to Google Cloud Platform.

## Prerequisites

Before deploying, ensure you have the following:

1. **Google Cloud SDK** installed and configured 
   - Install from: https://cloud.google.com/sdk/docs/install
   - Run `gcloud auth login` to authenticate

2. **Google Cloud Platform Project** with the following APIs enabled:
   - Cloud Run API
   - Cloud SQL Admin API
   - Cloud Build API
   - Container Registry API

3. **Node.js** installed (version 16 or higher)

4. **PostgreSQL Client Tools** installed (for database operations)
   - `pg_dump` and `pg_restore` commands must be available

## Deployment Scripts

### Full Deployment

To perform a complete deployment:

```bash
./deployment/deploy-all.sh
```

This script will:
1. Create/update the Cloud SQL database instance
2. Deploy the application to Cloud Run
3. Initialize the database schema and test data
4. Perform health checks

### Individual Scripts

If you prefer to run the deployment steps individually:

1. **Deploy infrastructure and application:**
```bash
./deployment/deploy-to-gcp.sh
```

2. **Set up database schema and initial data:**
```bash
./deployment/setup-database.sh
```

3. **Check deployment status:**
```bash
./deployment/check-deployment.sh
```

4. **Backup or restore the database:**
```bash
./deployment/backup-restore-db.sh backup   # Create a backup
./deployment/backup-restore-db.sh restore  # Restore from backup
```

## Cloud SQL Auth Proxy

The deployment scripts use the Cloud SQL Auth Proxy to securely connect to your Cloud SQL instance. The proxy will be downloaded automatically when needed.

## Configuration

Each script contains configuration variables at the top. Before deployment, review and update these variables:

- `PROJECT_ID`: Your Google Cloud project ID
- `REGION`: The Google Cloud region (e.g., "us-central1")
- `SERVICE_NAME`: Name for your Cloud Run service
- `DB_INSTANCE_NAME`: Name for your Cloud SQL instance
- `DB_NAME`: The database name
- `DB_USER`: The database user

## Environment Variables

The application expects the following environment variables in production:

- `DATABASE_URL`: Standard PostgreSQL connection string (for local development)
- `CLOUD_SQL_URL`: Cloud SQL connection string (for production)
- `CLOUD_SQL_CONNECTION_NAME`: Cloud SQL instance connection name
- `NODE_ENV`: Set to "production"
- `USE_CLOUD_SQL`: Set to "true" in production
- `SESSION_SECRET`: Secret for session encryption
- `MAILJET_API_KEY` and `MAILJET_SECRET_KEY`: For email functionality (optional)

## Troubleshooting

If you encounter deployment issues:

1. Check application logs:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=skills-management-app"
```

2. Check Cloud SQL instance logs:
```bash
gcloud logging read "resource.type=cloudsql_database"
```

3. Verify Cloud SQL connection:
```bash
./cloud-sql-proxy --instances=PROJECT_ID:REGION:INSTANCE_NAME=tcp:5432
```

4. Run the health check script:
```bash
./deployment/check-deployment.sh
```