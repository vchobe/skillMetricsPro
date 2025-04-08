# Google Cloud Platform Deployment Guide

This guide walks through deploying the Skills Management Platform to Google Cloud Platform (GCP) using Cloud Run for the application and Cloud SQL for the PostgreSQL database.

## Prerequisites

Before deploying, ensure you have:

1. A Google Cloud Platform account
2. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and configured
3. [Docker](https://docs.docker.com/get-docker/) installed
4. Necessary permissions on your GCP project:
   - Cloud Run Admin
   - Cloud SQL Admin
   - Service Account User
   - Storage Admin

## Step 1: Setup GCP Project

If you haven't created a GCP project, create one:

```bash
gcloud projects create [PROJECT_ID] --name="Skills Management Platform"
gcloud config set project [PROJECT_ID]
```

Enable the necessary APIs:

```bash
gcloud services enable cloudbuild.googleapis.com \
                       containerregistry.googleapis.com \
                       cloudrun.googleapis.com \
                       sqladmin.googleapis.com \
                       secretmanager.googleapis.com
```

## Step 2: Set Up Cloud SQL PostgreSQL Instance

Create a PostgreSQL instance:

```bash
gcloud sql instances create skills-platform-db \
  --database-version=POSTGRES_13 \
  --cpu=1 \
  --memory=3840MB \
  --region=us-central1 \
  --storage-size=10GB \
  --storage-type=SSD
```

Create the database and user:

```bash
gcloud sql databases create skills_platform --instance=skills-platform-db

# Create a random password
DB_PASSWORD=$(openssl rand -base64 16)

# Create database user
gcloud sql users create skills_platform_user \
  --instance=skills-platform-db \
  --password="$DB_PASSWORD"

# Store password in Secret Manager
echo -n "$DB_PASSWORD" | gcloud secrets create db-password --data-file=-
```

## Step 3: Configure Environment Variables

Create a `.env.prod` file with production environment settings:

```
NODE_ENV=production
SESSION_SECRET=your-strong-session-secret
```

Store secrets in Secret Manager:

```bash
echo -n "your-strong-session-secret" | gcloud secrets create session-secret --data-file=-
```

## Step 4: Build and Push Docker Image

Build the Docker image:

```bash
docker build -t gcr.io/[PROJECT_ID]/skills-platform:v1 .
```

Push the image to Google Container Registry:

```bash
docker push gcr.io/[PROJECT_ID]/skills-platform:v1
```

## Step 5: Deploy to Cloud Run

Deploy the application:

```bash
gcloud run deploy skills-platform \
  --image gcr.io/[PROJECT_ID]/skills-platform:v1 \
  --platform managed \
  --region us-central1 \
  --memory 1Gi \
  --allow-unauthenticated \
  --set-secrets=SESSION_SECRET=session-secret:latest \
  --set-secrets=DB_PASSWORD=db-password:latest \
  --set-env-vars="NODE_ENV=production,DB_USER=skills_platform_user,DB_NAME=skills_platform,DB_HOST=localhost"
```

Create a Cloud SQL connection:

```bash
gcloud run services update skills-platform \
  --add-cloudsql-instances=[PROJECT_ID]:us-central1:skills-platform-db
```

Update the environment variables with the connection:

```bash
DB_CONNECTION_NAME="[PROJECT_ID]:us-central1:skills-platform-db"

gcloud run services update skills-platform \
  --set-env-vars="DB_CONNECTION_NAME=$DB_CONNECTION_NAME"
```

## Step 6: Set Up Database Schema and Initial Data

Run the database migration script:

```bash
gcloud run jobs create db-migration \
  --image gcr.io/[PROJECT_ID]/skills-platform:v1 \
  --set-cloudsql-instances=[PROJECT_ID]:us-central1:skills-platform-db \
  --set-secrets=DB_PASSWORD=db-password:latest \
  --set-env-vars="DB_USER=skills_platform_user,DB_NAME=skills_platform,DB_HOST=localhost,DB_CONNECTION_NAME=$DB_CONNECTION_NAME" \
  --command="node" \
  --args="db-push.js"
```

Create an admin user:

```bash
gcloud run jobs create create-admin \
  --image gcr.io/[PROJECT_ID]/skills-platform:v1 \
  --set-cloudsql-instances=[PROJECT_ID]:us-central1:skills-platform-db \
  --set-secrets=DB_PASSWORD=db-password:latest \
  --set-env-vars="DB_USER=skills_platform_user,DB_NAME=skills_platform,DB_HOST=localhost,DB_CONNECTION_NAME=$DB_CONNECTION_NAME,ADMIN_EMAIL=admin@example.com,ADMIN_PASSWORD=Admin@2025" \
  --command="node" \
  --args="scripts/create-admin.js"
```

## Step 7: Setup SSL and Domain (Optional)

If you have a custom domain, map it to your Cloud Run service:

```bash
gcloud beta run domain-mappings create \
  --service skills-platform \
  --domain your-domain.com
```

Follow the DNS verification steps provided by the command output to verify your domain.

## Automated Deployment with Scripts

The project includes automated deployment scripts in the `deployment/` directory:

### deploy-all.sh

This script orchestrates the entire deployment process:

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

### deploy-to-gcp.sh

Handles building and deploying the Docker image:

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

### setup-database.sh

Creates and configures the PostgreSQL database:

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

### backup-restore-db.sh

Handles database backups and restores:

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

## Continuous Deployment Setup

### Setup Cloud Build Trigger

1. Go to Cloud Build > Triggers
2. Create a new trigger:
   - Name: `skills-platform-deploy`
   - Event: `Push to a branch`
   - Repository: Connect to your GitHub/GitLab repository
   - Branch: `^main$`
   - Build configuration: `Cloud Build configuration file (yaml or json)`
   - File location: `cloudbuild.yaml`

### Create cloudbuild.yaml

Create a `cloudbuild.yaml` file in your repository:

```yaml
steps:
# Build the container image
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', 'gcr.io/$PROJECT_ID/skills-platform:$COMMIT_SHA', '.']

# Push the container image to Container Registry
- name: 'gcr.io/cloud-builders/docker'
  args: ['push', 'gcr.io/$PROJECT_ID/skills-platform:$COMMIT_SHA']

# Deploy container image to Cloud Run
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  entrypoint: gcloud
  args:
  - 'run'
  - 'deploy'
  - 'skills-platform'
  - '--image'
  - 'gcr.io/$PROJECT_ID/skills-platform:$COMMIT_SHA'
  - '--region'
  - 'us-central1'
  - '--platform'
  - 'managed'
  - '--allow-unauthenticated'
  - '--set-secrets=SESSION_SECRET=session-secret:latest'
  - '--set-secrets=DB_PASSWORD=db-password:latest'
  - '--set-env-vars=NODE_ENV=production,DB_USER=skills_platform_user,DB_NAME=skills_platform,DB_HOST=localhost'
  - '--add-cloudsql-instances=$PROJECT_ID:us-central1:skills-platform-db'

# Run database migrations
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  entrypoint: gcloud
  args:
  - 'run'
  - 'jobs'
  - 'execute'
  - 'db-migration'
  - '--region'
  - 'us-central1'

images:
- 'gcr.io/$PROJECT_ID/skills-platform:$COMMIT_SHA'
```

## Monitoring and Logging

### Cloud Monitoring

1. Go to **Monitoring > Dashboard**
2. Create a custom dashboard with:
   - Cloud Run metrics (request count, latency, error rate)
   - Cloud SQL metrics (CPU usage, memory usage, disk usage)

### Cloud Logging

View logs for your Cloud Run service:

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=skills-platform" --limit=10
```

Set up log-based alerts:

1. Go to **Logging > Logs Explorer**
2. Create a filter for error logs
3. Create an alert policy based on your filter

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Ensure the Cloud SQL instance is running
   - Check that the Cloud Run service has the correct connection string
   - Verify the service account has the necessary permissions

2. **Deployment Failures**:
   - Check Cloud Build logs for any build errors
   - Verify Docker image builds successfully locally
   - Ensure all required environment variables are set

3. **Application Errors**:
   - Review Cloud Run logs for application errors
   - Test the application locally with production configuration
   - Verify environment variables are correctly set in Cloud Run

### Getting Support

For issues with:
- GCP services: [Google Cloud Support](https://cloud.google.com/support)
- Application-specific issues: Create an issue in your project repository
- Database issues: Check PostgreSQL logs in Cloud SQL

## Security Considerations

1. **Secret Management**:
   - Use Secret Manager for all sensitive values
   - Avoid hardcoding secrets in scripts or code
   - Rotate secrets regularly

2. **Network Security**:
   - Configure VPC Service Controls if needed
   - Set up Cloud Armor for web application firewall protection
   - Use Cloud IAP for more restricted access

3. **Database Security**:
   - Enable SSL for database connections
   - Use least privilege principles for database users
   - Enable Cloud SQL audit logging

## Cost Optimization

1. **Rightsizing Resources**:
   - Start with minimal Cloud SQL and Cloud Run configurations
   - Scale up only as needed based on monitoring data
   - Consider using Cloud Run minimum instances = 0 for development environments

2. **Monitoring Usage**:
   - Set up billing alerts to notify when costs exceed thresholds
   - Regularly review the cost breakdown in the GCP Billing console
   - Consider using Cloud Run CPU always allocated = false to save on resources

## Next Steps

After deployment:

1. Set up automated backups for your database
2. Configure a custom domain with SSL
3. Implement CI/CD pipeline for automated testing and deployment
4. Set up monitoring and alerting for application health
5. Conduct a security review of your deployment