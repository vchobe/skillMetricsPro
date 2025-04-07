#!/bin/bash
set -e

# Configuration
PROJECT_ID="imposing-elixir-440911-u9"
REGION="us-central1"
SERVICE_NAME="skills-management-app"
IMAGE_NAME="skillmetricspro"

# Generate a secure session secret (change this in production)
SESSION_SECRET=$(openssl rand -hex 32)

echo "=== Deploying Skills Management App to Google Cloud Run ==="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"

# Ensure gcloud is configured
echo "=== Configuring gcloud ==="
gcloud config set project $PROJECT_ID

# Build and deploy
echo "=== Building and deploying to Cloud Run ==="
gcloud builds submit --tag gcr.io/$PROJECT_ID/$IMAGE_NAME:latest

echo "=== Deploying to Cloud Run ==="
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$IMAGE_NAME:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,PORT=8080,HOST=0.0.0.0,SESSION_SECRET=$SESSION_SECRET" \
  --memory 1Gi \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300s

# Get the URL of the deployed service
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format='value(status.url)')
echo "=== Deployment complete! ==="
echo "Your application is available at: $SERVICE_URL"
