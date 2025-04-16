#!/bin/bash
# Simple deployment script for Google Cloud Run

set -e  # Exit on any error

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-imposing-elixir-440911-u9}"
SERVICE_NAME="skills-management-app"
REGION="us-central1"

echo "===== STARTING SIMPLE CLOUD RUN DEPLOYMENT ====="
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "==========================================="

# 1. Authenticate with Google Cloud
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json
gcloud config set project $PROJECT_ID

# 2. Check the current service status
echo "2. Checking current service status..."
gcloud run services describe $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --format="yaml(spec.template.spec.containers)" || echo "Service not found or not accessible"

# 3. Update the existing service configuration
echo "3. Updating service configuration to use port 8080..."

# Extract DATABASE_URL from current configuration
DATABASE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --format="value(spec.template.spec.containers[0].env[?(@.name=='DATABASE_URL')].value)")

if [ -n "$DATABASE_URL" ]; then
  echo "Using existing DATABASE_URL from service configuration"
  ENV_VARS="PORT=8080,HOST=0.0.0.0,NODE_ENV=production,DATABASE_URL=${DATABASE_URL}"
else
  echo "No DATABASE_URL found, using only PORT and HOST variables"
  ENV_VARS="PORT=8080,HOST=0.0.0.0,NODE_ENV=production"
fi

# Update the service
gcloud run services update $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --port=8080 \
  --update-env-vars="${ENV_VARS}" \
  --timeout=5m

# 4. Verify the service status after update
echo "4. Service status after update:"
gcloud run services describe $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --format="yaml(status.conditions)"

echo "5. Getting service URL..."
gcloud run services describe $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --format="value(status.url)"

echo "===== DEPLOYMENT COMPLETE ====="