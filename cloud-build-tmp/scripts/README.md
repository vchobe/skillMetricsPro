# Employee Skills Management Testing Infrastructure

This directory contains scripts and documentation for testing the Employee Skills Management application.

## Overview

The testing infrastructure consists of several components:

1. **API Testing**: Automated tests for API endpoints
2. **Database Testing**: Tests for database operations and integrity
3. **Test Data Generation**: Scripts to generate test data for development and testing
4. **UI Testing**: Manual testing guide for UI components
5. **Comprehensive Test Suite**: Integrated testing environment for all components

## Scripts

### API Testing

- `api-testing.js`: Automated tests for all API endpoints
- `API.md`: Documentation of all API endpoints

### Database Testing

- `database-testing.js`: Tests for database operations and integrity

### Test Data Generation

- `generate-test-data.js`: Generates test users, skills, endorsements, and more

### Test Runner

- `run-tests.js`: Main entry point for running all tests
- `full-test-suite.js`: Comprehensive test suite with reporting

### Documentation

- `TESTING.md`: Overall testing guide
- `ui-testing.md`: Manual UI testing guide
- `test-report-template.md`: Template for test reports

## Usage

See `TESTING.md` for detailed usage instructions, but here are the basics:

```bash
# Run all tests
node scripts/run-tests.js

# Run only API tests
node scripts/run-tests.js --api-only

# Run only database tests
node scripts/run-tests.js --database-only

# Only generate test data
node scripts/run-tests.js --generate-data

# Run the comprehensive test suite
node scripts/full-test-suite.js
```

## Test Users

The test data generation script creates:

- Admin users with password: `Admin@123`
- Regular users with password: `User@123`

## Test Reports

When running the comprehensive test suite, a test report is generated at the root of the project as `test-report.md`.

## ES Modules

All test scripts use ES modules. This allows for better code organization and reuse between test components.

## Maintenance

When adding new features to the application, be sure to:

1. Update API documentation in `API.md`
2. Add tests for new API endpoints in `api-testing.js`
3. Add database tests for new schemas in `database-testing.js`
4. Update test data generation in `generate-test-data.js`
5. Add UI test cases for new features in `ui-testing.md`