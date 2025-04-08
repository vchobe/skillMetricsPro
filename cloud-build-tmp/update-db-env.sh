#!/bin/bash

# Simple script to only update the database environment variable
echo "===== UPDATING DATABASE URL ON CLOUD RUN SERVICE ====="
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"

echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "==========================================="

# 1. Authenticate with GCP
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json

# 2. Update ONLY the environment variables on the existing service
echo "2. Updating environment variables on Cloud Run service..."
gcloud run services update $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --set-env-vars="DATABASE_URL=$DATABASE_URL,NODE_ENV=production,HOST=0.0.0.0"

echo "===== ENVIRONMENT UPDATE COMPLETE ====="
echo "Check status using: ./check-gc-deployment.sh"
echo "Note: Using the secure DATABASE_URL you provided (value not shown for security)."