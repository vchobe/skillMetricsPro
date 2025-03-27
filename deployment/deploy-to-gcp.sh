#!/bin/bash
set -e

# Configuration
PROJECT_ID="skills-management-platform"  # Replace with your GCP project ID
REGION="us-central1"                     # GCP region 
SERVICE_NAME="skills-management-app"     # Cloud Run service name
DB_INSTANCE_NAME="skills-management-db"  # Cloud SQL instance name
DB_NAME="skills_platform"                # Database name
DB_USER="skills_admin"                   # Database user
DB_PORT="5432"                           # PostgreSQL port

# Generate a random password for the database
DB_PASSWORD=$(openssl rand -base64 16)

echo "=== Deploying Skills Management Platform to Google Cloud Platform ==="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo "Database Instance: $DB_INSTANCE_NAME"

# Ensure gcloud is configured for the project
echo "=== Configuring Google Cloud project ==="
gcloud config set project $PROJECT_ID

# Create Cloud SQL PostgreSQL instance if it doesn't exist
echo "=== Setting up Cloud SQL PostgreSQL instance ==="
if gcloud sql instances describe $DB_INSTANCE_NAME > /dev/null 2>&1; then
  echo "Cloud SQL instance $DB_INSTANCE_NAME already exists."
else
  echo "Creating Cloud SQL instance $DB_INSTANCE_NAME..."
  gcloud sql instances create $DB_INSTANCE_NAME \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=$REGION \
    --storage-type=SSD \
    --storage-size=10GB \
    --availability-type=ZONAL
  echo "Cloud SQL instance created successfully."
fi

# Create database user if it doesn't exist
echo "=== Setting up database user ==="
if gcloud sql users list --instance=$DB_INSTANCE_NAME | grep -q $DB_USER; then
  echo "Database user $DB_USER already exists."
else
  echo "Creating database user $DB_USER..."
  gcloud sql users create $DB_USER \
    --instance=$DB_INSTANCE_NAME \
    --password="$DB_PASSWORD"
  echo "Database user created successfully."
fi

# Create database if it doesn't exist
echo "=== Setting up database ==="
if gcloud sql databases list --instance=$DB_INSTANCE_NAME | grep -q $DB_NAME; then
  echo "Database $DB_NAME already exists."
else
  echo "Creating database $DB_NAME..."
  gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME
  echo "Database created successfully."
fi

# Get the Cloud SQL connection name
DB_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format='value(connectionName)')
echo "Cloud SQL Connection Name: $DB_CONNECTION_NAME"

# Set environment variables for database connection in a tempfile
echo "=== Creating environment variables file ==="
cat << EOF > .env.cloud
DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}
NODE_ENV=production
EOF

# Build and push the Docker image
echo "=== Building and pushing Docker image ==="
IMAGE_URL="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"
gcloud builds submit --tag $IMAGE_URL

# Generate a session secret
SESSION_SECRET=$(openssl rand -hex 32)

# Get Mailjet credentials if they exist
MAILJET_API_KEY=$(gcloud secrets versions access latest --secret="MAILJET_API_KEY" 2>/dev/null || echo "")
MAILJET_SECRET_KEY=$(gcloud secrets versions access latest --secret="MAILJET_SECRET_KEY" 2>/dev/null || echo "")

# Create environment variables for deployment
CLOUD_SQL_CONNECTION="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${DB_CONNECTION_NAME}"
ENV_VARS="DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME},CLOUD_SQL_URL=${CLOUD_SQL_CONNECTION},CLOUD_SQL_CONNECTION_NAME=${DB_CONNECTION_NAME},DB_USER=${DB_USER},DB_PASSWORD=${DB_PASSWORD},DB_NAME=${DB_NAME},NODE_ENV=production,USE_CLOUD_SQL=true,PORT=8080,HOST=0.0.0.0,SESSION_SECRET=${SESSION_SECRET}"

# Add Mailjet keys if they exist
if [ -n "$MAILJET_API_KEY" ] && [ -n "$MAILJET_SECRET_KEY" ]; then
  ENV_VARS="${ENV_VARS},MAILJET_API_KEY=${MAILJET_API_KEY},MAILJET_SECRET_KEY=${MAILJET_SECRET_KEY}"
  echo "Added Mailjet credentials to deployment environment"
else
  echo "Warning: Mailjet credentials not found. Email functionality will be limited."
fi

echo "Cloud SQL connection string format: ${CLOUD_SQL_CONNECTION//${DB_PASSWORD}/****}"

# Deploy to Cloud Run with Cloud SQL connection
echo "=== Deploying to Cloud Run ==="
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_URL \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances $DB_CONNECTION_NAME \
  --update-env-vars "$ENV_VARS" \
  --cpu=1 \
  --memory=1Gi \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300s

# Get the URL of the deployed service
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format='value(status.url)')
echo "=== Deployment complete! ==="
echo "Your application is available at: $SERVICE_URL"
echo "Cloud SQL Instance: $DB_INSTANCE_NAME"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Password has been set and stored in environment variables."

# Clean up
rm .env.cloud

echo "=== Next steps ==="
echo "1. Initialize the database schema and test data using the setup script:"
echo "   ./deployment/setup-database.sh"