#!/bin/bash

# This script starts both the mock Java backend and the frontend
# in the correct order to ensure proper backend detection

# Kill any existing Node.js processes
echo "Stopping any existing servers..."
pkill -f "node" || true
sleep 1

# Start mock Java backend first
echo "Starting mock Java backend on port 8080..."
node mock-java-backend.js &

# Save the PID of the mock Java backend
JAVA_PID=$!
echo "Mock Java backend starting with PID: $JAVA_PID"

# Wait for Java backend to start
echo "Waiting for mock Java backend to start..."
sleep 2

# Check if Java backend is actually running
if ! ps -p $JAVA_PID > /dev/null; then
  echo "Error: Mock Java backend failed to start"
  exit 1
fi

# Set environment variables for frontend
export USE_JAVA_BACKEND=true
export PORT=5000

echo "==============================================="
echo "  Starting Frontend in Java Mode"
echo "==============================================="
echo "The frontend will run on port 5000"
echo "API requests will be sent to mock Java backend on port 8080"
echo ""
echo "To test skill update functionality, log in and try creating/updating skills"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "Servers started. Press Ctrl+C to stop."
echo ""

# Start frontend
npm run dev 

# When frontend exits, kill the Java backend
kill $JAVA_PID