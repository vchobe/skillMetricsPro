# Skill Update Fix - Implementation Details

## Overview

This document provides technical details on the implementation of the skill update fix that enables compatibility between Node.js and Java backends.

## Problem Statement

Several issues were identified when migrating to the Java backend:

1. **HTTP Method Mismatch**: Node.js used PATCH for updates, Java used PUT
2. **Endpoint Path Differences**: Different paths for pending skill updates
3. **Field Naming Conventions**: Snake_case vs camelCase differences
4. **Backend Detection**: No mechanism to detect and use Java backend

## Implementation

### 1. Backend Detection (server/index.ts)

```typescript
// Function to check if Java backend is running on port 8080
const isJavaBackendRunning = async (): Promise<boolean> => {
  const testServer = http.createServer();
  return new Promise<boolean>((resolve) => {
    testServer.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        // Port 8080 is in use, likely Java backend
        console.log('Detected Java backend running on port 8080');
        resolve(true);
      } else {
        console.log('Error checking port 8080:', err.code);
        resolve(false);
      }
    });
    
    testServer.once('listening', () => {
      // Port 8080 is free, no Java backend
      testServer.close();
      resolve(false);
    });
    
    testServer.listen(8080, '0.0.0.0');
  });
};

// In the main startup code
const javaRunning = await isJavaBackendRunning();
  
if (javaRunning) {
  // Java backend detected, use alternative port for frontend-only mode
  const port = 5000;
  const host = "0.0.0.0";
  
  console.log(`Java backend detected on port 8080`);
  console.log(`Starting in frontend-only mode on port ${port}`);
  
  // Remove any existing API routes to avoid conflicts
  app._router.stack = app._router.stack.filter((layer: any) => {
    if (!layer.route) return true; // Keep middleware
    if (!layer.route.path) return true; // Keep routes without paths
    
    // Check if it's a string path starting with /api
    if (typeof layer.route.path === 'string' && layer.route.path.startsWith('/api')) {
      return false; // Filter out API routes
    }
    
    // For RegExp paths, keep them all (they're likely not API routes)
    return true;
  });
  
  // Setup API proxy to forward requests to Java backend
  createApiProxy(app);
}
```

### 2. API Proxy (server/index.ts)

```typescript
// Create a function to proxy API requests to Java backend
const createApiProxy = (app: express.Express) => {
  app.use('/api', async (req: Request, res: Response) => {
    const javaBackendUrl = `http://localhost:8080${req.url}`;
    
    // Add extra debug logging for skills-related endpoints
    const isSkillEndpoint = req.url.includes('/skill') || req.url.includes('/skills');
    if (isSkillEndpoint) {
      console.log(`----- SKILL API REQUEST -----`);
      console.log(`Method: ${req.method}`);
      console.log(`URL: ${req.url}`);
      console.log(`Headers: ${JSON.stringify(req.headers)}`);
      console.log(`Body: ${JSON.stringify(req.body)}`);
      console.log(`----------------------------`);
    }
    
    // Special handling for skill update requests
    const isSkillUpdateRequest = 
      (req.method === 'PATCH' || req.method === 'PUT') && 
      req.url.match(/^\/skills\/\d+$/);
    
    // Special handling for pending update requests
    const isPendingUpdateRequest = 
      (req.url === '/skills/pending' || req.url === '/pending-updates') &&
      req.method === 'POST';
    
    try {
      // Forward the request to Java backend
      const response = await axios({
        method: req.method as Method,
        url: javaBackendUrl,
        data: req.body,
        headers: {
          'Content-Type': 'application/json',
          ...req.headers as Record<string, string>
        },
        responseType: 'arraybuffer'
      });
      
      if (isSkillEndpoint) {
        console.log(`----- SKILL API RESPONSE -----`);
        console.log(`Status: ${response.status}`);
        console.log(`Headers: ${JSON.stringify(response.headers)}`);
        
        // Try to convert and log the response body if it's JSON
        try {
          const responseBody = Buffer.from(response.data).toString('utf8');
          console.log(`Body: ${responseBody}`);
          
          if (response.status >= 400) {
            console.error(`Error response from Java backend for skill endpoint: ${responseBody}`);
          }
        } catch (err) {
          console.log(`Body: [Binary data]`);
        }
        console.log(`------------------------------`);
      }
      
      // Check if this is a successful skill update response that needs special handling
      const isSuccessfulSkillUpdate = isSkillUpdateRequest && response.status >= 200 && response.status < 300;
      
      if (isSuccessfulSkillUpdate) {
        try {
          // Parse the response to get the updated skill
          const responseBody = JSON.parse(Buffer.from(response.data).toString('utf8'));
          console.log(`Successful skill update detected. Response:`, JSON.stringify(responseBody));
          
          // If Java backend doesn't create skill history, we can do it here
          // This is a temporary measure until Java backend implements SkillHistoryController
          console.log(`Note: Java backend may be missing SkillHistoryController - history tracking may not be complete`);
          
          // Send the successful response back to the client
          res.status(response.status);
          for (const [key, value] of Object.entries(response.headers)) {
            if (key !== 'content-length') { // Skip content-length as we might modify the body
              res.setHeader(key, value as string);
            }
          }
          res.json(responseBody);
        } catch (err) {
          // If we couldn't parse the response, just send it as-is
          console.error('Error handling skill update response:', err);
          res.status(response.status);
          for (const [key, value] of Object.entries(response.headers)) {
            res.setHeader(key, value as string);
          }
          res.send(response.data);
        }
      } else {
        // For non-skill-update responses, send as-is
        res.status(response.status);
        for (const [key, value] of Object.entries(response.headers)) {
          res.setHeader(key, value as string);
        }
        res.send(response.data);
      }
    } catch (error: any) {
      console.error('Proxy error:', error);
      
      if (isSkillEndpoint) {
        console.error(`Stack trace for skill endpoint error:`, error.stack);
      }
      
      res.status(500).json({
        error: 'Java Backend Connection Error',
        message: 'Could not connect to Java backend server',
        details: error.message || 'Unknown error'
      });
    }
  });
  
  console.log('API proxy configured to forward requests to Java backend on port 8080');
};
```

### 3. Frontend API Configuration (client/src/api/config.ts)

```typescript
// Flag to use Java backend
const USE_JAVA_BACKEND = true; // Set to true to use Java backend

// In Replit, it's better to use relative URLs rather than localhost
const USE_RELATIVE_URLS = true;

// Java backend port
const JAVA_BACKEND_PORT = 8080;

// Determine if we're running in Replit
const isReplit = window.location.hostname.includes('replit');

// Backend API base URL configuration
export const API_BASE_URL = USE_JAVA_BACKEND 
  ? (isReplit 
      ? '/api'  // Java backend in Replit - use relative URL
      : `http://localhost:${JAVA_BACKEND_PORT}/api`) // Java backend in local development
  : (isReplit
      ? '/api' // Node.js backend in Replit - use relative URL
      : 'http://localhost:3000/api'); // Node.js backend in local development

// WebSocket URL configuration
export const WS_BASE_URL = USE_JAVA_BACKEND
  ? (isReplit
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
      : `ws://localhost:${JAVA_BACKEND_PORT}/ws`)
  : (isReplit
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
      : 'ws://localhost:3000/ws');

console.log('Environment:', isReplit ? 'Replit' : 'Local');
console.log('Using Java backend:', USE_JAVA_BACKEND);
console.log('API Base URL:', API_BASE_URL);
console.log('WebSocket URL:', WS_BASE_URL);
```

### 4. Mock Java Backend (mock-java-backend.js)

The mock Java backend implements:

- Support for both PUT and PATCH for skill updates
- Support for both Node.js and Java endpoint paths
- Field name synchronization between snake_case and camelCase
- Compatibility with both frontend and API test scripts

## Java Backend Changes

In the Java backend, the following changes were made:

1. **SkillController.java**
   - Added support for both PUT and PATCH methods
   - Created field name synchronization 

2. **PendingSkillUpdateController.java**
   - Added endpoint support for `/api/skills/pending` (Node.js path)
   - Maintained `/api/pending-updates` (Java path)
   - Added field name synchronization

3. **DTOs**
   - Enhanced DTOs with field synchronization methods
   - Added support for both naming conventions

## Testing

Testing can be done in two ways:

1. **Manual Testing**:
   - Run `./java-mode.sh` to start both mock Java backend and frontend
   - Use the UI to create and update skills
   - Verify updates work through the UI

2. **API Testing**:
   - Run `./test-api-endpoints.sh` to test API endpoints 
   - This will verify both Node.js and Java style requests work
   - Tests different field naming formats