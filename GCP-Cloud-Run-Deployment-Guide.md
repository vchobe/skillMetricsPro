# Google Cloud Run Deployment Guide

This guide provides detailed instructions for deploying the Skills Management application to Google Cloud Run.

## Prerequisites

- Google Cloud SDK installed locally
- Docker installed locally (for local builds)
- A Google Cloud project with billing enabled
- Owner or Editor access to the Google Cloud project

## Step 1: Initial Setup

### Set up Google Cloud environment

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required services
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  cloudresourcemanager.googleapis.com
```

### Clone the repository

```bash
git clone <repository-url>
cd <repository-directory>
```

## Step 2: Setting up the Database

We recommend using Neon.tech for a serverless PostgreSQL database:

1. Sign up at [Neon.tech](https://neon.tech)
2. Create a new project
3. Create a database called `skills_management`
4. Get the connection string in the format: `postgres://user:password@hostname:port/database`

## Step 3: Configure Environment Variables

Create a `.env.cloud` file with your production environment variables:

```
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
DATABASE_URL=<your-postgresql-connection-string>
SESSION_SECRET=<generated-secret>
```

## Step 4: Deployment Options

### Option 1: Using Cloud Build (Recommended)

This option uses Google Cloud Build to build and deploy your application:

```bash
# Update cloudbuild.yaml with your database connection string
# Then submit the build
gcloud builds submit
```

### Option 2: Build locally and deploy manually

If you prefer to build the container locally:

```bash
# Build the Docker image
docker build -t gcr.io/$PROJECT_ID/skillmetricspro:latest .

# Configure Docker to use gcloud credentials
gcloud auth configure-docker

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/skillmetricspro:latest

# Deploy to Cloud Run
gcloud run deploy skills-management-app \
  --image gcr.io/$PROJECT_ID/skillmetricspro:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=8080,HOST=0.0.0.0,DATABASE_URL=<your-db-url>,SESSION_SECRET=<your-secret> \
  --memory 1Gi \
  --min-instances 0 \
  --max-instances 10
```

### Option 3: Using the provided deployment script

We've included a deployment script that handles the process for you:

```bash
# Edit the script first to configure your database connection
nano deploy-to-cloud-run.sh

# Make it executable and run it
chmod +x deploy-to-cloud-run.sh
./deploy-to-cloud-run.sh
```

## Step 5: Verify Deployment

After deployment completes, you can access your application:

```bash
# Get the URL of your deployed application
gcloud run services describe skills-management-app \
  --platform managed \
  --region us-central1 \
  --format='value(status.url)'
```

## Step 6: Database Migrations

To apply database migrations:

```bash
# Run a one-time migration job
DATABASE_URL="your-production-db-url" npm run db:push
```

## Troubleshooting

### Common Issues

1. **Container fails to start**: Check Cloud Run logs for errors:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND \
                        resource.labels.service_name=skills-management-app" \
                        --limit 20
   ```

2. **Database connection issues**: Verify your connection string is correctly formatted and accessible from Cloud Run.

3. **Build failures**: Check Cloud Build logs:
   ```bash
   gcloud builds list
   gcloud builds log <build-id>
   ```

## Security Considerations

- Set up Identity and Access Management (IAM) rules for your service
- Consider using Secret Manager for sensitive environment variables
- Configure VPC Service Controls for enhanced security

## Continuous Deployment

To set up continuous deployment:

1. Connect your repository to Cloud Build
2. Create a trigger that runs on pushes to main/master branch
3. Configure the trigger to use your cloudbuild.yaml file

## Custom Domain Setup

To use a custom domain:

```bash
gcloud beta run domain-mappings create \
  --service skills-management-app \
  --domain your-domain.com
```

Follow the DNS verification steps provided by Google Cloud.
