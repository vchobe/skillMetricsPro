#!/bin/bash
# Development startup script with in-memory mode

# Force environment variables for development
export NODE_ENV=development
export USE_MEMORY_STORE=true
export USE_MEMORY_SESSION=true
export DISABLE_DB_FOR_DEV=true
export PORT=5010
export HOST=0.0.0.0
export SESSION_SECRET=development-session-secret

# Start the application in development mode
npm run dev