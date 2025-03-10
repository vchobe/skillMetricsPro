# UI Testing Guide for Employee Skills Management

## Prerequisites
- Test environment is set up
- Database is initialized
- Server is running on http://localhost:5000
- Test data for 100 users is generated
- Testing accounts have been set up with different roles (admin, regular user)

## 1. Authentication Testing

### 1.1 Registration Flow
- [ ] **TC-REG-01**: Register with valid email
  - Navigate to /auth
  - Enter valid email address
  - Submit form
  - Verify success message indicating password was generated
  - Check email (server logs) for generated password
  - Verify user is redirected to login form after registration

- [ ] **TC-REG-02**: Register with invalid email format
  - Navigate to /auth
  - Enter invalid email format (e.g., "test", "test@", "test@domain")
  - Submit form
  - Verify validation error is displayed
  - Form should not submit

- [ ] **TC-REG-03**: Register with already existing email
  - Navigate to /auth
  - Enter email address that already exists in the system
  - Submit form
  - Verify error message indicating email already exists
  - Form should not submit

- [ ] **TC-REG-04**: Registration with empty email
  - Navigate to /auth
  - Leave email field empty
  - Submit form
  - Verify validation error is displayed
  - Form should not submit

### 1.2 Login Flow
- [ ] **TC-LOGIN-01**: Login with valid credentials
  - Navigate to /auth
  - Enter valid email and password
  - Submit form
  - Verify successful login
  - Verify redirect to dashboard/home page

- [ ] **TC-LOGIN-02**: Login with invalid password
  - Navigate to /auth
  - Enter valid email but invalid password
  - Submit form
  - Verify error message is displayed
  - User remains on login page

- [ ] **TC-LOGIN-03**: Login with non-existent email
  - Navigate to /auth
  - Enter non-existent email and any password
  - Submit form
  - Verify error message is displayed
  - User remains on login page

- [ ] **TC-LOGIN-04**: Login with empty fields
  - Navigate to /auth
  - Leave email and/or password fields empty
  - Submit form
  - Verify validation errors are displayed
  - Form should not submit

### 1.3 Password Reset Flow
- [ ] **TC-PWD-01**: Request password reset with valid email
  - Navigate to password reset form
  - Enter valid email
  - Submit form
  - Verify success message
  - Check server logs for password reset email

- [ ] **TC-PWD-02**: Request password reset with invalid email
  - Navigate to password reset form
  - Enter invalid or non-existent email
  - Submit form
  - Verify appropriate error message
  - No password reset email should be generated

### 1.4 Logout Flow
- [ ] **TC-LOGOUT-01**: Logout from any page
  - Login with valid credentials
  - Click on logout button/link
  - Verify user is logged out
  - Verify redirect to login page
  - Verify protected routes are inaccessible after logout

## 2. Navigation and Layout Testing

### 2.1 Responsive Layout
- [ ] **TC-LAYOUT-01**: Desktop layout (1920x1080)
  - Test all pages on desktop resolution
  - Verify all elements are properly sized and positioned
  - Verify no horizontal scrolling is needed
  - Check for any overflow issues

- [ ] **TC-LAYOUT-02**: Tablet layout (768x1024)
  - Test all pages on tablet resolution
  - Verify responsive design adapts correctly
  - Verify all elements are usable and properly displayed
  - Test orientation changes (if applicable)

- [ ] **TC-LAYOUT-03**: Mobile layout (375x667)
  - Test all pages on mobile resolution
  - Verify responsive design adapts correctly
  - Verify all elements are usable and properly displayed
  - Verify touch targets are large enough
  - Test hamburger menu functionality

### 2.2 Navigation
- [ ] **TC-NAV-01**: Sidebar navigation
  - Verify all sidebar links
  - Test collapsible sidebar (if implemented)
  - Verify active link highlighting
  - Test navigation to all main sections

- [ ] **TC-NAV-02**: Mobile navigation
  - Test hamburger menu toggle
  - Verify all mobile menu links
  - Test closing mobile menu
  - Verify navigation behavior after route change

- [ ] **TC-NAV-03**: Breadcrumb navigation (if implemented)
  - Verify breadcrumb accuracy
  - Test breadcrumb links
  - Verify breadcrumb behavior on page changes

## 3. Skills Management Testing

### 3.1 Skills List
- [ ] **TC-SKILL-01**: Skills list display
  - Navigate to skills page
  - Verify all skills are displayed correctly
  - Verify skill cards show proper information
  - Test pagination (if implemented)

- [ ] **TC-SKILL-02**: Skill sorting
  - Test sorting by name (A-Z, Z-A)
  - Test sorting by level (beginner to expert, expert to beginner)
  - Test sorting by category
  - Test sorting by last updated

- [ ] **TC-SKILL-03**: Skill filtering
  - Test filtering by level
  - Test filtering by category
  - Test combining multiple filters
  - Verify clearing all filters works

- [ ] **TC-SKILL-04**: Skill search
  - Test searching by skill name
  - Test searching by partial name
  - Test search with no results
  - Verify search resets properly

### 3.2 Skill CRUD Operations
- [ ] **TC-SKILL-05**: Add new skill
  - Click "Add Skill" button
  - Fill in all required fields
  - Submit form
  - Verify new skill appears in the skills list
  - Verify skill history is created

- [ ] **TC-SKILL-06**: Add skill with validation errors
  - Click "Add Skill" button
  - Leave required fields empty or provide invalid data
  - Submit form
  - Verify validation errors are displayed
  - Form should not submit

- [ ] **TC-SKILL-07**: Edit skill
  - Find existing skill and click edit button
  - Modify skill information
  - Submit form
  - Verify changes are reflected in the skills list
  - Verify skill history is updated

- [ ] **TC-SKILL-08**: Delete skill
  - Find existing skill and click delete button
  - Confirm deletion
  - Verify skill is removed from the list
  - Verify skill history is maintained

### 3.3 Skill Details
- [ ] **TC-SKILL-09**: View skill details
  - Click on a skill to view details
  - Verify all skill information is displayed correctly
  - Test all tabs/sections on the detail page
  - Verify endorsements are displayed

## 4. Profile Management Testing

### 4.1 Profile View
- [ ] **TC-PROFILE-01**: View profile information
  - Navigate to profile page
  - Verify all user information is displayed correctly
  - Test all tabs/sections on the profile page

### 4.2 Profile Editing
- [ ] **TC-PROFILE-02**: Edit profile
  - Navigate to profile page
  - Click edit button
  - Update profile information
  - Submit form
  - Verify changes are reflected
  - Verify profile history is updated

- [ ] **TC-PROFILE-03**: Edit profile with validation errors
  - Navigate to profile page
  - Click edit button
  - Provide invalid data or leave required fields empty
  - Submit form
  - Verify validation errors are displayed
  - Form should not submit

### 4.3 Password Change
- [ ] **TC-PROFILE-04**: Change password
  - Navigate to password change form
  - Enter current password
  - Enter new password and confirmation
  - Submit form
  - Verify success message
  - Test login with new password

- [ ] **TC-PROFILE-05**: Change password with validation errors
  - Navigate to password change form
  - Test various validation scenarios:
    - Incorrect current password
    - New password too short
    - Passwords don't match
  - Verify appropriate error messages
  - Form should not submit for invalid cases

## 5. Endorsements Testing

### 5.1 Endorsement Actions
- [ ] **TC-END-01**: Add endorsement
  - Navigate to a skill detail page (another user's skill)
  - Add an endorsement with comment
  - Submit form
  - Verify endorsement appears in the list
  - Verify notification is created for the skill owner

- [ ] **TC-END-02**: Add endorsement with validation errors
  - Navigate to a skill detail page
  - Try to submit an empty endorsement
  - Verify validation error is displayed
  - Form should not submit

- [ ] **TC-END-03**: View received endorsements
  - Navigate to profile or skills page
  - View received endorsements
  - Verify all endorsement information is displayed correctly

- [ ] **TC-END-04**: Remove endorsement (if implemented)
  - Find an endorsement you created
  - Click remove button
  - Confirm removal
  - Verify endorsement is removed from the list

## 6. Notifications Testing

### 6.1 Notification Actions
- [ ] **TC-NOTIF-01**: View notifications
  - Navigate to notifications panel/page
  - Verify all notifications are displayed correctly
  - Verify unread notifications are highlighted

- [ ] **TC-NOTIF-02**: Mark notification as read
  - Click on an unread notification
  - Verify it becomes marked as read
  - Verify unread count decreases

- [ ] **TC-NOTIF-03**: Mark all notifications as read (if implemented)
  - Click "mark all as read" button
  - Verify all notifications become marked as read
  - Verify unread count becomes zero

- [ ] **TC-NOTIF-04**: Notification navigation
  - Click on a notification
  - Verify navigation to the relevant page/content

## 7. Skill History and Timeline Testing

### 7.1 History Views
- [ ] **TC-HIST-01**: View skill history
  - Navigate to skill history page
  - Verify timeline is displayed correctly
  - Verify all history entries show correct information

- [ ] **TC-HIST-02**: View profile history
  - Navigate to profile history page
  - Verify timeline is displayed correctly
  - Verify all history entries show correct information

### 7.2 Timeline Filtering (if implemented)
- [ ] **TC-HIST-03**: Filter timeline by date
  - Test date range filtering
  - Verify timeline updates correctly

- [ ] **TC-HIST-04**: Filter timeline by action type
  - Test filtering by different action types
  - Verify timeline updates correctly

## 8. Admin Features Testing (for admin users)

### 8.1 User Management
- [ ] **TC-ADMIN-01**: View all users
  - Login as admin
  - Navigate to user management page
  - Verify all users are listed
  - Test pagination (if implemented)

- [ ] **TC-ADMIN-02**: Search/filter users
  - Test user search functionality
  - Test filtering by role, status, etc.
  - Verify results are accurate

- [ ] **TC-ADMIN-03**: Edit user
  - Select a user to edit
  - Modify user information
  - Submit form
  - Verify changes are reflected

- [ ] **TC-ADMIN-04**: Disable/enable user
  - Select a user
  - Toggle user status
  - Verify status change is reflected
  - Verify disabled user cannot log in

### 8.2 Analytics Dashboard
- [ ] **TC-ADMIN-05**: View statistics
  - Navigate to analytics dashboard
  - Verify all charts and statistics are displayed correctly
  - Test different time periods (if implemented)

- [ ] **TC-ADMIN-06**: Export data (if implemented)
  - Test export functionality
  - Verify exported data is correct

## 9. Error Handling Testing

### 9.1 Form Errors
- [ ] **TC-ERR-01**: Test all form validation error messages
  - Test required field validation
  - Test format validation (email, passwords, etc.)
  - Test business rule validation
  - Verify error messages are clear and helpful

### 9.2 API Errors
- [ ] **TC-ERR-02**: Network error handling
  - Simulate network disconnection
  - Verify appropriate error messaging
  - Test retry functionality (if implemented)

- [ ] **TC-ERR-03**: Server error handling
  - Simulate server errors (500 responses)
  - Verify appropriate error messaging
  - Test recovery mechanisms

### 9.3 Empty States
- [ ] **TC-ERR-04**: Empty list states
  - Test UI for empty skills list
  - Test UI for empty notifications list
  - Test UI for empty search results
  - Verify helpful messaging

## 10. Performance Testing

### 10.1 Load Testing
- [ ] **TC-PERF-01**: Test with large data sets
  - Load profile with many skills (50+)
  - Test navigation with 100+ users
  - Verify UI remains responsive

### 10.2 Responsiveness
- [ ] **TC-PERF-02**: Measure page load times
  - Test initial load time
  - Test navigation between pages
  - Verify transitions are smooth

## 11. Cross-Browser Testing

### 11.1 Desktop Browsers
- [ ] **TC-BROWSER-01**: Chrome (latest)
- [ ] **TC-BROWSER-02**: Firefox (latest)
- [ ] **TC-BROWSER-03**: Safari (latest)
- [ ] **TC-BROWSER-04**: Edge (latest)

### 11.2 Mobile Browsers
- [ ] **TC-BROWSER-05**: Chrome Mobile
- [ ] **TC-BROWSER-06**: Safari Mobile

## Test Data Requirements

For comprehensive testing, the following test data should be generated:

1. 100 user accounts with the following distribution:
   - 5 admin users
   - 95 regular users
   - Various profile completeness levels

2. Skills variety:
   - At least 20 different skill categories
   - Skills with all three levels (beginner, intermediate, expert)
   - 5-15 skills per user (randomly distributed)

3. Skill histories:
   - Multiple history entries for selected skills
   - Various progression paths (beginner→intermediate→expert)

4. Endorsements:
   - Minimum 200 endorsements distributed across users
   - Some skills with multiple endorsements
   - Some users with many endorsements (for pagination testing)

5. Notifications:
   - Mix of read and unread notifications
   - All notification types represented
   - Some users with many notifications (for pagination testing)

## Test Execution Checklist

- [ ] Preparation: Test environment setup
- [ ] Preparation: Test data generation
- [ ] Preparation: Test accounts setup
- [ ] Execution: Authentication tests
- [ ] Execution: Navigation and layout tests
- [ ] Execution: Skills management tests
- [ ] Execution: Profile management tests
- [ ] Execution: Endorsements tests
- [ ] Execution: Notifications tests
- [ ] Execution: History and timeline tests
- [ ] Execution: Admin features tests
- [ ] Execution: Error handling tests
- [ ] Execution: Performance tests
- [ ] Execution: Cross-browser tests
- [ ] Reporting: Document all issues found
- [ ] Reporting: Complete test report

## Test Reporting

Use the test-report-template.md file to document all test results, including:
1. Test execution date and environment details
2. Pass/fail status for each test case
3. Details for any failed tests
4. Screenshots of critical bugs
5. Performance measurements
6. Recommendations for improvements