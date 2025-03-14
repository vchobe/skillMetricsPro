# Google Cloud Platform Deployment Guide

This document provides detailed instructions for deploying the Skills Management Platform to Google Cloud Platform (GCP).

## Architecture

The deployment architecture consists of:

1. **Cloud Run**: For hosting the application
2. **Cloud SQL**: For PostgreSQL database
3. **Cloud Storage**: For backups and static assets
4. **Secret Manager**: For managing secrets
5. **Cloud Build**: For CI/CD
6. **Cloud Monitoring**: For monitoring the application

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│                 │       │                 │       │                 │
│   Cloud Run     │◄─────►│   Cloud SQL     │◄─────►│  Cloud Storage  │
│                 │       │  (PostgreSQL)   │       │   (Backups)     │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                         │
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│                 │       │                 │       │                 │
│ Secret Manager  │       │ Cloud Monitoring│       │   Cloud Build   │
│                 │       │                 │       │                 │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

## Prerequisites

Before deploying, ensure you have:

1. A Google Cloud Platform account
2. Google Cloud SDK installed and configured
3. Docker installed locally
4. PostgreSQL client tools installed
5. A GCP project with billing enabled
6. Required APIs enabled:
   - Cloud Run
   - Cloud SQL
   - Cloud Build
   - Secret Manager
   - Cloud Storage
   - Cloud Monitoring

## Deployment Scripts

The deployment process is automated through scripts located in the `deployment/` directory:

- `deploy-to-gcp.sh`: Main deployment script
- `setup-database.sh`: Database setup script
- `check-deployment.sh`: Deployment status check script
- `backup-restore-db.sh`: Database backup and restore script
- `deploy-all.sh`: All-in-one deployment script

## Step-by-Step Deployment

### 1. Configure Deployment Settings

Edit the configuration variables at the top of each deployment script:

```bash
# deployment/deploy-to-gcp.sh
PROJECT_ID="your-project-id"
REGION="your-preferred-region"
SERVICE_NAME="skills-platform"
DB_INSTANCE_NAME="skills-db"
DB_NAME="skills_platform"
DB_USER="skills_admin"
```

### 2. Run the All-in-One Deployment Script

For a complete deployment, make all scripts executable and run the all-in-one script:

```bash
chmod +x deployment/*.sh
./deployment/deploy-all.sh
```

This script will:
1. Enable required GCP APIs
2. Deploy the application to Cloud Run
3. Set up a Cloud SQL PostgreSQL instance
4. Initialize the database schema and test data
5. Configure monitoring and scheduled backups

### 3. Manual Deployment

If you prefer a manual approach, you can run each script individually:

```bash
# Deploy application and setup database
./deployment/deploy-to-gcp.sh

# Initialize database schema and test data
./deployment/setup-database.sh

# Check deployment status
./deployment/check-deployment.sh

# Create a database backup
./deployment/backup-restore-db.sh backup
```

## Detailed Script Documentation

### deploy-to-gcp.sh

This script handles:
- Creating a Cloud SQL PostgreSQL instance
- Setting up a database user and database
- Building and pushing the Docker image
- Deploying the application to Cloud Run with Cloud SQL connection

Key functions:
- Cloud SQL instance creation with appropriate settings
- Database user and password setup
- Docker image building and deployment

### setup-database.sh

This script handles:
- Connecting to the Cloud SQL instance
- Running database migrations to create the schema
- Creating an admin user
- Loading test data

Key functions:
- Cloud SQL proxy setup for secure database access
- Schema creation using Drizzle ORM
- Test data generation

### check-deployment.sh

This script checks:
- Cloud Run service status
- Cloud SQL instance status
- API connectivity

Key functions:
- Service status checking
- Database status checking
- API connectivity testing

### backup-restore-db.sh

This script handles:
- Creating database backups
- Uploading backups to Cloud Storage
- Restoring from backups

Key functions:
- Backup creation using `pg_dump`
- Backup uploading to Google Cloud Storage
- Database restoration using `pg_restore`

### deploy-all.sh

This is an all-in-one script that:
- Runs all the above scripts in sequence
- Configures additional settings
- Sets up monitoring and scheduled backups

Key functions:
- API enabling
- Complete deployment orchestration
- Monitoring setup

## Environment Variables

The deployed application uses the following environment variables:

- `DATABASE_URL`: Connection string for the Cloud SQL database
- `NODE_ENV`: Set to 'production'
- `SESSION_SECRET`: Secret for session encryption

These are set during deployment in the Cloud Run service.

## Cloud SQL Configuration

The Cloud SQL instance is configured with:
- PostgreSQL 15
- db-f1-micro instance type (suitable for development/testing)
- 10GB SSD storage
- Zonal availability

For production, consider upgrading to:
- db-g1-small or larger
- 20GB+ SSD storage
- Regional availability for high availability

## Security Considerations

The deployment includes:
- Database user with a strong password
- Cloud SQL proxy for secure connections
- Private Cloud SQL connection
- Session secret stored in Secret Manager

Additional security measures to consider:
- VPC Service Controls
- Identity-Aware Proxy (IAP)
- Cloud Armor for DDoS protection

## Monitoring and Logging

The deployment configures:
- Cloud Monitoring alerts for high error rates
- Log routing to Cloud Logging
- Database backup scheduling

## Custom Domain Configuration

To use a custom domain:
1. Register your domain
2. Map it to your Cloud Run service:
   ```bash
   gcloud beta run domain-mappings create \
     --service skills-platform \
     --domain your-domain.com
   ```
3. Configure DNS records as instructed

## Cost Optimization

To optimize costs:
- Use Cloud Run's per-request billing
- Scale Cloud SQL to an appropriate size
- Set up budget alerts
- Consider reservations for sustained usage

## Troubleshooting

Common issues and solutions:

### Deployment Failures
- Check Cloud Build logs
- Verify project permissions
- Ensure APIs are enabled

### Database Connection Issues
- Check Cloud SQL instance status
- Verify Cloud SQL proxy is running
- Check connection string format

### Application Errors
- View Cloud Run logs
- Check environment variables
- Verify database migration success

## Cleanup

To remove all deployed resources:

```bash
# Delete Cloud Run service
gcloud run services delete skills-platform --region=us-central1

# Delete Cloud SQL instance
gcloud sql instances delete skills-db

# Delete backup bucket
gsutil rm -r gs://skills-platform-backups/
```