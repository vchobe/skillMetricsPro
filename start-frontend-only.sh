#!/bin/bash

# This script starts the frontend server in frontend-only mode
# It assumes Java backend is already running on port 8080

echo "==============================================="
echo "  Starting Frontend for Skills Management"
echo "  (Frontend-only mode with Java Backend)"
echo "==============================================="

# Set up environment variables
export USE_JAVA_BACKEND=true

# Check if Java backend is running
echo "Checking if Java backend is running on port 8080..."
if ! curl -s http://localhost:8080/api/info > /dev/null; then
  echo "Warning: Java backend does not appear to be running."
  echo "Please start the Java backend first with ./start-java-backend.sh"
  echo "Do you want to continue anyway? (y/n)"
  read -r response
  if [[ "$response" != "y" ]]; then
    echo "Exiting. Please start the Java backend first."
    exit 1
  fi
  echo "Continuing without verifying Java backend..."
else
  echo "Java backend detected on port 8080."
fi

# Start the frontend server on port 5000
echo "Starting frontend server in frontend-only mode on port 5000..."
PORT=5000 npm run dev