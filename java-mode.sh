#!/bin/bash

echo "Starting application in Java compatibility mode"
echo "This script will start the frontend server only and proxy API requests to the Java backend"

# Check if Java backend is running on port 8080
echo "Checking for Java backend on port 8080..."
if nc -z localhost 8080; then
  echo "✅ Java backend detected on port 8080"
else
  echo "❌ Java backend not detected on port 8080"
  echo "Make sure to start the Java backend before running this script"
  echo "You can start it with: cd java-backend && ./mvnw spring-boot:run"
  exit 1
fi

# Start the Node.js server in frontend-only mode
echo "Starting frontend server (proxying API requests to Java backend)..."
npm run dev