#!/bin/bash
set -e

# Configuration
PROJECT_ID="skills-management-platform"  # Replace with your GCP project ID
REGION="us-central1"                     # GCP region
DB_INSTANCE_NAME="skills-management-db"  # Cloud SQL instance name
DB_NAME="skills_platform"                # Database name
DB_USER="skills_admin"                   # Database user
BACKUP_BUCKET="skills-management-backups"  # GCS bucket for backups
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Command line argument processing
ACTION=$1  # 'backup' or 'restore'
BACKUP_FILE=$2  # Only needed for restore

function show_usage {
  echo "Usage:"
  echo "  $0 backup                # Creates a new backup"
  echo "  $0 restore [BACKUP_FILE] # Restores from a backup file"
  exit 1
}

# Check action parameter
if [ "$ACTION" != "backup" ] && [ "$ACTION" != "restore" ]; then
  show_usage
fi

# For restore, check backup file parameter
if [ "$ACTION" = "restore" ] && [ -z "$BACKUP_FILE" ]; then
  echo "Error: Missing backup file parameter for restore action"
  show_usage
fi

# Create GCS bucket if it doesn't exist
echo "=== Checking GCS backup bucket ==="
if ! gsutil ls -b gs://$BACKUP_BUCKET &>/dev/null; then
  echo "Creating backup bucket: gs://$BACKUP_BUCKET"
  gsutil mb -l $REGION gs://$BACKUP_BUCKET
else
  echo "Backup bucket exists: gs://$BACKUP_BUCKET"
fi

# Start Cloud SQL proxy
echo "=== Starting Cloud SQL proxy ==="
DB_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format='value(connectionName)')
cloud_sql_proxy -instances=$DB_CONNECTION_NAME=tcp:5432 &
PROXY_PID=$!

# Wait for proxy to establish connection
sleep 5
echo "Cloud SQL proxy started with PID $PROXY_PID"

# Get database password
if [ -z "$DB_PASSWORD" ]; then
  echo "Please enter the database password for user $DB_USER:"
  read -s DB_PASSWORD
fi

if [ "$ACTION" = "backup" ]; then
  echo "=== Creating database backup ==="
  BACKUP_FILENAME="skills_platform_backup_$TIMESTAMP.sql"
  
  echo "Backing up database to $BACKUP_FILENAME..."
  PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -p 5432 -U $DB_USER -d $DB_NAME -F c > $BACKUP_FILENAME
  
  echo "Uploading backup to GCS..."
  gsutil cp $BACKUP_FILENAME gs://$BACKUP_BUCKET/
  
  echo "Cleaning up local backup file..."
  rm $BACKUP_FILENAME
  
  echo "Backup complete: gs://$BACKUP_BUCKET/$BACKUP_FILENAME"

elif [ "$ACTION" = "restore" ]; then
  echo "=== Restoring database from backup ==="
  
  # Check if backup file exists in GCS
  if ! gsutil stat gs://$BACKUP_BUCKET/$BACKUP_FILE &>/dev/null; then
    echo "Error: Backup file not found in gs://$BACKUP_BUCKET/$BACKUP_FILE"
    
    # List available backups
    echo "Available backups:"
    gsutil ls gs://$BACKUP_BUCKET/
    
    # Kill the proxy and exit
    kill $PROXY_PID
    exit 1
  fi
  
  echo "Downloading backup file from GCS..."
  gsutil cp gs://$BACKUP_BUCKET/$BACKUP_FILE .
  
  echo "Restoring database from $BACKUP_FILE..."
  PGPASSWORD=$DB_PASSWORD pg_restore -h localhost -p 5432 -U $DB_USER -d $DB_NAME --clean --if-exists $BACKUP_FILE
  
  echo "Cleaning up local backup file..."
  rm $BACKUP_FILE
  
  echo "Database restore complete!"
fi

# Stop the Cloud SQL proxy
echo "=== Stopping Cloud SQL proxy ==="
kill $PROXY_PID

echo "=== Operation complete! ==="