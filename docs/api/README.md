# API Documentation

## Overview
The SkillMetrics API provides endpoints for managing user skills, projects, and other core functionality. The backend is implemented using Express.js with TypeScript.

## Key Components

### Authentication (`server/auth.ts`)
Authentication is handled via Passport.js with:
- Local strategy (email/password)
- Session management using PostgreSQL store
- JWT token support for API access

Key Methods:
- `setupAuth(app)`: Configures authentication middleware and routes
- `hashPassword(password)`: Securely hashes passwords using scrypt
- `comparePasswords(supplied, stored)`: Validates password hashes

### Storage Layer (`server/storage.ts`) 
Handles all database operations using a PostgreSQL implementation.

Key Interfaces:
- `IStorage`: Defines the contract for all storage operations
- `PostgresStorage`: Implements storage operations for PostgreSQL

Major Operations:
- User Management (CRUD)
- Skills Management 
- Project/Resource Management
- History Tracking
- Endorsements System

### Routes (`server/routes.ts`)
Defines all API endpoints and their handlers.

Main Route Categories:
1. Authentication Routes
   - POST /api/auth
   - POST /api/register 
   - POST /api/logout

2. User Routes
   - GET /api/user/profile
   - PATCH /api/user/profile
   - GET /api/users

3. Skills Routes
   - GET /api/skills
   - POST /api/skills
   - PATCH /api/skills/:id
   - DELETE /api/skills/:id

4. Project Routes
   - GET /api/projects
   - POST /api/projects
   - GET /api/projects/:id

5. Admin Routes
   - GET /api/admin/users
   - GET /api/admin/skills
   - POST /api/admin/skill-templates

### Email Service (`server/email.ts`)
Handles all email notifications using Mailjet.

Key Features:
- Registration emails
- Password reset
- Resource notifications
- Weekly reports

## Authentication Flow
1. User submits credentials
2. Passport validates against database
3. Session is created on success
4. JWT token issued for API access

## Error Handling
All endpoints implement consistent error handling:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Data Models
See schema.ts for detailed type definitions of:
- Users
- Skills
- Projects
- Resources
- History tracking