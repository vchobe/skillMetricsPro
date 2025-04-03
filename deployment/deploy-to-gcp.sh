#!/bin/bash
set -e

# Help information
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  echo "Usage: $0 [--project-id=<id>] [--region=<region>] [--service=<name>] [--db-instance=<name>] [--db-name=<name>] [--db-user=<user>]"
  echo ""
  echo "Deployment script for Skills Management Platform to GCP"
  echo ""
  echo "Options:"
  echo "  --project-id=ID       Google Cloud Project ID (required)"
  echo "  --region=REGION       Google Cloud region [default: us-central1]"
  echo "  --service=NAME        Cloud Run service name [default: skills-management-app]"
  echo "  --db-instance=NAME    Cloud SQL instance name [default: skills-management-db]"
  echo "  --db-name=NAME        Database name [default: skills_platform]"
  echo "  --db-user=USER        Database user [default: skills_admin]"
  echo "  --use-existing-db     Use existing database credentials (won't create new password)"
  echo "  --debug               Enable debug mode (verbose output)"
  echo ""
  echo "Example:"
  echo "  $0 --project-id=my-project-123 --region=us-east1"
  exit 0
fi

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --project-id=*)
      PROJECT_ID="${arg#*=}"
      shift
      ;;
    --region=*)
      REGION="${arg#*=}"
      shift
      ;;
    --service=*)
      SERVICE_NAME="${arg#*=}"
      shift
      ;;
    --db-instance=*)
      DB_INSTANCE_NAME="${arg#*=}"
      shift
      ;;
    --db-name=*)
      DB_NAME="${arg#*=}"
      shift
      ;;
    --db-user=*)
      DB_USER="${arg#*=}"
      shift
      ;;
    --use-existing-db)
      USE_EXISTING_DB=true
      shift
      ;;
    --debug)
      set -x # Enable debug mode
      DEBUG=true
      shift
      ;;
    *)
      # Unknown option
      echo "Unknown option: $arg"
      echo "Use --help for usage information."
      exit 1
      ;;
  esac
done

# Default configuration
PROJECT_ID=${PROJECT_ID:-""}                   # GCP project ID
REGION=${REGION:-"us-central1"}               # GCP region 
SERVICE_NAME=${SERVICE_NAME:-"skills-management-app"} # Cloud Run service name
DB_INSTANCE_NAME=${DB_INSTANCE_NAME:-"skills-management-db"} # Cloud SQL instance name
DB_NAME=${DB_NAME:-"skills_platform"}         # Database name
DB_USER=${DB_USER:-"skills_admin"}            # Database user
DB_PORT="5432"                                # PostgreSQL port

# Check for required parameters
if [ -z "$PROJECT_ID" ]; then
  echo "Error: Missing required parameter --project-id"
  echo "Use --help for usage information."
  exit 1
fi

# Generate a random password for the database, unless using existing one
if [ "$USE_EXISTING_DB" = true ]; then
  echo "Using existing database credentials (will not generate new password)"
  # We'll retrieve the password later
else
  DB_PASSWORD=$(openssl rand -base64 16)
fi

echo "=== Deploying Skills Management Platform to Google Cloud Platform ==="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo "Database Instance: $DB_INSTANCE_NAME"

# Ensure gcloud is configured for the project
echo "=== Configuring Google Cloud project ==="
gcloud config set project $PROJECT_ID

# Create Cloud SQL PostgreSQL instance if it doesn't exist
echo "=== Setting up Cloud SQL PostgreSQL instance ==="
if gcloud sql instances describe $DB_INSTANCE_NAME > /dev/null 2>&1; then
  echo "Cloud SQL instance $DB_INSTANCE_NAME already exists."
else
  echo "Creating Cloud SQL instance $DB_INSTANCE_NAME..."
  gcloud sql instances create $DB_INSTANCE_NAME \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=$REGION \
    --storage-type=SSD \
    --storage-size=10GB \
    --availability-type=ZONAL
  echo "Cloud SQL instance created successfully."
fi

# Create database user if it doesn't exist
echo "=== Setting up database user ==="
if gcloud sql users list --instance=$DB_INSTANCE_NAME | grep -q $DB_USER; then
  echo "Database user $DB_USER already exists."
else
  echo "Creating database user $DB_USER..."
  gcloud sql users create $DB_USER \
    --instance=$DB_INSTANCE_NAME \
    --password="$DB_PASSWORD"
  echo "Database user created successfully."
fi

# Create database if it doesn't exist
echo "=== Setting up database ==="
if gcloud sql databases list --instance=$DB_INSTANCE_NAME | grep -q $DB_NAME; then
  echo "Database $DB_NAME already exists."
else
  echo "Creating database $DB_NAME..."
  gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME
  echo "Database created successfully."
fi

# Get the Cloud SQL connection name
DB_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format='value(connectionName)')
echo "Cloud SQL Connection Name: $DB_CONNECTION_NAME"

# Set environment variables for database connection in a tempfile
echo "=== Creating environment variables file ==="
cat << EOF > .env.cloud
DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}
NODE_ENV=production
EOF

# Build and push the Docker image
echo "=== Building and pushing Docker image ==="
IMAGE_URL="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

# Check if application directory exists
if [ ! -f "package.json" ]; then
  if [ -f "../package.json" ]; then
    echo "package.json found in parent directory, moving up..."
    cd ..
  else
    echo "Error: package.json not found in current or parent directory."
    echo "Make sure you're running this script from the deployment directory or project root."
    exit 1
  fi
fi

# Verify Dockerfile exists
if [ ! -f "Dockerfile" ]; then
  echo "Error: Dockerfile not found in current directory."
  exit 1
fi

echo "Building from directory: $(pwd)"
echo "Using Dockerfile: $(cat Dockerfile | head -n 1)"

# Check if we're authenticated to GCP
if ! gcloud auth print-access-token &>/dev/null; then
  echo "Error: Not authenticated to Google Cloud. Please run 'gcloud auth login' first."
  exit 1
fi

# Submit the build to Cloud Build
echo "Submitting build to Cloud Build..."
if ! gcloud builds submit --tag $IMAGE_URL; then
  echo "Error: Failed to build and push Docker image."
  echo "Check the build logs for details."
  exit 1
fi

echo "Successfully built and pushed Docker image: $IMAGE_URL"

# Generate a session secret
SESSION_SECRET=$(openssl rand -hex 32)

# Get Mailjet credentials if they exist
MAILJET_API_KEY=$(gcloud secrets versions access latest --secret="MAILJET_API_KEY" 2>/dev/null || echo "")
MAILJET_SECRET_KEY=$(gcloud secrets versions access latest --secret="MAILJET_SECRET_KEY" 2>/dev/null || echo "")

# Format the Cloud SQL URL correctly
CLOUD_SQL_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${DB_CONNECTION_NAME}"

# Create extensive environment variables for deployment
ENV_VARS="DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME},"
ENV_VARS+="CLOUD_SQL_URL=${CLOUD_SQL_URL},"
ENV_VARS+="CLOUD_SQL_CONNECTION_NAME=${DB_CONNECTION_NAME},"
ENV_VARS+="DB_USER=${DB_USER},"
ENV_VARS+="DB_PASSWORD=${DB_PASSWORD},"
ENV_VARS+="DB_NAME=${DB_NAME},"
ENV_VARS+="NODE_ENV=production,"
ENV_VARS+="USE_CLOUD_SQL=true,"
ENV_VARS+="PORT=8080,"
ENV_VARS+="HOST=0.0.0.0,"
ENV_VARS+="SESSION_SECRET=${SESSION_SECRET}"

echo "Environment variables for deployment:"
echo "DATABASE_URL=postgresql://${DB_USER}:****@localhost:${DB_PORT}/${DB_NAME}"
echo "CLOUD_SQL_URL=postgresql://${DB_USER}:****@/${DB_NAME}?host=/cloudsql/${DB_CONNECTION_NAME}"
echo "CLOUD_SQL_CONNECTION_NAME=${DB_CONNECTION_NAME}"

# Add Mailjet keys if they exist
if [ -n "$MAILJET_API_KEY" ] && [ -n "$MAILJET_SECRET_KEY" ]; then
  ENV_VARS="${ENV_VARS},MAILJET_API_KEY=${MAILJET_API_KEY},MAILJET_SECRET_KEY=${MAILJET_SECRET_KEY}"
  echo "Added Mailjet credentials to deployment environment"
else
  echo "Warning: Mailjet credentials not found. Email functionality will be limited."
fi

echo "Cloud SQL connection string format: postgresql://${DB_USER}:****@/${DB_NAME}?host=/cloudsql/${DB_CONNECTION_NAME}"

# Deploy to Cloud Run with Cloud SQL connection
echo "=== Deploying to Cloud Run ==="

# Check if service already exists
if gcloud run services describe $SERVICE_NAME --region=$REGION --platform=managed &>/dev/null; then
  echo "Updating existing Cloud Run service: $SERVICE_NAME"
  
  # For existing service, we must use update and set commands separately
  gcloud run services update $SERVICE_NAME \
    --image $IMAGE_URL \
    --platform managed \
    --region $REGION
  
  # Update service with Cloud SQL instance
  gcloud run services update $SERVICE_NAME \
    --add-cloudsql-instances $DB_CONNECTION_NAME \
    --update-env-vars "$ENV_VARS" \
    --platform managed \
    --region $REGION
    
  echo "Service updated successfully"
else
  echo "Creating new Cloud Run service: $SERVICE_NAME"
  
  # For new service, we can set everything at once
  gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_URL \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --add-cloudsql-instances $DB_CONNECTION_NAME \
    --update-env-vars "$ENV_VARS" \
    --cpu=1 \
    --memory=1Gi \
    --min-instances=0 \
    --max-instances=10 \
    --timeout=300s
fi

# Verify the deployment was successful
if ! gcloud run services describe $SERVICE_NAME --region=$REGION --platform=managed &>/dev/null; then
  echo "Error: Failed to deploy service to Cloud Run."
  exit 1
fi

echo "Checking service health..."
# Wait a bit for the service to start
sleep 10

# Get the URL of the deployed service
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format='value(status.url)')
echo "=== Deployment complete! ==="
echo "Your application is available at: $SERVICE_URL"
echo "Cloud SQL Instance: $DB_INSTANCE_NAME"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Password has been set and stored in environment variables."

# Clean up
rm .env.cloud

echo "=== Next steps ==="
echo "1. Initialize the database schema and test data using the setup script:"
echo "   ./deployment/setup-database.sh"