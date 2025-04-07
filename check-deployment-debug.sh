#!/bin/bash
set -e

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"

echo -e "${YELLOW}Checking deployment status for ${SERVICE_NAME}...${NC}"

# Get service info
echo -e "${YELLOW}Service Configuration:${NC}"
gcloud run services describe ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID}

# Get recent revisions
echo -e "\n${YELLOW}Recent Revisions:${NC}"
gcloud run revisions list --service=${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --limit=3

# Fetch detailed logs for the service
echo -e "\n${YELLOW}Service Logs (last 20 entries):${NC}"
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}" --project=${PROJECT_ID} --limit=20 --format="table(timestamp, severity, textPayload)"

# Get revision-specific logs for the latest revision
LATEST_REVISION=$(gcloud run revisions list --service=${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --limit=1 --format="value(metadata.name)")

if [ -n "$LATEST_REVISION" ]; then
  echo -e "\n${YELLOW}Detailed Logs for Latest Revision (${LATEST_REVISION}):${NC}"
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME} AND resource.labels.revision_name=${LATEST_REVISION}" --project=${PROJECT_ID} --limit=30 --format="table(timestamp, severity, textPayload)"
else
  echo -e "\n${RED}Could not determine latest revision.${NC}"
fi

# Provide URL for the service
echo -e "\n${YELLOW}Service URL:${NC}"
URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --format="value(status.url)")
echo -e "${GREEN}${URL}${NC}"

echo -e "\n${YELLOW}Testing service with curl:${NC}"
curl -v ${URL} || echo -e "${RED}Failed to connect to service${NC}"

echo -e "\n${YELLOW}Deployment Debug Complete${NC}"
