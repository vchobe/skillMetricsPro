#!/bin/bash

# This script starts the Node.js server in Java-compatibility mode
# by setting environment variables that force it to run on port 5000

echo "==============================================="
echo "  Starting Skills Management in Java Mode"
echo "==============================================="

# Set environment variables to force frontend-only mode
export USE_JAVA_BACKEND=true
export PORT=5000

# Start the Node.js server in frontend-only mode
echo "Starting Node.js server in Java-compatibility mode..."
echo "This will run on port 5000 and expect Java backend on port 8080"
echo "------------------------"

# Run the Node.js server
npm run dev