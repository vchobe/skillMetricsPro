#!/bin/bash

# This script checks the service URL for the Cloud Run deployment
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"

echo "===== CHECKING SERVICE URL ====="
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "==========================================="

# 1. Authenticate with GCP
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json

# 2. Get the service URL
echo "2. Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(status.url)")

echo "Service URL: $SERVICE_URL"

# 3. Test the service URL
echo "3. Testing service health endpoints..."
echo "Checking /health endpoint..."
curl -s "$SERVICE_URL/health" || echo "Failed to reach /health endpoint"

echo -e "\nChecking /status endpoint..."
curl -s "$SERVICE_URL/status" || echo "Failed to reach /status endpoint"

echo -e "\nChecking /api/health endpoint..."
curl -s "$SERVICE_URL/api/health" || echo "Failed to reach /api/health endpoint"

echo -e "\nChecking /server-status endpoint..."
curl -s "$SERVICE_URL/server-status" | grep -o "<title>.*</title>" || echo "Failed to reach /server-status endpoint"

echo "===== URL CHECK COMPLETE ====="