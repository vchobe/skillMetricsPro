#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"

echo -e "${YELLOW}Checking recent builds...${NC}"
gcloud builds list --limit=5 --project=$PROJECT_ID

echo -e "\n${YELLOW}Checking Cloud Run service status...${NC}"
gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID

echo -e "\n${YELLOW}Checking service URL...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format='value(status.url)')

if [ -n "$SERVICE_URL" ]; then
  echo -e "${GREEN}Service URL: $SERVICE_URL${NC}"
  
  echo -e "\n${YELLOW}Testing service with a simple request...${NC}"
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL")
  
  if [ "$HTTP_STATUS" == "200" ]; then
    echo -e "${GREEN}Service is responding with HTTP 200 OK!${NC}"
  else
    echo -e "${RED}Service is responding with HTTP $HTTP_STATUS${NC}"
  fi
else
  echo -e "${RED}No service URL found. The service might not be deployed or might be having issues.${NC}"
fi

echo -e "\n${YELLOW}Checking service logs (last 10 entries)...${NC}"
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" --limit=10 --project=$PROJECT_ID

echo -e "\n${YELLOW}Deployment monitoring complete!${NC}"
echo -e "To access the service in production, use: ${GREEN}$SERVICE_URL${NC}"