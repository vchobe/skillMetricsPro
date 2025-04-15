# Java Backend Integration Guide

This document explains how to run the application with the Java Spring Boot backend instead of the Node.js backend.

## Architecture Overview

The application has been refactored to work with two different backend implementations:

1. **Node.js Backend**: The original backend implementation using Express.js
2. **Java Backend**: The new Spring Boot implementation 

The frontend React application is designed to work with either backend.

## Starting the Application with Java Backend

### Option 1: Using the automated script

```bash
# 1. Start the Java backend first
cd java-backend
./mvnw spring-boot:run

# 2. In a new terminal, start the frontend-only server
./java-mode.sh
```

The `java-mode.sh` script will:
- Check if the Java backend is running on port 8080
- Start the Node.js server in frontend-only mode
- Proxy all API requests to the Java backend

### Option 2: Manual Configuration

If the automated script doesn't work for your environment:

```bash
# 1. Start the Java backend first
cd java-backend
./mvnw spring-boot:run

# 2. In a new terminal, start the frontend-only server
npm run dev
```

The application is designed to automatically detect if the Java backend is running on port 8080:
- If detected, it will start in frontend-only mode on port 5000
- If not detected, it will start the full Node.js stack on port 8080

## Deployment Configuration

When deploying the application with the Java backend:

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Configure the Java backend to serve the static files:
   - Copy the built frontend files from `dist/` to `java-backend/src/main/resources/static/`
   - The Spring Boot application is configured to serve these static files

3. Deploy the Java backend only:
   ```bash
   cd java-backend
   ./mvnw package
   java -jar target/skillmetrics-0.0.1-SNAPSHOT.jar
   ```

## API Compatibility

The Java backend implements the same API endpoints as the Node.js backend. If you encounter any compatibility issues, check the following:

1. URL paths should be identical
2. Request and response formats should match
3. Authentication mechanisms should be compatible

## Troubleshooting

### Port Conflicts

If you encounter port conflicts:
- Make sure no other application is using port 8080 (Java backend)
- Make sure no other application is using port 5000 (Frontend server)

### API Request Issues

If API requests fail:
- Check the browser console for CORS or network errors
- Verify the Java backend is properly running on port 8080
- Check the API request format matches what the Java backend expects

### Missing Features

If some features don't work with the Java backend:
- Check if the corresponding endpoint is implemented in the Java backend
- Compare the request/response format with the Node.js implementation

## Development Guidelines

When developing new features:

1. Implement the feature in both backends if possible
2. If implementing only in Java, make sure the API contract is maintained
3. Test thoroughly with both backends to ensure compatibility