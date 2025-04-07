#!/bin/bash

# Deployment script with fixed port 8080 configuration
# This script builds and deploys the app to Google Cloud Run

set -e  # Exit on any error

# Configuration
PROJECT_ID="imposing-elixir-440911-u9"
IMAGE_NAME="gcr.io/${PROJECT_ID}/skillmetricspro2:latest"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
SERVICE_ACCOUNT="skillmetrics-service-account@${PROJECT_ID}.iam.gserviceaccount.com"

echo "===== STARTING DEPLOYMENT WITH FIXED PORT 8080 ====="
echo "Project ID: $PROJECT_ID"
echo "Image Name: $IMAGE_NAME"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "==========================================="

# 1. Authenticate with GCP
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json
gcloud config set project $PROJECT_ID

# 2. Build the Docker image
echo "2. Building Docker image..."
npm run build  # Build the production assets
docker build -t $IMAGE_NAME -f Dockerfile.cloudrun .

# 3. Push the image to Google Container Registry
echo "3. Pushing Docker image to Google Container Registry..."
gcloud auth configure-docker -q
docker push $IMAGE_NAME

# 4. Deploy to Cloud Run
echo "4. Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE_NAME \
  --platform=managed \
  --region=$REGION \
  --service-account=$SERVICE_ACCOUNT \
  --port=8080 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=${DATABASE_URL}"

echo "===== DEPLOYMENT COMPLETE ====="
echo "Getting service URL..."
gcloud run services describe $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --format="value(status.url)"

echo "Checking if service is healthy..."
./check-url.sh