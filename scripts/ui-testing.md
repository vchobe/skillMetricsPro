# Employee Skills Management UI Testing Guide

This document provides a comprehensive guide for manually testing the UI of the Employee Skills Management application.

## Test Environment Setup

1. Ensure the application is running (`npm run dev`)
2. Have test data generated (`node scripts/generate-test-data.js`)
3. Use both admin and regular user accounts for testing

## Test Cases

### Authentication & User Management (10 tests)

#### AUTH-01: User Registration
- Navigate to `/auth`
- Fill out registration form with valid data
- Submit and verify successful registration
- Check that you're redirected to the home page
✅ PASS / ❌ FAIL

#### AUTH-02: User Login
- Navigate to `/auth`
- Enter valid credentials
- Submit and verify successful login
- Check that you're redirected to the home page
✅ PASS / ❌ FAIL

#### AUTH-03: User Logout
- While logged in, click the logout button in the header
- Verify successful logout
- Check that you're redirected to the auth page
✅ PASS / ❌ FAIL

#### AUTH-04: Login Validation
- Navigate to `/auth`
- Try to login with invalid credentials
- Verify appropriate error messages are displayed
✅ PASS / ❌ FAIL

#### AUTH-05: Registration Validation
- Navigate to `/auth`
- Try to register with an existing username/email
- Try to register with invalid password format
- Verify appropriate error messages are displayed
✅ PASS / ❌ FAIL

#### AUTH-06: Route Protection
- While logged out, try to access protected routes (e.g., `/profile`, `/skills`)
- Verify you're redirected to the auth page
✅ PASS / ❌ FAIL

#### AUTH-07: Admin Route Protection
- Login as a regular user
- Try to access admin routes (e.g., `/admin`)
- Verify you're shown an appropriate message or redirected
✅ PASS / ❌ FAIL

#### AUTH-08: Profile Update
- Navigate to `/profile`
- Update profile information
- Submit and verify changes are saved
- Check that profile data is updated on the UI
✅ PASS / ❌ FAIL

#### AUTH-09: Password Change
- Navigate to `/profile`
- Change password with valid inputs
- Verify successful password change
- Logout and login with the new password
✅ PASS / ❌ FAIL

#### AUTH-10: Profile History
- Navigate to `/profile`
- Check that profile history is displayed correctly
- Verify that after updating profile, a new history entry is created
✅ PASS / ❌ FAIL

### Skills Management (12 tests)

#### SKILL-01: View Skills List
- Navigate to `/skills`
- Verify that your skills are listed correctly
- Check that skill information is displayed properly
✅ PASS / ❌ FAIL

#### SKILL-02: Add New Skill
- Navigate to `/skills`
- Click "Add Skill" button
- Fill out the form with valid data
- Submit and verify the new skill appears in the list
✅ PASS / ❌ FAIL

#### SKILL-03: Edit Skill
- Navigate to `/skills`
- Select a skill to edit
- Modify the data
- Submit and verify changes are saved
✅ PASS / ❌ FAIL

#### SKILL-04: Delete Skill
- Navigate to `/skills`
- Select a skill to delete
- Confirm deletion
- Verify the skill is removed from the list
✅ PASS / ❌ FAIL

#### SKILL-05: Skill Validation
- Try to add/edit a skill with invalid data
- Verify appropriate error messages are displayed
✅ PASS / ❌ FAIL

#### SKILL-06: Skill Filtering
- Navigate to `/skills`
- Use category filters to filter skills
- Verify filtered results are displayed correctly
✅ PASS / ❌ FAIL

#### SKILL-07: Skill Searching
- Navigate to `/skills`
- Use the search box to search for skills
- Verify search results are displayed correctly
✅ PASS / ❌ FAIL

#### SKILL-08: Skill Level Badge
- Verify that skill level badges (beginner, intermediate, expert) display correctly
- Check that the color coding is consistent
✅ PASS / ❌ FAIL

#### SKILL-09: Skill Detail View
- Navigate to `/skills/:id` for a specific skill
- Verify that all skill details are displayed correctly
✅ PASS / ❌ FAIL

#### SKILL-10: Skill History
- Navigate to `/skills/:id/history` for a specific skill
- Verify that skill history is displayed correctly
- After updating a skill level, check that a new history entry is created
✅ PASS / ❌ FAIL

#### SKILL-11: Skill Statistics
- Navigate to the skills page
- Check that skill statistics (counts by level, category) are displayed correctly
✅ PASS / ❌ FAIL

#### SKILL-12: Skill Sorting
- Navigate to `/skills`
- Test sorting options (by name, level, category, etc.)
- Verify sorting works correctly
✅ PASS / ❌ FAIL

### Endorsements (8 tests)

#### ENDORSE-01: View Endorsements
- Navigate to a skill detail page
- Verify endorsements are displayed correctly
✅ PASS / ❌ FAIL

#### ENDORSE-02: Add Endorsement
- Navigate to another user's skill
- Add an endorsement with a comment
- Verify the endorsement appears in the list
✅ PASS / ❌ FAIL

#### ENDORSE-03: Endorsement Validation
- Try to submit an empty endorsement
- Verify appropriate error messages are displayed
✅ PASS / ❌ FAIL

#### ENDORSE-04: Delete Endorsement
- Navigate to an endorsement you've given
- Delete the endorsement
- Verify it's removed from the list
✅ PASS / ❌ FAIL

#### ENDORSE-05: Endorsement Permissions
- Verify you cannot endorse your own skills
- Verify you can only delete your own endorsements
✅ PASS / ❌ FAIL

#### ENDORSE-06: Endorsement Counts
- Verify that endorsement counts are displayed correctly
- Add an endorsement and check that the count updates
✅ PASS / ❌ FAIL

#### ENDORSE-07: User Endorsements View
- Navigate to your profile
- View endorsements you've received
- Verify they display correctly
✅ PASS / ❌ FAIL

#### ENDORSE-08: Endorsement Notifications
- Have another user endorse your skill
- Verify you receive a notification
- Check that notification details are correct
✅ PASS / ❌ FAIL

### Notifications (5 tests)

#### NOTIF-01: View Notifications
- Click the notification icon in the header
- Verify notifications are displayed correctly
✅ PASS / ❌ FAIL

#### NOTIF-02: Mark Notification as Read
- Open a notification
- Verify it's marked as read
- Check that the unread count decreases
✅ PASS / ❌ FAIL

#### NOTIF-03: Mark All Notifications as Read
- Click "Mark all as read"
- Verify all notifications are marked as read
✅ PASS / ❌ FAIL

#### NOTIF-04: Notification Badges
- Verify that the notification badge shows the correct count
- Mark notifications as read and check that the count updates
✅ PASS / ❌ FAIL

#### NOTIF-05: Notification Types
- Generate different types of notifications (endorsement, level-up, etc.)
- Verify that each type displays correctly
✅ PASS / ❌ FAIL

### Admin Dashboard (5 tests)

#### ADMIN-01: View Admin Dashboard
- Login as an admin
- Navigate to `/admin`
- Verify the dashboard loads correctly
✅ PASS / ❌ FAIL

#### ADMIN-02: User Management
- Navigate to the user management section
- Verify user list is displayed correctly
- Test filtering and searching users
✅ PASS / ❌ FAIL

#### ADMIN-03: Skill Analytics
- Navigate to the skill analytics section
- Verify charts and statistics display correctly
✅ PASS / ❌ FAIL

#### ADMIN-04: Admin Actions
- Test admin-only actions (e.g., managing users, viewing all skills)
- Verify these actions work correctly
✅ PASS / ❌ FAIL

#### ADMIN-05: Admin Permissions
- Verify that regular users cannot access admin features
✅ PASS / ❌ FAIL

### Responsive Design (7 tests)

#### RESP-01: Mobile Layout
- Test the application on mobile devices or using device emulation
- Verify layout adapts properly to small screens
✅ PASS / ❌ FAIL

#### RESP-02: Tablet Layout
- Test the application on tablet devices or using device emulation
- Verify layout adapts properly to medium screens
✅ PASS / ❌ FAIL

#### RESP-03: Desktop Layout
- Test the application on desktop
- Verify layout utilizes larger screen space efficiently
✅ PASS / ❌ FAIL

#### RESP-04: Navigation Menu
- Test the navigation menu on different screen sizes
- Verify it collapses to a hamburger menu on smaller screens
✅ PASS / ❌ FAIL

#### RESP-05: Forms
- Test form layouts on different screen sizes
- Verify forms are usable on all devices
✅ PASS / ❌ FAIL

#### RESP-06: Tables and Lists
- Test tables and list views on different screen sizes
- Verify they adapt properly to screen width
✅ PASS / ❌ FAIL

#### RESP-07: Touch Interactions
- Test touch interactions on mobile devices
- Verify touchable elements are properly sized and spaced
✅ PASS / ❌ FAIL

## Exploratory Testing

Use the following scenarios for exploratory testing:

1. New user onboarding flow
2. Skill progression tracking over time
3. Team collaboration through endorsements
4. Admin user monitoring team skills
5. Mobile user checking notifications and updates

## Reporting Issues

For any issues found during testing:

1. Take a screenshot of the issue
2. Note the steps to reproduce
3. Document the expected vs. actual behavior
4. Note the browser/device information
5. Add the issue to the test report with severity rating