#!/bin/bash
set -e

PROJECT_ID="imposing-elixir-440911-u9"
REGION="us-central1"
SERVICE_NAME="skills-management-app"
IMAGE="gcr.io/imposing-elixir-440911-u9/skillmetricspro2:latest"
SERVICE_ACCOUNT="skillmetrics-service-account@imposing-elixir-440911-u9.iam.gserviceaccount.com"

# Generate a secure session secret
SESSION_SECRET=$(openssl rand -hex 32)

echo "=== Simplified Deployment to Google Cloud ==="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo "Image: $IMAGE"

# Ensure gcloud is configured for the project
echo "=== Configuring Google Cloud project ==="
gcloud config set project $PROJECT_ID

# Check if the image exists
echo "=== Checking for image availability ==="
if ! gcloud container images describe $IMAGE &>/dev/null; then
  echo "Error: Image $IMAGE not found"
  echo "Please build the image first or use an existing image"
  exit 1
fi

# Deploy to Cloud Run
echo "=== Deploying to Cloud Run ==="
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --service-account $SERVICE_ACCOUNT \
  --update-env-vars "NODE_ENV=production,PORT=8080,HOST=0.0.0.0,SESSION_SECRET=${SESSION_SECRET}" \
  --cpu=1 \
  --memory=1Gi \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300s

# Get the URL of the deployed service
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format='value(status.url)')
echo "=== Deployment complete! ==="
echo "Your application is available at: $SERVICE_URL"