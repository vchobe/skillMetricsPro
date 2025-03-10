# Employee Skills Management API Documentation

This document outlines all the API endpoints available in the Employee Skills Management application.

## Base URL

All endpoints are prefixed with `/api`.

## Authentication Endpoints

### Register a New User

```
POST /api/register
```

**Request Body:**
```json
{
  "username": "john.doe",
  "email": "john.doe@example.com",
  "password": "secure-password"
}
```

**Response:** The newly created user object

### Login

```
POST /api/login
```

**Request Body:**
```json
{
  "username": "john.doe",
  "password": "secure-password"
}
```

**Response:** The authenticated user object

### Logout

```
POST /api/logout
```

**Response:** Status 200 on success

### Get Current User

```
GET /api/user
```

**Response:** The current authenticated user or 401 if not authenticated

## User Management Endpoints

### Get All Users (Admin Only)

```
GET /api/users
```

**Response:** Array of all users

### Get User by ID

```
GET /api/users/:id
```

**Response:** User object for the specified ID

### Update User

```
PATCH /api/users/:id
```

**Request Body:** Any user fields to update
**Response:** Updated user object

### Update Password

```
POST /api/users/:id/password
```

**Request Body:**
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

**Response:** Status 200 on success

## Skills Endpoints

### Get All Skills

```
GET /api/skills
```

**Query Parameters:**
- `search`: Optional search term
- `category`: Optional category filter
- `level`: Optional level filter

**Response:** Array of skills matching criteria

### Get User Skills

```
GET /api/users/:userId/skills
```

**Response:** Array of skills for the specified user

### Get Skill by ID

```
GET /api/skills/:id
```

**Response:** Skill object for the specified ID

### Create Skill

```
POST /api/skills
```

**Request Body:**
```json
{
  "name": "JavaScript",
  "category": "Programming Languages",
  "level": "expert",
  "notes": "Optional notes"
}
```

**Response:** The newly created skill object

### Update Skill

```
PATCH /api/skills/:id
```

**Request Body:** Any skill fields to update
**Response:** Updated skill object

### Delete Skill

```
DELETE /api/skills/:id
```

**Response:** Status 200 on success

## Skill History Endpoints

### Get Skill History

```
GET /api/skills/:skillId/history
```

**Response:** Array of skill history entries for the specified skill

### Get User Skill History

```
GET /api/users/:userId/skill-history
```

**Response:** Array of skill history entries for the specified user

### Create Skill History

```
POST /api/skill-histories
```

**Request Body:**
```json
{
  "skillId": 123,
  "previousLevel": "intermediate",
  "newLevel": "expert",
  "changeNote": "Completed advanced training"
}
```

**Response:** The newly created skill history object

## Profile History Endpoints

### Get User Profile History

```
GET /api/users/:userId/profile-history
```

**Response:** Array of profile history entries for the specified user

### Create Profile History

```
POST /api/profile-histories
```

**Request Body:**
```json
{
  "fieldChanged": "role",
  "previousValue": "Junior Developer",
  "newValue": "Senior Developer",
  "changeNote": "Annual promotion"
}
```

**Response:** The newly created profile history object

## Endorsement Endpoints

### Get Skill Endorsements

```
GET /api/skills/:skillId/endorsements
```

**Response:** Array of endorsements for the specified skill

### Get User Endorsements

```
GET /api/users/:userId/endorsements
```

**Response:** Array of endorsements for the specified user

### Create Endorsement

```
POST /api/endorsements
```

**Request Body:**
```json
{
  "skillId": 123,
  "endorseeId": 456,
  "comment": "Excellent JavaScript skills!"
}
```

**Response:** The newly created endorsement object

### Delete Endorsement

```
DELETE /api/endorsements/:id
```

**Response:** Status 200 on success

## Notification Endpoints

### Get User Notifications

```
GET /api/notifications
```

**Query Parameters:**
- `unreadOnly`: Set to "true" to get only unread notifications

**Response:** Array of notifications for the current user

### Mark Notification as Read

```
PATCH /api/notifications/:id
```

**Response:** Updated notification object

### Mark All Notifications as Read

```
POST /api/notifications/read-all
```

**Response:** Status 200 on success

## System Endpoints

### Health Check

```
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-03-10T12:00:00.000Z"
}
```

## Error Responses

All API endpoints return appropriate HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses include a message field with details about the error.