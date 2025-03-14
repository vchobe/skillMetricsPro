# Deployment Scripts Documentation

This directory contains scripts for deploying the Skills Management Platform to Google Cloud Platform (GCP).

## Overview

The deployment scripts automate the process of setting up and deploying the application to GCP, including:

1. Creating and configuring the database
2. Building and pushing the Docker image
3. Deploying the application to Cloud Run
4. Setting up environment variables and secrets
5. Running database migrations
6. Handling database backups and restores

## Prerequisites

Before using these scripts, ensure you have:

1. Google Cloud SDK installed and configured
2. Docker installed
3. Proper GCP permissions:
   - Cloud Run Admin
   - Cloud SQL Admin
   - Service Account User
   - Storage Admin
4. A properly configured `.env.prod` file (see [Environment Variables Documentation](../docs/installation/environment_variables.md))

## Script Files

### `deploy-all.sh`

Main orchestration script that runs the entire deployment process.

```bash
#!/bin/bash
# Main deployment script for the Skills Management Platform

# Load environment variables
source .env.prod

# Step 1: Setup Database
./deployment/setup-database.sh

# Step 2: Build and deploy application
./deployment/deploy-to-gcp.sh

# Step 3: Run database migrations
./deployment/run-migrations.sh

# Step 4: Verify deployment
./deployment/check-deployment.sh

echo "Deployment completed successfully!"
```

**Usage:**
```bash
chmod +x deployment/deploy-all.sh
./deployment/deploy-all.sh
```

### `setup-database.sh`

Sets up the Cloud SQL PostgreSQL database.

```bash
#!/bin/bash
# Setup PostgreSQL database on Cloud SQL

# Create Cloud SQL instance if it doesn't exist
gcloud sql instances describe ${DB_INSTANCE} > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Creating Cloud SQL instance: ${DB_INSTANCE}"
  gcloud sql instances create ${DB_INSTANCE} \
    --database-version=POSTGRES_13 \
    --cpu=1 \
    --memory=3840MB \
    --region=${GCP_REGION} \
    --storage-size=10GB \
    --storage-type=SSD
else
  echo "Cloud SQL instance ${DB_INSTANCE} already exists"
fi

# Create database if it doesn't exist
gcloud sql databases describe ${DB_NAME} --instance=${DB_INSTANCE} > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Creating database: ${DB_NAME}"
  gcloud sql databases create ${DB_NAME} --instance=${DB_INSTANCE}
else
  echo "Database ${DB_NAME} already exists"
fi

# Create database user if it doesn't exist
gcloud sql users describe ${DB_USER} --instance=${DB_INSTANCE} > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Creating database user: ${DB_USER}"
  
  # Generate random password if not provided
  if [ -z "${DB_PASSWORD}" ]; then
    DB_PASSWORD=$(openssl rand -base64 16)
    
    # Store password in Secret Manager
    echo -n "${DB_PASSWORD}" | gcloud secrets create db-password --data-file=-
    echo "Password stored in Secret Manager as 'db-password'"
  fi
  
  gcloud sql users create ${DB_USER} \
    --instance=${DB_INSTANCE} \
    --password="${DB_PASSWORD}"
else
  echo "Database user ${DB_USER} already exists"
fi

echo "Database setup completed successfully"
```

**Usage:**
```bash
chmod +x deployment/setup-database.sh
./deployment/setup-database.sh
```

### `deploy-to-gcp.sh`

Builds and deploys the application to Google Cloud Run.

```bash
#!/bin/bash
# Deploy application to Google Cloud Platform

# Build Docker image
docker build -t gcr.io/${GCP_PROJECT_ID}/skills-platform:v1 .

# Push to Google Container Registry
docker push gcr.io/${GCP_PROJECT_ID}/skills-platform:v1

# Deploy to Cloud Run
gcloud run deploy skills-platform \
  --image gcr.io/${GCP_PROJECT_ID}/skills-platform:v1 \
  --platform managed \
  --region ${GCP_REGION} \
  --memory 1Gi \
  --allow-unauthenticated \
  --set-secrets=SESSION_SECRET=session-secret:latest \
  --set-secrets=DB_PASSWORD=db-password:latest \
  --set-env-vars="NODE_ENV=production,DB_USER=${DB_USER},DB_NAME=${DB_NAME},DB_HOST=localhost" \
  --add-cloudsql-instances=${GCP_PROJECT_ID}:${GCP_REGION}:${DB_INSTANCE}

echo "Application deployed successfully to Cloud Run"
```

**Usage:**
```bash
chmod +x deployment/deploy-to-gcp.sh
./deployment/deploy-to-gcp.sh
```

### `backup-restore-db.sh`

Handles database backups and restores.

```bash
#!/bin/bash
# Backup and restore database script

USAGE="Usage: $0 [backup|restore] [backup_file_name]"
ACTION=$1
BACKUP_FILE=$2

if [ "$ACTION" != "backup" ] && [ "$ACTION" != "restore" ]; then
  echo $USAGE
  exit 1
fi

if [ "$ACTION" = "backup" ]; then
  # Create a backup
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_NAME=${BACKUP_FILE:-"skills_platform_backup_${TIMESTAMP}.sql"}
  
  echo "Creating backup: $BACKUP_NAME"
  gcloud sql export sql ${DB_INSTANCE} gs://${GCP_BUCKET}/${BACKUP_NAME} \
    --database=${DB_NAME} \
    --offload
  
  echo "Backup created successfully!"

elif [ "$ACTION" = "restore" ]; then
  # Restore from backup
  if [ -z "$BACKUP_FILE" ]; then
    echo "Error: Backup file name is required for restore operation"
    echo $USAGE
    exit 1
  fi
  
  echo "Restoring from backup: $BACKUP_FILE"
  gcloud sql import sql ${DB_INSTANCE} gs://${GCP_BUCKET}/${BACKUP_FILE} \
    --database=${DB_NAME} \
    --quiet
  
  echo "Database restored successfully!"
fi
```

**Usage:**
```bash
# For backup
chmod +x deployment/backup-restore-db.sh
./deployment/backup-restore-db.sh backup [optional_backup_name]

# For restore
./deployment/backup-restore-db.sh restore backup_file_name
```

### `check-deployment.sh`

Verifies that the deployment is working correctly.

```bash
#!/bin/bash
# Check deployment status

SERVICE_URL=$(gcloud run services describe skills-platform --platform managed --region ${GCP_REGION} --format 'value(status.url)')

# Check if service URL is accessible
echo "Checking if service is accessible at: ${SERVICE_URL}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${SERVICE_URL})

if [ $HTTP_STATUS -eq 200 ]; then
  echo "✅ Service is accessible (HTTP 200)"
else
  echo "❌ Service is not accessible (HTTP ${HTTP_STATUS})"
  exit 1
fi

# Check database connectivity
echo "Checking database connectivity..."
gcloud run services describe skills-platform --platform managed --region ${GCP_REGION} --format 'value(status.conditions)'

echo "Deployment check completed successfully!"
```

**Usage:**
```bash
chmod +x deployment/check-deployment.sh
./deployment/check-deployment.sh
```

## Environment Variables

The deployment scripts use the following environment variables from `.env.prod`:

- `GCP_PROJECT_ID`: Your Google Cloud Platform project ID
- `GCP_REGION`: GCP region for deployment (e.g., `us-central1`)
- `DB_INSTANCE`: Cloud SQL instance name
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password (optional, will generate if not provided)
- `GCP_BUCKET`: GCS bucket for database backups

Example `.env.prod` file:

```
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
DB_INSTANCE=skills-platform-db
DB_NAME=skills_platform
DB_USER=skills_platform_user
DB_PASSWORD=your-strong-password
GCP_BUCKET=skills-platform-backups
```

## Deployment Process

The complete deployment process follows these steps:

1. **Database Setup**: Creates the Cloud SQL instance, database, and user if they don't exist
2. **Docker Build**: Builds the Docker image for the application
3. **Container Registry**: Pushes the image to Google Container Registry
4. **Cloud Run Deployment**: Deploys the application to Cloud Run with appropriate configuration
5. **Database Migration**: Applies database schema changes
6. **Verification**: Checks that the deployment is working correctly

## Best Practices

1. **Environment Variables**: Keep sensitive information in environment variables or Secret Manager
2. **Regular Backups**: Schedule regular database backups
3. **Version Control**: Tag releases and use versioned Docker images
4. **Testing**: Test deployments in a staging environment before production
5. **Monitoring**: Set up monitoring and alerting for the deployed application

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Check that you're logged in to Google Cloud: `gcloud auth login`
   - Verify your project is set: `gcloud config set project your-project-id`

2. **Database Connection Issues**:
   - Ensure the Cloud SQL instance is running
   - Check that the database user has the correct permissions
   - Verify the connection string is correct

3. **Deployment Failures**:
   - Check for errors in the deployment logs: `gcloud run services logs read skills-platform`
   - Verify that required services are enabled: `gcloud services list`
   - Ensure service account has necessary permissions

### Getting Support

If you encounter issues with these deployment scripts:

1. Check the GCP documentation for specific services
2. Look for error messages in the command output
3. Review Cloud Run and Cloud SQL logs
4. Contact your GCP administrator for account or permission issues

## Customization

To customize these scripts for your environment:

1. Edit the environment variables in `.env.prod`
2. Modify resource allocations in the deployment scripts
3. Add additional steps for specific requirements
4. Incorporate into your CI/CD pipeline as needed

## Continuous Deployment

For continuous deployment:

1. Add a `cloudbuild.yaml` file to your project
2. Set up Cloud Build triggers for your repository
3. Configure Cloud Build to execute these deployment scripts
4. Set up appropriate IAM permissions for the Cloud Build service account