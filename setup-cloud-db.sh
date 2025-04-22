#!/bin/bash

# Exit on error
set -e

# Configuration - edit these values
PROJECT_ID="imposing-elixir-440911-u9"
REGION="us-central1"
INSTANCE_NAME="skillmetrics-db"
DB_NAME="appdb"
DB_USER="app_user"

# Get Cloud SQL IP address
CLOUD_SQL_IP=$(gcloud sql instances describe $INSTANCE_NAME \
  --project=$PROJECT_ID \
  --format='value(ipAddresses[0].ipAddress)')

if [ -z "$CLOUD_SQL_IP" ]; then
  echo "Error: Could not retrieve Cloud SQL IP address. Make sure the instance exists."
  exit 1
fi

echo "Cloud SQL Instance IP: $CLOUD_SQL_IP"

# Prompt for DB password (more secure than hardcoding)
read -s -p "Enter database password for user $DB_USER: " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
  echo "Error: Password cannot be empty"
  exit 1
fi

# Set environment variables for the script
export DB_HOST="$CLOUD_SQL_IP"
export DB_USER="$DB_USER"
export DB_PASSWORD="$DB_PASSWORD"
export DB_NAME="$DB_NAME"
export DB_PORT="5432"

echo "Running database setup script..."
node setup-cloud-database.js

echo "Script execution completed."