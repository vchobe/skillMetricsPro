# API Documentation

The Skills Management Platform provides a RESTful API for interacting with the system. This document provides an overview of the available endpoints and authentication requirements.

## API Overview

The API is organized around the following resources:

- **Authentication**: User registration, login, and session management
- **Users**: User profiles and management
- **Skills**: User skills and skill management
- **Endorsements**: Skill endorsements between users
- **Notifications**: User notifications
- **Admin**: Administrative functions

## Authentication

All API requests (except for login, register, and logout) require authentication. Authentication is session-based, and a valid session cookie must be included with each request.

See the [Authentication](./authentication.md) documentation for details on the authentication endpoints.

## API Request Format

API requests should be made using HTTP methods (GET, POST, PUT, DELETE) to the appropriate endpoint.

### Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://yourdomain.com/api`

### Headers

For all requests:
- `Content-Type: application/json`

### Request Body

For POST and PUT requests, the request body should be JSON.

## API Response Format

API responses are returned as JSON with the following structure:

**Success Response:**
```json
{
  "data": { ... },  // Response data
  "status": 200     // HTTP status code
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "status": 400  // HTTP status code
}
```

## HTTP Status Codes

The API uses standard HTTP status codes:

- `200 OK`: The request was successful
- `201 Created`: A resource was successfully created
- `400 Bad Request`: The request was invalid
- `401 Unauthorized`: Authentication is required
- `403 Forbidden`: The user does not have permission
- `404 Not Found`: The resource was not found
- `500 Internal Server Error`: Server error

## Rate Limiting

The API enforces rate limiting to prevent abuse. The limits are:

- 100 requests per minute per IP address
- 1000 requests per hour per IP address

When a rate limit is exceeded, the API will return a `429 Too Many Requests` response.

## API Versioning

The current API version is v1. The version is not included in the URL path, but may be included in future releases if breaking changes are introduced.

## API Documentation Sections

- [Authentication](./authentication.md)
- [User Management](./users.md)
- [Skills Management](./skills.md)
- [Endorsements](./endorsements.md)
- [Notifications](./notifications.md)
- [Admin Functions](./admin.md)

## Example Requests

### Authentication

```javascript
// Login
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'password' })
})
```

### Skills

```javascript
// Get all skills for current user
fetch('/api/skills', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
```

## API Client

The frontend application uses TanStack Query to interact with the API. See the [Frontend Components](../components/README.md) documentation for details.

## Postman Collection

A Postman collection is available for testing the API. Download it [here](../assets/skills_platform_api.postman_collection.json).

## API Playground

An interactive API playground is available at `/api/docs` when running in development mode.