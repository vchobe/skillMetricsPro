#!/bin/bash
# Super simplified script for deploying to Google Cloud Run
# Requires only username and password as arguments

# Check if username and password were provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <db_username> <db_password>"
    echo "Example: $0 app_user my_secure_password"
    exit 1
fi

DB_USER=$1
DB_PASSWORD=$2

# Fixed settings
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
CLOUD_SQL_CONNECTION_NAME="imposing-elixir-440911-u9:us-central1:skillmetrics-db"
CLOUD_SQL_DATABASE="neondb"
CLOUD_SQL_HOST="34.30.6.95"
CLOUD_SQL_PORT="5432"

echo "===== STARTING DEPLOYMENT TO CLOUD RUN ====="
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Database Connection: $CLOUD_SQL_CONNECTION_NAME"
echo "Database Host: $CLOUD_SQL_HOST"
echo "==========================================="

# Activate service account
echo "1. Activating service account..."
gcloud auth activate-service-account --key-file=service-account-key.json --project=$PROJECT_ID

# Submit build with substitution variables
echo "2. Submitting Cloud Build job with database credentials..."
gcloud builds submit --config cloudbuild.yaml \
  --project=$PROJECT_ID \
  --substitutions=_SERVICE_NAME=$SERVICE_NAME,_REGION=$REGION,_ENV_VARS="NODE_ENV=production,CLOUD_SQL_CONNECTION_NAME=$CLOUD_SQL_CONNECTION_NAME,CLOUD_SQL_USER=$DB_USER,CLOUD_SQL_PASSWORD=$DB_PASSWORD,CLOUD_SQL_DATABASE=$CLOUD_SQL_DATABASE,CLOUD_SQL_HOST=$CLOUD_SQL_HOST,CLOUD_SQL_PORT=$CLOUD_SQL_PORT,PGUSER=$DB_USER,PGPASSWORD=$DB_PASSWORD,PGDATABASE=$CLOUD_SQL_DATABASE,PGHOST=$CLOUD_SQL_HOST,PGPORT=$CLOUD_SQL_PORT,DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$CLOUD_SQL_HOST:$CLOUD_SQL_PORT/$CLOUD_SQL_DATABASE"

# Verify deployment
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
else
  echo "ERROR: Service URL not found. Deployment may have failed."
  echo "Check the Google Cloud Console for more details."
  exit 1
fi