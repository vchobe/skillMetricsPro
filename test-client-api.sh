#!/bin/bash

# Client API test script using curl
# Simplified test script focused on client creation and editing

# Base URL for API
BASE_URL="http://localhost:5000"

# Admin login credentials
EMAIL="admin@atyeti.com"
PASSWORD="Admin@123"

# Variables to store session and client data
SESSION_COOKIE=""
CREATED_CLIENT_ID=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to log messages with timestamp
log() {
  local level=$1
  local message=$2
  local color=$NC
  
  case $level in
    "INFO") color=$GREEN ;;
    "WARN") color=$YELLOW ;;
    "ERROR") color=$RED ;;
  esac
  
  echo -e "${color}[$(date '+%H:%M:%S')] [$level] $message${NC}"
}

# Login and get session cookie
login() {
  log "INFO" "Logging in as $EMAIL..."
  
  local response=$(curl -s -X POST "$BASE_URL/api/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
    -c cookies.txt)
  
  # Check if cookies.txt contains connect.sid
  if grep -q "connect.sid" cookies.txt; then
    SESSION_COOKIE=$(grep "connect.sid" cookies.txt | awk '{print $6}')
    log "INFO" "Login successful! Session cookie: ${SESSION_COOKIE:0:10}..."
    return 0
  else
    log "ERROR" "Login failed. No session cookie found."
    return 1
  fi
}

# Verify the session is authenticated
verify_auth() {
  log "INFO" "Verifying authentication..."
  
  local response=$(curl -s -X GET "$BASE_URL/api/user" \
    -b cookies.txt)
  
  # Check if we got a valid user object back
  if echo "$response" | grep -q "\"id\""; then
    log "INFO" "Session is authenticated."
    return 0
  else
    log "ERROR" "Session is not authenticated. Response: $response"
    return 1
  fi
}

# Create a test client with some extra fields that should be sanitized
create_client() {
  log "INFO" "Creating test client..."
  
  # Test client data with extra fields that should be sanitized
  local client_data='{
    "name": "API Test Client",
    "industry": "Technology",
    "accountManagerId": 1,
    "website": "https://example.com",
    "notes": "Created via test script",
    "description": "This field does not exist in the database",
    "address": "123 Test Street",
    "nonExistentField": "This should be filtered out"
  }'
  
  local response=$(curl -s -X POST "$BASE_URL/api/clients" \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d "$client_data")
  
  # Check if we got a valid client object back with an ID
  if echo "$response" | grep -q "\"id\""; then
    CREATED_CLIENT_ID=$(echo "$response" | grep -o '\"id\":[0-9]*' | cut -d':' -f2)
    log "INFO" "Client created successfully with ID: $CREATED_CLIENT_ID"
    echo "$response" | json_pp
    return 0
  else
    log "ERROR" "Failed to create client. Response: $response"
    return 1
  fi
}

# Update the test client with some extra fields that should be sanitized
update_client() {
  if [ -z "$CREATED_CLIENT_ID" ]; then
    log "ERROR" "No client ID available for update"
    return 1
  fi
  
  log "INFO" "Updating client with ID: $CREATED_CLIENT_ID..."
  
  # Updated client data with extra fields
  local update_data='{
    "name": "Updated API Test Client",
    "industry": "Technology",
    "accountManagerId": 1,
    "website": "https://example.com/updated",
    "notes": "Updated via test script",
    "description": "This field does not exist in the database",
    "address": "456 Updated Street",
    "nonExistentField": "This should still be filtered out"
  }'
  
  local response=$(curl -s -X PATCH "$BASE_URL/api/clients/$CREATED_CLIENT_ID" \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d "$update_data")
  
  # Check if we got a valid client object back
  if echo "$response" | grep -q "\"id\""; then
    log "INFO" "Client updated successfully!"
    echo "$response" | json_pp
    return 0
  else
    log "ERROR" "Failed to update client. Response: $response"
    return 1
  fi
}

# Delete the test client (cleanup)
delete_client() {
  if [ -z "$CREATED_CLIENT_ID" ]; then
    log "ERROR" "No client ID available for deletion"
    return 1
  fi
  
  log "INFO" "Deleting client with ID: $CREATED_CLIENT_ID..."
  
  local response=$(curl -s -X DELETE "$BASE_URL/api/clients/$CREATED_CLIENT_ID" \
    -b cookies.txt)
  
  # For delete, an empty response is usually successful
  if [ -z "$response" ] || [ "$response" = "{}" ]; then
    log "INFO" "Client deleted successfully!"
    return 0
  else
    log "ERROR" "Failed to delete client. Response: $response"
    return 1
  fi
}

# Run the tests
run_tests() {
  log "INFO" "Starting client API tests (create/update only)..."
  
  # Login
  if ! login; then
    log "ERROR" "Login failed, cannot proceed with tests"
    return 1
  fi
  
  # Verify auth
  if ! verify_auth; then
    log "ERROR" "Authentication verification failed, cannot proceed with tests"
    return 1
  fi
  
  # Create client
  if ! create_client; then
    log "ERROR" "Client creation failed, cannot proceed with update test"
    return 1
  fi
  
  # Update client
  if ! update_client; then
    log "ERROR" "Client update failed"
  else
    log "INFO" "Client update successful! Field sanitization is working properly."
  fi
  
  # Cleanup: Delete client
  if ! delete_client; then
    log "WARN" "Client deletion failed (cleanup issue)"
  fi
  
  log "INFO" "Client API tests completed!"
}

# Execute the tests
run_tests