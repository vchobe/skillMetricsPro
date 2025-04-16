// This script simulates a Java backend by occupying port 8080
// It's used to trick the Node.js server into running in frontend-only mode
// while testing the frontend with mock API responses

import http from 'http';

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  console.log(`[MOCK JAVA] ${req.method} ${req.url}`);
  
  // Simple handler for /api/info endpoint
  if (req.url === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      serviceName: 'skills-management-api',
      version: '1.0.0',
      status: 'UP',
      mode: 'MOCK'
    }));
    return;
  }
  
  // Default response for all API endpoints
  res.writeHead(501, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'This is a mock Java backend. The real Java backend is not running.',
    endpoint: req.url,
    method: req.method
  }));
});

// Start the server on port 8080
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Mock Java backend server running on port ${PORT}`);
  console.log('This will cause the Node.js server to run in frontend-only mode');
});