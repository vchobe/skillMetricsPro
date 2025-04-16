#!/bin/bash

# This script runs the frontend in Java-compatible mode by:
# 1. Starting a mock Java backend on port 8080
# 2. Starting the frontend server in Java-compatibility mode

echo "==============================================="
echo "  Starting Frontend in Java-compatible Mode"
echo "==============================================="

# Kill any existing servers on port 8080
echo "Stopping any existing servers on port 8080..."
pkill -f "node.*8080" || echo "No existing node servers on port 8080"
sleep 1

# Start the mock Java backend
echo "Starting mock Java backend on port 8080..."
node simulate-java-backend.js &
MOCK_PID=$!
echo "Mock Java backend started with PID: $MOCK_PID"

# Wait for the mock Java backend to start
echo "Waiting for mock Java backend to start..."
sleep 2

# Set environment variables
export USE_JAVA_BACKEND=true
export PORT=5000

# Start the frontend
echo "==============================================="
echo "  Starting Frontend on port 5000"
echo "==============================================="
echo "The frontend will proxy API requests to port 8080"
echo "Press Ctrl+C to stop both servers"

# Start the Node.js server with a trap to ensure cleanup
npm run dev

# Kill the mock Java backend when the frontend stops
echo "Shutting down mock Java backend..."
kill $MOCK_PID