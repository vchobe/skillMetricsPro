# Cloud Run Deployment Guide

This guide will walk you through deploying the Employee Skills Management application to Google Cloud Run.

## Prerequisites

Before beginning deployment, ensure you have:

1. A Google Cloud account with billing enabled
2. The Google Cloud SDK (`gcloud`) installed locally
3. Access to Google Cloud services: Cloud Run, Artifact Registry, Cloud Build
4. A PostgreSQL database (we recommend using Neon.tech for a serverless PostgreSQL solution)

## Deployment Steps

### 1. Configure Environment Variables

Create a `.env` file with your production environment variables:

```
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
DATABASE_URL=<your-postgresql-connection-string>
SESSION_SECRET=<random-strong-secret>
```

### 2. Set Up Google Cloud Project

```bash
# Set your project ID
PROJECT_ID="your-project-id"

# Configure gcloud to use your project
gcloud config set project $PROJECT_ID

# Enable required services
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com
```

### 3. Create a Container Repository

```bash
# Create a Docker repository in Artifact Registry
gcloud artifacts repositories create skills-app-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Skills Management App Docker repository"
```

### 4. Build and Push the Docker Image

```bash
# Build the image using Cloud Build
gcloud builds submit --tag us-central1-docker.pkg.dev/$PROJECT_ID/skills-app-repo/skills-app:latest

# Alternatively, build locally and push
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/skills-app-repo/skills-app:latest .
docker push us-central1-docker.pkg.dev/$PROJECT_ID/skills-app-repo/skills-app:latest
```

### 5. Deploy to Cloud Run

```bash
# Deploy the service
gcloud run deploy skills-management-app \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/skills-app-repo/skills-app:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,PORT=8080,HOST=0.0.0.0,DATABASE_URL=<your-postgresql-connection-string>,SESSION_SECRET=<random-strong-secret>" \
  --memory=1Gi \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300s
```

### 6. Access Your Deployed Application

After successful deployment, get the URL of your application:

```bash
gcloud run services describe skills-management-app --platform managed --region us-central1 --format='value(status.url)'
```

## Setting Up Database

For the database, we recommend using Neon.tech for a serverless PostgreSQL database:

1. Sign up for an account at [Neon.tech](https://neon.tech)
2. Create a new project
3. Create a database named `skills_management`
4. Get the connection string and add it to your environment variables

## Deploying Schema Changes

When you need to update the database schema:

```bash
# Run migration script locally against your production database
NODE_ENV=production DATABASE_URL="your-production-db-url" npm run db:push
```

## Troubleshooting

- **Deployment Fails**: Check Cloud Build logs for errors
- **Runtime Issues**: Check Cloud Run logs for application errors
- **Database Connection**: Verify your database connection string and ensure the Cloud Run service has network access to the database

## Additional Configuration

### Custom Domain Setup

```bash
# Map custom domain to your Cloud Run service
gcloud beta run domain-mappings create --service skills-management-app --domain your-domain.com --region us-central1
```

### Continuous Deployment

Set up a Cloud Build trigger to automatically deploy on repository changes:

1. Connect your repository to Cloud Build
2. Create a trigger to build and deploy on push to main branch

## Security Considerations

- Use secrets management for sensitive environment variables
- Set up Identity and Access Management (IAM) rules for your Cloud Run service
- Configure network policies to restrict access to your database
