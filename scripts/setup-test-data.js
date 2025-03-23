/**
 * Script to set up complete test data for the application
 * - Creates admin user
 * - Creates test users
 * - Adds skills and certifications
 * - Creates clients and projects
 * - Assigns resources to projects
 */

import { execSync } from 'child_process';

console.log('Starting test data setup...');

try {
  // Step 1: Create admin user
  console.log('\n=== Creating admin user ===');
  execSync('node scripts/fix-admin.js', { stdio: 'inherit' });
  
  // Step 2: Create test users
  console.log('\n=== Creating test users ===');
  execSync('node scripts/create-test-users.js', { stdio: 'inherit' });
  
  // Step 3: Add skills and certifications
  console.log('\n=== Adding skills and certifications ===');
  execSync('node scripts/regenerate-data.js', { stdio: 'inherit' });
  
  // Step 4: Create clients and projects
  console.log('\n=== Creating project management data ===');
  execSync('node scripts/generate-project-data.js', { stdio: 'inherit' });
  
  console.log('\n=== Test data setup completed successfully! ===');
  console.log('\nYou can log in with:');
  console.log('Email: admin@atyeti.com');
  console.log('Password: Admin@123');
} catch (error) {
  console.error('Error setting up test data:', error);
}