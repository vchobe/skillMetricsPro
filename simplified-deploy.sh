#!/bin/bash
# Extremely simplified deployment script for Google Cloud Run

set -e
echo "===== STARTING SIMPLIFIED DEPLOYMENT TO CLOUD RUN ====="

# Set variables
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/skillmetricspro-simple:latest"

echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE_NAME"
echo "===========================================" 

# Step 1: Authenticate
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json --project=$PROJECT_ID

# Step 2: Build and Deploy in a single command
echo "2. Building and deploying in one step..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,PORT=8080,HOST=0.0.0.0" \
  --memory=1Gi

# Step 3: Get deployment URL
echo "3. Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format="value(status.url)")

if [ -n "$SERVICE_URL" ]; then
  echo ""
  echo "===== DEPLOYMENT COMPLETED ====="
  echo "Service URL: $SERVICE_URL"
  echo ""
  echo "To check if your service is running properly, visit:"
  echo "$SERVICE_URL/api/health"
else
  echo "ERROR: Service URL not found. Deployment may have failed."
  echo "Check the Google Cloud Console for more details."
  exit 1
fi
