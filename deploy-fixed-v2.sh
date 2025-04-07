#!/bin/bash

# Script to deploy the application to Cloud Run with a fixed port configuration

set -e  # Exit on any error

# Configuration - Use environment variables with fallbacks
PROJECT_ID="${GCP_PROJECT_ID:-imposing-elixir-440911-u9}"
SERVICE_NAME="skills-management-app" 
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/skillmetricspro2:fixed-v2"

echo "===== STARTING DEPLOYMENT WITH FIXED PORT V2 ====="
echo "Project ID: $PROJECT_ID"
echo "Image Name: $IMAGE_NAME"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "==========================================="

# Ensure service account key exists
if [ ! -f "service-account-key.json" ]; then
  if [ -z "$GCP_SERVICE_ACCOUNT" ]; then
    echo "Error: service-account-key.json not found and GCP_SERVICE_ACCOUNT is not set."
    echo "Please either create a service account key file or set the GCP_SERVICE_ACCOUNT environment variable."
    exit 1
  else
    echo "Creating service-account-key.json from GCP_SERVICE_ACCOUNT environment variable..."
    echo "$GCP_SERVICE_ACCOUNT" > service-account-key.json
    chmod 600 service-account-key.json
  fi
fi

# 1. Authenticate with Google Cloud
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json
gcloud config set project $PROJECT_ID

# 2. Fix port in server/index.ts - a critical step for Cloud Run compatibility
echo "2. Creating a cloud-specific build that enforces port 8080..."

# We don't need to modify server/index.ts since it's already been fixed
echo "Current server/index.ts port configuration:"
grep -n "port =" server/index.ts

# Create a special build script for cloud deployment
cat > cloud-build.sh << 'EOF'
#!/bin/bash
# Build the app
npm run build

# Extra fixes on the compiled JavaScript
echo "Applying port 8080 fixes to compiled JavaScript..."
sed -i 's/const port = process.env.PORT/const port = 8080/g' ./dist/index.js
sed -i 's/parseInt(process.env.PORT, 10) : 5000/8080/g' ./dist/index.js
sed -i 's/log(`serving on ${host}:${port}`)/log(`serving on port 8080`)/g' ./dist/index.js
sed -i 's/const {PORT/const {_PORT/g' ./dist/index.js

# Print the result
echo "Final port configuration in dist/index.js:"
grep -n "port" ./dist/index.js
EOF

chmod +x cloud-build.sh

# Create a specialized Dockerfile for this deployment
cat > Dockerfile.cloud << 'EOF'
# Use Node.js LTS slim
FROM node:20-slim

# Set environment variables - Cloud Run will set PORT to 8080
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Copy and run our specialized build script
COPY cloud-build.sh ./
RUN ./cloud-build.sh

# Expose the port
EXPOSE 8080

# Use node to start the server (using the compiled JavaScript)
CMD ["node", "dist/index.js"]
EOF

echo "Created specialized Dockerfile and build script for Cloud Run deployment"

# 3. Build and push the Docker image
echo "3. Building and pushing Docker image..."
# Use our custom Dockerfile.cloud
echo "Building Docker image with Dockerfile.cloud..."
gcloud builds submit --timeout=30m --config=cloudbuild.yaml --substitutions=_PROJECT_ID=$PROJECT_ID

# 4. Deploy to Cloud Run
echo "4. Deploying to Cloud Run..."

# Check if DATABASE_URL is set in the environment
if [ -n "$DATABASE_URL" ]; then
  echo "Using DATABASE_URL from environment variables"
  ENV_VARS="PORT=8080,HOST=0.0.0.0,NODE_ENV=production,DATABASE_URL=$DATABASE_URL"
else
  echo "No DATABASE_URL provided - using default configuration"
  ENV_VARS="PORT=8080,HOST=0.0.0.0,NODE_ENV=production"
fi

gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --timeout=10m \
  --update-env-vars="$ENV_VARS" \
  --port=8080

# 5. Get the deployed service URL
echo "5. Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform=managed \
  --region=$REGION \
  --format="value(status.url)")

echo "Deployment successful!"
echo "Service URL: $SERVICE_URL"
echo "==========================================="