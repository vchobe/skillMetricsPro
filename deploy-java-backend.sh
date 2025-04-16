#!/bin/bash

# Exit on error
set -e

# Configuration
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/skillmetricspro2:latest"

echo "Building Java backend Docker image..."
cd java-backend
docker build -t $IMAGE_NAME .

echo "Pushing Docker image to Google Container Registry..."
docker push $IMAGE_NAME

echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=${DATABASE_URL},JWT_SECRET=skillmetrics-secure-jwt-secret" \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --port 8080 \
  --project $PROJECT_ID

echo "Deployment completed successfully!"
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')"
