#!/bin/bash

echo "Starting frontend-only server (API redirected to Java backend)..."
echo "Using port 5000 for frontend, Java backend expected on port 8080"

# Run the frontend-only server
npx tsx server/frontend-only.ts