# Google Cloud Run Deployment Guide

This guide explains how to deploy the Skills Management Application to Google Cloud Run for serverless, scalable hosting.

## Prerequisites

Before starting the deployment process, you should have:

1. A Google Cloud Platform account with billing enabled
2. The Google Cloud SDK (`gcloud`) installed 
3. Editor or Owner access to your Google Cloud project
4. The application source code cloned to your local machine

## Step 1: Project Setup

First, select or create a Google Cloud project:

```bash
# Create a new project (optional)
gcloud projects create [PROJECT_ID] --name="Skills Management App"

# Select your project
gcloud config set project [PROJECT_ID]
```

Then enable the required Google Cloud APIs:

```bash
gcloud services enable cloudrun.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

## Step 2: Service Account Setup

Create a dedicated service account for your deployment:

```bash
# Create service account
gcloud iam service-accounts create skillmetrics-service-account \
  --display-name="Skills Management Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding [PROJECT_ID] \
  --member="serviceAccount:skillmetrics-service-account@[PROJECT_ID].iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding [PROJECT_ID] \
  --member="serviceAccount:skillmetrics-service-account@[PROJECT_ID].iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding [PROJECT_ID] \
  --member="serviceAccount:skillmetrics-service-account@[PROJECT_ID].iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding [PROJECT_ID] \
  --member="serviceAccount:skillmetrics-service-account@[PROJECT_ID].iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

## Step 3: Set Up Artifact Repository

Create a Docker repository to store your container images:

```bash
gcloud artifacts repositories create cloud-run-source-deploy \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker repository for Cloud Run deployments"
```

## Step 4: Prepare Environment Secrets

Create and store secrets for your application:

```bash
# Generate a random session secret
SESSION_SECRET=$(openssl rand -hex 32)

# Store it in Secret Manager
echo -n "$SESSION_SECRET" | \
  gcloud secrets create app-session-secret \
  --replication-policy="automatic" \
  --data-file=-

# Grant access to the service account
gcloud secrets add-iam-policy-binding app-session-secret \
  --member="serviceAccount:skillmetrics-service-account@[PROJECT_ID].iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Step 5: Dockerfile Configuration

Make sure you have a Dockerfile in your project root:

```dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["npm", "start"]
```

## Step 6: Deployment

You can deploy your application using one of these methods:

### Method 1: Direct deployment from source

```bash
gcloud run deploy skills-management-app \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account skillmetrics-service-account@[PROJECT_ID].iam.gserviceaccount.com \
  --set-env-vars="NODE_ENV=production,PORT=8080,HOST=0.0.0.0" \
  --set-secrets="SESSION_SECRET=app-session-secret:latest" \
  --memory=512Mi
```

### Method 2: Using Cloud Build with cloudbuild.yaml

Create a `cloudbuild.yaml` file:

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/skills-management-app:$COMMIT_SHA', '.']

  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/skills-management-app:$COMMIT_SHA']

  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'skills-management-app'
      - '--image'
      - 'gcr.io/$PROJECT_ID/skills-management-app:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--service-account'
      - 'skillmetrics-service-account@$PROJECT_ID.iam.gserviceaccount.com'
      - '--set-env-vars'
      - 'NODE_ENV=production,PORT=8080,HOST=0.0.0.0' 
      - '--set-secrets'
      - 'SESSION_SECRET=app-session-secret:latest'
      - '--memory'
      - '512Mi'

images:
  - 'gcr.io/$PROJECT_ID/skills-management-app:$COMMIT_SHA'
```

Then submit the build:

```bash
gcloud builds submit --config=cloudbuild.yaml
```

## Step 7: Verify Deployment

Check the status and get the URL of your deployed service:

```bash
# Check service status
gcloud run services describe skills-management-app --region us-central1

# Get the service URL
gcloud run services describe skills-management-app --region us-central1 --format="value(status.url)"
```

## Troubleshooting

If you encounter issues during deployment:

### Permission Issues
- Ensure your service account has all necessary permissions
- Check if you've enabled all required APIs

### Build Failures
- Verify your Dockerfile is correct
- Check Cloud Build logs for specific error messages

### Runtime Errors
- Check application logs in Google Cloud Console
- Ensure all environment variables are properly set

## Next Steps

### Setting up a Custom Domain
```bash
gcloud beta run domain-mappings create \
  --service skills-management-app \
  --domain [YOUR_DOMAIN] \
  --region us-central1
```

### Configuring Autoscaling
```bash
gcloud run services update skills-management-app \
  --region us-central1 \
  --min-instances=1 \
  --max-instances=10
```

### Continuous Deployment
Set up a Cloud Build trigger to automatically deploy when changes are pushed to your repository:

```bash
gcloud builds triggers create github \
  --name="skills-app-deploy" \
  --repo-owner="[GITHUB_USERNAME]" \
  --repo-name="[REPO_NAME]" \
  --branch-pattern="main" \
  --build-config="cloudbuild.yaml"
```

## Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)