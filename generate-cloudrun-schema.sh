#!/bin/bash

# Exit on error
set -e

# Configuration variables
OUTPUT_DIR="cloud-build-tmp"

# Create output directory if it doesn't exist
mkdir -p $OUTPUT_DIR

# Run the generate-schema.js script
echo "Generating schema.sql from Drizzle schema definitions..."
node generate-schema.js

# Copy the schema.sql to the output directory
echo "Copying schema.sql to $OUTPUT_DIR..."
cp schema.sql $OUTPUT_DIR/

# Print success message
echo "Schema generation complete!"
echo "The schema has been generated at schema.sql and copied to $OUTPUT_DIR/schema.sql"
echo "Use this SQL file to initialize your Cloud SQL database."