#!/bin/bash
set -e

# Configuration
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
SERVICE_ACCOUNT="skillmetrics-service-account@${PROJECT_ID}.iam.gserviceaccount.com"

# Generate a secure session secret (if needed)
SESSION_SECRET=$(openssl rand -hex 32)

echo "🚀 Starting deployment to Cloud Run..."
echo "Project ID: $PROJECT_ID"
echo "Service name: $SERVICE_NAME"
echo "Region: $REGION"

# Authenticate with Google Cloud using service account
if [ -f "service-account-key.json" ]; then
  echo "🔑 Authenticating with Google Cloud..."
  gcloud auth activate-service-account --key-file=service-account-key.json
else
  echo "⚠️ Service account key file not found. Assuming already authenticated."
fi

# Set the Google Cloud project
echo "🔧 Setting Google Cloud project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Build and deploy using Cloud Run without Docker
echo "🏗️ Building and deploying directly to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --service-account $SERVICE_ACCOUNT \
  --set-env-vars="NODE_ENV=production,PORT=8080,HOST=0.0.0.0,SESSION_SECRET=$SESSION_SECRET" \
  --memory=512Mi

echo "✅ Deployment initiated! The build and deployment will continue in Google Cloud."
echo "📋 Check deployment status with: gcloud run services describe $SERVICE_NAME --region $REGION"