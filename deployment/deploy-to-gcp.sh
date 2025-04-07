#!/bin/bash
set -e

# Configuration
PROJECT_ID="imposing-elixir-440911-u9"
REGION="us-central1"
SERVICE_NAME="skills-management-app"
SERVICE_ACCOUNT="skillmetrics-service-account@imposing-elixir-440911-u9.iam.gserviceaccount.com"

# Generate a secure session secret
SESSION_SECRET=$(openssl rand -hex 32)

echo "=== Direct Source Deployment to Google Cloud Run ==="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"

# Ensure gcloud is configured for the project
echo "=== Configuring Google Cloud project ==="
gcloud config set project $PROJECT_ID

# Deploy directly from source code
echo "=== Deploying to Cloud Run from source ==="
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --service-account $SERVICE_ACCOUNT \
  --set-env-vars "NODE_ENV=production,PORT=8080,HOST=0.0.0.0,SESSION_SECRET=${SESSION_SECRET}" \
  --memory=1Gi \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300s

# Get the URL of the deployed service
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format='value(status.url)')
echo "=== Deployment complete! ==="
echo "Your application is available at: $SERVICE_URL"