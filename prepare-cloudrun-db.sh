#!/bin/bash

# Exit on error
set -e

# Configuration variables
PROJECT_ID=${PROJECT_ID:-"imposing-elixir-440911-u9"}
REGION=${REGION:-"us-central1"}
INSTANCE_NAME=${INSTANCE_NAME:-"skillmetrics-db"}
DB_NAME=${DB_NAME:-"appdb"}
DB_USER=${DB_USER:-"app_user"}
SCHEMA_FILE="schema.sql"

# Function to show usage instructions
show_usage() {
  echo "Usage: $0 [--schema-only | --data-only | --complete]"
  echo "  --schema-only    Prepare database with schema only (no data)"
  echo "  --data-only      Import data only (assumes schema exists)"
  echo "  --complete       Import both schema and data (default)"
  exit 1
}

# Parse command line options
IMPORT_MODE="complete"
if [ $# -gt 0 ]; then
  if [ "$1" == "--schema-only" ]; then
    IMPORT_MODE="schema"
  elif [ "$1" == "--data-only" ]; then
    IMPORT_MODE="data"
  elif [ "$1" == "--complete" ]; then
    IMPORT_MODE="complete"
  else
    show_usage
  fi
fi

# Check for schema.sql if needed
if [ "$IMPORT_MODE" == "schema" ] || [ "$IMPORT_MODE" == "complete" ]; then
  if [ ! -f "$SCHEMA_FILE" ]; then
    echo "Error: Schema file '$SCHEMA_FILE' not found!"
    echo "Run ./generate-cloudrun-schema.sh first to create the schema."
    exit 1
  fi
fi

# Check if the latest db_dumps exist for data import
if [ "$IMPORT_MODE" == "data" ] || [ "$IMPORT_MODE" == "complete" ]; then
  LATEST_DATA=$(ls -t db_dumps/data_*.sql 2>/dev/null | head -1)
  if [ -z "$LATEST_DATA" ]; then
    echo "Error: No data dump file found in db_dumps/"
    echo "Run ./export-database.sh first to create database dumps."
    exit 1
  fi
  echo "Using data file: $LATEST_DATA"
fi

# Ask for the database password
read -s -p "Enter password for database user '$DB_USER': " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
  echo "Error: Password cannot be empty"
  exit 1
fi

# Check if Cloud SQL Auth Proxy is available
if [ ! -f ./cloud_sql_proxy ]; then
  echo "Downloading Cloud SQL Auth Proxy..."
  wget https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.10.0/cloud-sql-proxy.linux.amd64 -O cloud_sql_proxy
  chmod +x ./cloud_sql_proxy
fi

# Get Cloud SQL instance connection name
SQL_INSTANCE_CONNECTION_NAME="${PROJECT_ID}:${REGION}:${INSTANCE_NAME}"
echo "Cloud SQL instance connection name: $SQL_INSTANCE_CONNECTION_NAME"

# Check for GCP credentials
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ] && [ ! -f "service-account-key.json" ]; then
  echo "Warning: No GCP credentials found."
  echo "Either set GOOGLE_APPLICATION_CREDENTIALS environment variable"
  echo "or place service-account-key.json in the current directory."
  read -p "Continue anyway? (y/n): " CONTINUE_WITHOUT_CREDS
  if [ "$CONTINUE_WITHOUT_CREDS" != "y" ] && [ "$CONTINUE_WITHOUT_CREDS" != "Y" ]; then
    echo "Preparation cancelled."
    exit 1
  fi
fi

# Set credentials if file exists but env var not set
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ] && [ -f "service-account-key.json" ]; then
  export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/service-account-key.json"
  echo "Using service account key from service-account-key.json"
fi

# Start Cloud SQL Auth Proxy
echo "Starting Cloud SQL Auth Proxy..."
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
  ./cloud_sql_proxy --port=5432 --credentials-file="$GOOGLE_APPLICATION_CREDENTIALS" $SQL_INSTANCE_CONNECTION_NAME &
else
  # Try without explicit credentials (relies on default application credentials)
  ./cloud_sql_proxy --port=5432 $SQL_INSTANCE_CONNECTION_NAME &
fi
PROXY_PID=$!

# Give proxy time to establish connection
echo "Waiting for proxy connection to establish..."
sleep 5

# Check if proxy is running
if ! kill -0 $PROXY_PID 2>/dev/null; then
  echo "Error: Cloud SQL Auth Proxy failed to start"
  exit 1
fi

# Function to clean up proxy on exit
cleanup() {
  echo "Stopping Cloud SQL Auth Proxy (PID: $PROXY_PID)..."
  kill $PROXY_PID 2>/dev/null || true
  wait $PROXY_PID 2>/dev/null || true
  echo "Proxy stopped"
}

# Set up trap to ensure proxy is stopped on script exit
trap cleanup EXIT

# Set PGPASSWORD for psql commands
export PGPASSWORD="$DB_PASSWORD"

# Perform database preparation based on selected mode
case $IMPORT_MODE in
  schema)
    echo "Importing schema only from $SCHEMA_FILE..."
    psql -h localhost -p 5432 -U $DB_USER -d $DB_NAME -f "$SCHEMA_FILE"
    ;;
    
  data)
    echo "Importing data only from $LATEST_DATA..."
    psql -h localhost -p 5432 -U $DB_USER -d $DB_NAME -f "$LATEST_DATA"
    ;;
    
  complete)
    echo "Importing schema from $SCHEMA_FILE..."
    psql -h localhost -p 5432 -U $DB_USER -d $DB_NAME -f "$SCHEMA_FILE"
    
    echo "Importing data from $LATEST_DATA..."
    psql -h localhost -p 5432 -U $DB_USER -d $DB_NAME -f "$LATEST_DATA"
    ;;
esac

echo "Database preparation completed successfully!"

# Clean up
unset PGPASSWORD