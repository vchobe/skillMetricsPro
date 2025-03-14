# Skills Management Platform: GCP Deployment Guide

This directory contains scripts for deploying the Skills Management Platform to Google Cloud Platform (GCP).

## Prerequisites

1. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and configured
2. [Docker](https://docs.docker.com/get-docker/) installed (for local testing)
3. [PostgreSQL client tools](https://www.postgresql.org/download/) installed (`psql`, `pg_dump`, `pg_restore`)
4. A GCP project with billing enabled
5. Cloud Build, Cloud Run, and Cloud SQL APIs enabled

## Quick Start

The easiest way to deploy is to use the all-in-one script:

```bash
# Make scripts executable
chmod +x deployment/*.sh

# Run the deployment
./deployment/deploy-all.sh
```

This script will:
1. Deploy the application to Cloud Run
2. Set up a Cloud SQL PostgreSQL database
3. Initialize the database schema
4. Load test data
5. Configure basic monitoring and backups

## Step-by-Step Deployment

If you prefer to deploy manually, follow these steps:

### 1. Deploy to Cloud Run and Set up Cloud SQL

```bash
./deployment/deploy-to-gcp.sh
```

This script:
- Creates a Cloud SQL PostgreSQL instance
- Sets up a database user and database
- Builds and pushes the Docker image to Google Container Registry
- Deploys the application to Cloud Run with the Cloud SQL connection

### 2. Initialize Database Schema and Test Data

```bash
./deployment/setup-database.sh
```

This script:
- Connects to the Cloud SQL database using the Cloud SQL proxy
- Runs the database migration script to set up the schema
- Creates an admin user
- Loads test data

### 3. Check Deployment Status

```bash
./deployment/check-deployment.sh
```

This script:
- Checks the status of the Cloud Run service
- Checks the status of the Cloud SQL instance
- Tests connectivity to the API

### 4. Backup and Restore

```bash
# Create a backup
./deployment/backup-restore-db.sh backup

# Restore from a backup
./deployment/backup-restore-db.sh restore [BACKUP_FILE]
```

This script:
- Creates backups of the Cloud SQL database
- Stores backups in Google Cloud Storage
- Allows restoring the database from a previous backup

## Configuration

Before running the scripts, you should modify the configuration variables at the top of each script:

- `PROJECT_ID`: Your GCP project ID
- `REGION`: The GCP region to deploy to
- `SERVICE_NAME`: The name for your Cloud Run service
- `DB_INSTANCE_NAME`: The name for your Cloud SQL instance
- `DB_NAME`: The name of the database to create
- `DB_USER`: The database user to create

## Accessing the Application

After deployment, the application will be available at the URL provided by Cloud Run.

## Troubleshooting

If you encounter issues:

1. Check the Cloud Run logs:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=skills-management-app"
   ```

2. Check the Cloud SQL logs:
   ```bash
   gcloud logging read "resource.type=cloudsql_database AND resource.labels.database_id=[INSTANCE_ID]"
   ```

3. Test the database connection using the Cloud SQL proxy.

## Cleanup

To delete all resources:

```bash
# Delete Cloud Run service
gcloud run services delete skills-management-app --region=us-central1

# Delete Cloud SQL instance
gcloud sql instances delete skills-management-db

# Delete GCS backup bucket
gsutil rm -r gs://skills-management-backups/
```