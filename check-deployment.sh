#!/bin/bash
# Script to check the deployment status of a Cloud Run service

set -e
echo "===== CHECKING CLOUD RUN DEPLOYMENT STATUS ====="

# Set variables
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"

echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "===========================================" 

# Step 1: Authenticate
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json --project=$PROJECT_ID

# Step 2: Get service status
echo "2. Getting service status..."
SERVICE_STATUS=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --format="yaml" \
  --project=$PROJECT_ID 2>/dev/null || echo "Service not found")

if [[ $SERVICE_STATUS == *"Service not found"* ]]; then
  echo "⚠️ Service not deployed yet."
  exit 1
fi

# Step 3: Get service URL
echo "3. Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --format="value(status.url)" \
  --project=$PROJECT_ID)

if [ -z "$SERVICE_URL" ]; then
  echo "⚠️ Service URL not available."
  exit 1
fi

echo "Service URL: $SERVICE_URL"

# Step 4: Check if service is responding
echo "4. Checking service health..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL/api/health 2>/dev/null || echo "Failed")

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ Health check successful (HTTP $HTTP_CODE)"
  echo "Service is running properly"
else
  echo "⚠️ Health check returned HTTP $HTTP_CODE"
  echo "Service may not be fully operational"
fi

# Step 5: Check service traffic assignments
echo "5. Checking traffic assignments..."
TRAFFIC=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --format="value(status.traffic)" \
  --project=$PROJECT_ID)

echo "Traffic assignment: $TRAFFIC"

# Step 6: Get latest deployment logs
echo "6. Getting latest logs..."
echo "Recent logs (last 5 entries):"
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
  --project=$PROJECT_ID \
  --limit=5 \
  --format="table(timestamp,textPayload,jsonPayload.message)"

echo ""
echo "===== CHECK COMPLETED ====="
echo "Service URL: $SERVICE_URL"
