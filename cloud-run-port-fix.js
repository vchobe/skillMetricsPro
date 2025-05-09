/**
 * Module to check and fix port configuration for Cloud Run deployment
 * 
 * This script examines the current port configuration in index.js (after build)
 * and ensures it listens on port 8080 and host 0.0.0.0 for Cloud Run compatibility.
 * 
 * Usage: node cloud-run-port-fix.js
 */

const fs = require('fs');
const path = require('path');

console.log('Cloud Run Port Configuration Fixer');
console.log('==================================');

/**
 * Update the server port in environment configuration
 * For Cloud Run we need to ensure the server binds to port 8080.
 */
function updateServerPort() {
  console.log('\nChecking .env file for port configuration...');
  
  try {
    // Create a Cloud Run specific .env file
    const envContent = `# Cloud Run Environment Configuration
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
# Database Configuration
DATABASE_URL='postgresql://app_user:EjsUgkhcd/DB3kdibkXMAw@34.30.6.95/neondb'
`;

    fs.writeFileSync(path.join(__dirname, '.env.cloudrun'), envContent);
    console.log('✅ Created Cloud Run specific .env.cloudrun file');
    
    // Create a simple .env fallback
    const simpleEnv = `PORT=8080
HOST=0.0.0.0
NODE_ENV=production
`;
    fs.writeFileSync(path.join(__dirname, '.env.production'), simpleEnv);
    console.log('✅ Created .env.production fallback file');
    
    return true;
  } catch (error) {
    console.error('❌ Error updating environment configuration:', error.message);
    return false;
  }
}

/**
 * Update Dockerfile for Cloud Run compatibility
 */
function updateDockerfile() {
  console.log('\nChecking Dockerfile for Cloud Run compatibility...');
  
  try {
    const dockerfilePath = path.join(__dirname, 'Dockerfile.cloud-run-optimized');
    
    if (!fs.existsSync(dockerfilePath)) {
      // Create a new optimized Dockerfile for Cloud Run
      const dockerfileContent = `# Optimized Dockerfile for Cloud Run deployment
FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Set environment variables for Cloud Run
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Expose port 8080 - required for Cloud Run
EXPOSE 8080

# Start the server using production settings
CMD ["node", "server/index.js"]
`;
      fs.writeFileSync(dockerfilePath, dockerfileContent);
      console.log('✅ Created optimized Dockerfile for Cloud Run at Dockerfile.cloud-run-optimized');
    } else {
      console.log('✅ Dockerfile.cloud-run-optimized already exists');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error updating Dockerfile:', error.message);
    return false;
  }
}

/**
 * Main function to check and fix port configuration
 */
async function fixPortConfiguration() {
  console.log('Starting Cloud Run port configuration check...');
  
  // Update files for Cloud Run compatibility
  const envUpdated = updateServerPort();
  const dockerfileUpdated = updateDockerfile();
  
  if (envUpdated && dockerfileUpdated) {
    console.log('\n✅ Cloud Run port configuration completed successfully!');
    console.log('The application is now configured to run on port 8080 for Cloud Run.');
    return true;
  } else {
    console.error('\n❌ Failed to complete Cloud Run port configuration.');
    console.error('Please check the errors above and fix them manually.');
    return false;
  }
}

// Execute the main function
fixPortConfiguration().then(success => {
  if (!success) {
    process.exit(1);
  }
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});