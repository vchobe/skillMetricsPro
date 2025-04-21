#!/bin/bash

# Test script for verifying skill update functionality
# This script tests both PUT and PATCH methods to ensure compatibility

echo "==============================================="
echo "  Testing Skill Update API Compatibility"
echo "==============================================="

# Check if we're using the Java backend
JAVA_BACKEND=false
PORT=8080

# Check if port 5000 is in use (frontend-only mode)
if curl -s http://localhost:5000 > /dev/null; then
  echo "Detected frontend running on port 5000"
  echo "Assuming Java backend is running on port 8080"
  JAVA_BACKEND=true
  PORT=5000
else
  echo "Using port 8080 for API tests"
fi

# Base URL for API requests
BASE_URL="http://localhost:$PORT/api"

# Function to make API requests with proper formatting
function api_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  echo "▶ $method $endpoint"
  echo "Request body: $data"
  
  # Make the API request
  response=$(curl -s -X "$method" \
    -H "Content-Type: application/json" \
    -d "$data" \
    "$BASE_URL$endpoint")
  
  # Print formatted response
  echo "Response: $response"
  echo "------------------------"
}

# Test 1: Create a new skill using PUT
echo "Test 1: Creating a new skill using PUT"
CREATE_SKILL_DATA='{
  "name": "Java Spring Boot",
  "category": "Backend",
  "level": "Intermediate",
  "description": "Java Spring Boot development"
}'
api_request "PUT" "/skills" "$CREATE_SKILL_DATA"

# Test 2: Update skill using PATCH (Node.js style)
echo "Test 2: Update skill using PATCH (Node.js style)"
UPDATE_SKILL_DATA='{
  "level": "Advanced",
  "description": "Advanced Java Spring Boot with microservices"
}'
api_request "PATCH" "/skills/1" "$UPDATE_SKILL_DATA"

# Test 3: Update skill using PUT (Java style)
echo "Test 3: Update skill using PUT (Java style)"
UPDATE_SKILL_DATA='{
  "name": "Java Spring Boot",
  "category": "Backend",
  "level": "Expert",
  "description": "Expert Java Spring Boot with microservices and cloud deployment"
}'
api_request "PUT" "/skills/1" "$UPDATE_SKILL_DATA"

# Test 4: Create pending skill update
echo "Test 4: Create pending skill update"
PENDING_UPDATE_DATA='{
  "skillId": 1,
  "newLevel": "Expert",
  "justification": "Completed advanced certification"
}'
api_request "POST" "/skills/pending" "$PENDING_UPDATE_DATA"

# Test 5: Get pending updates (Node.js style endpoint)
echo "Test 5: Get pending updates (Node.js style endpoint)"
echo "▶ GET /skills/pending"
response=$(curl -s "$BASE_URL/skills/pending")
echo "Response: $response"
echo "------------------------"

# Test 6: Get pending updates (Java style endpoint)
if [ "$JAVA_BACKEND" = true ]; then
  echo "Test 6: Get pending updates (Java style endpoint)"
  echo "▶ GET /pending-updates"
  response=$(curl -s "$BASE_URL/pending-updates")
  echo "Response: $response"
  echo "------------------------"
fi

echo "==============================================="
echo "  Skill Update API Compatibility Test Complete"
echo "==============================================="