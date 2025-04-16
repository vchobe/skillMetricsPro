import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import axios from "axios";
import * as http from 'http';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Create a function to proxy API requests to Java backend
const createApiProxy = (app: express.Express) => {
  app.use('/api', async (req: Request, res: Response) => {
    const javaBackendUrl = `http://localhost:8080${req.url}`;
    
    // Add extra debug logging for skills-related endpoints
    const isSkillEndpoint = req.url.includes('/skill') || req.url.includes('/skills');
    if (isSkillEndpoint) {
      console.log(`----- SKILL API REQUEST -----`);
      console.log(`Method: ${req.method}`);
      console.log(`URL: ${javaBackendUrl}`);
      console.log(`Headers: ${JSON.stringify(req.headers)}`);
      console.log(`Body: ${JSON.stringify(req.body)}`);
      console.log(`----------------------------`);
    } else {
      console.log(`Proxying request to Java backend: ${req.method} ${javaBackendUrl}`);
    }
    
    try {
      // Detect skill update request specifically (PATCH /api/skills/:id)
      const isSkillUpdateRequest = req.method === 'PATCH' && req.url.match(/^\/skills\/\d+/);
      
      // Modify the request body for skill updates if needed
      let requestBody = req.body;
      if (isSkillUpdateRequest) {
        console.log(`Special handling for skill update request detected`);
        console.log(`Original request body:`, JSON.stringify(req.body));
        
        // Make sure the skill update body is in the format expected by Java backend
        // Example transformation if needed:
        // requestBody = {
        //   name: req.body.name,
        //   category: req.body.category,
        //   level: req.body.level,
        //   // Add any other fields needed by Java backend
        // };
        
        console.log(`Transformed request body:`, JSON.stringify(requestBody));
      }
      
      // Create request options
      const requestOptions = {
        method: req.method,
        url: javaBackendUrl,
        headers: { 
          ...req.headers, 
          host: 'localhost:8080',
          // Ensure content-type is set correctly
          'content-type': req.headers['content-type'] || 'application/json'
        },
        data: requestBody,
        responseType: 'arraybuffer' as 'arraybuffer',
        validateStatus: () => true // Don't throw on any status code
      };
      
      // Forward the request to Java backend
      const response = await axios(requestOptions);
      
      // Add special handling for skills endpoints to debug issues
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

// Function to check if Java backend is running on port 8080
const isJavaBackendRunning = async (): Promise<boolean> => {
  // Since we've switched to using the Node.js backend directly,
  // we'll return false to ensure we always use the Node.js backend
  // rather than trying to detect Java
  console.log('Skipping Java backend detection, using Node.js backend directly');
  return false;
};

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup vite in development or serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Check if Java backend is running
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
    
    server.listen(port, host, () => {
      log(`serving frontend on port ${port} (API calls forwarded to Java backend on 8080)`);
      console.log(`Frontend-only server started on port ${port}`);
    });
  } else {
    // No Java backend, start normally on port 8080
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
    const host = process.env.HOST || "0.0.0.0";
    
    console.log(`No Java backend detected`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Using port ${port} (from env: ${process.env.PORT || 'not set, using default 8080'})`);
    console.log(`Starting server on host ${host} and port ${port}`);
    
    server.listen(port, host, () => {
      log(`serving on port ${port}`);
      console.log(`Server started and explicitly listening on port ${port}`);
    });
  }
})();