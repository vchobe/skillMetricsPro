/**
 * Script to run schema comparison with temporary access to DATABASE_URL
 */
import fs from 'fs';
import { execSync } from 'child_process';

// Record the original DATABASE_URL from the environment
const originalDatabaseUrl = process.env.DATABASE_URL;

// Exit if no DATABASE_URL found
if (!originalDatabaseUrl) {
  console.error('Error: DATABASE_URL environment variable not found.');
  console.error('Cannot compare schemas without access to both databases.');
  process.exit(1);
}

console.log('Starting database schema comparison...');
console.log('Both Google Cloud SQL and Replit database configurations available.');

try {
  // Run the comparison script (with DATABASE_URL in the environment)
  // Use node with --experimental-modules flag for ESM support
  execSync('node --experimental-modules compare-schemas.js', { stdio: 'inherit' });
  
  console.log('\nSchema comparison completed successfully!');
  
} catch (error) {
  console.error('Error during schema comparison:', error.message);
} 

console.log('You may need to restart the application to continue using Google Cloud SQL.');