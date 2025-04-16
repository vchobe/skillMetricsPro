#!/bin/bash

# Script to test skill update functionality with PATCH requests
# This script simulates both direct skill updates and pending skill update submissions

echo "===== Testing Skill Update Functionality ====="
echo "This script will test both direct PATCH updates and pending skill update submissions"
echo ""

# Configuration
API_BASE_URL="http://localhost:8080/api"
AUTH_TOKEN="" # Will be set after login

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to handle errors
handle_error() {
    echo -e "${RED}Error: $1${NC}"
    exit 1
}

# Function to get status message based on HTTP code
get_status_message() {
    local status_code=$1
    
    if [ $status_code -ge 200 ] && [ $status_code -lt 300 ]; then
        echo -e "${GREEN}SUCCESS ($status_code)${NC}"
    elif [ $status_code -ge 400 ] && [ $status_code -lt 500 ]; then
        echo -e "${RED}CLIENT ERROR ($status_code)${NC}"
    elif [ $status_code -ge 500 ]; then
        echo -e "${RED}SERVER ERROR ($status_code)${NC}"
    else
        echo -e "${YELLOW}UNKNOWN ($status_code)${NC}"
    fi
}

# Step 1: Authenticate to get token
echo -e "${YELLOW}Step 1: Authenticating...${NC}"
login_response=$(curl -s -X POST "$API_BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin", "password":"admin"}' \
    -w "\n%{http_code}")

login_status=$(echo "$login_response" | tail -n1)
login_body=$(echo "$login_response" | head -n -1)

echo "Authentication status: $(get_status_message $login_status)"

if [ $login_status -ne 200 ]; then
    handle_error "Failed to authenticate"
fi

# Extract token from response
AUTH_TOKEN=$(echo $login_body | grep -o '"token":"[^"]*"' | cut -d':' -f2 | tr -d '"')

if [ -z "$AUTH_TOKEN" ]; then
    handle_error "Could not extract authentication token"
fi

echo "Authentication successful!"
echo ""

# Step 2: Create a new skill
echo -e "${YELLOW}Step 2: Creating a new test skill...${NC}"
new_skill='{
    "name": "Test Skill For Update",
    "category": "Testing",
    "level": "beginner",
    "notes": "Created for update testing"
}'

create_response=$(curl -s -X POST "$API_BASE_URL/skills" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "$new_skill" \
    -w "\n%{http_code}")

create_status=$(echo "$create_response" | tail -n1)
create_body=$(echo "$create_response" | head -n -1)

echo "Create skill status: $(get_status_message $create_status)"

if [ $create_status -ne 201 ] && [ $create_status -ne 200 ]; then
    handle_error "Failed to create test skill"
fi

# Extract skill ID from response
SKILL_ID=$(echo $create_body | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$SKILL_ID" ]; then
    handle_error "Could not extract skill ID"
fi

echo "Created test skill with ID: $SKILL_ID"
echo ""

# Step 3: Update the skill with PATCH request
echo -e "${YELLOW}Step 3: Testing direct PATCH update...${NC}"
patch_data='{
    "level": "intermediate",
    "changeNote": "Updated for testing"
}'

patch_response=$(curl -s -X PATCH "$API_BASE_URL/skills/$SKILL_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "$patch_data" \
    -w "\n%{http_code}")

patch_status=$(echo "$patch_response" | tail -n1)
patch_body=$(echo "$patch_response" | head -n -1)

echo "PATCH update status: $(get_status_message $patch_status)"

if [ $patch_status -ne 200 ]; then
    handle_error "Failed to update skill with PATCH request"
fi

# Verify the skill was updated
updated_level=$(echo $patch_body | grep -o '"level":"[^"]*"' | cut -d':' -f2 | tr -d '"')

if [ "$updated_level" = "intermediate" ]; then
    echo -e "${GREEN}Verified: Skill level was updated to intermediate${NC}"
else
    echo -e "${RED}Error: Skill level was not updated correctly${NC}"
fi
echo ""

# Step 4: Update the skill with PUT request
echo -e "${YELLOW}Step 4: Testing PUT update (should also work)...${NC}"
put_data='{
    "level": "expert",
    "changeNote": "Updated again for testing"
}'

put_response=$(curl -s -X PUT "$API_BASE_URL/skills/$SKILL_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "$put_data" \
    -w "\n%{http_code}")

put_status=$(echo "$put_response" | tail -n1)
put_body=$(echo "$put_response" | head -n -1)

echo "PUT update status: $(get_status_message $put_status)"

if [ $put_status -ne 200 ]; then
    handle_error "Failed to update skill with PUT request"
fi

# Verify the skill was updated
updated_level_put=$(echo $put_body | grep -o '"level":"[^"]*"' | cut -d':' -f2 | tr -d '"')

if [ "$updated_level_put" = "expert" ]; then
    echo -e "${GREEN}Verified: Skill level was updated to expert${NC}"
else
    echo -e "${RED}Error: Skill level was not updated correctly with PUT${NC}"
fi
echo ""

# Step 5: Test submitting a pending skill update
echo -e "${YELLOW}Step 5: Testing pending skill update submission...${NC}"
pending_data='{
    "skillId": '"$SKILL_ID"',
    "name": "Test Skill For Update",
    "category": "Testing",
    "level": "beginner",
    "notes": "Testing the pending skill update system",
    "is_update": true,
    "status": "pending",
    "submitted_at": "'"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"'"
}'

pending_response=$(curl -s -X POST "$API_BASE_URL/skills/pending" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "$pending_data" \
    -w "\n%{http_code}")

pending_status=$(echo "$pending_response" | tail -n1)
pending_body=$(echo "$pending_response" | head -n -1)

echo "Pending update status: $(get_status_message $pending_status)"

if [ $pending_status -ne 201 ] && [ $pending_status -ne 200 ]; then
    handle_error "Failed to submit pending skill update"
fi

echo -e "${GREEN}Successfully submitted pending skill update${NC}"
echo ""

# Step 6: Get all pending updates to verify
echo -e "${YELLOW}Step 6: Verifying pending updates...${NC}"

pending_list_response=$(curl -s -X GET "$API_BASE_URL/user/pending-skills" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -w "\n%{http_code}")

pending_list_status=$(echo "$pending_list_response" | tail -n1)
pending_list_body=$(echo "$pending_list_response" | head -n -1)

echo "Get pending updates status: $(get_status_message $pending_list_status)"

if [ $pending_list_status -ne 200 ]; then
    handle_error "Failed to get pending skill updates"
fi

# Check if the pending update is in the list
if echo "$pending_list_body" | grep -q "Test Skill For Update"; then
    echo -e "${GREEN}Verified: Pending skill update was found in the list${NC}"
else
    echo -e "${RED}Error: Pending skill update was not found in the list${NC}"
fi
echo ""

# Step 7: Clean up - delete the test skill
echo -e "${YELLOW}Step 7: Cleaning up test data...${NC}"

delete_response=$(curl -s -X DELETE "$API_BASE_URL/skills/$SKILL_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -w "\n%{http_code}")

delete_status=$(echo "$delete_response" | tail -n1)

echo "Delete skill status: $(get_status_message $delete_status)"

if [ $delete_status -ne 204 ] && [ $delete_status -ne 200 ]; then
    echo -e "${YELLOW}Warning: Failed to delete test skill, but test is complete${NC}"
else
    echo -e "${GREEN}Successfully deleted test skill${NC}"
fi
echo ""

echo -e "${GREEN}===== Test Completed Successfully =====${NC}"
echo ""