#!/bin/bash
# Detailed deployment status checker
# This script provides comprehensive debugging information for Cloud Run deployments

set -e  # Exit on error

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-imposing-elixir-440911-u9}"
SERVICE_NAME="skills-management-app"
REGION="us-central1"

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===== CLOUD RUN DEPLOYMENT HEALTH CHECK =====${NC}"
echo "Project ID: ${PROJECT_ID}"
echo "Service: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo ""

# Step 1: Authenticate with Google Cloud
echo "1. Authenticating with Google Cloud..."
if [[ -z "${GCP_SERVICE_ACCOUNT}" ]]; then
  echo -e "${RED}ERROR: GCP_SERVICE_ACCOUNT environment variable is not set${NC}"
  exit 1
fi

echo "${GCP_SERVICE_ACCOUNT}" > service-account-key.json
gcloud auth activate-service-account --key-file=service-account-key.json
gcloud config set project ${PROJECT_ID}
echo -e "${GREEN}✓ Authentication successful${NC}"
echo ""

# Step 2: Check service status
echo "2. Checking service status..."
SERVICE_INFO=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format=json 2>/dev/null || echo '{"error": "service not found"}')

if [[ "$SERVICE_INFO" == *"error"* ]]; then
  echo -e "${RED}ERROR: Service not found${NC}"
  echo "Please make sure the service name and region are correct."
  exit 1
fi

SERVICE_URL=$(echo $SERVICE_INFO | jq -r '.status.url' 2>/dev/null || echo "unknown")
SERVICE_CONDITIONS=$(echo $SERVICE_INFO | jq -r '.status.conditions' 2>/dev/null || echo "[]")
LATEST_READY=$(echo $SERVICE_CONDITIONS | jq -r '.[] | select(.type=="Ready") | .status' 2>/dev/null || echo "unknown")
LATEST_MESSAGE=$(echo $SERVICE_CONDITIONS | jq -r '.[] | select(.type=="Ready") | .message' 2>/dev/null || echo "No status message available")

echo "Service URL: ${SERVICE_URL}"
echo "Ready status: ${LATEST_READY}"
echo "Status message: ${LATEST_MESSAGE}"
echo ""

# Step 3: Check latest revision
echo "3. Checking latest revision..."
LATEST_REVISION=$(gcloud run revisions list --service=${SERVICE_NAME} --region=${REGION} --format="value(metadata.name)" 2>/dev/null | head -1 || echo "unknown")

if [[ "$LATEST_REVISION" == "unknown" ]]; then
  echo -e "${RED}ERROR: Could not retrieve latest revision${NC}"
else
  echo "Latest revision: ${LATEST_REVISION}"
  
  # Get detailed revision info
  REVISION_INFO=$(gcloud run revisions describe ${LATEST_REVISION} --region=${REGION} --format=json 2>/dev/null)
  REVISION_CONDITIONS=$(echo $REVISION_INFO | jq -r '.status.conditions' 2>/dev/null || echo "[]")
  
  # Extract container status
  CONTAINER_CONDITIONS=$(echo $REVISION_INFO | jq -r '.status.conditions[] | select(.type=="ContainerHealthy")' 2>/dev/null || echo "{}")
  CONTAINER_STATUS=$(echo $CONTAINER_CONDITIONS | jq -r '.status' 2>/dev/null || echo "unknown")
  CONTAINER_MESSAGE=$(echo $CONTAINER_CONDITIONS | jq -r '.message' 2>/dev/null || echo "No container message available")
  
  echo "Container health: ${CONTAINER_STATUS}"
  echo "Container message: ${CONTAINER_MESSAGE}"
  
  # Extract resource allocation
  ALLOCATED_MEMORY=$(echo $REVISION_INFO | jq -r '.spec.containers[0].resources.limits.memory' 2>/dev/null || echo "unknown")
  ALLOCATED_CPU=$(echo $REVISION_INFO | jq -r '.spec.containers[0].resources.limits.cpu' 2>/dev/null || echo "unknown")
  
  echo "Allocated memory: ${ALLOCATED_MEMORY}"
  echo "Allocated CPU: ${ALLOCATED_CPU}"
  
  # Check environment variables
  ENV_VARS=$(echo $REVISION_INFO | jq -r '.spec.containers[0].env[]?.name' 2>/dev/null || echo "None")
  echo "Environment variables set: "
  for VAR in $ENV_VARS; do
    echo "  - ${VAR}"
  done
fi
echo ""

# Step 4: Check logs
echo "4. Retrieving logs for troubleshooting..."
echo "(Last 20 log entries)"
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME} AND resource.labels.location=${REGION}" --limit=20 --format="table(timestamp, severity, textPayload)" 2>/dev/null || echo "Could not retrieve logs"
echo ""

# Step 5: Check health endpoint
echo "5. Checking health endpoint..."
if [[ "$SERVICE_URL" != "unknown" ]]; then
  HEALTH_URL="${SERVICE_URL}/api/health"
  echo "Attempting to access: ${HEALTH_URL}"
  
  CURL_RESULT=$(curl -s -o /dev/null -w "%{http_code}" ${HEALTH_URL} 2>/dev/null || echo "failed")
  
  if [[ "$CURL_RESULT" == "200" ]]; then
    echo -e "${GREEN}Health endpoint returned 200 OK✓${NC}"
    echo "Full response:"
    curl -s ${HEALTH_URL}
    echo ""
  else
    echo -e "${RED}Health check failed with status: ${CURL_RESULT}${NC}"
    echo "Detailed response (if available):"
    curl -s ${HEALTH_URL} || echo "No response body"
  fi
else
  echo -e "${RED}Cannot check health endpoint - service URL unknown${NC}"
fi
echo ""

# Summary
echo "===== DEPLOYMENT STATUS SUMMARY ====="
if [[ "$LATEST_READY" == "True" && "$CURL_RESULT" == "200" ]]; then
  echo -e "${GREEN}✓ Service is deployed and healthy${NC}"
  echo "Service URL: ${SERVICE_URL}"
elif [[ "$LATEST_READY" == "True" ]]; then
  echo -e "${YELLOW}⚠ Service is deployed but health check failed${NC}"
  echo "Service URL: ${SERVICE_URL}"
  echo "Possible issues:"
  echo "- Application is not properly handling health checks"
  echo "- Database connection issues"
  echo "- Application crashed after startup"
else
  echo -e "${RED}✗ Service deployment has issues${NC}"
  echo "Please check the logs and status message for more details"
  echo "Status message: ${LATEST_MESSAGE}"
  echo "Container message: ${CONTAINER_MESSAGE}"
fi