#!/bin/bash

# Exit on error
set -e

# Directory to store dump files
DUMP_DIR="db_dumps"
mkdir -p $DUMP_DIR

# Timestamp for filenames
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Get the connection string from DATABASE_URL if available
if [ -n "$DATABASE_URL" ]; then
  echo "Using connection string from DATABASE_URL environment variable"
  
  # Parse DATABASE_URL to extract connection parts manually
  # URL format: postgresql://username:password@hostname:port/dbname?sslmode=require

  # Display what we're working with (obscuring password)
  SAFE_URL=$(echo "$DATABASE_URL" | sed 's/:[^:]*@/:***@/')
  echo "Database URL: $SAFE_URL"
  
  # Hardcode these values since we know the database connection details
  DB_HOST="ep-flat-shape-a51t7ga4.us-east-2.aws.neon.tech"
  DB_PORT="5432"
  DB_USER="neondb_owner"
  DB_NAME="neondb"
  
  # Extract password from DATABASE_URL
  DB_PASSWORD=$(echo "$DATABASE_URL" | grep -o ':[^:]*@' | sed 's/://' | sed 's/@//')
  
  echo "Using database details:"
  echo "  Host: $DB_HOST"
  echo "  Port: $DB_PORT"
  echo "  Database: $DB_NAME"
  echo "  User: $DB_USER"
  echo "  Password: [HIDDEN]"
else
  # Database settings - these will be overridden by environment variables if present
  DB_HOST=${DB_HOST:-"localhost"}
  DB_PORT=${DB_PORT:-"5432"}
  DB_NAME=${DB_NAME:-"neondb"}  # Assuming default db name from repository
  DB_USER=${DB_USER:-"neondb_owner"}  # Change to match your current db user
  
  # Prompt for password (don't store it in a file or show it)
  read -s -p "Enter PostgreSQL password for $DB_USER: " DB_PASSWORD
  echo ""
  
  echo "Using explicit connection parameters:"
  echo "  Host: $DB_HOST"
  echo "  Port: $DB_PORT"
  echo "  Database: $DB_NAME"
  echo "  User: $DB_USER"
  echo "  Password: [HIDDEN]"
fi

# Export as environment variable for pg_dump
export PGPASSWORD="$DB_PASSWORD"

echo "Extracting database schema and data from $DB_HOST:$DB_PORT/$DB_NAME..."

# Add SSL mode for Neon database
PG_SSL_MODE="require"
PG_COMMON_OPTIONS="--host=$DB_HOST --port=$DB_PORT --username=$DB_USER --dbname=$DB_NAME --no-owner --no-privileges"

# 1. Schema-only dump (no data, creates tables, functions, triggers, etc.)
echo "Creating schema-only dump..."
pg_dump $PG_COMMON_OPTIONS \
  --schema-only --no-comments \
  --file="$DUMP_DIR/schema_$TIMESTAMP.sql" \
  --sslmode=$PG_SSL_MODE

# 2. Full data dump (all tables with data)
echo "Creating full data dump..."
pg_dump $PG_COMMON_OPTIONS \
  --data-only --inserts \
  --file="$DUMP_DIR/data_$TIMESTAMP.sql" \
  --sslmode=$PG_SSL_MODE

# 3. Complete dump (schema + data) 
echo "Creating complete dump (schema + data)..."
pg_dump $PG_COMMON_OPTIONS \
  --clean --if-exists --create \
  --file="$DUMP_DIR/complete_$TIMESTAMP.sql" \
  --sslmode=$PG_SSL_MODE

# 4. Individual table dumps (useful if you need to load specific tables)
echo "Creating individual table dumps..."

# Get list of tables
TABLES=$(PGPASSWORD="$DB_PASSWORD" psql --host=$DB_HOST --port=$DB_PORT --username=$DB_USER --dbname=$DB_NAME \
  --sslmode=$PG_SSL_MODE -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")

mkdir -p "$DUMP_DIR/tables"

for TABLE in $TABLES; do
  TABLE=$(echo $TABLE | tr -d ' ')
  if [ -n "$TABLE" ]; then
    echo "Dumping table: $TABLE"
    pg_dump $PG_COMMON_OPTIONS \
      --table="$TABLE" --clean --if-exists \
      --file="$DUMP_DIR/tables/${TABLE}_$TIMESTAMP.sql" \
      --sslmode=$PG_SSL_MODE
  fi
done

echo "Creating import instruction file..."
cat > "$DUMP_DIR/import_instructions.txt" << 'EOF'
# Instructions for importing dumps into Cloud SQL PostgreSQL

## Option 1: Using complete dump

To import the complete dump (schema + data) to Cloud SQL:

1. Set up Cloud SQL Auth Proxy to connect to your Cloud SQL instance
   ```
   ./cloud_sql_proxy --port=5432 INSTANCE_CONNECTION_NAME &
   ```

2. Import the complete dump:
   ```
   psql -h localhost -p 5432 -U USERNAME -d DATABASE_NAME < complete_TIMESTAMP.sql
   ```

## Option 2: Using separate schema and data dumps

If you prefer to load schema and data separately:

1. First import the schema:
   ```
   psql -h localhost -p 5432 -U USERNAME -d DATABASE_NAME < schema_TIMESTAMP.sql
   ```

2. Then import the data:
   ```
   psql -h localhost -p 5432 -U USERNAME -d DATABASE_NAME < data_TIMESTAMP.sql
   ```

## Option 3: Using individual table dumps

If you need to import specific tables only:

1. Import individual table files:
   ```
   psql -h localhost -p 5432 -U USERNAME -d DATABASE_NAME < tables/TABLE_NAME_TIMESTAMP.sql
   ```

## Importing via gcloud SQL

You can also use gcloud command to import dumps directly to Cloud SQL:

```
gcloud sql import sql INSTANCE_NAME gs://BUCKET_NAME/PATH_TO_DUMP_FILE --database=DATABASE_NAME
```

Note: For this method, you need to upload the dump file to a Google Cloud Storage bucket first.
EOF

echo "Database export completed successfully!"
echo "Dump files can be found in the '$DUMP_DIR' directory"
echo "See '$DUMP_DIR/import_instructions.txt' for instructions on importing to Cloud SQL"

# Clean up password environment variable
unset PGPASSWORD