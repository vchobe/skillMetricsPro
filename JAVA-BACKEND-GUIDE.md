# Java Backend Usage Guide

This guide explains how to run the Skills Management application with the Java Spring Boot backend.

## Current Backend Status

The application has a dual-backend architecture:
- Original Node.js/Express backend 
- Migrated Java Spring Boot backend

The Node.js backend starts automatically in the "Start application" workflow, but to use the Java backend, you need to run it separately.

## Prerequisites

- PostgreSQL database (as specified in the DATABASE_URL environment variable)
- Java Development Kit (JDK) 17+
- Maven (or use the included Maven wrapper `./mvnw`)

## Starting the Java Backend

The Java backend and Node.js frontend need to be started separately to work together.

### Step 1: Start the Java Backend

1. Open a terminal
2. Run the Java backend script:
   ```bash
   ./start-java-backend.sh
   ```
3. Wait for the Java Spring Boot application to start up
   - You should see log messages indicating the server has started
   - Look for something like "Started ApiApplication in X.XXX seconds"

### Step 2: Start the Frontend in "Frontend-Only" Mode

In a separate terminal:
1. Run the frontend script:
   ```bash
   ./start-frontend-only.sh
   ```
2. This will start the Node.js server in "frontend-only" mode on port 5000
3. It will proxy all API requests to the Java backend running on port 8080

## Troubleshooting

### "No Java backend detected" Message

This message appears when:
- The Java backend is not running on port 8080 when the Node.js server starts
- There's another service using port 8080 that isn't the Java backend

Solution:
1. Stop all services (including the Node.js server)
2. Start the Java backend first
3. Then start the frontend in frontend-only mode

### Port Conflicts

If port 8080 is already in use:
1. Identify what's using the port: `lsof -i :8080` or `ps aux | grep java`
2. Stop the process
3. Then start the Java backend

## Testing the Java Backend API

Use the test script to verify the Java backend API functionality:
```bash
./test-skill-update.sh
```

This script tests:
- Authentication
- Creating skills
- Updating skills (using PATCH and PUT methods)
- Creating pending skill updates
- Retrieving pending updates

## Skill Update Fix

The recent skill update fix addressed:
1. HTTP method compatibility (PATCH vs PUT)
2. Field naming compatibility between Node.js and Java backends
3. Endpoint path compatibility for pending skill updates

All these fixes are applied in the Java backend code and don't require frontend changes.