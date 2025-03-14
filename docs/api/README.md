# API Documentation

This document provides comprehensive documentation for the Skills Management Platform's REST API.

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:3000/api
```

In production:

```
https://your-domain.com/api
```

## Authentication

Most API endpoints require authentication. The platform uses session-based authentication.

### Login

```
POST /auth/login
```

Authenticates a user and creates a session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isAdmin": false,
  "role": "Developer",
  "location": "Remote",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Successful login
- `401 Unauthorized`: Invalid credentials

### Register

```
POST /auth/register
```

Registers a new user.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "user@example.com",
  "password": "yourpassword",
  "confirmPassword": "yourpassword",
  "firstName": "John",
  "lastName": "Doe",
  "role": "Developer",
  "location": "Remote"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isAdmin": false,
  "role": "Developer",
  "location": "Remote",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `201 Created`: User successfully created
- `400 Bad Request`: Validation error
- `409 Conflict`: Username or email already exists

### Logout

```
POST /auth/logout
```

Logs out the current user by destroying the session.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Status Codes:**
- `200 OK`: Successfully logged out
- `401 Unauthorized`: Not logged in

### Get Current User

```
GET /user
```

Returns the currently authenticated user.

**Response:**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isAdmin": false,
  "role": "Developer",
  "location": "Remote",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200 OK`: User information returned
- `401 Unauthorized`: Not logged in

## User Management

### Get All Users

```
GET /users
```

Returns a list of all users. Requires admin privileges.

**Response:**
```json
[
  {
    "id": 1,
    "username": "johndoe",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isAdmin": false,
    "role": "Developer",
    "location": "Remote",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "username": "janedoe",
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "isAdmin": false,
    "role": "Designer",
    "location": "New York",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

**Status Codes:**
- `200 OK`: List of users returned
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin

### Get User by ID

```
GET /users/:id
```

Returns a specific user by ID.

**Response:**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isAdmin": false,
  "role": "Developer",
  "location": "Remote",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200 OK`: User information returned
- `401 Unauthorized`: Not logged in
- `404 Not Found`: User not found

### Update User

```
PATCH /users/:id
```

Updates a user's information. Users can only update their own information unless they have admin privileges.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "role": "Senior Developer",
  "location": "Chicago"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Smith",
  "isAdmin": false,
  "role": "Senior Developer",
  "location": "Chicago",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-10T00:00:00.000Z"
}
```

**Status Codes:**
- `200 OK`: User successfully updated
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not authorized to update this user
- `404 Not Found`: User not found

### Update Password

```
PATCH /users/:id/password
```

Updates a user's password. Users can only update their own password unless they have admin privileges.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword",
  "confirmPassword": "newpassword"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

**Status Codes:**
- `200 OK`: Password successfully updated
- `400 Bad Request`: Passwords don't match or other validation error
- `401 Unauthorized`: Not logged in or incorrect current password
- `403 Forbidden`: Not authorized to update this user's password
- `404 Not Found`: User not found

## Skills Management

### Get User Skills

```
GET /users/:userId/skills
```

Returns all skills for a specific user.

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "name": "JavaScript",
    "category": "Programming",
    "level": "expert",
    "yearsOfExperience": 5,
    "description": "Advanced JavaScript development",
    "certification": "JavaScript Certified Developer",
    "certificationLink": "https://example.com/cert/123",
    "certificationDate": "2024-01-01T00:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

**Status Codes:**
- `200 OK`: List of skills returned
- `401 Unauthorized`: Not logged in
- `404 Not Found`: User not found

### Get All Skills

```
GET /skills
```

Returns all skills in the system.

**Query Parameters:**
- `search`: Optional search term for skill name or category
- `category`: Optional filter by category
- `level`: Optional filter by skill level
- `userId`: Optional filter by user ID

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "name": "JavaScript",
    "category": "Programming",
    "level": "expert",
    "yearsOfExperience": 5,
    "description": "Advanced JavaScript development",
    "certification": "JavaScript Certified Developer",
    "certificationLink": "https://example.com/cert/123",
    "certificationDate": "2024-01-01T00:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

**Status Codes:**
- `200 OK`: List of skills returned
- `401 Unauthorized`: Not logged in

### Get Skill by ID

```
GET /skills/:id
```

Returns a specific skill by ID.

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "name": "JavaScript",
  "category": "Programming",
  "level": "expert",
  "yearsOfExperience": 5,
  "description": "Advanced JavaScript development",
  "certification": "JavaScript Certified Developer",
  "certificationLink": "https://example.com/cert/123",
  "certificationDate": "2024-01-01T00:00:00.000Z",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Skill information returned
- `401 Unauthorized`: Not logged in
- `404 Not Found`: Skill not found

### Create Skill

```
POST /skills
```

Creates a new skill for the current user.

**Request Body:**
```json
{
  "userId": 1,
  "name": "Python",
  "category": "Programming",
  "level": "intermediate",
  "yearsOfExperience": 2,
  "description": "Python development with focus on data analysis",
  "certification": "Python Data Scientist",
  "certificationLink": "https://example.com/cert/456",
  "certificationDate": "2024-06-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "id": 2,
  "userId": 1,
  "name": "Python",
  "category": "Programming",
  "level": "intermediate",
  "yearsOfExperience": 2,
  "description": "Python development with focus on data analysis",
  "certification": "Python Data Scientist",
  "certificationLink": "https://example.com/cert/456",
  "certificationDate": "2024-06-01T00:00:00.000Z",
  "createdAt": "2025-01-10T00:00:00.000Z",
  "updatedAt": "2025-01-10T00:00:00.000Z"
}
```

**Status Codes:**
- `201 Created`: Skill successfully created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not authorized to create a skill for this user

### Update Skill

```
PATCH /skills/:id
```

Updates a skill. Users can only update their own skills unless they have admin privileges.

**Request Body:**
```json
{
  "level": "expert",
  "yearsOfExperience": 3,
  "description": "Updated description"
}
```

**Response:**
```json
{
  "id": 2,
  "userId": 1,
  "name": "Python",
  "category": "Programming",
  "level": "expert",
  "yearsOfExperience": 3,
  "description": "Updated description",
  "certification": "Python Data Scientist",
  "certificationLink": "https://example.com/cert/456",
  "certificationDate": "2024-06-01T00:00:00.000Z",
  "createdAt": "2025-01-10T00:00:00.000Z",
  "updatedAt": "2025-01-15T00:00:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Skill successfully updated
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not authorized to update this skill
- `404 Not Found`: Skill not found

### Delete Skill

```
DELETE /skills/:id
```

Deletes a skill. Users can only delete their own skills unless they have admin privileges.

**Response:**
```json
{
  "message": "Skill deleted successfully"
}
```

**Status Codes:**
- `200 OK`: Skill successfully deleted
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not authorized to delete this skill
- `404 Not Found`: Skill not found

## Skill History

### Get Skill History

```
GET /skills/:skillId/history
```

Returns the history of a specific skill.

**Response:**
```json
[
  {
    "id": 1,
    "skillId": 1,
    "userId": 1,
    "previousLevel": "intermediate",
    "newLevel": "expert",
    "date": "2025-01-05T00:00:00.000Z",
    "note": "Completed advanced certification"
  }
]
```

**Status Codes:**
- `200 OK`: Skill history returned
- `401 Unauthorized`: Not logged in
- `404 Not Found`: Skill not found

### Get User Skill History

```
GET /user/skills/history
```

Returns the skill history for the current authenticated user.

**Response:**
```json
[
  {
    "id": 1,
    "skillId": 1,
    "userId": 1,
    "previousLevel": "intermediate",
    "newLevel": "expert",
    "date": "2025-01-05T00:00:00.000Z",
    "note": "Completed advanced certification"
  }
]
```

**Status Codes:**
- `200 OK`: User skill history returned
- `401 Unauthorized`: Not logged in

## Endorsements

### Get Skill Endorsements

```
GET /skills/:skillId/endorsements
```

Returns all endorsements for a specific skill.

**Response:**
```json
[
  {
    "id": 1,
    "skillId": 1,
    "endorserId": 2,
    "comment": "Great JavaScript developer",
    "createdAt": "2025-01-10T00:00:00.000Z"
  }
]
```

**Status Codes:**
- `200 OK`: Endorsements returned
- `401 Unauthorized`: Not logged in
- `404 Not Found`: Skill not found

### Create Endorsement

```
POST /skills/:skillId/endorsements
```

Creates a new endorsement for a skill.

**Request Body:**
```json
{
  "comment": "Great TypeScript skills!"
}
```

**Response:**
```json
{
  "id": 2,
  "skillId": 1,
  "endorserId": 3,
  "comment": "Great TypeScript skills!",
  "createdAt": "2025-01-15T00:00:00.000Z"
}
```

**Status Codes:**
- `201 Created`: Endorsement successfully created
- `400 Bad Request`: Validation error or trying to endorse your own skill
- `401 Unauthorized`: Not logged in
- `404 Not Found`: Skill not found

### Delete Endorsement

```
DELETE /endorsements/:id
```

Deletes an endorsement. Only the endorser or an admin can delete an endorsement.

**Response:**
```json
{
  "message": "Endorsement deleted successfully"
}
```

**Status Codes:**
- `200 OK`: Endorsement successfully deleted
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not authorized to delete this endorsement
- `404 Not Found`: Endorsement not found

## Notifications

### Get User Notifications

```
GET /notifications
```

Returns all notifications for the current user.

**Query Parameters:**
- `unreadOnly`: If set to "true", returns only unread notifications

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "type": "endorsement",
    "message": "Jane Doe endorsed your JavaScript skill",
    "isRead": false,
    "createdAt": "2025-01-10T00:00:00.000Z",
    "relatedSkillId": 1,
    "relatedUserId": 2
  }
]
```

**Status Codes:**
- `200 OK`: Notifications returned
- `401 Unauthorized`: Not logged in

### Mark Notification as Read

```
PATCH /notifications/:id
```

Marks a specific notification as read.

**Response:**
```json
{
  "message": "Notification marked as read"
}
```

**Status Codes:**
- `200 OK`: Notification marked as read
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not authorized to update this notification
- `404 Not Found`: Notification not found

### Mark All Notifications as Read

```
PATCH /notifications/mark-all-read
```

Marks all notifications for the current user as read.

**Response:**
```json
{
  "message": "All notifications marked as read"
}
```

**Status Codes:**
- `200 OK`: All notifications marked as read
- `401 Unauthorized`: Not logged in

## Skill Templates (Admin Only)

### Get All Skill Templates

```
GET /admin/skill-templates
```

Returns all skill templates. Requires admin privileges.

**Response:**
```json
[
  {
    "id": 1,
    "name": "JavaScript",
    "category": "Programming",
    "description": "Modern JavaScript development",
    "isRecommended": true,
    "targetLevel": "intermediate",
    "targetDate": "2025-06-01T00:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

**Status Codes:**
- `200 OK`: Templates returned
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin

### Create Skill Template

```
POST /admin/skill-templates
```

Creates a new skill template. Requires admin privileges.

**Request Body:**
```json
{
  "name": "React",
  "category": "Web Development",
  "description": "React.js frontend development",
  "isRecommended": true,
  "targetLevel": "intermediate",
  "targetDate": "2025-06-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "id": 2,
  "name": "React",
  "category": "Web Development",
  "description": "React.js frontend development",
  "isRecommended": true,
  "targetLevel": "intermediate",
  "targetDate": "2025-06-01T00:00:00.000Z",
  "createdAt": "2025-01-15T00:00:00.000Z",
  "updatedAt": "2025-01-15T00:00:00.000Z"
}
```

**Status Codes:**
- `201 Created`: Template successfully created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin

### Update Skill Template

```
PATCH /admin/skill-templates/:id
```

Updates a skill template. Requires admin privileges.

**Request Body:**
```json
{
  "description": "Updated description",
  "targetLevel": "expert"
}
```

**Response:**
```json
{
  "id": 2,
  "name": "React",
  "category": "Web Development",
  "description": "Updated description",
  "isRecommended": true,
  "targetLevel": "expert",
  "targetDate": "2025-06-01T00:00:00.000Z",
  "createdAt": "2025-01-15T00:00:00.000Z",
  "updatedAt": "2025-01-20T00:00:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Template successfully updated
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin
- `404 Not Found`: Template not found

### Delete Skill Template

```
DELETE /admin/skill-templates/:id
```

Deletes a skill template. Requires admin privileges.

**Response:**
```json
{
  "message": "Skill template deleted successfully"
}
```

**Status Codes:**
- `200 OK`: Template successfully deleted
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin
- `404 Not Found`: Template not found

## Skill Targets (Admin Only)

### Get All Skill Targets

```
GET /admin/skill-targets
```

Returns all skill targets. Requires admin privileges.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Web Development Skills",
    "description": "Essential skills for web developers",
    "targetLevel": "intermediate",
    "targetDate": "2025-06-01T00:00:00.000Z",
    "targetNumber": 3,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

**Status Codes:**
- `200 OK`: Targets returned
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin

### Create Skill Target

```
POST /admin/skill-targets
```

Creates a new skill target. Requires admin privileges.

**Request Body:**
```json
{
  "name": "Data Science Skills",
  "description": "Essential skills for data scientists",
  "targetLevel": "intermediate",
  "targetDate": "2025-06-01T00:00:00.000Z",
  "targetNumber": 5
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Data Science Skills",
  "description": "Essential skills for data scientists",
  "targetLevel": "intermediate",
  "targetDate": "2025-06-01T00:00:00.000Z",
  "targetNumber": 5,
  "createdAt": "2025-01-15T00:00:00.000Z",
  "updatedAt": "2025-01-15T00:00:00.000Z"
}
```

**Status Codes:**
- `201 Created`: Target successfully created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin

### Update Skill Target

```
PATCH /admin/skill-targets/:id
```

Updates a skill target. Requires admin privileges.

**Request Body:**
```json
{
  "description": "Updated description",
  "targetLevel": "expert"
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Data Science Skills",
  "description": "Updated description",
  "targetLevel": "expert",
  "targetDate": "2025-06-01T00:00:00.000Z",
  "targetNumber": 5,
  "createdAt": "2025-01-15T00:00:00.000Z",
  "updatedAt": "2025-01-20T00:00:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Target successfully updated
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin
- `404 Not Found`: Target not found

### Delete Skill Target

```
DELETE /admin/skill-targets/:id
```

Deletes a skill target. Requires admin privileges.

**Response:**
```json
{
  "message": "Skill target deleted successfully"
}
```

**Status Codes:**
- `200 OK`: Target successfully deleted
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin
- `404 Not Found`: Target not found

### Add Skill to Target

```
POST /admin/skill-targets/:targetId/skills/:skillId
```

Adds a skill to a target. Requires admin privileges.

**Response:**
```json
{
  "message": "Skill added to target successfully"
}
```

**Status Codes:**
- `200 OK`: Skill added to target
- `400 Bad Request`: Skill already in target
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin
- `404 Not Found`: Target or skill not found

### Remove Skill from Target

```
DELETE /admin/skill-targets/:targetId/skills/:skillId
```

Removes a skill from a target. Requires admin privileges.

**Response:**
```json
{
  "message": "Skill removed from target successfully"
}
```

**Status Codes:**
- `200 OK`: Skill removed from target
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin
- `404 Not Found`: Target, skill, or assignment not found

### Add User to Target

```
POST /admin/skill-targets/:targetId/users/:userId
```

Assigns a user to a target. Requires admin privileges.

**Response:**
```json
{
  "message": "User assigned to target successfully"
}
```

**Status Codes:**
- `200 OK`: User assigned to target
- `400 Bad Request`: User already assigned to target
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin
- `404 Not Found`: Target or user not found

### Remove User from Target

```
DELETE /admin/skill-targets/:targetId/users/:userId
```

Removes a user from a target. Requires admin privileges.

**Response:**
```json
{
  "message": "User removed from target successfully"
}
```

**Status Codes:**
- `200 OK`: User removed from target
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin
- `404 Not Found`: Target, user, or assignment not found

## Analytics (Admin Only)

### Get Skills Distribution

```
GET /admin/analytics/skills-distribution
```

Returns the distribution of skills by level and category. Requires admin privileges.

**Response:**
```json
{
  "byLevel": {
    "beginner": 25,
    "intermediate": 45,
    "expert": 30
  },
  "byCategory": {
    "Programming": 40,
    "Web Development": 20,
    "Data Science": 15,
    "DevOps": 10,
    "Design": 15
  }
}
```

**Status Codes:**
- `200 OK`: Analytics data returned
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin

### Get Skill Gap Analysis

```
GET /admin/analytics/skill-gaps
```

Returns skill gap analysis data. Requires admin privileges.

**Response:**
```json
[
  {
    "targetId": 1,
    "targetName": "Web Development Skills",
    "targetLevel": "intermediate",
    "targetDate": "2025-06-01T00:00:00.000Z",
    "targetSkillCount": 3,
    "users": [
      {
        "userId": 1,
        "username": "johndoe",
        "currentSkillCount": 2,
        "gap": 1,
        "percentComplete": 66.7,
        "skillsNeeded": ["React"]
      }
    ]
  }
]
```

**Status Codes:**
- `200 OK`: Analytics data returned
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin

### Get Advanced Analytics

```
GET /admin/advanced-analytics
```

Returns comprehensive advanced analytics data. Requires admin privileges.

**Response:**
```json
{
  "monthlyData": [
    {
      "month": "2025-01",
      "skillsAdded": 15,
      "skillsUpdated": 8,
      "endorsements": 12
    }
  ],
  "certifications": {
    "total": 45,
    "byCategory": {
      "Programming": 20,
      "Web Development": 15,
      "Data Science": 10
    }
  },
  "userActivity": {
    "mostActiveUsers": [
      {
        "userId": 1,
        "username": "johndoe",
        "activityCount": 25
      }
    ],
    "leastActiveUsers": [
      {
        "userId": 5,
        "username": "inactive",
        "activityCount": 1
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK`: Analytics data returned
- `401 Unauthorized`: Not logged in
- `403 Forbidden`: Not an admin

## Error Responses

All API endpoints return standardized error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Common Error Status Codes

- `400 Bad Request`: Invalid request parameters or validation error
- `401 Unauthorized`: Authentication required or invalid credentials
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate username)
- `500 Internal Server Error`: Server-side error