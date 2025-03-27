#!/bin/bash
set -e

# Script to deploy the entire application stack to GCP:
# 1. Create and configure the Cloud SQL database
# 2. Deploy the application to Cloud Run
# 3. Setup database schema and initial data
# 4. Perform health checks

# Run in the context of the repository root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/.."  # Navigate to project root

# Configuration
PROJECT_ID="skills-management-platform"  # Replace with your GCP project ID
REGION="us-central1"                     # GCP region
SERVICE_NAME="skills-management-app"     # Cloud Run service name 
DB_INSTANCE_NAME="skills-management-db"  # Cloud SQL instance name

echo "===================================================="
echo "🚀 STARTING FULL DEPLOYMENT PROCESS"
echo "===================================================="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION" 
echo "Service: $SERVICE_NAME"
echo "Database: $DB_INSTANCE_NAME"
echo "----------------------------------------------------"

# Check if required tools are installed
command -v gcloud >/dev/null 2>&1 || { echo "❌ Google Cloud SDK (gcloud) is required but not installed. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting."; exit 1; }

# Check if user is logged in to gcloud
ACCOUNT=$(gcloud config get-value account 2>/dev/null)
if [ -z "$ACCOUNT" ]; then
  echo "❌ You are not logged in to gcloud. Please run 'gcloud auth login' first."
  exit 1
fi
echo "✅ Logged in to gcloud as: $ACCOUNT"

# Check permissions
echo "Checking permissions..."
gcloud projects describe $PROJECT_ID >/dev/null 2>&1 || { echo "❌ You don't have permission to access project $PROJECT_ID. Aborting."; exit 1; }
echo "✅ You have access to project $PROJECT_ID"

# Step 1: Deploy infrastructure and application
echo -e "\n===================================================="
echo "📦 STEP 1: DEPLOYING INFRASTRUCTURE AND APPLICATION"
echo "===================================================="
./deployment/deploy-to-gcp.sh

# Step 2: Set up database schema and test data
echo -e "\n===================================================="
echo "🗃️ STEP 2: SETTING UP DATABASE SCHEMA AND INITIAL DATA" 
echo "===================================================="
./deployment/setup-database.sh

# Step 3: Run deployment checks
echo -e "\n===================================================="
echo "🔍 STEP 3: RUNNING DEPLOYMENT CHECKS"
echo "===================================================="
./deployment/check-deployment.sh

# Get the service URL for the final message
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format='value(status.url)')

echo -e "\n===================================================="
echo "✅ DEPLOYMENT COMPLETE"
echo "===================================================="
echo "Your application is now deployed and available at:"
echo "$SERVICE_URL"
echo ""
echo "Default admin credentials:"
echo "Username: admin@example.com"
echo "Password: password123"
echo "(Change these credentials after first login!)"
echo ""
echo "To monitor your application:"
echo "- Cloud Run console: https://console.cloud.google.com/run?project=$PROJECT_ID"
echo "- Logs: https://console.cloud.google.com/logs?project=$PROJECT_ID" 
echo "- Database: https://console.cloud.google.com/sql/instances/$DB_INSTANCE_NAME?project=$PROJECT_ID"
echo ""
echo "To run health checks again: ./deployment/check-deployment.sh"
echo "===================================================="