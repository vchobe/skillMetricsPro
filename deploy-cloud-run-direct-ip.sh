#!/bin/bash
# Cloud Run Direct IP Deployment Script
# This script handles Cloud Run deployment using direct IP database connection

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

# Step 3: Fix port configuration
echo "Checking port configuration..."
node cloud-run-port-fix.js

# Step 4: Run database migration script
echo "Running database migration script..."
node apply-report-settings-migration.mjs

# Step 5: Build the Docker image
echo "Building Docker image..."
docker build -t $IMAGE_NAME -f $DOCKERFILE .

# Step 6: Push the Docker image to Container Registry
echo "Pushing Docker image to Container Registry..."
docker push $IMAGE_NAME

# Step 7: Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="PGHOST=34.30.6.95" \
  --set-env-vars="PGUSER=neondb_owner" \
  --set-env-vars="PGPASSWORD=npg_6SNPYmkEt5pa" \
  --set-env-vars="PGDATABASE=neondb" \
  --set-env-vars="DATABASE_URL=postgresql://neondb_owner:npg_6SNPYmkEt5pa@34.30.6.95/neondb"

# Step 8: Get the deployed URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo "✅ Deployment completed successfully!"
echo "Service URL: $SERVICE_URL"

# Check if service is accessible
echo "Checking service health..."
curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL/health

echo "Done!"