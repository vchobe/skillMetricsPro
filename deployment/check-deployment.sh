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
  
  # Extract additional database information if available
  if [[ $HEALTH_CHECK == *"\"database_info\""* ]]; then
    echo "Database information:"
    echo "$HEALTH_CHECK" | grep -o '"database_info":{[^}]*}' | sed 's/"database_info"://;s/{//;s/}//;s/,/\n/g;s/"//g'
  fi
else
  echo "❌ Database connection failed!"
  
  # Check for environment variables related to database connection
  echo "Checking Cloud Run environment variables..."
  
  # Check if environment variables are set for the service (without showing values)
  ENV_VARS=$(gcloud run services describe $SERVICE_NAME --region=$REGION --platform=managed --format="value(spec.template.spec.containers[0].env)" 2>/dev/null || echo "")
  
  # List of database-related environment variables to check
  DB_ENV_VARS=("DATABASE_URL" "CLOUD_SQL_URL" "CLOUD_SQL_CONNECTION_NAME" "DB_USER" "DB_NAME" "USE_CLOUD_SQL")
  
  for VAR in "${DB_ENV_VARS[@]}"; do
    if [[ "$ENV_VARS" == *"$VAR"* ]]; then
      echo "✅ $VAR is set"
    else
      echo "❌ $VAR is missing"
    fi
  done
  
  # Check Cloud SQL connection
  if [[ "$ENV_VARS" == *"CLOUD_SQL_CONNECTION_NAME"* ]]; then
    # Extract the connection name if possible
    SQL_CONN=$(echo "$ENV_VARS" | grep -o "CLOUD_SQL_CONNECTION_NAME:[^,]*" | cut -d':' -f2- | tr -d ' ')
    if [ -n "$SQL_CONN" ]; then
      echo "Cloud SQL connection name: $SQL_CONN"
      # Check if connection name matches the DB instance
      EXPECTED_CONN=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)" 2>/dev/null || echo "")
      if [ -n "$EXPECTED_CONN" ] && [ "$SQL_CONN" == "$EXPECTED_CONN" ]; then
        echo "✅ Cloud SQL connection name matches the instance"
      else
        echo "❌ Cloud SQL connection name mismatch"
        echo "Expected: $EXPECTED_CONN"
        echo "Actual: $SQL_CONN"
      fi
    fi
  fi
fi

# Check latest logs
echo -e "\n=== Recent application logs ==="
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" --limit=10 --format="table(timestamp, textPayload, severity)" --order="desc"

# Check Google Cloud SQL instance status
echo -e "\n=== Cloud SQL instance status ==="
gcloud sql instances describe $DB_INSTANCE_NAME --format="table(name, state, settings.tier, settings.activationPolicy, gceZone, ipAddresses)"

# Check Docker image details
echo -e "\n=== Docker image details ==="
IMAGE_URL="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"
echo "Image URL: $IMAGE_URL"

# Check if image exists
if gcloud container images describe $IMAGE_URL > /dev/null 2>&1; then
  echo "✅ Docker image exists"
  
  # Show image details
  echo "Image details:"
  gcloud container images describe $IMAGE_URL --format="table(image_summary.fully_qualified_digest, image_summary.digest, image_summary.tags, image_summary.mediaType)"
  
  # Show when the image was last pushed
  echo -e "\nImage creation time:"
  gcloud container images describe $IMAGE_URL --format="value(image_summary.uploadTime)"
  
  # Get image digest
  IMAGE_DIGEST=$(gcloud container images describe $IMAGE_URL --format="value(image_summary.digest)")
  
  # Show image layers and config to diagnose potential issues
  echo -e "\nImage structure analysis:"
  echo "Checking image configuration and layers..."
  
  # Try to get manifest (requires proper authentication)
  MANIFEST=$(gcloud container images describe --format=json "$IMAGE_URL@$IMAGE_DIGEST" 2>/dev/null || echo "")
  
  if [ -n "$MANIFEST" ]; then
    # Count layers
    LAYER_COUNT=$(echo "$MANIFEST" | grep -o '"layers":' | wc -l)
    echo "Image has $LAYER_COUNT layers"
    
    # Check entry point
    CMD=$(echo "$MANIFEST" | grep -o '"Cmd":\[[^]]*\]' || echo "Not found")
    ENTRYPOINT=$(echo "$MANIFEST" | grep -o '"Entrypoint":\[[^]]*\]' || echo "Not found")
    
    echo "Image command: $CMD"
    echo "Image entrypoint: $ENTRYPOINT"
    
    # Check Working Directory
    WORKDIR=$(echo "$MANIFEST" | grep -o '"WorkingDir":"[^"]*"' | sed 's/"WorkingDir":"//;s/"//')
    echo "Working directory: $WORKDIR"
    
    # Extract environment variables
    echo "Environment variables (first 5):"
    echo "$MANIFEST" | grep -o '"Env":\[[^]]*\]' | tr ',' '\n' | head -n 5
  else
    echo "Could not retrieve detailed manifest information (requires authentication)"
  fi
  
  # Check if the image is being used by the deployed service
  DEPLOYED_IMAGE=$(gcloud run services describe $SERVICE_NAME --region=$REGION --platform=managed --format="value(spec.template.spec.containers[0].image)")
  if [ "$DEPLOYED_IMAGE" == "$IMAGE_URL" ]; then
    echo "✅ Deployed service is using this image"
  else
    echo "⚠️ Warning: Deployed service is using a different image: $DEPLOYED_IMAGE"
  fi
  
else
  echo "❌ Docker image not found!"
  echo "The image $IMAGE_URL does not exist."
  echo "Check build logs with: gcloud builds list --limit=5 --format='table(id, createTime, status)'"
  echo "For a specific build, use: gcloud builds log <build-id>"
fi

echo -e "\n=== Deployment check complete ==="
echo "If you're experiencing issues, consider the following steps:"
echo "1. Check the full application logs to identify errors:"
echo "   gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\""
echo "2. Ensure Cloud SQL Admin API is enabled:"
echo "   gcloud services enable sqladmin.googleapis.com"
echo "3. Verify Cloud Run service account has appropriate Cloud SQL access"
echo "4. Check for network connectivity issues"
echo "5. Verify environment variables are correctly set"
echo "6. Debug Docker image issues:"
echo "   - Check Cloud Build logs: gcloud builds list"
echo "   - Inspect the image locally: docker pull $IMAGE_URL && docker inspect $IMAGE_URL"
echo "   - Test the image locally: docker run --rm $IMAGE_URL ls -la /app"