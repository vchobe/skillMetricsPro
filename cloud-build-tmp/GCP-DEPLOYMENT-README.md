# Google Cloud Run Deployment Guide

This document outlines the steps taken to deploy the Skill Management application to Google Cloud Run, addressing common issues and providing best practices.

## Deployment Prerequisites

1. **Google Cloud Project ID**: `imposing-elixir-440911-u9`
2. **Service Account**: `skillmetrics-service-account@imposing-elixir-440911-u9.iam.gserviceaccount.com`
3. **Image Name**: `skillmetricspro6` (versioned with sequential numbering)
4. **Service Name**: `skills-management-app`
5. **Region**: `us-central1`

## Critical Configuration Changes Made

### 1. Server Code Modifications (server/index.ts)

```typescript
// Properly specify host and port for Cloud Run compatibility
server.listen(port, host, () => {
  log(`serving on ${host}:${port}`);
  console.log(`Server started and listening on ${host}:${port}`);
});
```

### 2. Environment Variables in Cloud Run

Key environment variables for successful deployment:
- `PORT=8080` (Cloud Run expects this specific port)
- `HOST=0.0.0.0` (Binds to all network interfaces)
- `NODE_ENV=production`
- `SESSION_SECRET=generated-session-secret-for-production-environment`

### 3. Dockerfile Best Practices

```dockerfile
FROM node:20-slim

ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080
CMD ["node", "dist/index.js"]
```

### 4. cloudbuild.yaml Configuration

```yaml
steps:
# Build Docker image with updated PORT environment variable handling
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', 'gcr.io/${PROJECT_ID}/skillmetricspro6:latest', '.']

# Deploy to Cloud Run
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  entrypoint: gcloud
  args:
  - 'run'
  - 'deploy'
  - 'skills-management-app'
  - '--image'
  - 'gcr.io/${PROJECT_ID}/skillmetricspro6:latest'
  - '--region'
  - 'us-central1'
  - '--platform'
  - 'managed'
  - '--allow-unauthenticated'
  - '--service-account'
  - 'skillmetrics-service-account@imposing-elixir-440911-u9.iam.gserviceaccount.com'
  - '--update-env-vars'
  - 'NODE_ENV=production,HOST=0.0.0.0,PORT=8080,SESSION_SECRET=${_SESSION_SECRET}'
  - '--memory'
  - '1Gi'
  - '--min-instances'
  - '0'
  - '--max-instances'
  - '10'
  - '--timeout'
  - '300s'
```

## Deployment Scripts

### Deploy Final Script

A comprehensive deployment script (`deploy-final.sh`) that:
1. Submits the build to Cloud Build
2. Verifies the service status
3. Checks logs for errors
4. Tests the deployed service

### Deployment Debug Script

A detailed debugging script (`check-deployment-debug.sh`) that:
1. Checks service configuration and status
2. Retrieves revision details
3. Fetches and displays logs
4. Tests connectivity to the deployed service

## Troubleshooting

### Common Issues & Solutions

1. **Container fails to start**: Ensure the server correctly listens on PORT=8080
2. **Health check failures**: Check server logs for binding errors
3. **Permission issues**: Verify service account has necessary roles
4. **Cold start timeouts**: Increase memory allocation and startup timeout

### Checking Deployment Logs

```bash
# View recent logs for the service
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=skills-management-app" --limit=20

# View error logs only
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=skills-management-app AND severity>=ERROR" --limit=10
```

## Next Steps

After deployment, verify:
1. The API endpoints are accessible
2. Database connectivity works correctly
3. Static assets are served properly
4. Authentication flows function as expected