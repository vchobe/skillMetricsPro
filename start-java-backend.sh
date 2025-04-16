#!/bin/bash

# This script ensures no other processes are using port 8080
# and then starts the Java backend

echo "==============================================="
echo "  Starting Java Backend for Skills Management"
echo "==============================================="

# Stop any existing servers to free up port 8080
echo "Stopping any processes on port 8080..."
pkill -f "node" || echo "No Node.js processes were running"
sleep 2

# Double check port 8080 is free
echo "Verifying port 8080 is available..."
if nc -z localhost 8080 2>/dev/null; then
  echo "Error: Port 8080 is still in use. Please manually stop whatever is using it."
  exit 1
else
  echo "Port 8080 is available."
fi

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
cd java-backend || { echo "Error: java-backend directory not found"; exit 1; }

# Build and run the Spring Boot application
echo "Building and starting Spring Boot application..."
./mvnw spring-boot:run

echo "Java backend stopped."