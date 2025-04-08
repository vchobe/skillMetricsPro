#!/bin/bash

# Set project ID and service name
PROJECT_ID="imposing-elixir-440911-u9"
SERVICE_NAME="skills-management-app"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/skillmetricspro2-java:latest"

echo "Building Java Spring Boot backend..."
cd java-backend
./build.sh

if [ $? -ne 0 ]; then
    echo "Java backend build failed. Exiting."
    exit 1
fi

echo "Building Docker image for Java backend..."
docker build -t ${IMAGE_NAME} .

if [ $? -ne 0 ]; then
    echo "Docker build failed. Exiting."
    exit 1
fi

echo "Pushing Docker image to Google Cloud Registry..."
docker push ${IMAGE_NAME}

if [ $? -ne 0 ]; then
    echo "Docker push failed. Exiting."
    exit 1
fi

echo "Deploying Java backend to Cloud Run..."
gcloud run deploy ${SERVICE_NAME}-java \
    --image=${IMAGE_NAME} \
    --platform=managed \
    --region=${REGION} \
    --allow-unauthenticated \
    --set-env-vars="DATABASE_URL=${DATABASE_URL},PGUSER=${PGUSER},PGPASSWORD=${PGPASSWORD},JWT_SECRET=skillmetricsSecretKey123"

if [ $? -eq 0 ]; then
    echo "Deployment successful!"
    echo "You can access your service at: $(gcloud run services describe ${SERVICE_NAME}-java --platform=managed --region=${REGION} --format='value(status.url)')"
else
    echo "Deployment failed. Check the error messages above."
    exit 1
fi
