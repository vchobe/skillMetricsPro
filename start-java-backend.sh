#!/bin/bash

echo "Starting Skills Management Platform with Java backend..."
echo "Stopping any running Node.js processes..."

# Kill any running Node.js processes
pkill -f "node" || echo "No Node.js processes were running"

# Set environment variable to indicate Java backend is in use
export USE_JAVA_BACKEND=true

echo "Starting Java backend..."
cd java-backend
./mvnw spring-boot:run &
JAVA_PID=$!

echo "Java backend started with PID: $JAVA_PID"
echo "Java backend is running on port 8080"

# Start the frontend only
echo "Starting frontend to connect to Java backend..."
cd ..
npm run frontend-only

# If frontend exits, kill the Java backend
kill $JAVA_PID
echo "Application shutdown complete."