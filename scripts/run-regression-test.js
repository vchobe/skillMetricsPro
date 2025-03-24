/**
 * Runner for the regression tests
 * This script runs the regression tests and generates a report
 * 
 * Usage: node scripts/run-regression-test.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Constants
const REPORT_DIR = path.join(__dirname, '..', 'test-reports');
const REPORT_FILE = path.join(REPORT_DIR, `regression-test-report-${Date.now()}.html`);

// Create reports directory if it doesn't exist
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Function to run the regression tests
function runRegressionTests() {
  console.log('Running regression tests...');
  
  // Capture output
  let stdoutData = '';
  let stderrData = '';
  
  // Spawn the regression test process
  const proc = spawn('node', ['scripts/regression-test.js']);
  
  proc.stdout.on('data', (data) => {
    const output = data.toString();
    stdoutData += output;
    console.log(output);
  });
  
  proc.stderr.on('data', (data) => {
    const output = data.toString();
    stderrData += output;
    console.error(output);
  });
  
  proc.on('close', (code) => {
    console.log(`Regression tests completed with exit code ${code}`);
    
    // Generate HTML report
    generateHtmlReport(stdoutData, stderrData, code);
  });
}

// Function to parse test results from stdout
function parseTestResults(stdout) {
  const results = {
    tests: {},
    summary: {
      totalTests: 0,
      passCount: 0,
      failCount: 0,
      passPercentage: 0
    }
  };
  
  // Extract test results
  const testLines = stdout.split('\n');
  let currentTest = null;
  
  for (const line of testLines) {
    // Extract test name and status
    const testMatch = line.match(/[✓✗]\s+(\w+):\s+(PASSED|FAILED)/i);
    if (testMatch) {
      currentTest = testMatch[1];
      results.tests[currentTest] = {
        name: currentTest,
        status: testMatch[2].toLowerCase(),
        details: ''
      };
      continue;
    }
    
    // Extract test details
    const detailsMatch = line.match(/\s+Details:\s+(.*)/);
    if (detailsMatch && currentTest) {
      results.tests[currentTest].details = detailsMatch[1];
      continue;
    }
    
    // Extract summary
    const totalMatch = line.match(/Total Tests:\s+(\d+)/);
    if (totalMatch) {
      results.summary.totalTests = parseInt(totalMatch[1]);
    }
    
    const passMatch = line.match(/Tests Passed:\s+(\d+)\s+\((\d+\.\d+)%\)/);
    if (passMatch) {
      results.summary.passCount = parseInt(passMatch[1]);
      results.summary.passPercentage = parseFloat(passMatch[2]);
    }
    
    const failMatch = line.match(/Tests Failed:\s+(\d+)/);
    if (failMatch) {
      results.summary.failCount = parseInt(failMatch[1]);
    }
  }
  
  return results;
}

// Function to generate HTML report
function generateHtmlReport(stdout, stderr, exitCode) {
  console.log('Generating HTML report...');
  
  const testResults = parseTestResults(stdout);
  
  // Create HTML content
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Regression Test Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #333;
    }
    .summary {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
    }
    .summary-item {
      text-align: center;
    }
    .summary-number {
      font-size: 24px;
      font-weight: bold;
    }
    .test-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .test-card {
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .test-passed {
      border-top: 4px solid #4CAF50;
    }
    .test-failed {
      border-top: 4px solid #F44336;
    }
    .test-name {
      font-weight: bold;
      margin-top: 0;
      display: flex;
      align-items: center;
    }
    .test-details {
      color: #555;
      font-size: 14px;
    }
    .status-icon {
      display: inline-block;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      margin-right: 10px;
      text-align: center;
      color: white;
      font-weight: bold;
    }
    .status-passed {
      background-color: #4CAF50;
    }
    .status-failed {
      background-color: #F44336;
    }
    .logs {
      white-space: pre-wrap;
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 14px;
      overflow: auto;
      max-height: 400px;
    }
    .error-logs {
      background-color: #ffebee;
    }
    .timestamp {
      color: #777;
      font-size: 14px;
      margin-top: 10px;
    }
    .progress-bar {
      height: 20px;
      background-color: #e0e0e0;
      border-radius: 10px;
      margin-bottom: 20px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background-color: #4CAF50;
      width: ${testResults.summary.passPercentage}%;
    }
  </style>
</head>
<body>
  <h1>Regression Test Report</h1>
  <p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>
  
  <div class="progress-bar">
    <div class="progress-fill"></div>
  </div>
  
  <div class="summary">
    <div class="summary-item">
      <div class="summary-number">${testResults.summary.totalTests}</div>
      <div>Total Tests</div>
    </div>
    <div class="summary-item">
      <div class="summary-number" style="color: #4CAF50">${testResults.summary.passCount}</div>
      <div>Passed</div>
    </div>
    <div class="summary-item">
      <div class="summary-number" style="color: #F44336">${testResults.summary.failCount}</div>
      <div>Failed</div>
    </div>
    <div class="summary-item">
      <div class="summary-number">${testResults.summary.passPercentage}%</div>
      <div>Success Rate</div>
    </div>
  </div>
  
  <h2>Test Results</h2>
  <div class="test-grid">
    ${Object.values(testResults.tests).map(test => `
      <div class="test-card ${test.status === 'passed' ? 'test-passed' : 'test-failed'}">
        <h3 class="test-name">
          <span class="status-icon ${test.status === 'passed' ? 'status-passed' : 'status-failed'}">
            ${test.status === 'passed' ? '✓' : '✗'}
          </span>
          ${test.name}
        </h3>
        <div class="test-details">
          ${test.details || 'No details provided'}
        </div>
      </div>
    `).join('')}
  </div>
  
  <h2>Console Output</h2>
  <div class="logs">
    ${stdout.replace(/\n/g, '<br>').replace(/✓/g, '<span style="color: #4CAF50">✓</span>').replace(/✗/g, '<span style="color: #F44336">✗</span>')}
  </div>
  
  ${stderr ? `
    <h2>Errors</h2>
    <div class="logs error-logs">
      ${stderr.replace(/\n/g, '<br>')}
    </div>
  ` : ''}
  
  <p>Exit code: ${exitCode}</p>
</body>
</html>
`;

  // Write report to file
  fs.writeFileSync(REPORT_FILE, html);
  console.log(`HTML report generated at: ${REPORT_FILE}`);
}

// Run the tests
runRegressionTests();