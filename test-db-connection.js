/**
 * Test script for database connectivity
 * 
 * This script tests direct connectivity to the Google Cloud SQL database
 * Run it with: node test-db-connection.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

const { Pool } = pg;
dotenv.config();

async function testConnection() {
  console.log('=== Database Connection Test ===');
  console.log('Testing connection to Google Cloud SQL...');
  
  // Log environment variables (without exposing password)
  console.log('\nEnvironment variables:');
  console.log('Database URL format:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@'));
  console.log('Host:', process.env.PGHOST || process.env.CLOUD_SQL_HOST);
  console.log('Port:', process.env.PGPORT || process.env.CLOUD_SQL_PORT);
  console.log('Database:', process.env.PGDATABASE || process.env.CLOUD_SQL_DATABASE);
  console.log('User:', process.env.PGUSER || process.env.CLOUD_SQL_USER);
  console.log('Connection name:', process.env.CLOUD_SQL_CONNECTION_NAME || 'Not set');
  console.log('SSL enabled:', process.env.CLOUD_SQL_USE_SSL === 'true' ? 'Yes' : 'No');
  
  // Try direct connection with connection string
  console.log('\nAttempting connection using DATABASE_URL...');
  const dbUrlConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.CLOUD_SQL_USE_SSL === 'true',
    connectionTimeoutMillis: 15000
  };
  
  try {
    const pool1 = new Pool(dbUrlConfig);
    const client1 = await pool1.connect();
    console.log('DATABASE_URL connection successful!');
    const result1 = await client1.query('SELECT current_timestamp');
    console.log('Database time:', result1.rows[0].current_timestamp);
    client1.release();
    await pool1.end();
  } catch (err) {
    console.error('DATABASE_URL connection failed:', err.message);
    console.log('\nDetails:', err);
  }
  
  // Try connection with individual parameters
  console.log('\nAttempting connection using individual params...');
  const directConfig = {
    host: process.env.PGHOST || process.env.CLOUD_SQL_HOST,
    port: parseInt(process.env.PGPORT || process.env.CLOUD_SQL_PORT, 10),
    database: process.env.PGDATABASE || process.env.CLOUD_SQL_DATABASE,
    user: process.env.PGUSER || process.env.CLOUD_SQL_USER,
    password: process.env.PGPASSWORD || process.env.CLOUD_SQL_PASSWORD,
    ssl: process.env.CLOUD_SQL_USE_SSL === 'true',
    connectionTimeoutMillis: 15000
  };
  
  try {
    const pool2 = new Pool(directConfig);
    const client2 = await pool2.connect();
    console.log('Direct params connection successful!');
    const result2 = await client2.query('SELECT current_timestamp');
    console.log('Database time:', result2.rows[0].current_timestamp);
    client2.release();
    await pool2.end();
  } catch (err) {
    console.error('Direct params connection failed:', err.message);
    console.log('\nDetails:', err);
  }
  
  // Display Replit IP
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    console.log('\nCurrent Replit IP Address:', data.ip);
    console.log('Make sure this IP is allowed in your Google Cloud SQL instance\'s authorized networks');
  } catch (err) {
    console.error('Could not determine IP address:', err.message);
  }
  
  console.log('\n=== Test Completed ===');
}

testConnection().catch(err => {
  console.error('Unhandled error:', err);
});