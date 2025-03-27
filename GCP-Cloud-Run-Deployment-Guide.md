# Employee Skills Management Platform - GCP Cloud Run Deployment Guide

This guide explains how to deploy the Employee Skills Management Platform to Google Cloud Platform using Cloud Run and Cloud SQL.

## Deployment Scripts Overview

The deployment scripts in the `deployment/` directory automate the entire deployment process, including:

1. Setting up GCP project configuration
2. Creating a Cloud SQL PostgreSQL instance
3. Setting up environment variables
4. Building and pushing the Docker image
5. Deploying the application to Cloud Run
6. Initializing the database schema and sample data
7. Verifying deployment status with health checks

## Available Deployment Scripts

1. **`deployment/deploy-all.sh`** - Orchestrates the entire deployment process in one command
2. **`deployment/deploy-to-gcp.sh`** - Deploys the infrastructure and application
3. **`deployment/setup-database.sh`** - Sets up database schema and initial data
4. **`deployment/check-deployment.sh`** - Verifies deployment status
5. **`deployment/backup-restore-db.sh`** - Manages database backups and restoration

## Prerequisites

Before running the deployment script, ensure you have:

- Google Cloud SDK installed on your local machine or Cloud Shell
- Docker installed (for local testing)
- Git installed
- Logged in to Google Cloud (`gcloud auth login`)
- A Google Cloud project created
- Billing enabled on your Google Cloud project

## Step-by-Step Deployment Instructions

### 1. Prepare Your Environment

1. Open Google Cloud Shell or your local terminal
2. Clone the repository containing the deployment scripts:
   ```bash
   git clone https://github.com/yourusername/employee-skills-platform.git
   cd employee-skills-platform
   ```
3. Make the deployment scripts executable:
   ```bash
   chmod +x deployment/*.sh
   ```

### 2. Run the Deployment

#### Option 1: Full Automated Deployment (Recommended)

Run the all-in-one deployment script:

```bash
./deployment/deploy-all.sh
```

This script will handle the entire deployment process from start to finish.

#### Option 2: Step-by-Step Deployment

If you prefer to run each step individually:

1. Deploy the infrastructure and application:
   ```bash
   ./deployment/deploy-to-gcp.sh
   ```

2. Set up the database schema and initial data:
   ```bash
   ./deployment/setup-database.sh
   ```

3. Verify the deployment:
   ```bash
   ./deployment/check-deployment.sh
   ```

### 3. Script Execution Details

The script performs the following steps:

#### a. Set up Google Cloud Project Configuration
- Sets the active GCP project
- Enables required APIs (Cloud Build, Container Registry, Cloud Run, Cloud SQL, Secret Manager)

#### b. Repository Setup
- Clones the repository or updates the existing code
- Prepares the codebase for deployment

#### c. Database Setup
- Creates a Cloud SQL PostgreSQL instance
- Creates the database and database user
- Configures database connection settings

#### d. Environment Variables
- Creates a .env file with appropriate settings for the application
- Includes database connection details and other configuration values
- Generates secure random values for secrets

#### e. Database Initialization
- Prepares scripts to create the database schema
- Sets up tables, relationships, and enumerated types
- Creates an admin user and sample data

#### f. Docker Configuration
- Creates or updates the Dockerfile for the application
- Sets up the build process for a production-ready container

#### g. Image Building
- Builds the Docker image using Cloud Build
- Pushes the image to Google Container Registry

#### h. Cloud Run Deployment
- Creates a service account with appropriate permissions
- Securely stores environment variables in Secret Manager
- Deploys the container to Cloud Run with Cloud SQL connection
- Configures public access to the application

#### i. Database Initialization
- Runs the database initialization scripts
- Creates the schema, tables, and initial data

### 4. Post-Deployment Steps

After successful deployment, the script provides:
- The URL for accessing your application
- Admin credentials for the first login
- Database information for future reference

Important security steps to take after deployment:
1. Change the admin password immediately after first login
2. Consider restricting access to the application if needed
3. Set up HTTPS with a custom domain if needed

## Customization Options

You can modify the script to change:
- The region for deployment
- Database instance specifications
- Admin user details
- Application configuration
- Resource allocation for Cloud Run

## Troubleshooting

### Using the Deployment Check Script

We've provided a comprehensive diagnostic tool that can help identify common deployment issues:

```bash
./deployment/check-deployment.sh
```

This script will:
- Verify if the Cloud Run service is accessible
- Check the application health endpoint
- Test database connectivity
- Display recent application logs
- Check Cloud SQL instance status

### Common Troubleshooting Steps

If deployment fails, check the following:
1. Verify that billing is enabled for your GCP project
2. Ensure all required APIs are enabled:
   ```bash
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com sqladmin.googleapis.com
   ```
3. Check Cloud Build logs for container build errors:
   ```bash
   gcloud builds list --filter="source.repoSource.repoName:skills-management-app"
   ```
4. Review the deployment logs in the Cloud Run service:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision" --limit=50
   ```
5. Test database connectivity directly:
   ```bash
   ./cloud-sql-proxy --instances=PROJECT_ID:REGION:skills-management-db=tcp:5432
   ```

### Common Issues

- **Insufficient permissions**: Ensure your account has the following roles:
  - Cloud Run Admin
  - Cloud SQL Admin
  - Cloud Build Editor
  - Storage Admin

- **API limits**: New GCP accounts may have limits on resource creation
  - Request quota increases if needed

- **Database connection issues**: 
  - Verify the connection string format
  - Check that the Cloud SQL instance is running
  - Ensure the Cloud Run service has the proper IAM permissions

- **Container startup failures**:
  - Check the application logs for startup errors
  - Verify all required environment variables are set

## Maintenance and Updates

To update the deployed application:
1. Make changes to the code repository
2. Run the deployment script again
3. The script will detect existing resources and update only what's necessary

## Cost Management

This deployment uses:
- Cloud Run (pay per use)
- Cloud SQL (db-f1-micro, which is the smallest and cheapest option)
- Cloud Build (free tier available)
- Container Registry (storage costs apply)

Monitor your billing dashboard to track costs.

## Security Considerations

The deployment includes:
- Secure storage of secrets in Secret Manager
- Private database connection using Cloud SQL Proxy
- Encrypted connections between services
- Minimal permission service accounts

For production environments, consider:
- Setting up VPC Service Controls
- Implementing Identity and Access Management best practices
- Adding additional security layers as needed
- Regular security scans and updates

## Data Backup and Recovery

By default, Cloud SQL is configured with daily backups. We've also provided a backup/restore script for manual database backups:

```bash
# To create a backup
./deployment/backup-restore-db.sh backup

# To restore from the latest backup
./deployment/backup-restore-db.sh restore
```

For additional protection in production environments:
1. Set up point-in-time recovery in Cloud SQL
2. Configure scheduled export jobs for database dumps
3. Store backups in multiple geographic regions
4. Test restoration procedures regularly

## Support and Additional Resources

- Google Cloud Run Documentation: [https://cloud.google.com/run/docs](https://cloud.google.com/run/docs)
- Cloud SQL Documentation: [https://cloud.google.com/sql/docs](https://cloud.google.com/sql/docs)
- Secret Manager: [https://cloud.google.com/secret-manager/docs](https://cloud.google.com/secret-manager/docs)