#!/bin/bash

# Script to verify the Cloud Run deployment

set -e  # Exit on any error

# Configuration
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"

echo "===== VERIFYING CLOUD RUN DEPLOYMENT ====="
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "==========================================="

# 1. Authenticate with GCP
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json
gcloud config set project $PROJECT_ID

# 2. Get service URL
echo "2. Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --format="value(status.url)")

echo "Service URL: $SERVICE_URL"

# 3. Check service status
echo "3. Checking service status..."
SERVICE_STATUS=$(gcloud run services describe $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --format="value(status.conditions[0].status)")

echo "Service Ready Status: $SERVICE_STATUS"

# 4. Test the service URL with various health endpoints
echo "4. Testing service endpoints..."

echo "Testing /status endpoint..."
curl -s "$SERVICE_URL/status" || echo "Failed to reach /status endpoint"

echo -e "\nTesting /health endpoint..."
curl -s "$SERVICE_URL/health" || echo "Failed to reach /health endpoint"

echo -e "\nTesting /api/health endpoint..."
curl -s "$SERVICE_URL/api/health" || echo "Failed to reach /api/health endpoint"

echo -e "\nTesting /server-status endpoint..."
curl -s "$SERVICE_URL/server-status" | grep -o "<title>.*</title>" || echo "Failed to reach /server-status endpoint"

echo "===== VERIFICATION COMPLETE ====="
