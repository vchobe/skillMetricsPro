#!/bin/bash
# Simplified deployment script based on Cloud Run Quickstart approach

set -e
echo "===== STARTING QUICKSTART DEPLOYMENT TO CLOUD RUN ====="

# Set variables
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/skillmetricspro-quickstart:latest"
SESSION_SECRET="generated-session-secret-for-production-$(date +%s)"

echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE_NAME"
echo "===========================================" 

echo "1. Activating service account..."
gcloud auth activate-service-account --key-file=service-account-key.json --project=$PROJECT_ID

echo "2. Enabling required Google Cloud APIs..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com

echo "3. Building and pushing Docker image with Cloud Build..."
gcloud builds submit --tag=$IMAGE_NAME

echo "4. Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,PORT=8080,HOST=0.0.0.0,SESSION_SECRET=$SESSION_SECRET" \
  --memory=1Gi \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300s

echo "5. Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --project $PROJECT_ID --format="value(status.url)")

if [ -n "$SERVICE_URL" ]; then
  echo "Service deployed at: $SERVICE_URL"
  
  # Wait for the service to be fully deployed
  echo "Waiting 30 seconds for deployment to stabilize..."
  sleep 30
  
  echo "Testing service health..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/health" || echo "Failed")
  
  if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Health check successful (HTTP $HTTP_CODE)"
    echo "Service is running properly"
  else
    echo "⚠️ Health check returned HTTP $HTTP_CODE"
    echo "Service may not be fully operational"
    echo "Try checking logs with: gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\""
  fi
  
  echo ""
  echo "===== DEPLOYMENT COMPLETED ====="
  echo "Service URL: $SERVICE_URL"
else
  echo "ERROR: Service URL not found. Deployment may have failed."
  echo "Check the Google Cloud Console for more details."
  exit 1
fi
