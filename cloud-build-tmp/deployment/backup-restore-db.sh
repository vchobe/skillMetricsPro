#!/bin/bash
set -e

# Help information
show_help() {
  echo "Usage: $0 [command] [options]"
  echo ""
  echo "Database backup and restore utility for Skills Management Platform"
  echo ""
  echo "Commands:"
  echo "  backup    Create a database backup"
  echo "  restore   Restore a database from backup"
  echo "  list      List available backups"
  echo ""
  echo "Options:"
  echo "  --project-id=ID         Google Cloud Project ID (required)"
  echo "  --region=REGION         Google Cloud region [default: us-central1]"
  echo "  --db-instance=NAME      Cloud SQL instance name [default: skills-management-db]"
  echo "  --db-name=NAME          Database name [default: skills_platform]"
  echo "  --db-user=USER          Database user [default: skills_admin]"
  echo "  --bucket=NAME           GCS bucket name for backups [default: PROJECT_ID-db-backups]"
  echo "  --file=NAME             Backup file name (for restore) or custom name (for backup)"
  echo "  --local                 Use local file instead of GCS bucket"
  echo "  --no-confirm            Skip confirmation prompts"
  echo "  --debug                 Enable debug mode (verbose output)"
  echo "  --help                  Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 backup --project-id=my-project-123"
  echo "  $0 restore --project-id=my-project-123 --file=backup-2025-04-01.sql.gz"
  echo "  $0 list --project-id=my-project-123"
  exit 0
}

if [ "$1" == "--help" ] || [ "$1" == "-h" ] || [ -z "$1" ]; then
  show_help
fi

# Get the command
COMMAND="$1"
shift

# Validate command
if [ "$COMMAND" != "backup" ] && [ "$COMMAND" != "restore" ] && [ "$COMMAND" != "list" ]; then
  echo "Error: Invalid command '$COMMAND'"
  echo "Valid commands are: backup, restore, list"
  echo "Use --help for usage information."
  exit 1
fi

# Default configuration
PROJECT_ID=""                       # GCP project ID (must be provided)
REGION="us-central1"                # GCP region
DB_INSTANCE_NAME="skills-management-db" # Cloud SQL instance name
DB_NAME="skills_platform"           # Database name
DB_USER="skills_admin"              # Database user
BACKUP_FILE=""                      # Backup file name
USE_LOCAL=false                     # Use local file instead of GCS
NO_CONFIRM=false                    # Skip confirmation prompts
DEBUG=false                         # Debug mode
BUCKET=""                           # GCS bucket name (default: PROJECT_ID-db-backups)

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
    --bucket=*)
      BUCKET="${arg#*=}"
      shift
      ;;
    --file=*)
      BACKUP_FILE="${arg#*=}"
      shift
      ;;
    --local)
      USE_LOCAL=true
      shift
      ;;
    --no-confirm)
      NO_CONFIRM=true
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

# Set default bucket name if not provided
if [ -z "$BUCKET" ]; then
  BUCKET="${PROJECT_ID}-db-backups"
fi

# Generate default backup file name if not provided for backup command
if [ "$COMMAND" == "backup" ] && [ -z "$BACKUP_FILE" ]; then
  TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
  BACKUP_FILE="${DB_NAME}_${TIMESTAMP}.sql.gz"
fi

# Check if backup file is provided for restore command
if [ "$COMMAND" == "restore" ] && [ -z "$BACKUP_FILE" ]; then
  echo "Error: Missing required parameter --file for restore command"
  echo "Use --help for usage information."
  exit 1
fi

echo "=== Database $COMMAND operation ==="
echo "Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Database instance: $DB_INSTANCE_NAME"
echo "  Database name: $DB_NAME"
echo "  Database user: $DB_USER"
if [ "$COMMAND" == "backup" ] || [ "$COMMAND" == "restore" ]; then
  echo "  Backup file: $BACKUP_FILE"
  if [ "$USE_LOCAL" = true ]; then
    echo "  Storage: Local file"
  else
    echo "  Storage: GCS bucket $BUCKET"
  fi
fi

# Ensure gcloud is configured for the project
echo "=== Configuring Google Cloud project ==="
gcloud config set project $PROJECT_ID

# Create GCS bucket if it doesn't exist and we're not using local storage
if [ "$USE_LOCAL" != true ]; then
  if ! gsutil ls -b "gs://$BUCKET" > /dev/null 2>&1; then
    echo "Creating GCS bucket $BUCKET..."
    gsutil mb -l $REGION "gs://$BUCKET"
    echo "GCS bucket created successfully."
  else
    echo "GCS bucket $BUCKET already exists."
  fi
fi

# Get Cloud SQL instance connection name
DB_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format='value(connectionName)')
if [ -z "$DB_CONNECTION_NAME" ]; then
  echo "Error: Could not retrieve Cloud SQL instance connection name."
  exit 1
fi

# List available backups
if [ "$COMMAND" == "list" ]; then
  if [ "$USE_LOCAL" = true ]; then
    echo "Listing local backup files:"
    ls -la *.sql.gz 2>/dev/null || echo "No local backup files found."
  else
    echo "Listing backup files in GCS bucket $BUCKET:"
    if gsutil ls "gs://$BUCKET" > /dev/null 2>&1; then
      gsutil ls -la "gs://$BUCKET/*.sql.gz" 2>/dev/null || echo "No backup files found in bucket."
    else
      echo "Bucket does not exist or is empty."
    fi
  fi
  exit 0
fi

# Get database password
echo "Retrieving database password..."
DB_PASSWORD=$(gcloud sql users describe $DB_USER --instance=$DB_INSTANCE_NAME --format='value(password)' 2>/dev/null || echo "")

if [ -z "$DB_PASSWORD" ]; then
  echo "Could not retrieve database password automatically."
  if [ "$NO_CONFIRM" != true ]; then
    echo -n "Enter database password for $DB_USER: "
    read -s DB_PASSWORD
    echo ""
  else
    echo "Error: Cannot proceed without database password in non-interactive mode."
    exit 1
  fi
fi

# Backup database
if [ "$COMMAND" == "backup" ]; then
  echo "=== Backing up database $DB_NAME from instance $DB_INSTANCE_NAME ==="
  
  # Ask for confirmation
  if [ "$NO_CONFIRM" != true ]; then
    echo -n "Are you sure you want to create a backup? (y/n): "
    read CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
      echo "Backup cancelled."
      exit 0
    fi
  fi
  
  # Create temporary backup file
  TEMP_BACKUP="/tmp/$BACKUP_FILE"
  
  echo "Creating backup..."
  gcloud sql export sql $DB_INSTANCE_NAME "gs://$BUCKET/$BACKUP_FILE" \
    --database=$DB_NAME \
    --offload
  
  echo "Backup file created: gs://$BUCKET/$BACKUP_FILE"
  
  # Download the backup if using local storage
  if [ "$USE_LOCAL" = true ]; then
    echo "Downloading backup to local file..."
    gsutil cp "gs://$BUCKET/$BACKUP_FILE" ./$BACKUP_FILE
    echo "Local backup file created: ./$BACKUP_FILE"
  fi
  
  echo "Backup completed successfully."
  exit 0
fi

# Restore database
if [ "$COMMAND" == "restore" ]; then
  echo "=== Restoring database $DB_NAME from backup ==="
  
  # Check if backup file exists
  if [ "$USE_LOCAL" = true ]; then
    if [ ! -f "$BACKUP_FILE" ]; then
      echo "Error: Local backup file $BACKUP_FILE not found."
      exit 1
    fi
    
    # Upload to GCS for restoration
    echo "Uploading local backup to GCS bucket..."
    gsutil cp "$BACKUP_FILE" "gs://$BUCKET/$BACKUP_FILE"
  else
    if ! gsutil stat "gs://$BUCKET/$BACKUP_FILE" > /dev/null 2>&1; then
      echo "Error: Backup file gs://$BUCKET/$BACKUP_FILE not found."
      exit 1
    fi
  fi
  
  # Ask for confirmation
  if [ "$NO_CONFIRM" != true ]; then
    echo "WARNING: This will overwrite the current database $DB_NAME!"
    echo -n "Are you sure you want to proceed with the restoration? (y/n): "
    read CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
      echo "Restoration cancelled."
      exit 0
    fi
  fi
  
  echo "Restoring database from backup..."
  gcloud sql import sql $DB_INSTANCE_NAME "gs://$BUCKET/$BACKUP_FILE" \
    --database=$DB_NAME
  
  echo "Restoration completed successfully."
  exit 0
fi