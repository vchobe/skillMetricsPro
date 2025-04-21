#!/bin/bash

# This script tests key API endpoints against the mock Java backend
# It also compares responses between Java and Node.js styled requests
# to verify our compatibility fixes are working

echo "==============================================="
echo "  Testing API Endpoints with Mock Java"
echo "==============================================="

# Check if mock Java backend is running
if ! nc -z localhost 8080 >/dev/null 2>&1; then
  echo "Starting mock Java backend..."
  node mock-java-backend.js &
  MOCK_PID=$!
  sleep 2
  KILL_AT_END=true
  echo "Mock Java backend started with PID: $MOCK_PID"
else
  echo "Using existing mock Java backend on port 8080"
  KILL_AT_END=false
fi

BASE_URL="http://localhost:8080/api"

# Function to make API requests and display results
function test_api() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4
  
  echo ""
  echo "📌 TEST: $description"
  echo "▶ $method $endpoint"
  if [ -n "$data" ]; then
    echo "Request: $data"
  fi
  
  response=$(curl -s -X "$method" \
    -H "Content-Type: application/json" \
    ${data:+ -d "$data"} \
    "$BASE_URL$endpoint")
  
  echo "Response: $response"
  echo "------------------------"
}

# ======== SKILL TESTS ========
echo ""
echo "🔍 TESTING SKILL API ENDPOINTS"

# Test both skill creation endpoints
skill_data='{
  "name": "Java Spring Boot",
  "category": "Backend",
  "level": "Intermediate",
  "description": "Java Spring Boot development"
}'
test_api "PUT" "/skills" "$skill_data" "Create skill with PUT (Java style)"

skill_data='{
  "name": "TypeScript",
  "category": "Frontend",
  "level": "Advanced",
  "description": "TypeScript development"
}'
test_api "POST" "/skills" "$skill_data" "Create skill with POST (Node.js style)"

# Test both skill update methods
update_patch='{
  "level": "Expert"
}'
test_api "PATCH" "/skills/1" "$update_patch" "Update skill with PATCH (Node.js style)"

update_put='{
  "name": "Java Spring Boot",
  "category": "Backend",
  "level": "Expert",
  "description": "Expert Java Spring Boot development with Spring Security"
}'
test_api "PUT" "/skills/1" "$update_put" "Update skill with PUT (Java style)"

# ======== PENDING UPDATE TESTS ========
echo ""
echo "🔍 TESTING PENDING UPDATE ENDPOINTS"

# Test both endpoint styles for creating pending updates
pending_data='{
  "skillId": 1,
  "newLevel": "Expert",
  "justification": "Completed certification"
}'
test_api "POST" "/skills/pending" "$pending_data" "Create pending update (Node.js path)"

pending_data='{
  "skillId": 2,
  "newLevel": "Expert",
  "justification": "5+ years experience"
}'
test_api "POST" "/pending-updates" "$pending_data" "Create pending update (Java path)"

# Test both endpoint styles for getting pending updates
test_api "GET" "/skills/pending" "" "Get pending updates (Node.js path)"
test_api "GET" "/pending-updates" "" "Get pending updates (Java path)"

# ======== FIELD NAMING TESTS ========
echo ""
echo "🔍 TESTING FIELD NAMING COMPATIBILITY"

# Test snake_case (Node.js style)
snake_data='{
  "skill_id": 1,
  "new_level": "Advanced",
  "justification": "Testing snake_case"
}'
test_api "POST" "/skills/pending" "$snake_data" "Create pending with snake_case fields"

# Test camelCase (Java style)
camel_data='{
  "skillId": 2,
  "newLevel": "Advanced",
  "justification": "Testing camelCase"
}'
test_api "POST" "/skills/pending" "$camel_data" "Create pending with camelCase fields"

echo ""
echo "==============================================="
echo "  API Endpoint Testing Complete"
echo "==============================================="

# Clean up if we started the mock server
if [ "$KILL_AT_END" = true ]; then
  echo "Stopping mock Java backend (PID: $MOCK_PID)..."
  kill $MOCK_PID
fi