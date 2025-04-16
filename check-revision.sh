#!/bin/bash

# Script to check a specific revision 
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
REVISION_NAME="skills-management-app-00002-85f"

echo "===== CHECKING REVISION $REVISION_NAME ====="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "==========================================="

# 1. Authenticate with GCP
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json

# 2. Check revision status
echo "2. Checking revision details..."
gcloud run revisions describe $REVISION_NAME \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID

# 3. Check logs for the specific revision
echo "3. Getting logs for the revision..."
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME AND resource.labels.revision_name=$REVISION_NAME" \
  --project $PROJECT_ID \
  --limit=10 \
  --format="table(timestamp,severity,textPayload)"