# Cloud Run Deployment Guide

This document explains the improved deployment process we've developed to ensure successful deployment to Google Cloud Run.

## Key Improvements

1. **Fixed Port Configuration**: The server is now explicitly configured to listen on port 8080, which is required by Cloud Run.

2. **Multi-level Port Fixes**:
   - Hardcoded port 8080 in server/index.ts
   - Extra fixes to the compiled JavaScript to ensure port 8080 is used even after compilation
   - Port overrides in the Docker container environment

3. **Custom Build Process**: Created a specialized build script that modifies the compiled JavaScript to guarantee it uses port 8080.

4. **Enhanced Deployment Script**: The `deploy-fixed-v2.sh` script now:
   - Uses environment variables with fallbacks for project configuration
   - Supports service account credentials from environment variables
   - Passes database connection string to the deployed service
   - Uses a custom Dockerfile optimized for Cloud Run

5. **Improved Dockerfile**: A specialized Dockerfile.cloud that:
   - Sets proper environment variables
   - Runs the custom build script during the build process
   - Explicitly exposes port 8080
   - Uses the compiled JavaScript for production

6. **Deployment Status Checker**: Added `check-deployment-status.sh` to:
   - Verify the deployment status in detail
   - Show container port configuration
   - Display revision details including the deployed image
   - Provide comprehensive diagnostics for troubleshooting

## How to Deploy

1. Make sure you have the necessary environment variables set:
   - `GCP_PROJECT_ID` - Google Cloud project ID
   - `GCP_SERVICE_ACCOUNT` - Service account key (JSON content)
   - `DATABASE_URL` - PostgreSQL connection string to Neon database (preferred database with all templates)

2. Run the deployment script:
   ```bash
   ./deploy-fixed-v2.sh
   ```

3. Check the deployment status:
   ```bash
   ./check-deployment-status.sh
   ```

## Database Configuration

The application now prioritizes using the `DATABASE_URL` environment variable to connect to the database. This ensures consistent access to all skill templates, including the Oracle DBA template.

The preferred database configuration uses Neon PostgreSQL:
```
DATABASE_URL=postgresql://neondb_owner:npg_6SNPYmkEt5pa@ep-flat-shape-a51t7ga4.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Troubleshooting

If deployment fails, use `check-deployment-status.sh` to diagnose the issue. The most common problems are:

1. **Port configuration issues**: Ensure the application listens on port 8080
2. **Database connection errors**: Verify the DATABASE_URL is correctly set
3. **Container startup failures**: Check the container logs using the script
4. **Database schema issues**: Check the logs for database connection or schema errors

## Implementation Details

We've implemented several layers of port configuration to ensure robustness:

1. **In the Application Code**:
   ```typescript
   // server/index.ts
   const port = 8080;
   const host = "0.0.0.0";
   ```

2. **In the Build Process**:
   ```bash
   # Applying port 8080 fixes to compiled JavaScript
   sed -i 's/const port = process.env.PORT/const port = 8080/g' ./dist/index.js
   sed -i 's/parseInt(process.env.PORT, 10) : 5000/8080/g' ./dist/index.js
   ```

3. **In the Container Environment**:
   ```dockerfile
   # Set environment variables - Cloud Run will set PORT to 8080
   ENV PORT=8080
   ENV HOST=0.0.0.0
   ```

4. **In the Cloud Run Configuration**:
   ```bash
   --update-env-vars="PORT=8080,HOST=0.0.0.0" --port=8080
   ```

This multi-layered approach ensures the port configuration is correct regardless of potential issues in any single layer.
