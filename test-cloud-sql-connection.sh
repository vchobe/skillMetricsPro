#!/bin/bash
# Script to test and verify Cloud SQL connection

# Set environment variables for database connection
export PGHOST=34.30.6.95
export PGUSER=neondb_owner
export PGPASSWORD=npg_6SNPYmkEt5pa
export PGDATABASE=neondb
export DATABASE_URL=postgresql://$PGUSER:$PGPASSWORD@$PGHOST/$PGDATABASE

# Print configuration (with masked password)
echo "===== Cloud SQL Connection Test ====="
echo "Host: $PGHOST"
echo "User: $PGUSER"
echo "Database: $PGDATABASE"
echo "Connection URL: postgresql://$PGUSER:****@$PGHOST/$PGDATABASE"
echo "================================="

# Test Node.js connection
echo -e "\n1. Testing Node.js connection..."
node test-cloud-sql-direct.mjs
if [ $? -eq 0 ]; then
  echo "✅ Node.js connection test passed"
else
  echo "❌ Node.js connection test failed"
  exit 1
fi

# Create a temporary SQL script
echo -e "\n2. Testing direct psql command..."
cat > /tmp/test-query.sql << EOF
\echo 'Connected to PostgreSQL'
SELECT version();
\echo 'Listing some tables:'
\dt
\echo 'Done'
EOF

# Run the SQL script using psql
PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f /tmp/test-query.sql

if [ $? -eq 0 ]; then
  echo "✅ psql connection test passed"
else
  echo "❌ psql connection test failed"
  exit 1
fi

# Check user and permissions
echo -e "\n3. Checking database user and permissions..."
cat > /tmp/check-permissions.sql << EOF
SELECT current_user, current_database();
SELECT table_catalog, table_schema, table_name, privilege_type
FROM information_schema.table_privileges 
WHERE grantee = current_user
LIMIT 10;
EOF

PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f /tmp/check-permissions.sql

echo -e "\n===== Connection Tests Complete ====="
echo "All tests passed successfully!"