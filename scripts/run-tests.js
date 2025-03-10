#!/usr/bin/env node

/**
 * Test Runner for Employee Skills Management Application
 * 
 * This script runs:
 * 1. Database tests
 * 2. API tests
 * 3. Data generation for UI testing
 * 
 * Usage:
 *   node scripts/run-tests.js [options]
 * 
 * Options:
 *   --database-only  Run only database tests
 *   --api-only       Run only API tests
 *   --generate-data  Only generate test data
 *   --all            Run all tests (default)
 *   --help           Show this help message
 */

const { spawn } = require('child_process');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  databaseTests: args.includes('--all') || args.includes('--database-only') || (!args.includes('--api-only') && !args.includes('--generate-data')),
  apiTests: args.includes('--all') || args.includes('--api-only') || (!args.includes('--database-only') && !args.includes('--generate-data')),
  generateData: args.includes('--all') || args.includes('--generate-data') || (!args.includes('--database-only') && !args.includes('--api-only')),
  showHelp: args.includes('--help')
};

// Show help
if (options.showHelp) {
  console.log(`
Test Runner for Employee Skills Management Application

Usage:
  node scripts/run-tests.js [options]

Options:
  --database-only  Run only database tests
  --api-only       Run only API tests
  --generate-data  Only generate test data
  --all            Run all tests (default)
  --help           Show this help message
  `);
  process.exit(0);
}

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Helper function to execute a child process
function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.bright}${colors.fg.cyan}Running: ${command} ${args.join(' ')}${colors.reset}`);
    
    const child = spawn(command, args, { 
      stdio: 'inherit',
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Child process exited with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Main function
async function runTests() {
  try {
    console.log(`\n${colors.bright}${colors.fg.magenta}=== Employee Skills Management Tests ====${colors.reset}\n`);
    
    // Run database tests
    if (options.databaseTests) {
      console.log(`\n${colors.bright}${colors.fg.yellow}=== Running Database Tests ===${colors.reset}\n`);
      try {
        await runProcess('node', [path.join(__dirname, 'database-testing.js')]);
        console.log(`\n${colors.bright}${colors.fg.green}✓ Database tests completed successfully${colors.reset}\n`);
      } catch (error) {
        console.error(`\n${colors.bright}${colors.fg.red}✗ Database tests failed: ${error.message}${colors.reset}\n`);
        if (!options.apiTests && !options.generateData) {
          process.exit(1);
        }
      }
    }
    
    // Run API tests
    if (options.apiTests) {
      console.log(`\n${colors.bright}${colors.fg.yellow}=== Running API Tests ===${colors.reset}\n`);
      try {
        await runProcess('node', [path.join(__dirname, 'api-testing.js')]);
        console.log(`\n${colors.bright}${colors.fg.green}✓ API tests completed successfully${colors.reset}\n`);
      } catch (error) {
        console.error(`\n${colors.bright}${colors.fg.red}✗ API tests failed: ${error.message}${colors.reset}\n`);
        if (!options.generateData) {
          process.exit(1);
        }
      }
    }
    
    // Generate test data
    if (options.generateData) {
      console.log(`\n${colors.bright}${colors.fg.yellow}=== Generating Test Data ===${colors.reset}\n`);
      try {
        await runProcess('node', [path.join(__dirname, 'generate-test-data.js')]);
        console.log(`\n${colors.bright}${colors.fg.green}✓ Test data generated successfully${colors.reset}\n`);
      } catch (error) {
        console.error(`\n${colors.bright}${colors.fg.red}✗ Test data generation failed: ${error.message}${colors.reset}\n`);
        process.exit(1);
      }
    }
    
    console.log(`\n${colors.bright}${colors.fg.green}=== All Tests Completed ====${colors.reset}\n`);
    
    // Display UI testing instructions
    console.log(`${colors.bright}${colors.fg.yellow}UI Testing Instructions:${colors.reset}`);
    console.log('1. To run UI tests manually, refer to scripts/ui-testing.md');
    console.log('2. Follow the test cases to verify all UI functionality');
    console.log('3. Test the application on different browsers and devices');
    
  } catch (error) {
    console.error(`\n${colors.bright}${colors.fg.red}Fatal error during testing: ${error.message}${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});