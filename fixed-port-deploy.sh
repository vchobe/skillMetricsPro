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

echo "===== STARTING FIXED PORT DEPLOYMENT TO CLOUD RUN ====="
echo "Project ID: ${PROJECT_ID}"
echo "Service Name: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo "Image: ${IMAGE_NAME}"
echo "===========================================\n"

# Create simplified Dockerfile for Cloud Run with fixed port
cat > Dockerfile.cloud-run-fixed << EOF
FROM node:20-slim

# Set environment variables for better Node.js performance in containers
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Install required system dependencies
RUN apt-get update && apt-get install -y \\
    curl \\
    ca-certificates \\
    && apt-get clean \\
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy package files for better layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Fix the port in index.ts to always use 8080 - FOR CLOUD RUN ONLY
RUN sed -i 's/const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;/const port = 8080;/g' server/index.ts
RUN sed -i 's/const host = process.env.HOST || "0.0.0.0";/const host = "0.0.0.0";/g' server/index.ts

# Build the application with clean environment
RUN npm run build

# Create startup script with health check and better debugging
RUN echo '#!/bin/bash' > /usr/src/app/start.sh && \\
    echo 'set -e' >> /usr/src/app/start.sh && \\
    echo '' >> /usr/src/app/start.sh && \\
    echo '# Print environment for debugging' >> /usr/src/app/start.sh && \\
    echo 'echo "==== CLOUD RUN CONTAINER STARTUP ====="' >> /usr/src/app/start.sh && \\
    echo 'echo "PORT: \$PORT"' >> /usr/src/app/start.sh && \\
    echo 'echo "NODE_ENV: \$NODE_ENV"' >> /usr/src/app/start.sh && \\
    echo 'echo "HOST: \$HOST"' >> /usr/src/app/start.sh && \\
    echo 'echo "DATABASE_URL exists: \$(if [ -n "\$DATABASE_URL" ]; then echo Yes; else echo No; fi)"' >> /usr/src/app/start.sh && \\
    echo 'echo "Current directory: \$(pwd)"' >> /usr/src/app/start.sh && \\
    echo 'echo "Dist directory contents:"' >> /usr/src/app/start.sh && \\
    echo 'ls -la dist || echo "No dist directory found"' >> /usr/src/app/start.sh && \\
    echo 'echo "=================================="' >> /usr/src/app/start.sh && \\
    echo '' >> /usr/src/app/start.sh && \\
    echo '# Start the server with explicitly hardcoded port and host' >> /usr/src/app/start.sh && \\
    echo 'echo "Starting server on 0.0.0.0:8080"' >> /usr/src/app/start.sh && \\
    echo 'export PORT=8080' >> /usr/src/app/start.sh && \\
    echo 'export HOST=0.0.0.0' >> /usr/src/app/start.sh && \\
    echo 'node dist/index.js' >> /usr/src/app/start.sh

# Make startup script executable
RUN chmod +x /usr/src/app/start.sh

# Expose the port that will be used by Cloud Run (explicitly set to 8080)
EXPOSE 8080

# Use the startup script as the entry point
CMD ["/usr/src/app/start.sh"]
EOF

echo "✅ Cloud Run Fixed Dockerfile created"

# Build the container
echo "2. Building container image..."
gcloud builds submit --tag=${IMAGE_NAME} --config=cloudbuild.yaml --substitutions=_DOCKERFILE="Dockerfile.cloud-run-fixed" --timeout=15m

echo "✅ Container build submitted to Cloud Build"

# Deploy to Cloud Run
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
  --no-cpu-throttling \
  --max-instances=5 \
  --min-instances=1 \
  --startup-cpu-boost \
  --container-command="/usr/src/app/start.sh"

# Verify deployment
echo "4. Verifying deployment..."
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