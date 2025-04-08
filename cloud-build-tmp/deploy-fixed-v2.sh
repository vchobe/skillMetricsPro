#!/bin/bash
# Comprehensive deployment script for Google Cloud Run with robust error handling
# This script addresses Cloud Run port configuration issues and ensures database connectivity

set -eo pipefail  # Exit on any error and pipe failures

# Configuration - use environment variables if available, otherwise use defaults
PROJECT_ID="${GCP_PROJECT_ID:-imposing-elixir-440911-u9}"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/skillmetricspro2-fixed-v2:$(date +%Y%m%d-%H%M%S)"

# Database configuration - never print the actual connection string
DB_URL_EXISTS="$(if [[ -n "${DATABASE_URL}" ]]; then echo "yes"; else echo "no"; fi)"
DB_HOSTNAME="$(echo "${DATABASE_URL}" | sed -E 's|.*@([^:]+):.*|\1|' 2>/dev/null || echo "unknown")"

echo "===== CLOUD RUN DEPLOYMENT WITH FIXED CONFIGURATION ====="
echo "Project ID: ${PROJECT_ID}"
echo "Service: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo "Image: ${IMAGE_NAME}"
echo "Database available: ${DB_URL_EXISTS}"
echo "Database hostname: ${DB_HOSTNAME}"
echo "============================================================"

# Verify required environment variables
if [[ -z "${GCP_SERVICE_ACCOUNT}" ]]; then
  echo "ERROR: GCP_SERVICE_ACCOUNT environment variable is not set"
  echo "Please make sure this secret is available"
  exit 1
fi

if [[ "${DB_URL_EXISTS}" == "no" ]]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  echo "Please make sure this secret is available"
  exit 1
fi

# Step 1: Create service account key file
echo "1. Creating service account key file..."
echo "${GCP_SERVICE_ACCOUNT}" > service-account-key.json
if [[ ! -s service-account-key.json ]]; then
  echo "ERROR: Failed to create service account key file"
  exit 1
fi
echo "✅ Service account key file created"

# Step 2: Authenticate with Google Cloud
echo "2. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json
gcloud config set project ${PROJECT_ID}
echo "✅ Authentication successful"

# Step 3: Create explicit Cloud Run Dockerfile
echo "3. Creating Cloud Run optimized Dockerfile..."
cat > Dockerfile.cloudrun << 'EOF'
FROM node:20-slim

# Set environment variables - hardcoded values for Cloud Run
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy package files for better layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Check that dist/index.js exists after build
RUN if [ ! -f dist/index.js ]; then \
      echo "ERROR: dist/index.js not found after build" && \
      exit 1; \
    fi

# Modify server code to log more debugging information
RUN sed -i 's/console.log(`Server running on port \${port}`)/console.log(`Server running at http:\/\/${host}:${port} with NODE_ENV=${process.env.NODE_ENV}`)/' dist/index.js || true

# Create a health check script
RUN echo '#!/bin/bash' > /usr/src/app/healthcheck.sh && \
    echo 'curl -f http://localhost:8080/api/health || exit 1' >> /usr/src/app/healthcheck.sh && \
    chmod +x /usr/src/app/healthcheck.sh

# Expose port 8080 explicitly
EXPOSE 8080

# Use direct command to start the server - no shell script wrapper
CMD ["node", "dist/index.js"]
EOF
echo "✅ Cloud Run Dockerfile created"

# Step 4: Build the container
echo "4. Building container image..."
# Create a temporary build directory
mkdir -p cloud-build-tmp
cp Dockerfile.cloudrun cloud-build-tmp/Dockerfile
cp -r . cloud-build-tmp/
cd cloud-build-tmp
gcloud builds submit --tag=${IMAGE_NAME} --timeout=15m
cd ..
rm -rf cloud-build-tmp
echo "✅ Container build successful"

# Step 5: Deploy to Cloud Run with database configuration
echo "5. Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --port 8080 \
  --set-env-vars "NODE_ENV=production,HOST=0.0.0.0,DATABASE_URL=${DATABASE_URL}" \
  --memory 1Gi \
  --cpu 1 \
  --allow-unauthenticated \
  --timeout=10m

# Step 6: Verify deployment
echo "6. Verifying deployment..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format="value(status.url)")

if [[ -n "${SERVICE_URL}" ]]; then
  echo "✅ Service deployed successfully at: ${SERVICE_URL}"
  
  # Wait for the service to initialize
  echo "   Waiting 15 seconds for service to initialize..."
  sleep 15
  
  # Check if service health endpoint is available
  echo "   Checking service health..."
  HEALTH_CHECK_URL="${SERVICE_URL}/api/health"
  echo "   Health endpoint: ${HEALTH_CHECK_URL}"
  
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${HEALTH_CHECK_URL} || echo "failed")
  
  if [[ "${HTTP_STATUS}" == "200" ]]; then
    echo "✅ Health check successful"
    echo ""
    echo "===== DEPLOYMENT SUCCESSFUL ====="
    echo "Your application is now deployed and running at: ${SERVICE_URL}"
    echo ""
  else
    echo "⚠️ Health check returned status: ${HTTP_STATUS}"
    echo "Service is deployed, but may not be fully functional yet."
    echo "Please check the logs in Google Cloud Console:"
    echo "https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/logs"
  fi
else
  echo "⚠️ Deployment completed but could not retrieve service URL."
  echo "Please check the Google Cloud Console for status:"
  echo "https://console.cloud.google.com/run"
fi