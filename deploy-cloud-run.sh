#!/bin/bash
# Enhanced script for deploying to Google Cloud Run

set -e
echo "===== STARTING DEPLOYMENT TO CLOUD RUN ====="

# Set variables
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/skillmetricspro6:latest"

echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE_NAME"
echo "===========================================" 

echo "1. Activating service account..."
gcloud auth activate-service-account --key-file=service-account-key.json --project=$PROJECT_ID

echo "2. Submitting Cloud Build job..."
gcloud builds submit --config cloudbuild.yaml --project=$PROJECT_ID 

echo "3. Verifying deployment..."
echo "Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --project $PROJECT_ID --format="value(status.url)")

if [ -n "$SERVICE_URL" ]; then
  echo "Service deployed at: $SERVICE_URL"
  echo "Testing service health..."
  
  # Wait for the service to be fully deployed
  echo "Waiting 30 seconds for deployment to stabilize..."
  sleep 30
  
  # Test the service with curl
  echo "Making HTTP request to $SERVICE_URL..."
  curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/health" || echo "Failed to connect to service"
  
  echo ""
  echo "===== DEPLOYMENT COMPLETED ====="
  echo "Service URL: $SERVICE_URL"
else
  echo "ERROR: Service URL not found. Deployment may have failed."
  echo "Check the Google Cloud Console for more details."
  exit 1
fi