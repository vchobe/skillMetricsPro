#!/bin/bash

# Script to check Cloud Run deployment status

set -e  # Exit on any error

# Configuration - Use environment variables with fallbacks
PROJECT_ID="${GCP_PROJECT_ID:-imposing-elixir-440911-u9}"
SERVICE_NAME="skills-management-app" 
REGION="us-central1"

echo "===== CHECKING DEPLOYMENT STATUS ====="
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "======================================="

# Ensure service account key exists
if [ ! -f "service-account-key.json" ]; then
  if [ -z "$GCP_SERVICE_ACCOUNT" ]; then
    echo "Error: service-account-key.json not found and GCP_SERVICE_ACCOUNT is not set."
    echo "Please either create a service account key file or set the GCP_SERVICE_ACCOUNT environment variable."
    exit 1
  else
    echo "Creating service-account-key.json from GCP_SERVICE_ACCOUNT environment variable..."
    echo "$GCP_SERVICE_ACCOUNT" > service-account-key.json
    chmod 600 service-account-key.json
  fi
fi

# Authenticate with Google Cloud
echo "Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json
gcloud config set project $PROJECT_ID

# Check service status
echo "Getting service status..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --format="value(status.url)")

if [ -z "$SERVICE_URL" ]; then
  echo "Error: Could not get service URL. The service may not exist or you might not have permission to access it."
  exit 1
fi

echo "Service URL: $SERVICE_URL"

# Get latest revision
echo "Getting latest revision status..."
LATEST_REVISION=$(gcloud run revisions list \
  --platform=managed \
  --region=$REGION \
  --service=$SERVICE_NAME \
  --format="value(metadata.name)" \
  --limit=1 \
  --sort-by=~metadata.creationTimestamp)

if [ -z "$LATEST_REVISION" ]; then
  echo "Error: Could not get latest revision. The service may not have any revisions."
  exit 1
fi

echo "Latest revision: $LATEST_REVISION"

# Get the image used by this revision
REVISION_IMAGE=$(gcloud run revisions describe $LATEST_REVISION \
  --platform=managed \
  --region=$REGION \
  --format="value(spec.containers[0].image)")

# Get container port configuration
CONTAINER_PORT=$(gcloud run revisions describe $LATEST_REVISION \
  --platform=managed \
  --region=$REGION \
  --format="value(spec.containers[0].ports[0].containerPort)")

echo "Deployed image: $REVISION_IMAGE"
echo "Container port: ${CONTAINER_PORT:-Not specified (default: 8080)}"

# Check revision status
REVISION_STATUS=$(gcloud run revisions describe $LATEST_REVISION \
  --platform=managed \
  --region=$REGION \
  --format="value(status.conditions)")

echo "Revision status details:"
gcloud run revisions describe $LATEST_REVISION \
  --platform=managed \
  --region=$REGION \
  --format="yaml(status)"

# Check if revision is ready
READY_STATUS=$(gcloud run revisions describe $LATEST_REVISION \
  --platform=managed \
  --region=$REGION \
  --format="value(status.conditions.filter(e.type == 'Ready').status)")

if [ "$READY_STATUS" = "True" ]; then
  echo "Deployment is READY! 🎉"
  echo "You can access your application at: $SERVICE_URL"
  
  # Test the deployment with curl
  echo "Testing the deployment with curl..."
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL)
  
  if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "Deployment is responding with HTTP status 200 OK! 👍"
  else
    echo "Warning: Deployment is responding with HTTP status $HTTP_STATUS 👎"
  fi
else
  echo "Deployment is NOT READY. 😢"
  
  # Get failure reason
  REASON=$(gcloud run revisions describe $LATEST_REVISION \
    --platform=managed \
    --region=$REGION \
    --format="value(status.conditions.filter(e.type == 'ContainerHealthy').message)")
  
  if [ -n "$REASON" ]; then
    echo "Failure reason: $REASON"
  fi
  
  # Get container logs
  echo "Container logs:"
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME AND resource.labels.revision_name=$LATEST_REVISION" \
    --project=$PROJECT_ID \
    --limit=20 \
    --format="table(timestamp,textPayload,jsonPayload.message)"
fi

echo "======================================="