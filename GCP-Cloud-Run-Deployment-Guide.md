# Deploying to Google Cloud Run

This guide provides step-by-step instructions for deploying the Skills Management Platform application to Google Cloud Run with PostgreSQL database.

## Prerequisites

Before you begin, you'll need:

1. A Google Cloud Platform (GCP) account with billing enabled
2. The [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and configured locally
3. The `gcloud` CLI tool authenticated with your GCP account
4. Docker installed on your local machine (for local testing)
5. Git to clone this repository

## Step 1: Set Up Your GCP Project

1. Create a new GCP project or use an existing one:
```bash
gcloud projects create [PROJECT_ID] --name="Skills Management Platform"
```

2. Set the project as your default:
```bash
gcloud config set project [PROJECT_ID]
```

3. Enable required APIs:
```bash
gcloud services enable cloudbuild.googleapis.com \
    run.googleapis.com \
    cloudresourcemanager.googleapis.com \
    artifactregistry.googleapis.com \
    sqladmin.googleapis.com
```

## Step 2: Deploy Using the All-in-One Script

The simplest way to deploy is using our all-in-one script:

```bash
./deployment/deploy-all.sh --project-id=[YOUR_PROJECT_ID] --setup-db
```

This will:
1. Create a Cloud SQL PostgreSQL instance
2. Build and push the Docker image
3. Deploy the application to Cloud Run
4. Set up the database schema
5. Create an admin user

If you want to add test data as well:

```bash
./deployment/deploy-all.sh --project-id=[YOUR_PROJECT_ID] --with-test-data
```

## Step 3: Check Deployment Status

To verify your deployment is working correctly:

```bash
./deployment/check-deployment.sh --project-id=[YOUR_PROJECT_ID]
```

This will check:
- If the service is responding
- Database connection status
- Docker image details
- Recent application logs

## Step 4: Additional Configuration

### Email Notifications

To enable email notifications using Mailjet:

1. Create Mailjet API keys at https://app.mailjet.com/account/apikeys
2. Store them as secrets in Secret Manager:

```bash
echo -n "your-mailjet-api-key" | gcloud secrets create MAILJET_API_KEY --data-file=-
echo -n "your-mailjet-secret-key" | gcloud secrets create MAILJET_SECRET_KEY --data-file=-
```

3. Redeploy your application to use these secrets:

```bash
./deployment/deploy-to-gcp.sh --project-id=[YOUR_PROJECT_ID]
```

### Custom Domain (Optional)

To set up a custom domain:

1. Go to the [Cloud Run console](https://console.cloud.google.com/run)
2. Select your service
3. Go to the "Domain mappings" tab
4. Follow the instructions to map your domain

## Step 5: Database Backups and Maintenance

### Creating a Database Backup

```bash
./deployment/backup-restore-db.sh backup --project-id=[YOUR_PROJECT_ID]
```

### Restoring from a Backup

```bash
./deployment/backup-restore-db.sh restore --project-id=[YOUR_PROJECT_ID] --file=[BACKUP_FILENAME]
```

### Listing Available Backups

```bash
./deployment/backup-restore-db.sh list --project-id=[YOUR_PROJECT_ID]
```

## Troubleshooting

If you encounter issues with your deployment:

1. Check the application logs:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=skills-management-app" --limit=50
```

2. Verify database connectivity:
```bash
gcloud sql instances describe skills-management-db
```

3. Check if your Docker image was built correctly:
```bash
gcloud container images list-tags gcr.io/[YOUR_PROJECT_ID]/skills-management-app
```

4. Run the check-deployment.sh script for detailed diagnostics:
```bash
./deployment/check-deployment.sh --project-id=[YOUR_PROJECT_ID]
```

## Security Considerations

- The database password is automatically generated during deployment
- All communications between Cloud Run and Cloud SQL are encrypted
- For production deployments, consider:
  - Setting up IAM service accounts with minimal permissions
  - Enabling audit logging
  - Implementing network security policies
  - Setting up regular database backups

## Cost Management

To minimize costs:
- The Cloud SQL instance uses the smallest available tier (db-f1-micro)
- Cloud Run scales to zero when not in use
- Consider setting up budget alerts in GCP to monitor spending

## Need Help?

If you encounter any issues not addressed in this guide, please:
- Check the GCP documentation
- Look at the application logs
- Contact the development team for support