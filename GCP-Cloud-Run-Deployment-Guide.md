# Employee Skills Management Platform - GCP Cloud Run Deployment Guide

This guide explains how to deploy the Employee Skills Management Platform to Google Cloud Platform using Cloud Run and Cloud SQL.

## Deployment Script Overview

The `deploy-to-gcp.sh` script automates the entire deployment process, including:

1. Setting up GCP project configuration
2. Cloning the repository
3. Creating a Cloud SQL PostgreSQL instance
4. Setting up environment variables
5. Preparing database initialization scripts
6. Creating Docker configuration
7. Building and pushing the Docker image
8. Deploying the application to Cloud Run
9. Initializing the database

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
2. Clone the repository containing the deployment script:
   ```bash
   git clone https://github.com/yourusername/employee-skills-platform.git
   cd employee-skills-platform
   ```
3. Make the script executable:
   ```bash
   chmod +x deploy-to-gcp.sh
   ```

### 2. Run the Deployment Script

Run the script, providing your GCP project ID:

```bash
./deploy-to-gcp.sh your-gcp-project-id
```

If you don't provide a project ID, the script will use the default "skillmetrics-platform".

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

If deployment fails, check the following:
1. Verify that billing is enabled for your GCP project
2. Ensure all required APIs are enabled
3. Check Cloud Build logs for container build errors
4. Review the deployment logs in the Cloud Run service
5. Check the database initialization logs

Common issues:
- Insufficient permissions: Ensure your account has appropriate roles
- API limits: New GCP accounts may have limits on resource creation
- Database connection issues: Check network settings and credentials
- Build errors: Verify the Dockerfile and build configuration

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

By default, Cloud SQL is configured with daily backups. For additional protection:
1. Set up point-in-time recovery
2. Configure export jobs for database dumps
3. Implement application-level backup procedures

## Support and Additional Resources

- Google Cloud Run Documentation: [https://cloud.google.com/run/docs](https://cloud.google.com/run/docs)
- Cloud SQL Documentation: [https://cloud.google.com/sql/docs](https://cloud.google.com/sql/docs)
- Secret Manager: [https://cloud.google.com/secret-manager/docs](https://cloud.google.com/secret-manager/docs)