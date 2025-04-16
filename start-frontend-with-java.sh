#!/bin/bash

# This script starts the Java backend first, then the Node.js frontend
# This ensures the proper coordination between the two services

# Display header
echo "==============================================="
echo "  Starting Skills Management Application"
echo "  (Java Backend + React Frontend)"
echo "==============================================="

# First check if the Java backend is already running
if lsof -i :8080 > /dev/null 2>&1; then
  echo "Port 8080 is already in use. If this is the Java backend, you're good to go."
  echo "If you need to restart, please stop whatever is using port 8080 first."
  PS_OUTPUT=$(ps aux | grep java)
  echo "Current Java processes:"
  echo "$PS_OUTPUT"
else
  # Port 8080 is available, start the Java backend
  echo "Starting Java backend on port 8080..."
  
  # Set USE_JAVA_BACKEND environment variable
  export USE_JAVA_BACKEND=true
  
  # Start Java backend in the background
  cd java-backend
  ./mvnw spring-boot:run &
  JAVA_PID=$!
  cd ..
  
  echo "Java backend starting with PID: $JAVA_PID"
  echo "Waiting for Java backend to initialize (10 seconds)..."
  
  # Wait for the Java backend to initialize
  sleep 10
  
  # Check if Java process is still running
  if ps -p $JAVA_PID > /dev/null; then
    echo "Java backend started successfully."
  else
    echo "Error: Java backend failed to start."
    exit 1
  fi
fi

# Start the Node.js frontend
echo "Starting Node.js frontend in frontend-only mode..."
echo "This will use port 5000 for the frontend and proxy API requests to the Java backend on port 8080."
npm run dev

# Note: The Node.js server should automatically detect the Java backend
# and start in frontend-only mode, proxying API requests to the Java backend