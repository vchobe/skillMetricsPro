#!/bin/bash

# This script runs the mock Java backend and the frontend in Java mode
# to test the skill update fix without needing the full Spring Boot build

echo "==============================================="
echo "  Testing Skill Update Fix with Mock Java"
echo "==============================================="

# Kill any existing servers
echo "Stopping any existing servers..."
pkill -f "node" || echo "No existing Node.js servers"
sleep 2

# Start mock Java backend
echo "Starting mock Java backend on port 8080..."
node mock-java-backend.js &
MOCK_PID=$!

echo "Mock Java backend starting with PID: $MOCK_PID"
echo "Waiting for mock Java backend to start..."
sleep 3

# Check if mock Java backend is running
if ! curl -s http://localhost:8080/api/info > /dev/null; then
  echo "Error: Failed to start mock Java backend"
  kill $MOCK_PID 2>/dev/null
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
echo "You can also run: ./test-skill-update.sh"
echo ""
echo "Press Ctrl+C to stop both servers"

# Start frontend server
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
echo "Servers started. Press Ctrl+C to stop."
wait $FRONTEND_PID

# Cleanup on exit
echo "Stopping servers..."
kill $MOCK_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null