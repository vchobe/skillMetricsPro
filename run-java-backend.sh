#!/bin/bash

# Kill any running Node.js processes to free up resources
echo "Stopping any running Node.js processes..."
pkill -f "node" || echo "No Node.js processes were running"

# Set up environment variables
export USE_JAVA_BACKEND=true

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  echo "Please set the DATABASE_URL environment variable to connect to your PostgreSQL database"
  exit 1
fi

echo "Starting Java backend..."
echo "Database URL: $DATABASE_URL"

# Change to java-backend directory
cd java-backend

# Build and run the Spring Boot application
echo "Building and starting Spring Boot application..."
./mvnw spring-boot:run 

# Note: If the above command fails, you can try the following:
# ./mvnw clean package
# java -jar target/api-0.0.1-SNAPSHOT.jar