#!/bin/bash
set -e

# Project settings
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/skillmetricspro-fixed:latest"

# Authenticate with service account
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json

# Get DATABASE_URL from environment
if [[ -z "${DATABASE_URL}" ]]; then
  echo "❌ DATABASE_URL environment variable is not set."
  echo "Please set it before running this script."
  exit 1
fi

echo "===== QUICK REDEPLOYMENT TO CLOUD RUN ====="
echo "Project ID: ${PROJECT_ID}"
echo "Service Name: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo "Image: ${IMAGE_NAME}"
echo "===========================================\n"

# Just redeploy to Cloud Run without rebuilding the image
echo "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --port 8080 \
  --set-env-vars "NODE_ENV=production,HOST=0.0.0.0,PORT=8080,DATABASE_URL=${DATABASE_URL}" \
  --memory 1Gi \
  --cpu 1 \
  --allow-unauthenticated \
  --timeout=10m \
  --no-cpu-throttling \
  --max-instances=5 \
  --min-instances=1 \
  --startup-cpu-boost \
  --container-command="/usr/src/app/start.sh"

# Verify deployment
echo "Verifying deployment..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format="value(status.url)")

if [[ -n "${SERVICE_URL}" ]]; then
  echo "✅ Service redeployed successfully at: ${SERVICE_URL}"
  
  # Wait for the service to initialize
  echo "   Waiting 15 seconds for service to initialize..."
  sleep 15
  
  # Check if service health endpoint is available
  echo "   Checking service health..."
  HEALTH_CHECK_URL="${SERVICE_URL}/api/health"
  echo "   Health endpoint: ${HEALTH_CHECK_URL}"
  
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${HEALTH_CHECK_URL} || echo "failed")
  
  if [[ "${HTTP_STATUS}" == "200" ]]; then
    echo "✅ Health check successful"
    echo ""
    echo "===== REDEPLOYMENT SUCCESSFUL ====="
    echo "Your application is now deployed and running at: ${SERVICE_URL}"
    echo ""
  else
    echo "⚠️ Health check returned status: ${HTTP_STATUS}"
    echo "Service is deployed, but may not be fully functional yet."
    echo "Please check the logs in Google Cloud Console:"
    echo "https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/logs"
  fi
else
  echo "⚠️ Redeployment completed but could not retrieve service URL."
  echo "Please check the Google Cloud Console for status:"
  echo "https://console.cloud.google.com/run"
fi