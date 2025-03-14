#!/bin/bash
set -e

# Configuration
PROJECT_ID="skills-management-platform"  # Replace with your GCP project ID
REGION="us-central1"                     # GCP region 
REPO_URL="https://github.com/yourusername/skills-management-platform.git"  # Replace with your repository URL

echo "=== Skills Management Platform: Complete Deployment ==="
echo "This script will deploy the entire Skills Management Platform to Google Cloud Platform"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo ""
echo "The following steps will be performed:"
echo "1. Deploy the application to Cloud Run"
echo "2. Setup the Cloud SQL PostgreSQL database"
echo "3. Initialize the database schema"
echo "4. Load test data into the database"
echo "5. Configure backups and monitoring"
echo ""
echo "Press ENTER to continue or CTRL+C to cancel..."
read

# Make sure all scripts are executable
chmod +x deployment/*.sh

# 1. Initialize GCP project
echo "=== Initializing GCP project ==="
gcloud config set project $PROJECT_ID

# Check if user is authenticated to GCP
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &>/dev/null; then
  echo "You need to authenticate with GCP first. Running gcloud auth login..."
  gcloud auth login
fi

# Enable required APIs
echo "=== Enabling required GCP APIs ==="
gcloud services enable cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  monitoring.googleapis.com

# 2. Deploy application and setup database
echo "=== Deploying application and setting up database ==="
./deployment/deploy-to-gcp.sh

# 3. Initialize database schema and test data
echo "=== Initializing database schema and test data ==="
./deployment/setup-database.sh

# 4. Setup monitoring
echo "=== Setting up monitoring ==="

# Create basic Cloud Monitoring alerts for the service
SERVICE_NAME="skills-management-app"
gcloud beta monitoring channels create \
  --display-name="Skills Platform Admin Email" \
  --type=email \
  --channel-labels=email_address="admin@skillsplatform.com"

echo "=== Setting up Cloud Run error rate alert ==="
gcloud alpha monitoring policies create \
  --display-name="Cloud Run High Error Rate" \
  --conditions="condition-filter='metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" metric.label.\"response_code_class\"=\"4xx\" OR metric.label.\"response_code_class\"=\"5xx\"' AND condition-threshold='comparison=\"COMPARISON_GT\" threshold-value=5 duration=\"60s\" filter=\"resource.type=\\\"cloud_run_revision\\\" AND resource.label.\\\"service_name\\\"=\\\"$SERVICE_NAME\\\"\"'"

# 5. Create scheduled backups
echo "=== Setting up scheduled database backups ==="
# Create a backup schedule for Cloud SQL
gcloud sql instances patch $DB_INSTANCE_NAME \
  --backup-start-time="23:00" \
  --enable-bin-log \
  --retained-backups-count=7

echo "=== Deployment complete! ==="
echo ""
echo "Your Skills Management Platform has been successfully deployed to Google Cloud Platform."
echo ""
echo "Next steps:"
echo "1. Access your application at: $(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format='value(status.url)')"
echo "2. Check deployment status: ./deployment/check-deployment.sh"
echo "3. Create manual backups: ./deployment/backup-restore-db.sh backup"
echo ""
echo "For more information, refer to the deployment documentation."