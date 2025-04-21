#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e
# Treat unset variables as an error when substituting.
set -u
# Prevent errors in a pipeline from being masked.
set -o pipefail

# --- Configuration ---
# !!! Required: Set your desired region if not us-central1 !!!
REGION="us-central1"
# Set the specific Project ID
PROJECT_ID="imposing-elixir-440911-u9"
# Service names (customize if needed)
# IMPORTANT: THIS WILL BE CONVERTED TO LOWERCASE FOR SOME RESOURCES
ORIGINAL_SERVICE_NAME="skillMetrics" # Set desired Cloud Run service name

# Convert service name to lowercase for resources that require it (like Cloud SQL)
SERVICE_NAME_LOWER=$(echo "${ORIGINAL_SERVICE_NAME}" | tr '[:upper:]' '[:lower:]')
# Create a CONSISTENT SQL instance name based on the lowercase service name
SQL_INSTANCE_NAME="${SERVICE_NAME_LOWER}-db"
DB_NAME="appdb"
# You can set a specific user, or let the script generate one
DB_USER="app_user"
# Artifact Registry repo name
AR_REPO_NAME="cloud-run-source-deploy" # Default used by gcloud run deploy
# Cloud Build config file
CLOUDBUILD_CONFIG="cloudbuild_gcp.yaml"

# --- Auto-detected/Generated Variables (Project ID is now hardcoded above) ---
# Validate the hardcoded Project ID
if [ -z "$PROJECT_ID" ]; then
  echo "Error: PROJECT_ID is not set in the script!"
  exit 1
fi
# Use the valid, lowercase SQL instance name for the connection string
SQL_INSTANCE_CONNECTION_NAME="${PROJECT_ID}:${REGION}:${SQL_INSTANCE_NAME}"

# --- Generate Secure Passwords ---
# IMPORTANT: Store these passwords securely if needed outside the script.
# These will be generated ONCE when the user/instance is first created,
# and then reset on subsequent runs if the user/instance already exists.
DB_ROOT_PASSWORD=$(openssl rand -base64 16)
DB_PASSWORD=$(openssl rand -base64 16)
# Construct Database URL using the generated password and correct connection name
DATABASE_URL_FORMAT="mysql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${SQL_INSTANCE_CONNECTION_NAME}"

echo "--- Configuration ---"
echo "Project ID:                   ${PROJECT_ID}"
echo "Region:                       ${REGION}"
echo "Original Cloud Run Service Name: ${ORIGINAL_SERVICE_NAME}"
echo "Cloud SQL Instance Name:      ${SQL_INSTANCE_NAME}"
echo "Database Name:                ${DB_NAME}"
echo "Database User:                ${DB_USER}"
echo "Artifact Registry Repo:       ${AR_REPO_NAME}"
echo "Cloud Build Config:           ${CLOUDBUILD_CONFIG}"
echo "--- Starting Deployment ---"

# 1. Enable Necessary APIs
echo "1. Enabling Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project=$PROJECT_ID

# 2. Create Cloud SQL Instance (if it doesn't exist)
echo "2. Checking/Creating Cloud SQL Instance..."
# Use the consistent, lowercase SQL instance name here
if ! gcloud sql instances describe $SQL_INSTANCE_NAME --project=$PROJECT_ID &> /dev/null ; then
  echo "   Creating Cloud SQL instance: $SQL_INSTANCE_NAME..."
  # Set root password during creation only
  gcloud sql instances create $SQL_INSTANCE_NAME \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=$REGION \
    --root-password=$DB_ROOT_PASSWORD \
    --project=$PROJECT_ID
  echo "   Waiting for instance to be ready... This can take several minutes."
  sleep 120 # Allow time for instance creation
else
  echo "   Cloud SQL Instance '$SQL_INSTANCE_NAME' already exists."
  # Reset root password on subsequent runs for idempotency (consider Secret Manager for production)
  echo "   Setting/Updating Cloud SQL root password (idempotency)..."
  gcloud sql users set-password root --host=% \
    --instance=$SQL_INSTANCE_NAME \
    --password=$DB_ROOT_PASSWORD \
    --project=$PROJECT_ID
fi

# 3. Create Database (if it doesn't exist)
echo "3. Checking/Creating Database '$DB_NAME'..."
# Now uses the consistent SQL_INSTANCE_NAME for checking
if ! gcloud sql databases describe $DB_NAME --instance=$SQL_INSTANCE_NAME --project=$PROJECT_ID &> /dev/null ; then
  echo "   Creating database '$DB_NAME'..."
  gcloud sql databases create $DB_NAME \
    --instance=$SQL_INSTANCE_NAME \
    --project=$PROJECT_ID
else
  echo "   Database '$DB_NAME' already exists."
fi

# 4. Create Database User (if it doesn't exist)
echo "4. Checking/Creating Database User '$DB_USER'..."
# Now uses the consistent SQL_INSTANCE_NAME for checking
if ! gcloud sql users list --instance=$SQL_INSTANCE_NAME --project=$PROJECT_ID --format='value(name)' | grep -q "^${DB_USER}$"; then
    echo "   Creating database user '$DB_USER'..."
    gcloud sql users create $DB_USER --host=% \
        --instance=$SQL_INSTANCE_NAME \
        --password=$DB_PASSWORD \
        --project=$PROJECT_ID
else
    echo "   Database user '$DB_USER' already exists. Setting/Updating password..."
    # Reset user password on subsequent runs for idempotency
    gcloud sql users set-password $DB_USER --host=% \
        --instance=$SQL_INSTANCE_NAME \
        --password=$DB_PASSWORD \
        --project=$PROJECT_ID
fi

# 5. Create Artifact Registry Docker Repository (if it doesn't exist)
echo "5. Checking/Creating Artifact Registry Repository..."
if ! gcloud artifacts repositories describe $AR_REPO_NAME --location=$REGION --project=$PROJECT_ID &> /dev/null ; then
  echo "   Creating Artifact Registry repository '$AR_REPO_NAME' in region ${REGION}..."
  gcloud artifacts repositories create $AR_REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for Cloud Run source deployments" \
    --project=$PROJECT_ID
else
  echo "   Artifact Registry repository '$AR_REPO_NAME' already exists in region ${REGION}."
fi

# 6. Build and Push Container Image using Cloud Build with YAML config
echo "6. Building and pushing container image using ${CLOUDBUILD_CONFIG}..."
IMAGE_TAG=$(git rev-parse --short HEAD || date +%Y%m%d-%H%M%S)
LATEST_BUILT_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO_NAME}/${ORIGINAL_SERVICE_NAME}:${IMAGE_TAG}"
gcloud builds submit --config $CLOUDBUILD_CONFIG \
  --substitutions="_REGION=${REGION},_AR_REPO_NAME=${AR_REPO_NAME},_SERVICE_NAME=${ORIGINAL_SERVICE_NAME},SHORT_SHA=${IMAGE_TAG}" \
  --project=$PROJECT_ID

echo "   Image build submitted. Using image: ${LATEST_BUILT_IMAGE}"

# 7. Deploy to Cloud Run (Creates or Updates)
echo "7. Deploying service '$ORIGINAL_SERVICE_NAME' to Cloud Run..."
gcloud run deploy $ORIGINAL_SERVICE_NAME \
  --image=$LATEST_BUILT_IMAGE \
  --platform managed \
  --region=$REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances=$SQL_INSTANCE_CONNECTION_NAME \
  --set-env-vars="NODE_ENV=production,HOST=0.0.0.0,PORT=8080,DATABASE_URL=${DATABASE_URL_FORMAT}" \
  --project=$PROJECT_ID

# --- Database Schema Migration ---
echo "--- Running Database Schema Migration --- (Requires local Node.js setup)"

# 8. Ensure dependencies are installed locally for migration script
echo "8. Installing/Verifying npm dependencies locally for migration..."
if [ -f "package-lock.json" ]; then
  npm ci --ignore-scripts
else
  npm install --ignore-scripts
fi

# 9. Run db:push using Cloud SQL Auth Proxy
echo "9. Starting Cloud SQL Auth Proxy and running 'npm run db:push'..."

PROXY_DIR="/cloudsql"
sudo mkdir -p $PROXY_DIR
sudo chmod 777 $PROXY_DIR # Need write permissions for socket

if [ ! -f ./cloud_sql_proxy ]; then
    echo "    Downloading Cloud SQL Auth Proxy..."
    wget https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.10.0/cloud-sql-proxy.linux.amd64 -O cloud_sql_proxy
    chmod +x ./cloud_sql_proxy
fi

echo "    Starting proxy in background..."
# Use the consistent SQL_INSTANCE_CONNECTION_NAME
./cloud_sql_proxy --unix-socket=${PROXY_DIR} ${SQL_INSTANCE_CONNECTION_NAME} &> /tmp/proxy.log &
PROXY_PID=$!

sleep 8
if ! kill -0 $PROXY_PID > /dev/null 2>&1; then
    echo "Error: Cloud SQL Auth Proxy failed to start. Check logs: /tmp/proxy.log"
    cat /tmp/proxy.log
    sudo rm -rf $PROXY_DIR
    exit 1
fi

echo "    Proxy started (PID: $PROXY_PID). Running migration..."

# Use the correct connection string format for Unix socket and consistent connection name
export DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?socketPath=${PROXY_DIR}/${SQL_INSTANCE_CONNECTION_NAME}"

if npm run db:push; then
  echo "    Database migration ('npm run db:push') completed successfully."
else
  echo "Error: Database migration ('npm run db:push') failed."
  echo "    Stopping Cloud SQL Auth Proxy (PID: $PROXY_PID)..."
  kill $PROXY_PID
  wait $PROXY_PID 2>/dev/null || true
  sudo rm -rf $PROXY_DIR
  exit 1
fi

echo "    Stopping Cloud SQL Auth Proxy (PID: $PROXY_PID)..."
kill $PROXY_PID
wait $PROXY_PID 2>/dev/null || true

sudo rm -rf $PROXY_DIR
echo "    Proxy stopped and socket directory removed."

# --- Deployment Complete ---
echo "--- Deployment Summary --- (Please allow a minute for service to stabilize)"
SERVICE_URL=$(gcloud run services describe $ORIGINAL_SERVICE_NAME --platform managed --region $REGION --format='value(status.url)' --project=$PROJECT_ID)
echo "Cloud Run Service Deployed: ${ORIGINAL_SERVICE_NAME}"
echo "Service URL:                ${SERVICE_URL}"
echo "Cloud SQL Instance:         ${SQL_INSTANCE_NAME}"
echo "Database Name:              ${DB_NAME}"
echo "Database User:              ${DB_USER}"
echo "Database User Password:     ${DB_PASSWORD} (Keep this safe!) HINT: Check script output history if lost."
echo "Database **ROOT** Password: ${DB_ROOT_PASSWORD} (KEEP THIS SAFE!) HINT: Check script output history if lost."
echo "--------------------------"
echo "Deployment script finished successfully."