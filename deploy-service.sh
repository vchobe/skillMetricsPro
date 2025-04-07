#!/bin/bash

# This script deploys the service to Cloud Run with correct settings
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/skillmetricspro2:latest"

echo "===== DEPLOYING CLOUD RUN SERVICE ====="
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE_NAME"
echo "==========================================="

# 1. Authenticate with GCP
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json

# 2. Deploy new service
echo "2. Deploying service with correct configuration..."
gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE_NAME \
  --platform=managed \
  --region=$REGION \
  --project=$PROJECT_ID \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,HOST=0.0.0.0,DATABASE_URL=postgresql://neondb_owner:npg_6SNPYmkEt5pa@ep-flat-shape-a51t7ga4.us-east-2.aws.neon.tech/neondb?sslmode=require" \
  --port=8080 \
  --timeout=180s

echo "===== SERVICE DEPLOYMENT INITIATED ====="