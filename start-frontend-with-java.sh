#!/bin/bash

# Script to run the frontend configured to work with the Java backend
# This script is designed to work within the Replit environment

# Set environment variable for Java backend
export USE_JAVA_BACKEND=true

# Output configuration
echo "Starting frontend with Java backend configuration"
echo "USE_JAVA_BACKEND=$USE_JAVA_BACKEND"

# Start the frontend using npm
echo "Starting frontend with 'npm run dev'..."
npm run dev