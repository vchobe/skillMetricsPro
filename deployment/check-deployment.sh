#!/bin/bash
set -e

# Configuration
PROJECT_ID="skills-management-platform"  # Replace with your GCP project ID
REGION="us-central1"                     # GCP region
SERVICE_NAME="skills-management-app"     # Cloud Run service name
DB_INSTANCE_NAME="skills-management-db"  # Cloud SQL instance name

echo "=== Checking deployment status for Skills Management Platform ==="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo "Database Instance: $DB_INSTANCE_NAME"

# Check Cloud Run service status
echo "=== Cloud Run Service Status ==="
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format="table(status.url, status.conditions)"

# Check Cloud SQL instance status
echo "=== Cloud SQL Instance Status ==="
gcloud sql instances describe $DB_INSTANCE_NAME \
  --format="table(name, state, settings.tier, settings.availabilityType, settings.databaseVersion)"

# Check database status (requires database connection details)
echo "=== Database Check ==="
DB_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format='value(connectionName)')
echo "To check database status, connect using:"
echo "  cloud_sql_proxy -instances=$DB_CONNECTION_NAME=tcp:5432"
echo "  psql -h localhost -p 5432 -U [USERNAME] -d [DB_NAME]"

# Check API connectivity
echo "=== API Connectivity Test ==="
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
echo "Service URL: $SERVICE_URL"
echo "Testing connection to API..."
curl -s -o /dev/null -w "API Status: %{http_code}\n" $SERVICE_URL

echo ""
echo "=== Deployment Check Complete ==="
echo "For detailed logs, run: gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME'"