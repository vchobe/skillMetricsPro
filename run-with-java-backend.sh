#!/bin/bash

# Kill any running Node.js server processes
echo "Stopping any running Node.js server processes..."
pkill -f "node.*server" || echo "No Node.js server processes were running"

# Set up environment variables
export USE_JAVA_BACKEND=true

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  echo "Please set the DATABASE_URL environment variable to connect to your PostgreSQL database"
  exit 1
fi

echo "Starting Java backend and frontend..."
echo "Database URL: $DATABASE_URL"

# First, start the Java backend in the background
echo "Starting Java backend..."
cd java-backend
./mvnw spring-boot:run &
JAVA_PID=$!

# Wait for Java backend to start up
echo "Waiting for Java backend to start up..."
sleep 10

# Check if Java process is still running
if ! ps -p $JAVA_PID > /dev/null; then
  echo "Error: Java backend failed to start"
  exit 1
fi

echo "Java backend started successfully with PID: $JAVA_PID"
echo "Java backend is running on port 8080"

# Return to the root directory
cd ..

# Start the frontend with Vite
echo "Starting frontend..."
npx vite --host 0.0.0.0 --port 3000 &
VITE_PID=$!

echo "Frontend started with PID: $VITE_PID"
echo "Frontend is running on port 3000"

# Display access information
echo "-------------------------------------------------"
echo "Application is now running!"
echo "Frontend: http://localhost:3000"
echo "Java Backend API: http://localhost:8080/api"
echo "-------------------------------------------------"
echo "Press Ctrl+C to stop both frontend and backend"

# Wait for Ctrl+C and then clean up
trap "echo 'Stopping application...'; kill $JAVA_PID $VITE_PID; exit" INT TERM

# Keep the script running
wait