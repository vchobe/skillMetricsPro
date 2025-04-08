# Cloud Run Deployment Quickstart

This document provides a brief guide to deploying this application to Google Cloud Run.

## Prerequisites

- Google Cloud CLI installed locally (`gcloud`)
- Docker installed locally (for local builds)
- Google Cloud account with billing enabled
- Owner or Editor permissions on your Google Cloud project

## Steps to Deploy

### 1. Clone the repository locally

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Authenticate with Google Cloud

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 3. Enable required Google Cloud APIs

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com
```

### 4. Build and deploy using Cloud Build

The simplest way to deploy is using the provided cloudbuild.yaml file:

```bash
gcloud builds submit
```

This will:
- Build a Docker image from your code
- Push it to Google Container Registry
- Deploy it to Cloud Run

### 5. Access your application

After deployment completes, you can find your application URL with:

```bash
gcloud run services describe skills-management-app --platform managed --region us-central1 --format='value(status.url)'
```

## Environment Variables

The deployment includes the following environment variables:

- `NODE_ENV=production`
- `PORT=8080`
- `HOST=0.0.0.0`
- `SESSION_SECRET` (automatically generated)

If you need to add a database connection or other environment variables, modify the `cloudbuild.yaml` file.

## Database Setup

For the PostgreSQL database:

1. Create a database instance (we recommend using [Neon.tech](https://neon.tech) for serverless PostgreSQL)
2. Get the connection string
3. Add it to your environment variables in the `cloudbuild.yaml` file

## Troubleshooting

If you encounter any issues:

1. Check the Cloud Build logs for build errors
2. Check the Cloud Run logs for runtime errors
3. Verify that your service account has appropriate permissions

## Manual Deployment

If you prefer to deploy manually:

```bash
# Build the image locally
docker build -t gcr.io/YOUR_PROJECT_ID/skillmetricspro2:latest .

# Push to Container Registry
docker push gcr.io/YOUR_PROJECT_ID/skillmetricspro2:latest

# Deploy to Cloud Run
gcloud run deploy skills-management-app \
  --image gcr.io/YOUR_PROJECT_ID/skillmetricspro2:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,PORT=8080,HOST=0.0.0.0,SESSION_SECRET=YOUR_SECRET" \
  --memory=1Gi
```
