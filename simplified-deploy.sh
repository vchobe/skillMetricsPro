#!/bin/bash
set -e

# Project settings
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/skillmetricspro-fixed:latest"

# Authenticate with service account
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json

# Get DATABASE_URL from environment 
if [[ -z "${DATABASE_URL}" ]]; then
  echo "❌ DATABASE_URL environment variable is not set."
  echo "Please set it before running this script."
  exit 1
fi

echo "===== SIMPLIFIED DEPLOYMENT TO CLOUD RUN ====="
echo "Project ID: ${PROJECT_ID}"
echo "Service Name: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo "Image: ${IMAGE_NAME}"
echo "===========================================\n"

# STEP 1: Create a simple, reliable Dockerfile for Cloud Run
cat > Dockerfile.simple << EOF
FROM node:20-slim

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Install dependencies
RUN apt-get update && apt-get install -y curl && apt-get clean

# Set working directory
WORKDIR /app

# Copy package files for caching
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Build the app
RUN npm run build

# Create a startup script
RUN echo '#!/bin/bash' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'export PORT=8080' >> /app/start.sh && \
    echo 'export HOST=0.0.0.0' >> /app/start.sh && \
    echo 'node dist/index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose port 8080
EXPOSE 8080

# Use the startup script
CMD ["/app/start.sh"]
EOF

echo "✅ Simple Dockerfile created"

# STEP 2: Build the container image
echo "2. Building container image..."
gcloud builds submit --tag=${IMAGE_NAME} --timeout=15m

echo "✅ Container build submitted"

# STEP 3: Deploy to Cloud Run with essential settings
echo "3. Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --port 8080 \
  --set-env-vars "NODE_ENV=production,HOST=0.0.0.0,PORT=8080,DATABASE_URL=${DATABASE_URL}" \
  --memory 1Gi \
  --cpu 1 \
  --allow-unauthenticated \
  --timeout=10m \
  --no-cpu-throttling

echo "✅ Deployment command executed"

# STEP 4: Get service URL
echo "4. Getting service URL..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format="value(status.url)")

if [[ -n "${SERVICE_URL}" ]]; then
  echo "✅ Service deployed at: ${SERVICE_URL}"
  
  # Wait for the service to initialize
  echo "   Waiting 30 seconds for service to initialize..."
  sleep 30
  
  # Check health
  HEALTH_CHECK_URL="${SERVICE_URL}/api/health"
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${HEALTH_CHECK_URL} || echo "failed")
  
  if [[ "${HTTP_STATUS}" == "200" ]]; then
    echo "✅ Health check successful"
    echo ""
    echo "===== DEPLOYMENT SUCCESSFUL ====="
    echo "Your application is running at: ${SERVICE_URL}"
    echo ""
  else
    echo "⚠️ Health check returned status: ${HTTP_STATUS}"
    echo "Service may need more time to initialize."
  fi
else
  echo "⚠️ Deployment completed but could not retrieve service URL."
  echo "Please check the Google Cloud Console for status."
fi