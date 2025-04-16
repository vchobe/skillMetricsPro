# Java Backend Deployment Guide

This guide provides step-by-step instructions for deploying the Java Spring Boot backend to Google Cloud Run.

## Prerequisites

- Google Cloud SDK installed and configured
- Docker installed
- Access to Google Cloud Console with appropriate permissions
- Service account key file (service-account-key.json)
- Database connection string (PostgreSQL)

## Environment Variables

The following environment variables must be set for the Java backend:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `GCP_PROJECT_ID`: Google Cloud Project ID
- `PORT`: Port for the application (default: 8080)

## Deployment Steps

### 1. Build the Java Backend

```bash
# Navigate to the java-backend directory
cd java-backend

# Build the project using Maven
./mvnw clean package -DskipTests
```

### 2. Create a Dockerfile for Java Backend

A Dockerfile is already provided in the java-backend directory. It should contain:

```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/api-0.0.1-SNAPSHOT.jar app.jar

# Set environment variables
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod

# Expose the port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "app.jar"]
```

### 3. Build and Push Docker Image

```bash
# Set environment variables
export PROJECT_ID=<YOUR_GCP_PROJECT_ID>
export IMAGE_NAME=skills-management-java-backend
export IMAGE_TAG=latest

# Build the Docker image
docker build -t gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG ./java-backend

# Push the image to Google Container Registry
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG
```

### 4. Deploy to Google Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy skills-management-app-java \
  --image gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=$DATABASE_URL" \
  --set-env-vars="JWT_SECRET=$JWT_SECRET" \
  --set-env-vars="PORT=8080"
```

### 5. Verify Deployment

After deployment, verify that the service is running correctly:

```bash
# Get the URL of the deployed service
gcloud run services describe skills-management-app-java \
  --platform managed \
  --region us-central1 \
  --format="value(status.url)"
```

Test the deployed API:

```bash
curl <SERVICE_URL>/api/api-info
```

## Automating Deployment

For automated deployment, you can use the following script:

```bash
#!/bin/bash

# Set variables
PROJECT_ID=$(gcloud config get-value project)
IMAGE_NAME=skills-management-java-backend
IMAGE_TAG=$(date +%Y%m%d-%H%M%S)
REGION=us-central1
SERVICE_NAME=skills-management-app-java

# Build Java application
cd java-backend
./mvnw clean package -DskipTests

# Build Docker image
docker build -t gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=$DATABASE_URL" \
  --set-env-vars="JWT_SECRET=$JWT_SECRET" \
  --set-env-vars="PORT=8080"

# Get the URL of the deployed service
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --format="value(status.url)")

echo "Service deployed at: $SERVICE_URL"
```

## Updating the Frontend

After deploying the Java backend, you need to update the frontend to use the new API endpoint:

1. Update the `client/src/api/config.ts` file to point to the new backend:

```typescript
// Flag to use Java backend
const USE_JAVA_BACKEND = true;

// Java backend URL in production
const JAVA_BACKEND_PROD_URL = 'https://skills-management-app-java-<ID>.run.app';

// Backend API base URL configuration
export const API_BASE_URL = USE_JAVA_BACKEND 
  ? (process.env.NODE_ENV === 'production'
      ? `${JAVA_BACKEND_PROD_URL}/api` // Java backend in production
      : '/api') // Java backend in development
  : (process.env.NODE_ENV === 'production'
      ? '/api' // Node.js backend in production
      : '/api'); // Node.js backend in development
```

2. Rebuild and deploy the frontend application.

## Troubleshooting

### Database Connection Issues

- Check that the DATABASE_URL is correctly formatted
- Ensure that the database is accessible from Google Cloud Run
- Check for firewall rules that might be blocking connections

### Authentication Issues

- Verify that the JWT_SECRET is correctly set
- Check the authentication configuration in the Java backend

### Deployment Failures

- Check Cloud Run logs for error messages
- Verify that the service account has appropriate permissions
- Ensure the Docker image builds correctly locally before deploying

## Monitoring

Monitor your deployed application using Google Cloud Monitoring:

```bash
# View logs from the deployed service
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" --limit=10
```