#!/bin/bash
# Simplified script for deploying to Google Cloud Run with minimal database configuration
# Only requires database username and password

set -e
echo "===== STARTING DEPLOYMENT TO CLOUD RUN ====="

# Set project variables
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/skillmetricspro6:latest"

# Default database settings
CLOUD_SQL_CONNECTION_NAME="imposing-elixir-440911-u9:us-central1:skillmetrics-db"
CLOUD_SQL_DATABASE="neondb"
CLOUD_SQL_HOST="34.30.6.95"
CLOUD_SQL_PORT="5432"

# Only prompt for username and password
read -p "Enter Database User: " CLOUD_SQL_USER
read -sp "Enter Database Password: " CLOUD_SQL_PASSWORD
echo "" # Add a new line after password input

echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE_NAME"
echo "Database Connection: $CLOUD_SQL_CONNECTION_NAME"
echo "Database Host: $CLOUD_SQL_HOST"
echo "Database Name: $CLOUD_SQL_DATABASE"
echo "==========================================="

echo "1. Activating service account..."
gcloud auth activate-service-account --key-file=service-account-key.json --project=$PROJECT_ID

echo "2. Building Docker image..."
docker build -t $IMAGE_NAME -f Dockerfile.cloud-run-fixed .

echo "3. Pushing Docker image to Container Registry..."
docker push $IMAGE_NAME

echo "4. Deploying to Cloud Run with environment variables..."
# Configure environment variables for deployment
ENV_VARS="NODE_ENV=production"
ENV_VARS="$ENV_VARS,CLOUD_SQL_CONNECTION_NAME=$CLOUD_SQL_CONNECTION_NAME"
ENV_VARS="$ENV_VARS,CLOUD_SQL_USER=$CLOUD_SQL_USER"
ENV_VARS="$ENV_VARS,CLOUD_SQL_PASSWORD=$CLOUD_SQL_PASSWORD"
ENV_VARS="$ENV_VARS,CLOUD_SQL_DATABASE=$CLOUD_SQL_DATABASE"
ENV_VARS="$ENV_VARS,CLOUD_SQL_HOST=$CLOUD_SQL_HOST"
ENV_VARS="$ENV_VARS,CLOUD_SQL_PORT=$CLOUD_SQL_PORT"

# Add PG* variables as fallback
ENV_VARS="$ENV_VARS,PGUSER=$CLOUD_SQL_USER"
ENV_VARS="$ENV_VARS,PGPASSWORD=$CLOUD_SQL_PASSWORD"
ENV_VARS="$ENV_VARS,PGDATABASE=$CLOUD_SQL_DATABASE"
ENV_VARS="$ENV_VARS,PGHOST=$CLOUD_SQL_HOST"
ENV_VARS="$ENV_VARS,PGPORT=$CLOUD_SQL_PORT"

# Also add DATABASE_URL for direct connection
DATABASE_URL="postgresql://$CLOUD_SQL_USER:$CLOUD_SQL_PASSWORD@$CLOUD_SQL_HOST:$CLOUD_SQL_PORT/$CLOUD_SQL_DATABASE"
ENV_VARS="$ENV_VARS,DATABASE_URL=$DATABASE_URL"

# Execute the deployment command
echo "Running deployment command..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "$ENV_VARS" \
  --project $PROJECT_ID

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
  echo "Database user: $CLOUD_SQL_USER"
  echo "Database connection: Direct IP to $CLOUD_SQL_HOST and socket connection to $CLOUD_SQL_CONNECTION_NAME"
else
  echo "ERROR: Service URL not found. Deployment may have failed."
  echo "Check the Google Cloud Console for more details."
  exit 1
fi