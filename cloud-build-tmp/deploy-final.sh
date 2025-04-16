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
IMAGE_NAME="skillmetricspro6"
SERVICE_ACCOUNT="skillmetrics-service-account@${PROJECT_ID}.iam.gserviceaccount.com"
SESSION_SECRET="generated-session-secret-for-production-environment"

echo -e "${YELLOW}Starting deployment process for ${SERVICE_NAME}...${NC}"

# 1. Submit build to Cloud Build
echo -e "${YELLOW}Submitting build to Cloud Build...${NC}"
gcloud builds submit --config=cloudbuild.yaml \
  --project=${PROJECT_ID} \
  --substitutions=_SESSION_SECRET="${SESSION_SECRET}"

# 2. Wait for build to complete
echo -e "${YELLOW}Waiting for build to complete...${NC}"
sleep 10

# 3. Check service status to see if it's running
echo -e "${YELLOW}Checking service status...${NC}"
gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --format="value(status.url)" || echo -e "${RED}Service not found or error in checking status${NC}"

# 4. Verify the latest revision status
echo -e "${YELLOW}Latest revision status:${NC}"
gcloud run revisions list \
  --service=${SERVICE_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --limit=1 \
  --format="table(metadata.name, status.conditions.type, status.conditions.status, status.conditions.message)"

# 5. Check logs for errors
echo -e "${YELLOW}Checking logs for errors:${NC}"
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME} AND severity>=ERROR" \
  --project=${PROJECT_ID} \
  --limit=10 \
  --format="table(timestamp, severity, textPayload)"

# 6. Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --format="value(status.url)")

if [ -n "$SERVICE_URL" ]; then
  echo -e "${GREEN}Service deployed successfully!${NC}"
  echo -e "${GREEN}Service URL: ${SERVICE_URL}${NC}"
  
  # 7. Test the service with curl
  echo -e "${YELLOW}Testing service with curl...${NC}"
  curl -v ${SERVICE_URL} || echo -e "${RED}Failed to connect to service${NC}"
else
  echo -e "${RED}Service URL not available. Deployment may have failed.${NC}"
fi

echo -e "${YELLOW}Deployment process completed.${NC}"
echo -e "${YELLOW}Run ./check-deployment-debug.sh for detailed diagnostics if needed.${NC}"
