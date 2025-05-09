#!/bin/bash
# Cloud Run Deployment Script - DATABASE_URL only
# This script simplifies the Cloud Run deployment using only DATABASE_URL for database connection

set -e

# Step 1: Check required tools
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed"; exit 1; }
command -v gcloud >/dev/null 2>&1 || { echo "Google Cloud SDK is required but not installed"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed"; exit 1; }

# Step 2: Set configuration variables
PROJECT_ID="imposing-elixir-440911-u9"
REGION="us-central1"
SERVICE_NAME="skillmetrics"
IMAGE_NAME="gcr.io/$PROJECT_ID/skillmetrics:$(date +%Y%m%d-%H%M%S)"
DOCKERFILE="Dockerfile.cloud-run-optimized"

echo "Using configuration:"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service name: $SERVICE_NAME"
echo "Image name: $IMAGE_NAME"
echo "Dockerfile: $DOCKERFILE"

# Step 3: Fix port configuration for Cloud Run
echo "Checking port configuration..."
node cloud-run-port-fix.js

# Step 4: Build the Docker image
echo "Building Docker image..."
docker build -t $IMAGE_NAME -f $DOCKERFILE .

# Step 5: Push the Docker image to Container Registry
echo "Pushing Docker image to Container Registry..."
docker push $IMAGE_NAME

# Step 6: Deploy to Cloud Run with DATABASE_URL only
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="HOST=0.0.0.0" \
  --set-env-vars="PORT=8080" \
  --set-env-vars="DATABASE_URL=postgresql://app_user:EjsUgkhcd/DB3kdibkXMAw@34.30.6.95/neondb"

# Step 7: Get the deployed URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo "✅ Deployment completed successfully!"
echo "Service URL: $SERVICE_URL"

# Check if service is accessible
echo "Checking service health..."
curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL/health

echo "Done!"