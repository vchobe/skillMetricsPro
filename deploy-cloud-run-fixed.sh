#!/bin/bash
# Script for deploying to Cloud Run with fixed port configuration

set -e  # Exit on any error

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-imposing-elixir-440911-u9}"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/skillmetricspro2-fixed:latest"

echo "===== DEPLOYING TO CLOUD RUN WITH FIXED PORT ====="
echo "Project ID: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE_NAME"
echo "======================================================"

# 1. Authenticate with Google Cloud
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json
gcloud config set project $PROJECT_ID

# 2. Create the Dockerfile with appropriate fixes for Cloud Run
cat > Dockerfile.cloud-run-fixed << 'EOL'
FROM node:20-slim

# Set environment variables for better Node.js performance in containers
ENV NODE_ENV=production
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

# Run our port fix script to ensure the app listens on 8080
COPY cloud-run-port-fix.js ./
RUN node cloud-run-port-fix.js

# Create startup script with health check and better debugging
RUN echo '#!/bin/bash' > /usr/src/app/start.sh && \
    echo 'set -e' >> /usr/src/app/start.sh && \
    echo '' >> /usr/src/app/start.sh && \
    echo '# Print environment for debugging' >> /usr/src/app/start.sh && \
    echo 'echo "==== CLOUD RUN CONTAINER STARTUP ====="' >> /usr/src/app/start.sh && \
    echo 'echo "NODE_ENV: $NODE_ENV"' >> /usr/src/app/start.sh && \
    echo 'echo "HOST: $HOST"' >> /usr/src/app/start.sh && \
    echo 'echo "Using hardcoded port: 8080"' >> /usr/src/app/start.sh && \
    echo 'echo "Current directory: $(pwd)"' >> /usr/src/app/start.sh && \
    echo 'echo "Dist directory contents:"' >> /usr/src/app/start.sh && \
    echo 'ls -la dist' >> /usr/src/app/start.sh && \
    echo 'echo "=================================="' >> /usr/src/app/start.sh && \
    echo '' >> /usr/src/app/start.sh && \
    echo '# Start the server' >> /usr/src/app/start.sh && \
    echo 'echo "Starting server with fixed port 8080 on 0.0.0.0"' >> /usr/src/app/start.sh && \
    echo 'node dist/index.js' >> /usr/src/app/start.sh

# Make startup script executable
RUN chmod +x /usr/src/app/start.sh

# Explicitly expose port 8080 for Cloud Run
EXPOSE 8080

# Use the startup script as the entry point
CMD ["/usr/src/app/start.sh"]
EOL

echo "Created Dockerfile.cloud-run-fixed"

# 3. Create cloud build configuration file
cat > cloudbuild-fixed.yaml << 'EOL'
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/${PROJECT_ID}/skillmetricspro2-fixed:latest', '-f', 'Dockerfile.cloud-run-fixed', '.']
    timeout: '600s'
images: ['gcr.io/${PROJECT_ID}/skillmetricspro2-fixed:latest']
timeout: '900s'
options:
  machineType: 'E2_HIGHCPU_8'
  diskSizeGb: '100'
  dynamic_substitutions: true
EOL

echo "Created cloudbuild-fixed.yaml"

# 4. Build the container image with Cloud Build
echo "4. Building container image..."
gcloud builds submit --config=cloudbuild-fixed.yaml

# 5. Deploy the image to Cloud Run
echo "5. Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --port 8080 \
    --set-env-vars "NODE_ENV=production,HOST=0.0.0.0" \
    --memory 512Mi \
    --cpu 1 \
    --allow-unauthenticated \
    --timeout=5m

echo "===== DEPLOYMENT COMPLETE ====="
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --platform=managed --region=$REGION --format='value(status.url)')"