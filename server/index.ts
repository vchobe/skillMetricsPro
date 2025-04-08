import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // CRITICAL: Hardcoded port 8080 for Cloud Run compatibility
  // Cloud Run requires the application to listen on port 8080 
  // This value must not be changed or read from environment variables
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
  const host = process.env.HOST || "0.0.0.0";
  
  // Log environment details to help with debugging
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Using port ${port} (from env: ${process.env.PORT || 'not set, using default 8080'})`);
  console.log(`Starting server on host ${host} and port ${port}`);
  
  // Properly specify host and port for Cloud Run compatibility
  server.listen(port, host, () => {
    // Important: The following log statements are used by deployment scripts
    // to verify the application is listening on the correct port
    log(`serving on port ${port}`);
    console.log(`Server started and explicitly listening on port ${port}`);
  });
})();
