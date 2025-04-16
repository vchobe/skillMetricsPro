#!/bin/bash

# Simplified deployment to Google Cloud Run
# This script only deploys an existing image to Cloud Run

echo "===== SIMPLIFIED DEPLOYMENT TO CLOUD RUN ====="
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE="gcr.io/$PROJECT_ID/skills-management-app:latest"

echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE" 
echo "==========================================="

# 1. Authenticate with GCP
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json

# 2. Create a very minimal container locally for testing
echo "2. Creating a very basic Dockerfile for testing..."
cat > Dockerfile.mini << 'EOL'
FROM node:20-slim

WORKDIR /app

COPY package.json .
COPY server ./server
COPY client ./client
COPY shared ./shared
COPY public ./public

RUN npm install

ENV PORT=8080
ENV HOST=0.0.0.0

EXPOSE 8080

CMD ["npx", "tsx", "server/index.ts"]
EOL

# 3. Build the simplest possible container and tag it
echo "3. Building and deploying as one step..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,HOST=0.0.0.0" \
  --port=8080 \
  --memory=1Gi \
  --cpu=1

echo "===== DEPLOYMENT COMMAND COMPLETE ====="
echo "Check status and logs for any issues."