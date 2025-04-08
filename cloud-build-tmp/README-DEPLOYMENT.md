# Cloud Run Deployment Guide

This document provides instructions for deploying the Skills Management application to Google Cloud Run.

## Prerequisites

1. **Google Cloud Project**: You need a Google Cloud project with billing enabled.
2. **Service Account**: A service account with the necessary permissions (Cloud Run Admin, Storage Admin).
3. **Environment Variables**:
   - `GCP_PROJECT_ID`: Your Google Cloud project ID
   - `GCP_SERVICE_ACCOUNT`: The JSON service account key 
   - `DATABASE_URL`: PostgreSQL database connection string

## Deployment Scripts

### Standard Deployment

To deploy the application with the fixed configuration:

```bash
./deploy-fixed-v2.sh
```

This script:
1. Creates a Cloud Run optimized Dockerfile
2. Builds the container with fixed port configuration (8080)
3. Deploys to Cloud Run with the necessary environment variables
4. Verifies the deployment and health check

### Deployment Debugging

If you encounter issues with the deployment, use:

```bash
./check-deployment-debug.sh
```

This script provides detailed information about:
- Service status and URL
- Latest revision status
- Container health
- Resource allocation
- Environment variables
- Recent logs
- Health endpoint status

## Troubleshooting Common Issues

### HealthCheckContainerError

If the container fails health checks:

1. Ensure the server is listening on port 8080 and host 0.0.0.0
2. Check that the database connection is working
3. Verify that the health endpoint at `/api/health` returns 200 OK
4. Examine the application logs for startup errors

### Database Connection Issues

If the application can't connect to the database:

1. Verify that the `DATABASE_URL` environment variable is set correctly
2. Ensure the database is accessible from Google Cloud Run
3. Check for any firewall or network policy restrictions

### Port Configuration Problems

If there are port binding issues:

1. Confirm the application is using port 8080 (Cloud Run requirement)
2. Verify that the `EXPOSE 8080` directive is in the Dockerfile
3. Make sure the application binds to "0.0.0.0" not "localhost" or "127.0.0.1"

## Viewing Logs

To view logs for the deployed service:

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=skills-management-app" --limit=50
```

## Updating the Deployment

To update the deployment after making changes to the application:

1. Make your code changes
2. Run `./deploy-fixed-v2.sh` again to build and deploy

The script will create a new revision with a timestamp in the image name.

## Checking Deployment Status

After deployment, you can:

1. Visit the service URL displayed at the end of the deployment
2. Check the health endpoint at `{SERVICE_URL}/api/health`
3. View the status in Google Cloud Console: https://console.cloud.google.com/run
