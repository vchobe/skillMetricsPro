import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import * as http from "http";
import { log } from "./utils"; // Import log from utils

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

  if (app.get("env") === "production") {
    const vite = await import("./vite");
    vite.serveStatic(app);
  }

  // Configure server port and host
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  const host = process.env.HOST || "0.0.0.0";
  
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(
    `Using port ${port} (from env: ${
      process.env.PORT || "not set, using default 5000"
    })`,
  );
  console.log(`Starting server on host ${host} and port ${port}`);
  
  server.listen(port, host, () => {
    log(`serving on port ${port}`); });
})();