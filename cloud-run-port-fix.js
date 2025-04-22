/**
 * Module to check and fix port configuration for Cloud Run deployment
 * 
 * This script examines the current port configuration in index.js (after build)
 * and ensures it listens on port 8080 and host 0.0.0.0 for Cloud Run compatibility.
 */

const fs = require('fs');
const path = require('path');

// Path to the built server file 
const SERVER_FILE_PATH = path.join(__dirname, 'dist', 'index.js');

// Check if the file exists
if (!fs.existsSync(SERVER_FILE_PATH)) {
  console.error(`ERROR: Server file not found at ${SERVER_FILE_PATH}`);
  console.error('Build the application first with npm run build');
  process.exit(1);
}

// Read the current server file
let serverCode = fs.readFileSync(SERVER_FILE_PATH, 'utf8');
console.log(`Read ${serverCode.length} bytes from ${SERVER_FILE_PATH}`);

// Make a backup of the original file
const backupPath = `${SERVER_FILE_PATH}.backup`;
fs.writeFileSync(backupPath, serverCode);
console.log(`Backup created at ${backupPath}`);

// Check if the server is already configured correctly
if (serverCode.includes('const port = 8080;') && 
    serverCode.includes('const host = "0.0.0.0";') &&
    serverCode.includes('server.listen(port, host,')) {
  console.log('Server already configured correctly for Cloud Run');
  process.exit(0);
}

console.log('Patching server code for Cloud Run compatibility...');

// Look for the updated Cloud Run detection logic we added to server/index.ts
if (serverCode.includes('const isCloudRun = process.env.K_SERVICE !== undefined;')) {
  console.log('Found modern Cloud Run detection logic, no need to patch port');
} else {
  // Replace dynamic port with Cloud Run detection logic
  serverCode = serverCode.replace(
    /const port = .*process\.env\.PORT.*(\d+);/g, 
    'const isCloudRun = process.env.K_SERVICE !== undefined;\n' +
    '    const port = isCloudRun ? 8080 : (process.env.PORT ? parseInt(process.env.PORT, 10) : 5000);'
  );
  
  // Add host configuration if not present
  if (!serverCode.includes('const host = "0.0.0.0";')) {
    serverCode = serverCode.replace(
      /(const port = .*)/,
      '$1\n    const host = process.env.HOST || "0.0.0.0";'
    );
  }
  
  // Add debug logging
  if (!serverCode.includes('Cloud Run:')) {
    serverCode = serverCode.replace(
      /(console\.log\(`Environment: .*\);)/,
      '$1\n    console.log(`Cloud Run: ${isCloudRun ? \'Yes\' : \'No\'}`);'
    );
  }
}

// Update server.listen call to include host
serverCode = serverCode.replace(
  /server\.listen\(port([^,]|$)/g,
  'server.listen(port, host$1'
);

// Add debug logging
serverCode = serverCode.replace(
  /(server\.listen\(port, host,[^)]*\)\s*=>(?:\s*{)?)/,
  '$1\n    console.log(`Server started and listening on ${host}:${port}`);'
);

// Write the patched file
fs.writeFileSync(SERVER_FILE_PATH, serverCode);
console.log(`Updated ${SERVER_FILE_PATH} with Cloud Run port configuration`);

// Verify the changes
const patchedCode = fs.readFileSync(SERVER_FILE_PATH, 'utf8');

// Check for either the old style fixed port or our new Cloud Run detection
if ((patchedCode.includes('const port = 8080;') && patchedCode.includes('const host = "0.0.0.0";')) || 
    (patchedCode.includes('const isCloudRun = process.env.K_SERVICE !== undefined;') && 
     patchedCode.includes('const port = isCloudRun ? 8080'))) {
  console.log('Successfully patched server for Cloud Run deployment!');
  process.exit(0);
} else {
  console.error('Failed to patch server code correctly');
  process.exit(1);
}