#!/bin/bash

# This script deletes and recreates the service in Cloud Run to resolve port issues
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/skillmetricspro2:latest"

echo "===== RECREATING CLOUD RUN SERVICE ====="
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE_NAME"
echo "==========================================="

# 1. Authenticate with GCP
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json

# 2. Delete existing service
echo "2. Deleting existing service..."
gcloud run services delete $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --project=$PROJECT_ID \
  --quiet

# 3. Deploy new service
echo "3. Deploying new service with correct configuration..."
gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE_NAME \
  --platform=managed \
  --region=$REGION \
  --project=$PROJECT_ID \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,HOST=0.0.0.0,DATABASE_URL=postgresql://neondb_owner:npg_6SNPYmkEt5pa@ep-flat-shape-a51t7ga4.us-east-2.aws.neon.tech/neondb?sslmode=require" \
  --port=8080

# 4. Check the new service
echo "4. Checking new service configuration..."
gcloud run services describe $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="yaml(status.url, status.latestCreatedRevisionName)" 

echo "===== SERVICE RECREATION COMPLETE ====="