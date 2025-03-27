#!/bin/bash
set -e

# Configuration
PROJECT_ID="skills-management-platform"  # Replace with your GCP project ID
REGION="us-central1"                     # GCP region
SERVICE_NAME="skills-management-app"     # Cloud Run service name
DB_INSTANCE_NAME="skills-management-db"  # Cloud SQL instance name

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format='value(status.url)')
if [ -z "$SERVICE_URL" ]; then
  echo "Error: Could not retrieve service URL. Make sure the service exists and you have appropriate permissions."
  exit 1
fi

echo "=== Checking deployment status for $SERVICE_NAME ==="
echo "Service URL: $SERVICE_URL"

# Check if service is responsive
echo -e "\n=== Checking if service is responsive ==="
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL)
if [[ $HTTP_STATUS -ge 200 && $HTTP_STATUS -lt 300 ]]; then
  echo "✅ Service responded with HTTP status: $HTTP_STATUS"
else
  echo "❌ Service responded with HTTP status: $HTTP_STATUS"
  echo "Service may not be fully deployed or is experiencing issues."
fi

# Check application health endpoint
echo -e "\n=== Checking application health endpoint ==="
HEALTH_CHECK=$(curl -s ${SERVICE_URL}/api/health)
if [[ $HEALTH_CHECK == *"\"status\":\"ok\""* ]]; then
  echo "✅ Health check passed!"
  echo "Health check response:"
  echo "$HEALTH_CHECK" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_CHECK"
else
  echo "❌ Health check failed!"
  echo "Health check response:"
  echo "$HEALTH_CHECK" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_CHECK"
fi

# Check database connection
echo -e "\n=== Checking database connection ==="
if [[ $HEALTH_CHECK == *"\"database\":\"connected\""* ]]; then
  echo "✅ Database connection successful"
  DB_TYPE=$(echo $HEALTH_CHECK | grep -o '"connection_type":"[^"]*"' | sed 's/"connection_type":"//;s/"//')
  echo "Database connection type: $DB_TYPE"
else
  echo "❌ Database connection failed!"
fi

# Check latest logs
echo -e "\n=== Recent application logs ==="
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" --limit=10 --format="table(timestamp, textPayload, severity)" --order="desc"

# Check Google Cloud SQL instance status
echo -e "\n=== Cloud SQL instance status ==="
gcloud sql instances describe $DB_INSTANCE_NAME --format="table(name, state, settings.tier, settings.activationPolicy, gceZone, ipAddresses)"

echo -e "\n=== Deployment check complete ==="
echo "If you're experiencing issues, consider the following steps:"
echo "1. Check the full application logs to identify errors:"
echo "   gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\""
echo "2. Ensure Cloud SQL Admin API is enabled:"
echo "   gcloud services enable sqladmin.googleapis.com"
echo "3. Verify Cloud Run service account has appropriate Cloud SQL access"
echo "4. Check for network connectivity issues"
echo "5. Verify environment variables are correctly set"