#!/bin/bash

# Start frontend only (assumes Java backend is running)
# This script starts the Node.js server in frontend-only mode

export USE_JAVA_BACKEND=true
export PORT=5000

echo "==============================================="
echo "  Starting Frontend in Java Mode"
echo "==============================================="
echo "The frontend will run on port 5000"
echo "API requests will be sent to Java backend on port 8080"
echo ""
echo "The Node.js server should detect the Java backend and run in frontend-only mode"
echo ""

npm run dev
