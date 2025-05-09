/**
 * Test script for direct connection to Neon PostgreSQL
 * 
 * This script tests connectivity to the Neon PostgreSQL database
 * using the correct SSL configuration and credentials.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

const { Pool } = pg;
dotenv.config();

async function testConnection() {
  console.log('=== Neon Database Connection Test ===');
  
  // Build connection config directly
  const config = {
    host: process.env.PGHOST || 'ep-polished-flower-a56dxfld.us-east-2.aws.neon.tech',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'neondb',
    user: process.env.PGUSER || 'neondb_owner',
    password: process.env.NEON_DB_PASSWORD,
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 15000
  };
  
  console.log('Testing connection to Neon PostgreSQL...');
  console.log(`Host: ${config.host}`);
  console.log(`Database: ${config.database}`);
  console.log(`User: ${config.user}`);
  console.log(`SSL: Enabled with rejectUnauthorized=true`);
  
  try {
    console.log('\nAttempting connection...');
    const pool = new Pool(config);
    const client = await pool.connect();
    console.log('Connection successful!');
    
    console.log('\nQuerying database version...');
    const result = await client.query('SELECT version()');
    console.log('Database version:', result.rows[0].version);
    
    console.log('\nChecking server time...');
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('Server time:', timeResult.rows[0].current_time);
    
    console.log('\nListing tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.table_name}`);
    });
    
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Connection failed:', err.message);
    console.error('\nDetails:', err);
  }
  
  // Display Replit IP
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    console.log('\nCurrent Replit IP Address:', data.ip);
    console.log(`Make sure this IP (${data.ip}) is allowed in your Neon PostgreSQL project's allowed IPs`);
  } catch (err) {
    console.error('Could not determine IP address:', err.message);
  }
  
  console.log('\n=== Test Completed ===');
}

testConnection().catch(err => {
  console.error('Unhandled error:', err);
});