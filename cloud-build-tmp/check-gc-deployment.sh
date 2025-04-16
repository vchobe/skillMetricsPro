#!/bin/bash

# Script to check Google Cloud Run deployment status and diagnose issues
echo "===== CHECKING GOOGLE CLOUD RUN DEPLOYMENT ====="
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"

echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME" 
echo "Region: $REGION"
echo "==========================================="

# 1. Authenticate with GCP
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json

# 2. Check service status
echo "2. Checking service status..."
gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID

# 3. Get detailed service logs
echo "3. Getting detailed service logs..."
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
  --project $PROJECT_ID \
  --limit=20 \
  --format="table(timestamp,severity,textPayload)" \
  --freshness=1d

# 4. List all revisions
echo "4. Listing all revisions..."
gcloud run revisions list \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --service $SERVICE_NAME

# 5. Print deployment recommendations
echo ""
echo "===== DEPLOYMENT DIAGNOSTICS ====="
echo "If the service is failing to start, check the following:"
echo "1. Ensure the application listens on the PORT environment variable (8080)"
echo "2. Verify the startup probe is connecting to the correct port"
echo "3. Check that the application has the required dependencies installed"
echo "4. Confirm the database connection string is configured correctly"
echo "5. Try increasing the startup timeout to give the application more time to start"
echo ""
echo "Command to deploy with increased timeout:"
echo "gcloud run deploy $SERVICE_NAME --image=[YOUR-IMAGE] --platform managed --region $REGION --timeout=5m --cpu=1 --memory=1Gi"