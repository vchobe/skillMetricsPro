#!/bin/bash

# Script to test Java API endpoints and generate a report
# This script will send requests to each API endpoint and validate responses

# Configuration
API_BASE_URL="http://localhost:8080/api"
REPORT_FILE="java-api-test-report.md"
TEST_LOG_FILE="java-api-test.log"

# Make sure jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Please install jq first."
    exit 1
fi

# Initialize report file
echo "# Java Backend API Validation Report" > $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Test Date: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "## API Endpoints Test Results" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "| Endpoint | Status | Response | Time (ms) |" >> $REPORT_FILE
echo "|----------|--------|----------|-----------|" >> $REPORT_FILE

# Initialize log file
echo "Java Backend API Test Log" > $TEST_LOG_FILE
echo "Test Date: $(date)" >> $TEST_LOG_FILE
echo "--------------------------------" >> $TEST_LOG_FILE

# Function to test an API endpoint
test_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local data=$3
    local description=$4

    echo "Testing $method $endpoint - $description..." | tee -a $TEST_LOG_FILE
    
    start_time=$(date +%s%N)
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -X $method $API_BASE_URL$endpoint -w "\n%{http_code}\n%{time_total}")
    else
        response=$(curl -s -X $method $API_BASE_URL$endpoint -H "Content-Type: application/json" -d "$data" -w "\n%{http_code}\n%{time_total}")
    fi
    
    end_time=$(date +%s%N)
    
    # Parse response
    response_body=$(echo "$response" | head -n 1)
    status_code=$(echo "$response" | head -n 2 | tail -n 1)
    time_taken=$(echo "$response" | tail -n 1)
    time_ms=$(echo "$time_taken * 1000" | bc)
    
    # Format response for report
    if [ ${#response_body} -gt 100 ]; then
        short_response="${response_body:0:100}..."
    else
        short_response="$response_body"
    fi
    
    # Determine status
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        status="✅ Success"
    else
        status="❌ Failed"
    fi
    
    # Log detailed response
    echo "Status Code: $status_code" >> $TEST_LOG_FILE
    echo "Response Time: $time_ms ms" >> $TEST_LOG_FILE
    echo "Response Body:" >> $TEST_LOG_FILE
    echo "$response_body" >> $TEST_LOG_FILE
    echo "--------------------------------" >> $TEST_LOG_FILE
    
    # Add to report
    echo "| $endpoint | $status ($status_code) | \`$short_response\` | $time_ms |" >> $REPORT_FILE
}

# Test API endpoints
echo "Starting API endpoint tests..."

# Main API endpoints
test_endpoint "/users" "GET" "" "Get all users"
test_endpoint "/user" "GET" "" "Get current user"
test_endpoint "/skills" "GET" "" "Get all skills"
test_endpoint "/skill-templates" "GET" "" "Get skill templates"
test_endpoint "/projects" "GET" "" "Get all projects"
test_endpoint "/clients" "GET" "" "Get all clients"

# New API endpoints we implemented
test_endpoint "/api-info" "GET" "" "Get API information"
test_endpoint "/analytics/team-comparison" "GET" "" "Get team comparison analytics"
test_endpoint "/analytics/certifications" "GET" "" "Get certification analytics"
test_endpoint "/skill-gap/organization" "GET" "" "Get organization skill gap analysis"
test_endpoint "/skill-gap/project/1" "GET" "" "Get project skill gap analysis"
test_endpoint "/export/skills/pdf" "GET" "" "Export skills as PDF"
test_endpoint "/export/skills/csv" "GET" "" "Export skills as CSV"
test_endpoint "/org/skills/history" "GET" "" "Get organization skill history"
test_endpoint "/skills/all" "GET" "" "Get all skills comprehensive"

echo "" >> $REPORT_FILE
echo "## Summary" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "- **Total endpoints tested:** $(grep -c "^|" $REPORT_FILE | awk '{print $1-1}')" >> $REPORT_FILE
echo "- **Success:** $(grep -c "✅" $REPORT_FILE)" >> $REPORT_FILE
echo "- **Failed:** $(grep -c "❌" $REPORT_FILE)" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "## Notes" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "This test report validates the Java backend API endpoints against the expected functionality." >> $REPORT_FILE
echo "For detailed logs, see \`$TEST_LOG_FILE\`" >> $REPORT_FILE

echo "Testing complete. Report generated at $REPORT_FILE"
echo "Detailed logs available at $TEST_LOG_FILE"