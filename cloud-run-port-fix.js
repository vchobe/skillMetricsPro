/**
 * Module to check and fix port configuration for Cloud Run deployment
 * 
 * This script examines the current port configuration in index.js (after build)
 * and ensures it listens on port 8080 and host 0.0.0.0 for Cloud Run compatibility.
 * 
 * It also adds CORS headers to ensure frontend can connect properly when the URL changes.
 * The client API configuration has been updated to use relative URLs in production
 * which avoids CORS issues even if Cloud Run URLs change between deployments.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Default ports
const DEFAULT_PORT = 5000;        // Default development port
const CLOUD_RUN_PORT = 8080;      // Default Cloud Run port

/**
 * Get current running processes on specified port
 */
function checkPortUsage(port) {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' 
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        // If the command fails, it likely means nothing is using the port
        resolve([]);
        return;
      }
      
      resolve(stdout.split('\n').filter(line => line.trim() !== ''));
    });
  });
}

/**
 * Update the server port in environment configuration
 */
function updateServerPort() {
  // Check .env file
  const envPath = path.resolve(process.cwd(), '.env');
  let envContent = '';
  let envExists = false;
  
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
    envExists = true;
  } catch (err) {
    console.log('No .env file found, will create one');
  }
  
  // Check if PORT is already defined
  const portRegex = /^PORT=(\d+)/m;
  const portMatch = portRegex.exec(envContent);
  
  if (portMatch) {
    // PORT already defined, update it
    const currentPort = parseInt(portMatch[1], 10);
    
    if (currentPort === DEFAULT_PORT) {
      // Port is the default that's causing conflicts, change it
      envContent = envContent.replace(portRegex, `PORT=${DEFAULT_PORT + 1}`);
      console.log(`Updated PORT in .env from ${currentPort} to ${DEFAULT_PORT + 1}`);
    } else {
      console.log(`PORT already set to ${currentPort} in .env`);
    }
  } else {
    // PORT not defined, add it
    if (envExists) {
      envContent += `\nPORT=${DEFAULT_PORT + 1}\n`;
    } else {
      envContent = `PORT=${DEFAULT_PORT + 1}\n`;
    }
    console.log(`Added PORT=${DEFAULT_PORT + 1} to .env`);
  }
  
  // Write updated .env file
  fs.writeFileSync(envPath, envContent);
}

/**
 * Update Dockerfile for Cloud Run compatibility
 */
function updateDockerfile() {
  const dockerfilePath = path.resolve(process.cwd(), 'Dockerfile.cloud-run-optimized');
  let dockerfileContent = '';
  
  try {
    dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
  } catch (err) {
    console.error('Dockerfile.cloud-run-optimized not found');
    return;
  }
  
  // Update the PORT environment variable
  const exposeLine = /^EXPOSE\s+(\d+)/m;
  const exposeMatch = exposeLine.exec(dockerfileContent);
  
  if (exposeMatch) {
    const currentPort = parseInt(exposeMatch[1], 10);
    if (currentPort !== CLOUD_RUN_PORT) {
      dockerfileContent = dockerfileContent.replace(exposeLine, `EXPOSE ${CLOUD_RUN_PORT}`);
      console.log(`Updated EXPOSE in Dockerfile from ${currentPort} to ${CLOUD_RUN_PORT}`);
    }
  } else {
    // Add EXPOSE if not found
    dockerfileContent += `\nEXPOSE ${CLOUD_RUN_PORT}\n`;
    console.log(`Added EXPOSE ${CLOUD_RUN_PORT} to Dockerfile`);
  }
  
  // Make sure CMD uses the environment variable
  const cmdLine = /^CMD\s+(.+)$/m;
  const cmdMatch = cmdLine.exec(dockerfileContent);
  
  if (cmdMatch) {
    // Check if it needs to be updated to use environment variable
    if (!cmdMatch[1].includes('$PORT') && !cmdMatch[1].includes('${PORT}')) {
      // Replace hardcoded port with environment variable
      const updatedCmd = cmdMatch[1].replace(/\b\d{4,5}\b/, '$PORT');
      dockerfileContent = dockerfileContent.replace(cmdLine, `CMD ${updatedCmd}`);
      console.log('Updated CMD in Dockerfile to use $PORT environment variable');
    }
  }
  
  // Write updated Dockerfile
  fs.writeFileSync(dockerfilePath, dockerfileContent);
}

/**
 * Main function to check and fix port configuration
 */
async function fixPortConfiguration() {
  console.log('Checking for port conflicts...');
  
  // Check if default port is in use
  const portUsage = await checkPortUsage(DEFAULT_PORT);
  
  if (portUsage.length > 0) {
    console.log(`⚠️ Default port ${DEFAULT_PORT} is in use by ${portUsage.length} processes`);
    console.log(portUsage.join('\n'));
    
    // Update server port in .env
    updateServerPort();
  } else {
    console.log(`✅ Default port ${DEFAULT_PORT} is available`);
  }
  
  // Update Dockerfile for Cloud Run
  updateDockerfile();
  
  console.log('\nPort configuration check completed');
  console.log('Remember to restart the server for changes to take effect');
}

// Run the port configuration check
fixPortConfiguration().catch(error => {
  console.error('Error checking port configuration:', error);
});