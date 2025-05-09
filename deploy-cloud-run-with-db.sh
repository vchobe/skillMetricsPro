#!/bin/bash
# Enhanced script for deploying to Google Cloud Run with database configuration
# Takes database connection parameters as inputs

set -e
echo "===== STARTING DEPLOYMENT TO CLOUD RUN ====="

# Set project variables
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/skillmetricspro6:latest"

# Prompt for database configuration if not provided
read -p "Enter Cloud SQL Connection Name (e.g. project:region:instance): " CLOUD_SQL_CONNECTION_NAME
read -p "Enter Database User: " CLOUD_SQL_USER
read -sp "Enter Database Password: " CLOUD_SQL_PASSWORD
echo "" # Add a new line after password input
read -p "Enter Database Name: " CLOUD_SQL_DATABASE

# For direct IP connection, optionally get host and port
read -p "Use socket connection? (y/n, default: y): " USE_SOCKET
USE_SOCKET=${USE_SOCKET:-y}

if [[ $USE_SOCKET != "y" && $USE_SOCKET != "Y" ]]; then
  read -p "Enter Database Host IP: " CLOUD_SQL_HOST
  read -p "Enter Database Port (default: 5432): " CLOUD_SQL_PORT
  CLOUD_SQL_PORT=${CLOUD_SQL_PORT:-5432}
fi

echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE_NAME"
echo "==========================================="

echo "1. Activating service account..."
gcloud auth activate-service-account --key-file=service-account-key.json --project=$PROJECT_ID

echo "2. Building Docker image..."
docker build -t $IMAGE_NAME -f Dockerfile.cloud-run-fixed .

echo "3. Pushing Docker image to Container Registry..."
docker push $IMAGE_NAME

echo "4. Deploying to Cloud Run with environment variables..."
DEPLOY_CMD="gcloud run deploy $SERVICE_NAME --image $IMAGE_NAME --platform managed --region $REGION --allow-unauthenticated"

# Add environment variables
DEPLOY_CMD="$DEPLOY_CMD --set-env-vars NODE_ENV=production"
DEPLOY_CMD="$DEPLOY_CMD --set-env-vars CLOUD_SQL_CONNECTION_NAME=$CLOUD_SQL_CONNECTION_NAME"
DEPLOY_CMD="$DEPLOY_CMD --set-env-vars CLOUD_SQL_USER=$CLOUD_SQL_USER"
DEPLOY_CMD="$DEPLOY_CMD --set-env-vars CLOUD_SQL_PASSWORD=$CLOUD_SQL_PASSWORD"
DEPLOY_CMD="$DEPLOY_CMD --set-env-vars CLOUD_SQL_DATABASE=$CLOUD_SQL_DATABASE"

# Add direct connection variables if not using socket
if [[ $USE_SOCKET != "y" && $USE_SOCKET != "Y" ]]; then
  DEPLOY_CMD="$DEPLOY_CMD --set-env-vars CLOUD_SQL_HOST=$CLOUD_SQL_HOST"
  DEPLOY_CMD="$DEPLOY_CMD --set-env-vars CLOUD_SQL_PORT=$CLOUD_SQL_PORT"
fi

# Also add PG* variables as fallback
DEPLOY_CMD="$DEPLOY_CMD --set-env-vars PGUSER=$CLOUD_SQL_USER"
DEPLOY_CMD="$DEPLOY_CMD --set-env-vars PGPASSWORD=$CLOUD_SQL_PASSWORD"
DEPLOY_CMD="$DEPLOY_CMD --set-env-vars PGDATABASE=$CLOUD_SQL_DATABASE"

if [[ $USE_SOCKET != "y" && $USE_SOCKET != "Y" ]]; then
  DEPLOY_CMD="$DEPLOY_CMD --set-env-vars PGHOST=$CLOUD_SQL_HOST"
  DEPLOY_CMD="$DEPLOY_CMD --set-env-vars PGPORT=$CLOUD_SQL_PORT"
  
  # Also add DATABASE_URL for direct connection
  DATABASE_URL="postgresql://$CLOUD_SQL_USER:$CLOUD_SQL_PASSWORD@$CLOUD_SQL_HOST:$CLOUD_SQL_PORT/$CLOUD_SQL_DATABASE"
  DEPLOY_CMD="$DEPLOY_CMD --set-env-vars DATABASE_URL=$DATABASE_URL"
fi

# Execute the deployment command
echo "Running deployment command..."
eval $DEPLOY_CMD

echo "5. Verifying deployment..."
echo "Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --project $PROJECT_ID --format="value(status.url)")

if [ -n "$SERVICE_URL" ]; then
  echo "Service deployed at: $SERVICE_URL"
  echo "Testing service health..."
  
  # Wait for the service to be fully deployed
  echo "Waiting 30 seconds for deployment to stabilize..."
  sleep 30
  
  # Test the service with curl
  echo "Making HTTP request to $SERVICE_URL..."
  curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/health" || echo "Failed to connect to service"
  
  echo ""
  echo "===== DEPLOYMENT COMPLETED ====="
  echo "Service URL: $SERVICE_URL"
else
  echo "ERROR: Service URL not found. Deployment may have failed."
  echo "Check the Google Cloud Console for more details."
  exit 1
fi