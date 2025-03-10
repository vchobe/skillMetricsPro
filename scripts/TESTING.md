# Employee Skills Management Testing Guide

This document provides a comprehensive guide to testing the Employee Skills Management application.

## Available Test Scripts

Run these commands from the project root directory:

```bash
# Run all tests (API, database, and generate test data)
node scripts/run-tests.js

# Run only API tests
node scripts/run-tests.js --api-only

# Run only database tests
node scripts/run-tests.js --database-only

# Only generate test data
node scripts/run-tests.js --generate-data

# Run the comprehensive test suite (includes detailed reporting)
node scripts/full-test-suite.js
```

## Test Components

### 1. Database Tests

The database tests (in `scripts/database-testing.js`) verify:
- Database connection
- Schema and tables
- CRUD operations on all entities
- Relationships and joins
- Transaction support

### 2. API Tests

The API tests (in `scripts/api-testing.js`) verify:
- All API endpoints
- Authentication and authorization
- Error handling
- Data validation
- Response formats

### 3. Test Data Generation

The test data generation script (in `scripts/generate-test-data.js`):
- Creates 100 test users (5 admins and 95 regular users)
- Generates 5-15 skills per user across various categories
- Creates skill history entries to track progression
- Adds endorsements between users
- Generates notifications for various activities
- Creates profile history entries

### 4. UI Testing

UI testing is conducted manually using the test cases in `scripts/ui-testing.md`. This document contains 47 detailed test cases covering all aspects of the UI.

### 5. Comprehensive Test Suite

The comprehensive test suite (in `scripts/full-test-suite.js`):
- Runs all the above tests
- Generates a detailed test report
- Identifies bugs and issues
- Provides recommendations for improvement

## Test Environment

Tests run against the same database configured for the application. Make sure the application is running before executing tests.

## Test Users

The test data generation script creates users with the following credentials:

- Admin users:
  - Email: Generated for each admin (shown in console output)
  - Password: `Admin@123`

- Regular users:
  - Email: Generated for each user
  - Password: `User@123`

## Additional Notes

- All test scripts are implemented as ES modules
- Test reports are generated in markdown format
- Database tests include transaction rollback to avoid polluting the database
- Running the full test suite can take several minutes depending on the environment