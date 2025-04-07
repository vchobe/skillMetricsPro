#!/bin/bash
set -e

PROJECT_ID="imposing-elixir-440911-u9"
REGION="us-central1"
SERVICE_NAME="skills-management-app"
DB_INSTANCE_NAME="skillmetrics-db"
DB_NAME="skillmetrics"
DB_USER="skills_admin"
DB_PASSWORD="$(openssl rand -base64 16)"
DB_PORT="5432"

echo "=== Simplified Deployment to Google Cloud ==="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo "Database Instance: $DB_INSTANCE_NAME"

# Ensure gcloud is configured for the project
echo "=== Configuring Google Cloud project ==="
gcloud config set project $PROJECT_ID

# Get the Cloud SQL connection name
DB_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format='value(connectionName)')
echo "Cloud SQL Connection Name: $DB_CONNECTION_NAME"

# Generate a session secret
SESSION_SECRET=$(openssl rand -hex 32)

# Format the Cloud SQL URL correctly
CLOUD_SQL_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${DB_CONNECTION_NAME}"

# Create environment variables for deployment
ENV_VARS="DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME},"
ENV_VARS+="CLOUD_SQL_URL=${CLOUD_SQL_URL},"
ENV_VARS+="CLOUD_SQL_CONNECTION_NAME=${DB_CONNECTION_NAME},"
ENV_VARS+="DB_USER=${DB_USER},"
ENV_VARS+="DB_PASSWORD=${DB_PASSWORD},"
ENV_VARS+="DB_NAME=${DB_NAME},"
ENV_VARS+="NODE_ENV=production,"
ENV_VARS+="USE_CLOUD_SQL=true,"
ENV_VARS+="PORT=8080,"
ENV_VARS+="HOST=0.0.0.0,"
ENV_VARS+="SESSION_SECRET=${SESSION_SECRET}"

echo "Environment variables for deployment:"
echo "CLOUD_SQL_CONNECTION_NAME=${DB_CONNECTION_NAME}"
echo "We're using the pre-existing image: gcr.io/imposing-elixir-440911-u9/skillmetricspro2:latest"

# Deploy to Cloud Run with Cloud SQL connection
echo "=== Deploying to Cloud Run ==="

# Check if service already exists
if gcloud run services describe $SERVICE_NAME --region=$REGION --platform=managed &>/dev/null; then
  echo "Updating existing Cloud Run service: $SERVICE_NAME"
  
  # For existing service, we must use update and set commands separately
  gcloud run services update $SERVICE_NAME \
    --image gcr.io/imposing-elixir-440911-u9/skillmetricspro2:latest \
    --platform managed \
    --region $REGION
  
  # Update service with Cloud SQL instance
  gcloud run services update $SERVICE_NAME \
    --add-cloudsql-instances $DB_CONNECTION_NAME \
    --update-env-vars "$ENV_VARS" \
    --platform managed \
    --region $REGION
    
  echo "Service updated successfully"
else
  echo "Creating new Cloud Run service: $SERVICE_NAME"
  
  # For new service, we can set everything at once
  gcloud run deploy $SERVICE_NAME \
    --image gcr.io/imposing-elixir-440911-u9/skillmetricspro2:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --add-cloudsql-instances $DB_CONNECTION_NAME \
    --update-env-vars "$ENV_VARS" \
    --cpu=1 \
    --memory=1Gi \
    --min-instances=0 \
    --max-instances=10 \
    --timeout=300s
fi

# Verify the deployment was successful
if ! gcloud run services describe $SERVICE_NAME --region=$REGION --platform=managed &>/dev/null; then
  echo "Error: Failed to deploy service to Cloud Run."
  exit 1
fi

# Get the URL of the deployed service
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format='value(status.url)')
echo "=== Deployment complete! ==="
echo "Your application is available at: $SERVICE_URL"
echo "Cloud SQL Instance: $DB_INSTANCE_NAME"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Password has been set and stored in environment variables."

echo "=== Next steps ==="
echo "1. Initialize the database schema and test data using the setup script"