#!/bin/bash
# Enhanced script for deploying to Google Cloud Run with minimal database configuration
# Only requires database username and password as arguments

# Check if username and password were provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <db_username> <db_password>"
    echo "Example: $0 app_user my_secure_password"
    exit 1
fi

DB_USER=$1
DB_PASSWORD=$2

set -e
echo "===== STARTING DEPLOYMENT TO CLOUD RUN ====="

# Set project variables
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/skillmetricspro6:latest"

# Database configuration
CLOUD_SQL_CONNECTION_NAME="imposing-elixir-440911-u9:us-central1:skillmetrics-db"
CLOUD_SQL_DATABASE="neondb"
CLOUD_SQL_HOST="34.30.6.95"
CLOUD_SQL_PORT="5432"

echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE_NAME"
echo "Database Connection: $CLOUD_SQL_CONNECTION_NAME"
echo "Database Host: $CLOUD_SQL_HOST"
echo "==========================================="

echo "1. Activating service account..."
gcloud auth activate-service-account --key-file=service-account-key.json --project=$PROJECT_ID

echo "2. Submitting Cloud Build job with database credentials..."
# Configure environment variables for deployment
ENV_VARS="NODE_ENV=production"
ENV_VARS="$ENV_VARS,CLOUD_SQL_CONNECTION_NAME=$CLOUD_SQL_CONNECTION_NAME"
ENV_VARS="$ENV_VARS,CLOUD_SQL_USER=$DB_USER"
ENV_VARS="$ENV_VARS,CLOUD_SQL_PASSWORD=$DB_PASSWORD"
ENV_VARS="$ENV_VARS,CLOUD_SQL_DATABASE=$CLOUD_SQL_DATABASE"
ENV_VARS="$ENV_VARS,CLOUD_SQL_HOST=$CLOUD_SQL_HOST"
ENV_VARS="$ENV_VARS,CLOUD_SQL_PORT=$CLOUD_SQL_PORT"

# Add PG* variables as fallback
ENV_VARS="$ENV_VARS,PGUSER=$DB_USER"
ENV_VARS="$ENV_VARS,PGPASSWORD=$DB_PASSWORD"
ENV_VARS="$ENV_VARS,PGDATABASE=$CLOUD_SQL_DATABASE"
ENV_VARS="$ENV_VARS,PGHOST=$CLOUD_SQL_HOST"
ENV_VARS="$ENV_VARS,PGPORT=$CLOUD_SQL_PORT"

# Also add DATABASE_URL for direct connection
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$CLOUD_SQL_HOST:$CLOUD_SQL_PORT/$CLOUD_SQL_DATABASE"
ENV_VARS="$ENV_VARS,DATABASE_URL=$DATABASE_URL"

# Submit build with substitutions
gcloud builds submit --config cloudbuild.yaml \
  --project=$PROJECT_ID \
  --substitutions=_SERVICE_NAME=$SERVICE_NAME,_REGION=$REGION,_ENV_VARS="$ENV_VARS"

echo "3. Verifying deployment..."
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
  RESPONSE=$(curl -s -w "%{http_code}" "$SERVICE_URL/api/health")
  echo "Response status: $RESPONSE"
  
  echo ""
  echo "===== DEPLOYMENT COMPLETED ====="
  echo "Service URL: $SERVICE_URL"
  echo "Database user: $DB_USER"
  echo "Database connection: Direct IP to $CLOUD_SQL_HOST and socket connection to $CLOUD_SQL_CONNECTION_NAME"
else
  echo "ERROR: Service URL not found. Deployment may have failed."
  echo "Check the Google Cloud Console for more details."
  exit 1
fi