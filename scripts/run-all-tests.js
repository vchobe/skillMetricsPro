/**
 * Comprehensive Test Runner for Project Management
 * 
 * This script runs all test suites:
 * 1. Project edit fix verification
 * 2. Full regression tests
 * 3. Generates an integrated report
 * 
 * Run with: node scripts/run-all-tests.js
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const REPORT_DIR = path.join(__dirname, '..', 'test-reports');
const REPORT_FILE = path.join(REPORT_DIR, `all-tests-report-${Date.now()}.html`);

// Test results storage
const testResults = {
  editFix: {
    status: 'pending',
    output: '',
    error: '',
    exitCode: null
  },
  regression: {
    status: 'pending',
    output: '',
    error: '',
    exitCode: null
  }
};

// Create reports directory if it doesn't exist
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Function to run a test script and capture results
function runTest(script, resultKey) {
  return new Promise((resolve) => {
    console.log(`Running ${script}...`);
    
    const proc = spawn('node', [`scripts/${script}.js`]);
    
    proc.stdout.on('data', (data) => {
      const output = data.toString();
      testResults[resultKey].output += output;
      console.log(output);
    });
    
    proc.stderr.on('data', (data) => {
      const output = data.toString();
      testResults[resultKey].error += output;
      console.error(output);
    });
    
    proc.on('close', (code) => {
      console.log(`${script} completed with exit code ${code}`);
      testResults[resultKey].exitCode = code;
      testResults[resultKey].status = code === 0 ? 'passed' : 'failed';
      resolve();
    });
  });
}

// Function to generate HTML report
function generateHtmlReport() {
  console.log('Generating integrated HTML report...');
  
  // Parse regression test results
  const regressionResults = parseRegressionResults(testResults.regression.output);
  
  // Determine edit fix result
  const editFixPassed = testResults.editFix.status === 'passed';
  const editFixResult = testResults.editFix.output.includes('Edit functionality test result: PASSED') ? 'PASSED' : 'FAILED';
  
  // Create HTML content
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Management Test Report</title>
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
    .test-section {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      border-radius: 5px;
      overflow: hidden;
    }
    .test-header {
      padding: 15px;
      background-color: #f5f5f5;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .test-content {
      padding: 15px;
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
    .status-badge {
      padding: 5px 10px;
      border-radius: 15px;
      color: white;
      font-weight: bold;
    }
    .status-passed {
      background-color: #4CAF50;
    }
    .status-failed {
      background-color: #F44336;
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
    .logs {
      white-space: pre-wrap;
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 14px;
      overflow: auto;
      max-height: 200px;
    }
    .error-logs {
      background-color: #ffebee;
    }
    .timestamp {
      color: #777;
      font-size: 14px;
      margin-top: 10px;
    }
    .test-tabs {
      display: flex;
      border-bottom: 1px solid #ddd;
    }
    .test-tab {
      padding: 10px 15px;
      cursor: pointer;
    }
    .test-tab.active {
      border-bottom: 3px solid #2196F3;
      font-weight: bold;
    }
    .tab-content {
      display: none;
      padding: 15px;
    }
    .tab-content.active {
      display: block;
    }
    summary {
      cursor: pointer;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 5px;
      margin-bottom: 10px;
    }
    details {
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>Project Management Test Report</h1>
  <p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>
  
  <div class="summary">
    <div class="summary-item">
      <div class="summary-number">${editFixPassed ? 'PASSED' : 'FAILED'}</div>
      <div>Project Edit Fix</div>
    </div>
    <div class="summary-item">
      <div class="summary-number">${regressionResults ? regressionResults.summary.passCount : 0}/${regressionResults ? regressionResults.summary.totalTests : 0}</div>
      <div>Regression Tests Passed</div>
    </div>
    <div class="summary-item">
      <div class="summary-number" style="color: ${editFixPassed && regressionResults && regressionResults.summary.failCount === 0 ? '#4CAF50' : '#F44336'}">
        ${editFixPassed && regressionResults && regressionResults.summary.failCount === 0 ? 'PASS' : 'FAIL'}
      </div>
      <div>Overall Status</div>
    </div>
  </div>
  
  <h2>Test Sections</h2>
  
  <!-- Edit Functionality Test -->
  <div class="test-section">
    <div class="test-header">
      <span>Project Edit Fix Test</span>
      <span class="status-badge ${editFixPassed ? 'status-passed' : 'status-failed'}">${editFixResult}</span>
    </div>
    <div class="test-content">
      <details>
        <summary>Test Details & Output</summary>
        <div class="logs">
${testResults.editFix.output.replace(/\n/g, '<br>')}
        </div>
        ${testResults.editFix.error ? `
        <h4>Errors</h4>
        <div class="logs error-logs">
${testResults.editFix.error.replace(/\n/g, '<br>')}
        </div>
        ` : ''}
      </details>
    </div>
  </div>
  
  <!-- Regression Tests -->
  <div class="test-section">
    <div class="test-header">
      <span>Regression Tests (${regressionResults ? regressionResults.summary.passCount : 0}/${regressionResults ? regressionResults.summary.totalTests : 0} passed)</span>
      <span class="status-badge ${regressionResults && regressionResults.summary.failCount === 0 ? 'status-passed' : 'status-failed'}">
        ${regressionResults && regressionResults.summary.failCount === 0 ? 'PASSED' : 'FAILED'}
      </span>
    </div>
    <div class="test-content">
      ${regressionResults ? `
      <h3>Test Results</h3>
      <div class="test-grid">
        ${Object.values(regressionResults.tests).map(test => `
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
      ` : '<p>No regression test results available</p>'}
      
      <details>
        <summary>Console Output</summary>
        <div class="logs">
${testResults.regression.output.replace(/\n/g, '<br>').replace(/✓/g, '<span style="color: #4CAF50">✓</span>').replace(/✗/g, '<span style="color: #F44336">✗</span>')}
        </div>
        ${testResults.regression.error ? `
        <h4>Errors</h4>
        <div class="logs error-logs">
${testResults.regression.error.replace(/\n/g, '<br>')}
        </div>
        ` : ''}
      </details>
    </div>
  </div>
  
  <h2>Summary</h2>
  <ul>
    <li><strong>Project Edit Fix:</strong> ${editFixResult}</li>
    <li><strong>Regression Tests:</strong> ${regressionResults ? `${regressionResults.summary.passCount}/${regressionResults.summary.totalTests} passed (${regressionResults.summary.passPercentage}%)` : 'No results'}</li>
    <li><strong>Overall Status:</strong> ${editFixPassed && regressionResults && regressionResults.summary.failCount === 0 ? 'All tests passed' : 'Some tests failed'}</li>
  </ul>
  
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Tab functionality
      const tabs = document.querySelectorAll('.test-tab');
      const tabContents = document.querySelectorAll('.tab-content');
      
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          // Remove active class from all tabs and contents
          tabs.forEach(t => t.classList.remove('active'));
          tabContents.forEach(c => c.classList.remove('active'));
          
          // Add active class to clicked tab and corresponding content
          tab.classList.add('active');
          const targetId = tab.getAttribute('data-target');
          document.getElementById(targetId).classList.add('active');
        });
      });
    });
  </script>
</body>
</html>
`;

  // Write report to file
  fs.writeFileSync(REPORT_FILE, html);
  console.log(`Integrated HTML report generated at: ${REPORT_FILE}`);
}

// Function to parse regression test results from stdout
function parseRegressionResults(stdout) {
  if (!stdout) return null;
  
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

// Main function to run all tests
async function runAllTests() {
  console.log('Starting all tests...');
  
  // Step 1: Run edit fix test
  await runTest('fix-edit-project', 'editFix');
  
  // Step 2: Run regression tests
  await runTest('regression-test', 'regression');
  
  // Step 3: Generate comprehensive report
  generateHtmlReport();
  
  console.log('All tests completed');
}

// Run all tests
runAllTests();