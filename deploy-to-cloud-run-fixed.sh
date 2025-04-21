#!/bin/bash

# Exit on error
set -e

# Variables
SERVICE_NAME="skill-manager-app"
REGION="us-central1"  # Change this to your preferred region

echo "Building and deploying to Cloud Run using fixed Dockerfile..."

# Build the container using the fixed Dockerfile.cloudrun
gcloud builds submit --tag gcr.io/$(gcloud config get-value project)/$SERVICE_NAME --dockerfile=Dockerfile.cloudrun

# Deploy the container to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$(gcloud config get-value project)/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --memory 512Mi

echo "Deployment complete!"
echo "Your application will be available at the URL shown above."