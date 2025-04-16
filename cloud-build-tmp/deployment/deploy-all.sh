#!/bin/bash
set -e

# Help information
show_help() {
  echo "Usage: $0 [options]"
  echo ""
  echo "All-in-one deployment script for Skills Management Platform to GCP"
  echo ""
  echo "Options:"
  echo "  --project-id=ID         Google Cloud Project ID (required)"
  echo "  --region=REGION         Google Cloud region [default: us-central1]"
  echo "  --service=NAME          Cloud Run service name [default: skills-management-app]"
  echo "  --db-instance=NAME      Cloud SQL instance name [default: skills-management-db]"
  echo "  --db-name=NAME          Database name [default: skills_platform]"
  echo "  --db-user=USER          Database user [default: skills_admin]"
  echo "  --setup-db              Set up database schema and initial admin user"
  echo "  --with-test-data        Add test data to the database (implies --setup-db)"
  echo "  --quick-deploy          Skip database setup, only deploy application"
  echo "  --debug                 Enable debug mode (verbose output)"
  echo "  --help                  Show this help message"
  echo ""
  echo "Example:"
  echo "  $0 --project-id=my-project-123 --region=us-east1 --setup-db"
  exit 0
}

if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  show_help
fi

# Default configuration
PROJECT_ID=""                       # GCP project ID (must be provided)
REGION="us-central1"                # GCP region
SERVICE_NAME="skills-management-app" # Cloud Run service name
DB_INSTANCE_NAME="skills-management-db" # Cloud SQL instance name
DB_NAME="skills_platform"           # Database name
DB_USER="skills_admin"              # Database user
SETUP_DB=false
WITH_TEST_DATA=false
QUICK_DEPLOY=false
DEBUG=false

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
    --setup-db)
      SETUP_DB=true
      shift
      ;;
    --with-test-data)
      SETUP_DB=true
      WITH_TEST_DATA=true
      shift
      ;;
    --quick-deploy)
      QUICK_DEPLOY=true
      shift
      ;;
    --debug)
      DEBUG=true
      set -x # Enable debug mode
      shift
      ;;
    --help)
      show_help
      ;;
    *)
      # Unknown option
      echo "Unknown option: $arg"
      echo "Use --help for usage information."
      exit 1
      ;;
  esac
done

# Check for required parameters
if [ -z "$PROJECT_ID" ]; then
  echo "Error: Missing required parameter --project-id"
  echo "Use --help for usage information."
  exit 1
fi

# Find script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
echo "Script directory: $SCRIPT_DIR"

# Ensure we're in the right starting directory
if [ -f "$SCRIPT_DIR/deploy-to-gcp.sh" ]; then
  DEPLOY_SCRIPT="$SCRIPT_DIR/deploy-to-gcp.sh"
  CHECK_SCRIPT="$SCRIPT_DIR/check-deployment.sh"
  SETUP_DB_SCRIPT="$SCRIPT_DIR/setup-database.sh"
  
  # Make sure all scripts are executable
  chmod +x "$DEPLOY_SCRIPT" "$CHECK_SCRIPT" "$SETUP_DB_SCRIPT"
else
  echo "Error: Required deployment scripts not found in $SCRIPT_DIR"
  echo "Make sure you're running this script from the project's deployment directory."
  exit 1
fi

echo "=== Starting complete deployment process ==="
echo "Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service name: $SERVICE_NAME"
echo "  Database instance: $DB_INSTANCE_NAME"
echo "  Database name: $DB_NAME"
echo "  Database user: $DB_USER"
echo "  Setup database: $SETUP_DB"
echo "  With test data: $WITH_TEST_DATA"
echo "  Quick deploy: $QUICK_DEPLOY"

# Deploy to GCP
if [ "$QUICK_DEPLOY" = true ]; then
  echo "=== Quick deploying application only (skipping database setup) ==="
  $DEPLOY_SCRIPT --project-id="$PROJECT_ID" --region="$REGION" --service="$SERVICE_NAME" --db-instance="$DB_INSTANCE_NAME" --db-name="$DB_NAME" --db-user="$DB_USER"
else
  echo "=== Deploying application to GCP ==="
  $DEPLOY_SCRIPT --project-id="$PROJECT_ID" --region="$REGION" --service="$SERVICE_NAME" --db-instance="$DB_INSTANCE_NAME" --db-name="$DB_NAME" --db-user="$DB_USER"
  
  # Check deployment
  echo "=== Checking deployment status ==="
  $CHECK_SCRIPT --project-id="$PROJECT_ID" --region="$REGION" --service="$SERVICE_NAME" --db-instance="$DB_INSTANCE_NAME"
  
  # Setup database if requested
  if [ "$SETUP_DB" = true ]; then
    echo "=== Setting up database schema ==="
    
    # Get the service URL for database setup
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format='value(status.url)')
    if [ -z "$SERVICE_URL" ]; then
      echo "Error: Could not retrieve service URL. Database setup failed."
      exit 1
    fi
    
    DB_SETUP_OPTS=""
    if [ "$WITH_TEST_DATA" = true ]; then
      DB_SETUP_OPTS="--with-test-data"
    fi
    
    # Setup database
    $SETUP_DB_SCRIPT --service-url="$SERVICE_URL" $DB_SETUP_OPTS
    
    # Final check after database setup
    echo "=== Final deployment check after database setup ==="
    $CHECK_SCRIPT --project-id="$PROJECT_ID" --region="$REGION" --service="$SERVICE_NAME" --db-instance="$DB_INSTANCE_NAME"
  fi
fi

echo "=== Deployment process complete ==="
echo "Application URL: $(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format='value(status.url)')"
echo ""
echo "You can check the status of your deployment at any time with:"
echo "  $CHECK_SCRIPT --project-id=$PROJECT_ID --region=$REGION --service=$SERVICE_NAME --db-instance=$DB_INSTANCE_NAME"