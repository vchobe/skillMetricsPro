#!/bin/bash
set -e

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ID="imposing-elixir-440911-u9"
IMAGE_NAME="skillmetricspro3"
IMAGE_TAG="latest"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
SERVICE_ACCOUNT="skillmetrics-service-account@imposing-elixir-440911-u9.iam.gserviceaccount.com"
SESSION_SECRET="generated-session-secret-for-production-environment"

echo -e "${YELLOW}Starting deployment to Google Cloud Run...${NC}"

# Submit build to Cloud Build
echo -e "${YELLOW}Submitting build to Cloud Build...${NC}"
gcloud builds submit --config cloudbuild.yaml

# Wait a moment for the build to register
sleep 5

# List recent builds
echo -e "${YELLOW}Recent builds:${NC}"
gcloud builds list --limit=3

echo -e "${GREEN}Deployment process has been initiated!${NC}"
echo -e "${YELLOW}Note: The build and deployment will continue in Google Cloud.${NC}"
echo -e "${YELLOW}You can check the status of your service at:${NC}"
echo -e "${GREEN}https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/metrics?project=${PROJECT_ID}${NC}"
echo -e "${YELLOW}Once deployed, the service will be available at:${NC}"
echo -e "${GREEN}https://${SERVICE_NAME}-<hash>.${REGION}.run.app${NC}"