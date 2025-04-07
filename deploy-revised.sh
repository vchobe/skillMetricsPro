#!/bin/bash
# Script to build and deploy a new container image

set -e  # Exit on any error

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-imposing-elixir-440911-u9}"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/skillmetricspro-fixed:latest"

echo "===== BUILDING AND DEPLOYING NEW CONTAINER IMAGE ====="
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE_NAME"
echo "==========================================="

# 1. Authenticate with Google Cloud
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json
gcloud config set project $PROJECT_ID

# 2. Get current Dockerfile.port8080 and modify it if needed
echo "2. Checking Dockerfile.port8080..."
if [ -f "Dockerfile.port8080" ]; then
    echo "Using existing Dockerfile.port8080"
    cat Dockerfile.port8080
else
    echo "Creating Dockerfile.port8080"
    cat > Dockerfile.port8080 << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy source code
COPY server ./server
COPY client ./client
COPY shared ./shared
COPY drizzle.config.ts ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY public ./public
COPY theme.json ./

# Install dependencies
RUN npm ci

# Build the application
RUN npm run build

# Ensure the application listens on PORT env var
ENV HOST=0.0.0.0

# Modify the index.js file to ensure it listens on port 8080 or PORT env var
RUN sed -i 's/const PORT = process.env.PORT || 3000/const PORT = process.env.PORT || 8080/g' dist/server/index.js || true
RUN sed -i 's/const PORT = 5000/const PORT = process.env.PORT || 8080/g' dist/server/index.js || true
RUN sed -i 's/const port = process.env.PORT || 3000/const port = process.env.PORT || 8080/g' dist/server/index.js || true
RUN sed -i 's/const port = 5000/const port = process.env.PORT || 8080/g' dist/server/index.js || true

# Explicitly use port 8080
EXPOSE 8080

# Start the application
CMD ["node", "dist/server/index.js"]
EOF
fi

# 3. Create a Cloud Build config file
echo "3. Creating Cloud Build config file..."
cat > cloudbuild.yaml << EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', '$IMAGE_NAME', '-f', 'Dockerfile.port8080', '.']
images:
  - '$IMAGE_NAME'
timeout: '1800s'
EOF

# Submit the build
echo "Submitting build to Cloud Build..."
gcloud builds submit --config cloudbuild.yaml .

# 4. Deploy the image to Cloud Run
echo "4. Deploying to Cloud Run..."
DATABASE_URL="postgresql://neondb_owner:npg_6SNPYmkEt5pa@ep-flat-shape-a51t7ga4.us-east-2.aws.neon.tech/neondb?sslmode=require"

gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --port 8080 \
    --set-env-vars "NODE_ENV=production,HOST=0.0.0.0,DATABASE_URL=$DATABASE_URL" \
    --allow-unauthenticated

echo "===== DEPLOYMENT COMPLETE ====="
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --platform=managed --region=$REGION --format='value(status.url)')"