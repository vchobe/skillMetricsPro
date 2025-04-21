#!/bin/bash

# This script tests the skill update API with the mock Java backend
# It assumes the mock Java backend is already running

echo "==============================================="
echo "  Testing Skill Update API with Mock Java"
echo "==============================================="

BASE_URL="http://localhost:8080/api"

# Function to make API requests
function test_api() {
  local method=$1
  local endpoint=$2
  local data=$3
  
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

# Test 1: Check if the mock Java backend is running
echo "Test 1: Checking mock Java backend"
test_api "GET" "/info"

# Test 2: Create a skill with PUT
echo "Test 2: Creating skill with PUT"
skill_data='{
  "name": "Java Spring Boot",
  "category": "Backend",
  "level": "Intermediate",
  "description": "Java Spring Boot development"
}'
test_api "PUT" "/skills" "$skill_data"

# Test 3: Update skill with PATCH
echo "Test 3: Update skill with PATCH (Node.js style)"
update_data='{
  "level": "Advanced"
}'
test_api "PATCH" "/skills/1" "$update_data"

# Test 4: Update skill with PUT
echo "Test 4: Update skill with PUT (Java style)"
full_data='{
  "name": "Java Spring Boot",
  "category": "Backend",
  "level": "Expert",
  "description": "Expert Java Spring Boot development"
}'
test_api "PUT" "/skills/1" "$full_data"

# Test 5: Create pending update
echo "Test 5: Create pending update"
pending_data='{
  "skillId": 1,
  "newLevel": "Expert",
  "justification": "Completed certification"
}'
test_api "POST" "/skills/pending" "$pending_data"

# Test 6: Get pending updates (Node.js endpoint)
echo "Test 6: Get pending updates (Node.js endpoint)"
test_api "GET" "/skills/pending"

# Test 7: Get pending updates (Java endpoint)
echo "Test 7: Get pending updates (Java endpoint)"
test_api "GET" "/pending-updates"

echo "==============================================="
echo "  Skill Update API Test Complete"
echo "==============================================="