#!/bin/bash
set -e

# Project settings
SERVICE_URL="https://skills-management-app-59463544587.us-central1.run.app"

echo "==== CHECKING APP HEALTH ENDPOINT ===="
echo "Service URL: ${SERVICE_URL}"
echo "======================================="

# Check health endpoint
HEALTH_CHECK_URL="${SERVICE_URL}/api/health"
echo "Health endpoint: ${HEALTH_CHECK_URL}"

echo "Making request..."
HTTP_STATUS=$(curl -s -o response.json -w "%{http_code}" ${HEALTH_CHECK_URL})
echo "HTTP Status: ${HTTP_STATUS}"

if [[ "${HTTP_STATUS}" == "200" ]]; then
  echo "✅ Health check successful"
  echo "Response:"
  cat response.json | jq .
  echo ""

  # Extract useful info
  STATUS=$(cat response.json | jq -r '.status')
  DB_STATUS=$(cat response.json | jq -r '.database')
  DB_TYPE=$(cat response.json | jq -r '.connection_type')
  ENV=$(cat response.json | jq -r '.environment')
  SERVER_TIME=$(cat response.json | jq -r '.server_time')

  echo "==== HEALTH DETAILS ===="
  echo "Status: ${STATUS}"
  echo "Database: ${DB_STATUS}"
  echo "Connection Type: ${DB_TYPE}" 
  echo "Environment: ${ENV}"
  echo "Server Time: ${SERVER_TIME}"
  echo "======================="

  if [[ "${DB_STATUS}" == "connected" ]]; then
    echo "✅ Database connection OK"
  else
    echo "❌ Database connection failed"
  fi
else
  echo "❌ Health check failed with status: ${HTTP_STATUS}"
  
  if [[ -f response.json ]]; then
    echo "Response body:"
    cat response.json
  else
    echo "No response body received"
  fi
fi

# Clean up
rm -f response.json

# Also check server-status page
echo ""
echo "Checking server-status page..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/server-status")
echo "HTTP Status: ${HTTP_STATUS}"

if [[ "${HTTP_STATUS}" == "200" ]]; then
  echo "✅ Server status page is accessible"
else
  echo "❌ Server status page failed with status: ${HTTP_STATUS}"
fi

echo ""
echo "==== HEALTH CHECK COMPLETE ===="