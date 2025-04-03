#!/bin/bash
set -e

# Configuration
PROJECT_ID="skills-management-platform"  # Replace with your GCP project ID
REGION="us-central1"                     # GCP region
SERVICE_NAME="skills-management-app"     # Cloud Run service name
DB_INSTANCE_NAME="skills-management-db"  # Cloud SQL instance name
DB_NAME="skills_platform"                # Database name
DB_USER="skills_admin"                   # Database user

echo "=== Setting up database schema and test data ==="
echo "Project ID: $PROJECT_ID"
echo "Cloud SQL Instance: $DB_INSTANCE_NAME"

# Create a Cloud SQL proxy connection
echo "=== Starting Cloud SQL proxy ==="
DB_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format='value(connectionName)')

# Download the Cloud SQL proxy if it doesn't exist
if [ ! -f "./cloud-sql-proxy" ]; then
  echo "Downloading Cloud SQL proxy..."
  # For Linux
  if [ "$(uname)" == "Linux" ]; then
    curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
  # For macOS
  elif [ "$(uname)" == "Darwin" ]; then
    curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64
  else
    echo "Unsupported operating system: $(uname)"
    exit 1
  fi
  chmod +x cloud-sql-proxy
fi

# Start the proxy
./cloud-sql-proxy --instances=$DB_CONNECTION_NAME=tcp:5432 &
PROXY_PID=$!

# Wait for proxy to establish connection
sleep 10
echo "Cloud SQL proxy started with PID $PROXY_PID"

# Get database password from environment or prompt user
if [ -z "$DB_PASSWORD" ]; then
  echo "Please enter the database password for user $DB_USER:"
  read -s DB_PASSWORD
fi

# Export database connection variables
export DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
export CLOUD_SQL_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${DB_CONNECTION_NAME}"

# Log the connection info (mask password)
echo "Database URL: postgres://${DB_USER}:****@localhost:5432/${DB_NAME}"
echo "Cloud SQL URL format: postgresql://${DB_USER}:****@/${DB_NAME}?host=/cloudsql/${DB_CONNECTION_NAME}"

# Run the database schema setup
echo "=== Creating database schema ==="
# Use current directory instead of hardcoded /app path
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/.."  # Navigate to project root
node db-push.js

# Run test data scripts
echo "=== Creating test data ==="
node scripts/create-admin.js
node scripts/create-test-users.js
node scripts/generate-test-data.js
node scripts/add-certifications.js

# Stop the Cloud SQL proxy
echo "=== Stopping Cloud SQL proxy ==="
kill $PROXY_PID

echo "=== Database setup complete! ==="
echo "Schema and test data have been successfully created in the Cloud SQL database."
echo ""
echo "=== You can now access your application at: ==="
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format='value(status.url)')
echo $SERVICE_URL