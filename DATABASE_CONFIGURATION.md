# Database Configuration

## Google Cloud SQL Configuration (Permanent)

This application has been configured to use Google Cloud SQL as its permanent database solution.

### Environment Variables

The following environment variables must be set for the application to connect to Google Cloud SQL:

- `CLOUD_SQL_CONNECTION_NAME`: The connection identifier for your Cloud SQL instance (format: project-id:region:instance-id)
- `CLOUD_SQL_DATABASE`: The name of your database within the Cloud SQL instance
- `CLOUD_SQL_USER`: The username for the database
- `CLOUD_SQL_PASSWORD`: The password for the database user
- `CLOUD_SQL_HOST`: The public IP address or hostname of your Google Cloud SQL instance
- `CLOUD_SQL_PORT`: The port number for your Google Cloud SQL instance (usually 5432 for PostgreSQL)
- `CLOUD_SQL_USE_SSL`: Whether to use SSL for the connection (true or false)

### Connection Methods

The application supports two connection methods to Google Cloud SQL:

1. **Direct TCP Connection**: Used when running the application locally or in environments where you can directly connect to the database via TCP/IP.
   - Requires `CLOUD_SQL_HOST` and `CLOUD_SQL_PORT`
   - Can use SSL if `CLOUD_SQL_USE_SSL` is set to 'true'

2. **Unix Socket Connection**: Used when running the application in Google Cloud Run.
   - Requires `CLOUD_SQL_CONNECTION_NAME`
   - Automatically used when `K_SERVICE` environment variable is present (indicating Cloud Run environment)

### Connection Fallback

The application no longer uses the Replit database connection. It exclusively uses Google Cloud SQL.

### Deployment Considerations

When deploying to Cloud Run, make sure to:

1. Set all the required environment variables
2. Add the Cloud SQL connection as a service attachment
3. Ensure the service account has proper permissions to access the Cloud SQL instance

### Local Development

For local development, you can use:

1. Direct connection to the Cloud SQL instance if it's publicly accessible, or
2. Cloud SQL Auth Proxy if the instance is not publicly accessible

## Database Schema

The database schema is defined in `shared/schema.ts` and managed using Drizzle ORM.

## Troubleshooting

If you encounter database connection issues:

1. Verify all environment variables are correctly set
2. Check network access permissions to the database
3. Ensure the database instance is running
4. Check the server logs for specific error messages