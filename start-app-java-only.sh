#!/bin/bash

echo "Checking if Java backend is running on port 8080..."

# Try to connect to the Java backend on port 8080
if nc -z localhost 8080; then
  echo "✅ Java backend detected on port 8080"
else
  echo "❌ Java backend not detected on port 8080"
  echo "Make sure the Java backend is running before starting the frontend"
  echo "You can start it with: cd java-backend && ./mvnw spring-boot:run"
  exit 1
fi

# Start the frontend-only server
echo "Starting frontend server..."
./run-frontend-only.sh