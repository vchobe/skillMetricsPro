#!/bin/bash
# Script to test Cloud SQL connection locally using Cloud SQL Auth Proxy

# Set environment variables
export PROJECT_ID="imposing-elixir-440911-u9"
export REGION="us-central1"
export CLOUD_SQL_INSTANCE="skillmetrics-db"
export INSTANCE_CONNECTION_NAME="$PROJECT_ID:$REGION:$CLOUD_SQL_INSTANCE"
export DB_USER="neondb_owner"
export DB_PASSWORD="npg_6SNPYmkEt5pa"
export DB_NAME="neondb"

# Check if Cloud SQL Auth Proxy is installed
if ! command -v cloud_sql_proxy &> /dev/null; then
    echo "Cloud SQL Auth Proxy not found. Please install it first."
    echo "https://cloud.google.com/sql/docs/postgres/connect-auth-proxy"
    exit 1
fi

# Start Cloud SQL Auth Proxy in the background
echo "Starting Cloud SQL Auth Proxy for $INSTANCE_CONNECTION_NAME..."
cloud_sql_proxy -instances=$INSTANCE_CONNECTION_NAME=tcp:5432 &
PROXY_PID=$!

# Wait for the proxy to start
sleep 5

# Set environment variables for the application
export NODE_ENV=production
export USE_CLOUD_SQL=true
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

echo "Environment set up for Cloud SQL connection via proxy"
echo "DATABASE_URL: $DATABASE_URL"
echo "NODE_ENV: $NODE_ENV"
echo "USE_CLOUD_SQL: $USE_CLOUD_SQL"

# Run the application
echo "Starting application..."
npm run dev

# When the application exits, stop the proxy
kill $PROXY_PID
echo "Cloud SQL Auth Proxy stopped"