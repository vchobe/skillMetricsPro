#!/bin/bash
# Script to configure Cloud Run health check properly

set -e
echo "===== CONFIGURING CLOUD RUN HEALTH CHECK ====="

# Set variables
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"

echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"

echo "1. Activating service account..."
gcloud auth activate-service-account --key-file=service-account-key.json --project=$PROJECT_ID

echo "2. Setting health check configuration..."
gcloud run services update $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --port 8080 \
  --cpu 1 \
  --memory 1Gi \
  --set-env-vars="PORT=8080,HOST=0.0.0.0" \
  --min-instances 0 \
  --max-instances 10 \
  --cpu-throttling \
  --http-health-check-path "/api/health" \
  --health-checks \
  --timeout 300s

echo "3. Verifying configuration..."
gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --format="yaml"

echo "===== HEALTH CHECK CONFIGURATION COMPLETED ====="