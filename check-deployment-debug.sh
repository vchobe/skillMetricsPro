#!/bin/bash
# Advanced debugging script for Cloud Run deployments

set -e
echo "===== DETAILED CLOUD RUN DEPLOYMENT DIAGNOSTICS ====="

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

# Step 2: Check if the service exists
echo "2. Checking if service exists..."
SERVICE_EXISTS=$(gcloud run services list \
  --platform managed \
  --region $REGION \
  --project=$PROJECT_ID \
  --format="value(metadata.name)" | grep -c "$SERVICE_NAME" || echo "0")

if [ "$SERVICE_EXISTS" == "0" ]; then
  echo "⚠️ Service '$SERVICE_NAME' does not exist in region '$REGION'"
  echo "Available services in region '$REGION':"
  gcloud run services list \
    --platform managed \
    --region $REGION \
    --project=$PROJECT_ID \
    --format="table(metadata.name,status.url)"
  exit 1
fi

# Step 3: Get detailed service configuration
echo "3. Getting detailed service configuration..."
gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project=$PROJECT_ID \
  --format="yaml"

# Step 4: Check latest revision status
echo "4. Checking latest revision status..."
LATEST_REVISION=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project=$PROJECT_ID \
  --format="value(status.latestCreatedRevisionName)")

echo "Latest revision: $LATEST_REVISION"

gcloud run revisions describe $LATEST_REVISION \
  --platform managed \
  --region $REGION \
  --project=$PROJECT_ID \
  --format="yaml"

# Step 5: Get service URL and test endpoints
echo "5. Testing service endpoints..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project=$PROJECT_ID \
  --format="value(status.url)")

if [ -z "$SERVICE_URL" ]; then
  echo "⚠️ Service URL not available."
  exit 1
fi

echo "Service URL: $SERVICE_URL"

# Test multiple health endpoints
for endpoint in "/health" "/status" "/api/health"; do
  echo "Testing endpoint: $endpoint"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL$endpoint 2>/dev/null || echo "Failed")
  
  if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Endpoint $endpoint: HTTP $HTTP_CODE (Success)"
  else
    echo "⚠️ Endpoint $endpoint: HTTP $HTTP_CODE (Failed)"
    
    # Show response for failed endpoints
    echo "Response content:"
    curl -s $SERVICE_URL$endpoint || echo "No response received"
  fi
done

# Step 6: Get detailed logs with error filtering
echo "6. Checking for errors in logs..."
echo "Recent error logs (last 10 entries):"
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME AND severity>=ERROR" \
  --project=$PROJECT_ID \
  --limit=10 \
  --format="table(timestamp,severity,textPayload,jsonPayload.message)"

# Step 7: Check container startup logs
echo "7. Checking container startup logs..."
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME AND textPayload:('Starting container' OR 'Container failed')" \
  --project=$PROJECT_ID \
  --limit=5 \
  --format="table(timestamp,textPayload)"

echo ""
echo "===== DIAGNOSTICS COMPLETED ====="
echo ""
echo "If you're experiencing issues, check:"
echo "1. The PORT environment variable is set to 8080 in your deployment config"
echo "2. Your server listens on 0.0.0.0 (not localhost)"
echo "3. Your server has a health check endpoint at /health, /status, or /api/health"
echo "4. Your service account has sufficient permissions"
echo ""
echo "For more logs, run:"
echo "gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\" --project=$PROJECT_ID --limit=20"
