/**
 * Frontend-only server for the Java backend integration
 * This server only serves the frontend files and passes all API requests
 * to the Java backend running on port 8080
 */

import express from "express";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";

const app = express();

// Setup a lightweight proxy to forward API requests to Java backend
app.use('/api', (req, res) => {
  // Forward all API requests to the Java backend
  log(`[PROXY] Forwarding ${req.method} ${req.url} to Java backend`);
  res.redirect(307, `http://localhost:8080${req.url}`);
});

// Create a HTTP server instance
const server = createServer(app);

(async () => {
  // Setup Vite for serving frontend files
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000; // Use port 5000 to avoid conflict with Java backend on 8080
  const host = "0.0.0.0";
  
  log(`Starting frontend-only server (API requests forwarded to Java backend)`);
  log(`Using port ${port} for frontend`);
  
  server.listen(port, host, () => {
    log(`Frontend server started on port ${port}`);
    console.log(`Frontend server started and listening on port ${port}`);
  });
})();