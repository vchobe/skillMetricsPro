/**
 * Migration script to add project_lead_email and client_engagement_lead_email columns to projects table
 */
import pg from 'pg';
import * as dotenv from 'dotenv';
import fs from 'fs';

const { Pool } = pg;
dotenv.config();

async function addColumns() {
  console.log('Starting migration to add project lead email columns...');
  
  // Try to read database config from server code
  try {
    const dbConfig = {
      host: process.env.CLOUD_SQL_HOST || process.env.PGHOST,
      port: parseInt(process.env.CLOUD_SQL_PORT || process.env.PGPORT || '5432'),
      database: process.env.CLOUD_SQL_DATABASE || process.env.PGDATABASE,
      user: process.env.CLOUD_SQL_USER || process.env.PGUSER,
      password: process.env.CLOUD_SQL_PASSWORD || process.env.PGPASSWORD,
    };
    
    console.log('Using database config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      // Mask password for security
      password: dbConfig.password ? '********' : undefined
    });

    const pool = new Pool(dbConfig);
    
    // Add the new columns
    console.log('Adding project_lead_email and client_engagement_lead_email columns to projects table...');
    await pool.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS project_lead_email TEXT,
      ADD COLUMN IF NOT EXISTS client_engagement_lead_email TEXT;
    `);
    
    console.log('Migration completed successfully.');
    await pool.end();
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

addColumns().catch(console.error);