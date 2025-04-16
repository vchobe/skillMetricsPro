# Java Migration Guide

This document provides a guide to running and testing the application during the Java backend migration process.

## Overview

We're migrating the backend from Node.js to Java Spring Boot while keeping the React frontend. During this transition, the application can run in two modes:

1. **Standard Mode**: Node.js handles both frontend and backend (default)
2. **Java Mode**: Java handles the backend API, Node.js serves only the frontend

## How to Run the Application

### Standard Mode (Default)

This runs the full Node.js stack with both frontend and backend:

```bash
# In Replit, just click the Run button
# Or from the shell:
npm run dev
```

### Java Mode

Due to limitations with running Java in Replit's environment, we provide two ways to test Java mode:

#### Option 1: Using the Mock Java Backend (Recommended for Replit)

This runs a lightweight Node.js implementation that simulates the Java backend API:

```bash
./java-mode.sh
```

The script:
1. Starts a mock Java backend on port 8080
2. Starts the Node.js server in frontend-only mode on port 5000
3. Configures the API proxy to forward requests to the mock Java backend

#### Option 2: Using the Real Java Backend (For Local Development)

If you're developing locally and have Java installed:

```bash
# In separate terminals:
./start-java-backend.sh        # Start the Spring Boot backend
./start-frontend-only.sh       # Start the frontend in Java mode
```

## Testing the Skill Update Fix

The skill update functionality has been fixed to work with both backends. To test:

1. Start the application in Java mode using one of the options above
2. Log in to the application
3. Navigate to the Skills section
4. Create a new skill
5. Try updating the skill (this will use the Java-compatible API)

You can also run API tests directly:

```bash
./run-skill-update-test.sh
```

## Current Limitations

1. **No Maven Build in Replit**: The full Java build process often times out in Replit
2. **Authentication Differences**: Mock backend has simplified auth compared to Spring Security
3. **Limited WebSocket Support**: Mock backend doesn't implement all WebSocket functionality

## Deployment

For deployment:

1. The frontend continues to be built with Node.js
2. The backend is deployed as a separate Java Spring Boot application
3. In production, Java and Node.js run in separate containers with API forwarding

See `DEPLOYMENT-README.md` for detailed deployment instructions.

## Development Workflow

When working on features:

1. Develop and test using the Node.js backend first
2. Once working, ensure compatibility with Java backend
3. Add necessary compatibility layers or API adjustments
4. Update tests to verify functionality with both backends

## Structure

```
├── client/               # React frontend (TypeScript)
├── server/               # Node.js backend (Express)
├── java-backend/         # Java Spring Boot backend
├── shared/               # Shared types and interfaces
├── mock-java-backend.js  # Mock Java backend for testing
└── scripts/              # Utility scripts
```

## For More Information

See:
- `JAVA-MIGRATION-STATUS.md` - Current migration status
- `SKILL-UPDATE-FIX-SUMMARY.md` - Details on skill update fix
- `testing-skill-update-fix.md` - How to test skill update functionality