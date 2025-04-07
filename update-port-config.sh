#!/bin/bash

# This script updates the port configuration to ensure the app listens on port 8080 for Cloud Run
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"

echo "===== UPDATING PORT CONFIGURATION FOR CLOUD RUN ====="
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "==========================================="

# 1. Authenticate with GCP
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json

# 2. Update service configuration to explicitly set PORT=8080
echo "2. Updating service configuration with port settings..."
gcloud run services update $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --project=$PROJECT_ID \
  --set-env-vars="PORT=8080,HOST=0.0.0.0" \
  --port=8080

# 3. Check the updated configuration
echo "3. Checking updated service configuration..."
gcloud run services describe $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="yaml(spec.template.spec.containers[0].env)"

echo "===== PORT CONFIGURATION UPDATE COMPLETE ====="