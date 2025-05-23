#!/bin/bash
# Customized deployment script for Cloud Run with Cloud SQL

# Set environment variables
export PROJECT_ID="imposing-elixir-440911-u9"
export REGION="us-central1"
export SERVICE_NAME="skillmetrics"
export CLOUD_SQL_INSTANCE="skillmetrics-db"
export DB_USER="neondb_owner"
export DB_PASSWORD="npg_6SNPYmkEt5pa"
export DB_NAME="neondb"
export DB_HOST="34.30.6.95"

# Build the container
echo "Building container image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run with Cloud SQL connection
echo "Deploying to Cloud Run with Cloud SQL connection..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances $PROJECT_ID:$REGION:$CLOUD_SQL_INSTANCE \
  --set-env-vars="NODE_ENV=production,PGHOST=$DB_HOST,PGUSER=$DB_USER,PGPASSWORD=$DB_PASSWORD,PGDATABASE=$DB_NAME,DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST/$DB_NAME"

echo "Deployment complete!"
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')"