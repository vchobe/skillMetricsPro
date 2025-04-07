const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 8080;

// Create connection to Postgres
const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL }) 
  : null;

// Health check endpoint
app.get('/', async (req, res) => {
  let dbStatus = 'Not connected';
  
  if (pool) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      dbStatus = `Connected successfully - ${result.rows[0].now}`;
      client.release();
    } catch (err) {
      dbStatus = `Connection error: ${err.message}`;
    }
  }
  
  res.send(`
    <h1>Skills Management App - Test Page</h1>
    <p>Server is running on port ${port}</p>
    <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
    <p>Database: ${dbStatus}</p>
    <p>Host: ${process.env.HOST || 'not set'}</p>
  `);
});

// Additional route to test the server
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    port: port,
    host: process.env.HOST || 'not set'
  });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set'}`);
  console.log(`PORT: ${port}`);
});