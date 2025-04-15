#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================================${NC}"
echo -e "${BLUE}    Java Backend API Validation Test Suite Runner      ${NC}"
echo -e "${BLUE}=======================================================${NC}"
echo

# Create test results directory if it doesn't exist
mkdir -p test-results

# Define an array of test classes
TEST_CLASSES=(
    "com.skillmetrics.api.controller.ApiInfoControllerTest"
    "com.skillmetrics.api.controller.SkillGapAnalysisControllerTest"
    "com.skillmetrics.api.controller.ExportControllerTest"
    "com.skillmetrics.api.controller.OrganizationSkillHistoryControllerTest"
    "com.skillmetrics.api.controller.AnalyticsControllerTest"
    "com.skillmetrics.api.controller.AllSkillsControllerTest"
)

# Initialize counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Run tests for each class
for TEST_CLASS in "${TEST_CLASSES[@]}"; do
    CLASS_NAME=$(echo $TEST_CLASS | awk -F. '{print $NF}')
    echo -e "${YELLOW}Running tests for ${CLASS_NAME}...${NC}"
    
    # Run tests for the class and capture output
    TEST_OUTPUT=$(./mvnw test -Dtest=$TEST_CLASS 2>&1)
    TEST_EXIT_CODE=$?
    
    # Extract test summary
    TESTS_RUN=$(echo "$TEST_OUTPUT" | grep -o "Tests run: [0-9]*" | awk '{print $3}')
    FAILURES=$(echo "$TEST_OUTPUT" | grep -o "Failures: [0-9]*" | awk '{print $2}')
    ERRORS=$(echo "$TEST_OUTPUT" | grep -o "Errors: [0-9]*" | awk '{print $2}')
    
    # If we couldn't parse the output, set default values
    if [ -z "$TESTS_RUN" ]; then TESTS_RUN=0; fi
    if [ -z "$FAILURES" ]; then FAILURES=0; fi
    if [ -z "$ERRORS" ]; then ERRORS=0; fi
    
    # Calculate total tests for this class
    CLASS_TOTAL=$TESTS_RUN
    CLASS_FAILED=$((FAILURES + ERRORS))
    CLASS_PASSED=$((CLASS_TOTAL - CLASS_FAILED))
    
    # Update overall counters
    TOTAL_TESTS=$((TOTAL_TESTS + CLASS_TOTAL))
    PASSED_TESTS=$((PASSED_TESTS + CLASS_PASSED))
    FAILED_TESTS=$((FAILED_TESTS + CLASS_FAILED))
    
    # Save output to file
    echo "$TEST_OUTPUT" > test-results/${CLASS_NAME}.log
    
    # Display summary for this class
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed for ${CLASS_NAME}${NC}"
        echo -e "  ${BLUE}Tests: ${CLASS_TOTAL}, Passed: ${CLASS_PASSED}, Failed: ${CLASS_FAILED}${NC}"
    else
        echo -e "${RED}✗ Some tests failed for ${CLASS_NAME}${NC}"
        echo -e "  ${BLUE}Tests: ${CLASS_TOTAL}, Passed: ${CLASS_PASSED}, Failed: ${CLASS_FAILED}${NC}"
        
        # Extract failure details
        FAILURE_DETAILS=$(echo "$TEST_OUTPUT" | grep -A 5 "<<< FAILURE!" || echo "No details available")
        echo -e "${RED}Failure details:${NC}"
        echo "$FAILURE_DETAILS"
    fi
    echo
done

# Display overall summary
echo -e "${BLUE}=======================================================${NC}"
echo -e "${BLUE}                Test Results Summary                  ${NC}"
echo -e "${BLUE}=======================================================${NC}"
echo -e "${BLUE}Total Tests: ${TOTAL_TESTS}${NC}"
echo -e "${GREEN}Passed Tests: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed Tests: ${FAILED_TESTS}${NC}"
echo

# Calculate success rate
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.2f\", (${PASSED_TESTS}/${TOTAL_TESTS})*100}")
    echo -e "${BLUE}Success Rate: ${SUCCESS_RATE}%${NC}"
    
    # Display overall status
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}All API tests passed successfully!${NC}"
    else
        echo -e "${RED}Some API tests failed. Please review the logs for details.${NC}"
    fi
else
    echo -e "${YELLOW}No tests were executed. Please check your test configuration.${NC}"
fi

echo -e "${BLUE}=======================================================${NC}"
echo "Test logs saved to test-results/ directory"