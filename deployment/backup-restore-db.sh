#!/bin/bash
set -e

# Script to create and restore backups for the Cloud SQL database
# Usage:
#   ./backup-restore-db.sh backup    # Creates a backup of the database
#   ./backup-restore-db.sh restore   # Restores the latest backup

# Configuration
PROJECT_ID="skills-management-platform"  # Replace with your GCP project ID
REGION="us-central1"                     # GCP region
DB_INSTANCE_NAME="skills-management-db"  # Cloud SQL instance name
BACKUP_DIR="./db-backups"                # Local directory for backups

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Check command line arguments
if [ $# -lt 1 ]; then
  echo "Usage:"
  echo "  $0 backup   # Create a database backup"
  echo "  $0 restore  # Restore the latest backup"
  exit 1
fi

# Function to backup the database
function backup_database() {
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  BACKUP_FILE="$BACKUP_DIR/skills_db_backup_$TIMESTAMP.sql"
  
  echo "=== Creating database backup ==="
  echo "Cloud SQL Instance: $DB_INSTANCE_NAME"
  echo "Backup file: $BACKUP_FILE"
  
  # Create a Cloud SQL proxy connection
  echo "=== Starting Cloud SQL proxy ==="
  DB_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format='value(connectionName)')
  
  # Start the proxy
  ./cloud-sql-proxy --instances=$DB_CONNECTION_NAME=tcp:5432 &
  PROXY_PID=$!
  
  # Wait for proxy to establish connection
  sleep 10
  echo "Cloud SQL proxy started with PID $PROXY_PID"
  
  # Get database credentials
  echo "Enter database user:"
  read DB_USER
  
  echo "Enter database password:"
  read -s DB_PASSWORD
  
  echo "Enter database name (default: skills_platform):"
  read DB_NAME
  DB_NAME=${DB_NAME:-skills_platform}
  
  # Create the backup
  echo "=== Creating backup ==="
  PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -p 5432 -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE
  
  echo "=== Backup created successfully ==="
  echo "Backup file: $BACKUP_FILE"
  
  # Stop the Cloud SQL proxy
  kill $PROXY_PID
}

# Function to restore database from backup
function restore_database() {
  # Find the latest backup file
  LATEST_BACKUP=$(find $BACKUP_DIR -name "skills_db_backup_*.sql" -type f -printf "%T@ %p\n" | sort -n | tail -1 | cut -d' ' -f2-)
  
  if [ -z "$LATEST_BACKUP" ]; then
    echo "No backup files found in $BACKUP_DIR. Aborting."
    exit 1
  fi
  
  echo "=== Restoring database from backup ==="
  echo "Cloud SQL Instance: $DB_INSTANCE_NAME"
  echo "Backup file: $LATEST_BACKUP"
  
  # Confirm restoration
  echo "WARNING: This will overwrite the current database. Are you sure? (y/n)"
  read CONFIRM
  if [ "$CONFIRM" != "y" ]; then
    echo "Restoration aborted."
    exit 0
  fi
  
  # Create a Cloud SQL proxy connection
  echo "=== Starting Cloud SQL proxy ==="
  DB_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format='value(connectionName)')
  
  # Start the proxy
  ./cloud-sql-proxy --instances=$DB_CONNECTION_NAME=tcp:5432 &
  PROXY_PID=$!
  
  # Wait for proxy to establish connection
  sleep 10
  echo "Cloud SQL proxy started with PID $PROXY_PID"
  
  # Get database credentials
  echo "Enter database user:"
  read DB_USER
  
  echo "Enter database password:"
  read -s DB_PASSWORD
  
  echo "Enter database name (default: skills_platform):"
  read DB_NAME
  DB_NAME=${DB_NAME:-skills_platform}
  
  # Restore the backup
  echo "=== Restoring backup ==="
  PGPASSWORD=$DB_PASSWORD pg_restore -h localhost -p 5432 -U $DB_USER -d $DB_NAME -c -C $LATEST_BACKUP
  
  echo "=== Restoration completed ==="
  
  # Stop the Cloud SQL proxy
  kill $PROXY_PID
}

# Main logic
case "$1" in
  backup)
    backup_database
    ;;
  restore)
    restore_database
    ;;
  *)
    echo "Unknown command: $1"
    echo "Usage:"
    echo "  $0 backup   # Create a database backup"
    echo "  $0 restore  # Restore the latest backup"
    exit 1
    ;;
esac

echo "=== Operation completed ==="