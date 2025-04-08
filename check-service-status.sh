#!/bin/bash
set -e

# Project settings
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"

# Authenticate with service account
echo "Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json

echo "===== CHECKING CLOUD RUN SERVICE STATUS ====="
echo "Project ID: ${PROJECT_ID}"
echo "Service Name: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo "===========================================\n"

# Get service info
echo "Getting service information..."
SERVICE_INFO=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format="json")

# Extract key data
SERVICE_URL=$(echo $SERVICE_INFO | jq -r .status.url)
LATEST_REVISION=$(echo $SERVICE_INFO | jq -r .status.latestReadyRevisionName)
TRAFFIC_TARGET=$(echo $SERVICE_INFO | jq -r '.status.traffic[0].revisionName')
LATEST_CREATED=$(echo $SERVICE_INFO | jq -r '.status.latestCreatedRevisionName')

echo "Service URL: ${SERVICE_URL}"
echo "Latest Ready Revision: ${LATEST_REVISION}"
echo "Latest Created Revision: ${LATEST_CREATED}"
echo "Traffic Target: ${TRAFFIC_TARGET}"
echo ""

# Check if traffic is directed to the latest revision
if [[ "${TRAFFIC_TARGET}" != "${LATEST_REVISION}" ]]; then
  echo "⚠️ Warning: Traffic is not directed to the latest revision"
  echo "   Traffic is pointing to: ${TRAFFIC_TARGET}"
  echo "   Latest ready revision is: ${LATEST_REVISION}"
else
  echo "✅ Traffic is directed to the latest revision"
fi

# Get revision status
echo ""
echo "Checking revision status..."
REVISION_STATUS=$(gcloud run revisions describe ${LATEST_REVISION} --platform managed --region ${REGION} --format="json")
READY_CONDITION=$(echo $REVISION_STATUS | jq -r '.status.conditions[] | select(.type=="Ready")')
READY_STATUS=$(echo $READY_CONDITION | jq -r '.status')
READY_MESSAGE=$(echo $READY_CONDITION | jq -r '.message')

echo "Latest Revision Status: ${READY_STATUS}"
if [[ -n "${READY_MESSAGE}" ]]; then
  echo "Status Message: ${READY_MESSAGE}"
fi

if [[ "${READY_STATUS}" == "True" ]]; then
  echo "✅ Revision is ready"
else
  echo "❌ Revision is not ready"
fi

# Check health endpoint
echo ""
echo "Checking service health endpoint..."
HEALTH_CHECK_URL="${SERVICE_URL}/api/health"
echo "Health endpoint: ${HEALTH_CHECK_URL}"

HEALTH_RESPONSE=$(curl -s ${HEALTH_CHECK_URL} || echo '{"status":"failed"}')
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${HEALTH_CHECK_URL} || echo "failed")

echo "HTTP Status: ${HTTP_STATUS}"
echo "Response: ${HEALTH_RESPONSE}"

if [[ "${HTTP_STATUS}" == "200" ]]; then
  echo "✅ Health check successful"
else
  echo "❌ Health check failed"
fi

# Get logs from the latest revision
echo ""
echo "Fetching recent logs..."
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME} AND resource.labels.revision_name=${LATEST_REVISION}" --limit=10 --format="table(timestamp, textPayload)"

echo ""
echo "===== SERVICE STATUS CHECK COMPLETE ====="