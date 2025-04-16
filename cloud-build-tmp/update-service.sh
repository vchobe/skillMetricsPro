#!/bin/bash
# Script to update Cloud Run service environment variables

set -e  # Exit on any error

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-imposing-elixir-440911-u9}"
SERVICE_NAME="skills-management-app"
REGION="us-central1"

echo "===== UPDATING CLOUD RUN SERVICE ====="
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "==========================================="

# 1. Authenticate with Google Cloud
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json
gcloud config set project $PROJECT_ID

# 2. Update the service with the proper environment variables
echo "2. Updating service configuration..."

# Define the DATABASE_URL explicitly
DATABASE_URL="postgresql://neondb_owner:npg_6SNPYmkEt5pa@ep-flat-shape-a51t7ga4.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Update the service
echo "Updating environment variables (excluding reserved PORT)"
gcloud run services update $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --update-env-vars="HOST=0.0.0.0,NODE_ENV=production,DATABASE_URL=${DATABASE_URL}" \
  --timeout=5m

# Set the port specifically (not as an env var)
echo "Setting port to 8080"
gcloud run services update $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --port=8080 \
  --timeout=5m

echo "===== SERVICE UPDATE COMPLETE ====="