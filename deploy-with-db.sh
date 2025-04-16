#!/bin/bash

# Deployment script with database connection
echo "===== DEPLOYING TO CLOUD RUN WITH DATABASE ====="
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE="gcr.io/$PROJECT_ID/skillmetricspro-db:latest"

# Get the database URL from environment variables
# DATABASE_URL is set as a secret environment variable
# DO NOT expose the actual value in scripts or logs

echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE" 
echo "==========================================="

# 1. Authenticate with GCP
echo "1. Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=service-account-key.json

# 2. Create a Dockerfile that correctly handles the build
echo "2. Creating Dockerfile with database connection..."
cat > Dockerfile.db << 'EOL'
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

# Build TypeScript
RUN npm run build

# Expose the port
EXPOSE 8080

# Use node to start the server
CMD ["node", "dist/index.js"]
EOL

# 3. Try to update the existing service with database URL
echo "3. Updating Cloud Run service with database URL..."
gcloud run services update $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --set-env-vars="NODE_ENV=production,HOST=0.0.0.0,DATABASE_URL=$DATABASE_URL" \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300s

echo "===== DEPLOYMENT UPDATE COMPLETE ====="
echo "Check status using: ./check-gc-deployment.sh"
echo "Note: Using the secure DATABASE_URL you provided (value not shown for security)."