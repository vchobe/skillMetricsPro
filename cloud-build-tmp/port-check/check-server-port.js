const fs = require('fs');
const path = require('path');

// Create a temporary build directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Define path to server source file
const serverSourcePath = 'server/index.ts';

// Check if the source file exists
if (!fs.existsSync(serverSourcePath)) {
  console.error(`ERROR: Server source file not found at ${serverSourcePath}`);
  process.exit(1);
}

// Read the server source code
const serverCode = fs.readFileSync(serverSourcePath, 'utf8');
console.log(`Read ${serverCode.length} bytes from ${serverSourcePath}`);

// Check if the port is hardcoded to 8080
const portMatch = serverCode.match(/const\s+port\s*=\s*(\d+|process\.env\.PORT[^;]*);/);
if (portMatch) {
  console.log(`Found port configuration: ${portMatch[0]}`);
  if (portMatch[1] === '8080') {
    console.log('✅ Port is correctly hardcoded to 8080');
  } else {
    console.log('❌ Port is NOT hardcoded to 8080, current value:', portMatch[1]);
  }
} else {
  console.log('❌ Could not find port configuration');
}

// Check if listening on all interfaces (0.0.0.0)
const hostMatch = serverCode.match(/const\s+host\s*=\s*["']([^"']+)["']/);
if (hostMatch) {
  console.log(`Found host configuration: ${hostMatch[0]}`);
  if (hostMatch[1] === '0.0.0.0') {
    console.log('✅ Host is correctly set to 0.0.0.0');
  } else {
    console.log('❌ Host is NOT set to 0.0.0.0, current value:', hostMatch[1]);
  }
} else {
  console.log('❌ Could not find host configuration');
}

// Check if server.listen properly specifies host
const listenMatch = serverCode.match(/server\.listen\s*\(\s*port\s*,\s*host/);
if (listenMatch) {
  console.log('✅ server.listen correctly specifies host parameter');
} else {
  console.log('❌ server.listen does NOT specify host parameter');
}

console.log('\nVerification complete. If any issues were found, they need to be fixed for proper Cloud Run deployment.');
