#!/bin/bash

# Exit on error
set -e

# Configuration variables
PROJECT_ID="imposing-elixir-440911-u9"
REGION="us-central1"
INSTANCE_NAME="skillmetrics-db"
DB_NAME="appdb"
DB_USER="app_user"
DUMP_DIR="db_dumps"

# Function to display usage
show_usage() {
  echo "Usage: $0 [--complete | --schema-data | --tables]"
  echo "  --complete     Import the complete dump file (schema + data)"
  echo "  --schema-data  Import schema and data files separately"
  echo "  --tables       Import individual table dumps"
  exit 1
}

# Check for import method argument
if [ $# -eq 0 ]; then
  show_usage
fi

IMPORT_METHOD="$1"
if [ "$IMPORT_METHOD" != "--complete" ] && [ "$IMPORT_METHOD" != "--schema-data" ] && [ "$IMPORT_METHOD" != "--tables" ]; then
  show_usage
fi

# Check if dump files exist
if [ ! -d "$DUMP_DIR" ]; then
  echo "Error: Dump directory '$DUMP_DIR' not found!"
  echo "Run export-database.sh first to create database dumps."
  exit 1
fi

# Find latest dump files
LATEST_COMPLETE=$(ls -t $DUMP_DIR/complete_*.sql 2>/dev/null | head -1)
LATEST_SCHEMA=$(ls -t $DUMP_DIR/schema_*.sql 2>/dev/null | head -1)
LATEST_DATA=$(ls -t $DUMP_DIR/data_*.sql 2>/dev/null | head -1)

if [ -z "$LATEST_COMPLETE" ] && [ "$IMPORT_METHOD" == "--complete" ]; then
  echo "Error: No complete dump file found in $DUMP_DIR"
  exit 1
fi

if ([ -z "$LATEST_SCHEMA" ] || [ -z "$LATEST_DATA" ]) && [ "$IMPORT_METHOD" == "--schema-data" ]; then
  echo "Error: Schema or data dump files not found in $DUMP_DIR"
  exit 1
fi

# Get Cloud SQL instance connection name
SQL_INSTANCE_CONNECTION_NAME="${PROJECT_ID}:${REGION}:${INSTANCE_NAME}"
echo "Cloud SQL instance connection name: $SQL_INSTANCE_CONNECTION_NAME"

# Prompt for database password
read -s -p "Enter database password for $DB_USER: " DB_PASSWORD
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

# Start Cloud SQL Auth Proxy using TCP port
echo "Starting Cloud SQL Auth Proxy..."
./cloud_sql_proxy --port=5432 $SQL_INSTANCE_CONNECTION_NAME &
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

# Perform import based on selected method
case $IMPORT_METHOD in
  --complete)
    echo "Importing complete dump file: $LATEST_COMPLETE"
    psql -h localhost -p 5432 -U $DB_USER -d $DB_NAME -f "$LATEST_COMPLETE"
    ;;
    
  --schema-data)
    echo "Importing schema: $LATEST_SCHEMA"
    psql -h localhost -p 5432 -U $DB_USER -d $DB_NAME -f "$LATEST_SCHEMA"
    
    echo "Importing data: $LATEST_DATA"
    psql -h localhost -p 5432 -U $DB_USER -d $DB_NAME -f "$LATEST_DATA"
    ;;
    
  --tables)
    TABLES_DIR="$DUMP_DIR/tables"
    if [ ! -d "$TABLES_DIR" ] || [ -z "$(ls -A $TABLES_DIR 2>/dev/null)" ]; then
      echo "Error: No table dumps found in $TABLES_DIR"
      exit 1
    fi
    
    echo "Found the following table dumps:"
    ls -1 $TABLES_DIR
    
    read -p "Import all tables? (y/n): " IMPORT_ALL
    
    if [ "$IMPORT_ALL" == "y" ] || [ "$IMPORT_ALL" == "Y" ]; then
      for TABLE_FILE in $TABLES_DIR/*.sql; do
        echo "Importing table: $(basename $TABLE_FILE)"
        psql -h localhost -p 5432 -U $DB_USER -d $DB_NAME -f "$TABLE_FILE"
      done
    else
      read -p "Enter comma-separated list of table names to import: " TABLE_LIST
      IFS=',' read -ra TABLES <<< "$TABLE_LIST"
      
      for TABLE in "${TABLES[@]}"; do
        TABLE=$(echo $TABLE | tr -d ' ')
        LATEST_TABLE=$(ls -t $TABLES_DIR/${TABLE}_*.sql 2>/dev/null | head -1)
        
        if [ -n "$LATEST_TABLE" ]; then
          echo "Importing table: $TABLE from $LATEST_TABLE"
          psql -h localhost -p 5432 -U $DB_USER -d $DB_NAME -f "$LATEST_TABLE"
        else
          echo "Warning: No dump file found for table $TABLE"
        fi
      done
    fi
    ;;
esac

echo "Import completed successfully!"
echo "Stopping Cloud SQL Auth Proxy..."
kill $PROXY_PID
wait $PROXY_PID 2>/dev/null || true

# Unset password environment variable
unset PGPASSWORD