# Google Cloud Run Quick Deployment Guide

This is a quick guide to deploy the Skills Management Application to Google Cloud Run.

## Prerequisites

You need:
1. A Google Cloud account with billing enabled
2. The `gcloud` CLI installed or Cloud Shell access
3. The project source code

## Option 1: Deploy with the simplified script

For a streamlined deployment process:

```bash
# Authenticate with Google Cloud
gcloud auth activate-service-account --key-file=service-account-key.json

# Make sure the script is executable
chmod +x deployment/simplified-deploy.sh

# Run the simplified deployment script
./deployment/simplified-deploy.sh
```

## Option 2: Deploy with Cloud Build

For a more robust CI/CD-friendly deployment:

```bash
# Authenticate with Google Cloud
gcloud auth activate-service-account --key-file=service-account-key.json

# Generate a secure session secret
SESSION_SECRET=$(openssl rand -hex 32)

# Submit the build with cloudbuild.yaml
gcloud builds submit --config=cloudbuild.yaml --substitutions=_SESSION_SECRET="$SESSION_SECRET"
```

## Option 3: Deploy directly from source

For a one-command deployment directly to Cloud Run:

```bash
# Authenticate with Google Cloud
gcloud auth activate-service-account --key-file=service-account-key.json

# Deploy to Cloud Run
gcloud run deploy skills-management-app \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account skillmetrics-service-account@imposing-elixir-440911-u9.iam.gserviceaccount.com \
  --set-env-vars="NODE_ENV=production,PORT=8080,HOST=0.0.0.0,SESSION_SECRET=$(openssl rand -hex 32)" \
  --memory=512Mi
```

## Checking Deployment Status

After starting a deployment, check its status:

```bash
# List recent builds
gcloud builds list --limit=3

# Get details for a specific build
gcloud builds describe BUILD_ID

# Get Cloud Run service URL
gcloud run services describe skills-management-app --region us-central1 --format="value(status.url)"
```

## Troubleshooting

If your deployment encounters issues:

1. Check build logs:
   ```bash
   gcloud builds log BUILD_ID
   ```

2. Check Cloud Run service logs:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=skills-management-app" --limit=20
   ```

For more detailed information, refer to the complete [Cloud Run Deployment Guide](docs/cloud-run-deployment.md).
