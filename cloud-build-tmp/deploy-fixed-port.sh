#!/bin/bash
# Deployment script that fixes port configuration before building

set -e  # Exit on any error

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-imposing-elixir-440911-u9}"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/skillmetricspro2-fixed:latest"

echo "===== DEPLOYING TO CLOUD RUN WITH FIXED PORT ====="
echo "Project ID: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE_NAME"
echo "======================================================"

# 1. Fix the Dockerfile port
echo "1. Fixing Dockerfile to use explicit port 8080..."
cp Dockerfile Dockerfile.original
sed -i 's/EXPOSE \${PORT}/EXPOSE 8080/' Dockerfile
echo "   Dockerfile updated with explicit port 8080"

# 2. Authenticate with Google Cloud
echo "2. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json
gcloud config set project $PROJECT_ID

# 3. Build the container image
echo "3. Building container image..."
gcloud builds submit --tag=$IMAGE_NAME --timeout=15m

# 4. Restore original Dockerfile
echo "4. Restoring original Dockerfile..."
mv Dockerfile.original Dockerfile

# 5. Deploy the image to Cloud Run
echo "5. Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --port 8080 \
    --set-env-vars "NODE_ENV=production,HOST=0.0.0.0" \
    --memory 512Mi \
    --cpu 1 \
    --allow-unauthenticated \
    --timeout=5m

echo "===== DEPLOYMENT COMPLETE ====="
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --platform=managed --region=$REGION --format='value(status.url)')"