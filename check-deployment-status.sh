#!/bin/bash
# Script to check Cloud Run deployment status

# Set configuration variables
PROJECT_ID="imposing-elixir-440911-u9"
REGION="us-central1"
SERVICE_NAME="skillmetrics"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Checking Cloud Run deployment status..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
  echo -e "${RED}Google Cloud SDK (gcloud) is not installed.${NC}"
  exit 1
fi

# Check if the user is authenticated
AUTHENTICATED=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)
if [ -z "$AUTHENTICATED" ]; then
  echo -e "${RED}Not authenticated with gcloud. Please run 'gcloud auth login'.${NC}"
  exit 1
fi

# Get the service URL and status
echo "Getting service details..."
SERVICE_INFO=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format json 2>/dev/null)

if [ $? -ne 0 ]; then
  echo -e "${RED}Service '$SERVICE_NAME' not found in region '$REGION'.${NC}"
  exit 1
fi

# Extract service details
SERVICE_URL=$(echo $SERVICE_INFO | jq -r '.status.url')
LATEST_REVISION=$(echo $SERVICE_INFO | jq -r '.status.latestReadyRevision')
TRAFFIC_TARGETS=$(echo $SERVICE_INFO | jq -r '.status.traffic')
REVISION_COUNT=$(echo $SERVICE_INFO | jq -r '.status.traffic | length')

echo -e "${GREEN}Service URL:${NC} $SERVICE_URL"
echo -e "${GREEN}Latest Revision:${NC} $LATEST_REVISION"
echo -e "${GREEN}Traffic Distribution:${NC}"
echo $TRAFFIC_TARGETS | jq -r '.[] | "  - " + (.revisionName // "latest") + ": " + (.percent|tostring) + "%"'

# Check service health
echo -e "\nChecking service health..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL/health)

if [ "$HEALTH_CHECK" == "200" ]; then
  echo -e "${GREEN}Health check passed (HTTP 200)${NC}"
else
  echo -e "${RED}Health check failed (HTTP $HEALTH_CHECK)${NC}"
fi

# Check recent logs
echo -e "\nRetrieving recent logs..."
RECENT_LOGS=$(gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" --limit 5 --format json)

# Check for errors in logs
ERROR_COUNT=$(echo $RECENT_LOGS | grep -c "Error\|Exception\|error\|exception")

if [ $ERROR_COUNT -gt 0 ]; then
  echo -e "${YELLOW}Found $ERROR_COUNT potential errors in recent logs.${NC}"
  echo "Log sample:"
  echo $RECENT_LOGS | jq -r '.[].textPayload' | head -n 10
else
  echo -e "${GREEN}No critical errors found in recent logs.${NC}"
fi

# Check database connection status (if available)
echo -e "\nChecking database connectivity..."
DB_CONNECTION=$(curl -s $SERVICE_URL/api/health/database)
DB_STATUS=$(echo $DB_CONNECTION | jq -r '.status // "unknown"')

if [ "$DB_STATUS" == "connected" ]; then
  echo -e "${GREEN}Database connection successful${NC}"
else
  echo -e "${YELLOW}Database connection status: $DB_STATUS${NC}"
  echo "Details:"
  echo $DB_CONNECTION | jq '.'
fi

echo -e "\n${GREEN}Deployment check completed.${NC}"