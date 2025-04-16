#!/bin/bash

# Script to run both the Java backend and Node.js frontend
# This is designed to be used as the main run command for Replit

# Function to cleanup processes on exit
cleanup() {
  echo "Shutting down services..."
  kill $JAVA_PID 2>/dev/null
  kill $NODE_PID 2>/dev/null
  exit 0
}

# Set up trap to cleanup on exit
trap cleanup SIGINT SIGTERM EXIT

# Set Java backend flag
export USE_JAVA_BACKEND=true

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  echo "Please set the DATABASE_URL environment variable to connect to your PostgreSQL database"
  exit 1
fi

# Stop any existing processes on port 8080
echo "Stopping any existing processes on port 8080..."
pkill -f "node" || echo "No Node.js processes running"
pkill -f "java" || echo "No Java processes running"
sleep 2

# Start Java backend
echo "==============================================="
echo "  Starting Java Backend for Skills Management"
echo "==============================================="
echo "Starting Java backend on port 8080..."

# Change to java-backend directory
cd java-backend
./mvnw spring-boot:run &
JAVA_PID=$!
cd ..

echo "Java backend starting with PID: $JAVA_PID"
echo "Waiting for Java backend to initialize..."

# Wait for Java backend to start (max 60 seconds)
MAX_WAIT=60
WAIT_COUNT=0
while ! curl -s http://localhost:8080/api/info > /dev/null && [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  sleep 2
  WAIT_COUNT=$((WAIT_COUNT + 2))
  echo "Waiting for Java backend... ($WAIT_COUNT seconds)"
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
  echo "Warning: Timed out waiting for Java backend. Starting frontend anyway."
else
  echo "Java backend is up and running!"
fi

# Start Node.js frontend in frontend-only mode
echo "==============================================="
echo "  Starting Frontend for Skills Management"
echo "==============================================="
echo "Starting Node.js frontend on port 5000..."
PORT=5000 npm run dev &
NODE_PID=$!

echo "Frontend starting with PID: $NODE_PID"
echo "The application will be available on port 5000"
echo "API requests will be proxied to the Java backend on port 8080"

# Keep the script running to maintain both services
echo "==============================================="
echo "  Skills Management Application is Running"
echo "  Press Ctrl+C to stop all services"
echo "==============================================="
wait $NODE_PID