#!/bin/bash

# This script starts the Node.js server in frontend-only mode
# It simulates that a Java backend is already running on port 8080
# to make the Node.js server start in frontend-only mode on port 5000

echo "==============================================="
echo "  Starting Frontend in Java-compatible Mode"
echo "==============================================="

# Set environment variables to force frontend-only mode
export USE_JAVA_BACKEND=true
export PORT=5000

# Start the Node.js server
echo "Starting Node.js server in frontend-only mode..."
echo "This will run the frontend on port 5000 and expect Java on port 8080"
echo "------------------------"

# Run the Node.js server
npm run dev