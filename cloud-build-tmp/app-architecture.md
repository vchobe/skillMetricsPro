# Employee Skills Management Platform - Architecture Overview

This document provides a comprehensive overview of the application architecture for the Employee Skills Management Platform, designed to help developers understand the system during deployment and maintenance.

## Application Architecture

The Employee Skills Management Platform is built using a modern full-stack JavaScript architecture:

### Technology Stack

- **Frontend**: React.js with TypeScript, TailwindCSS, and Shadcn UI components
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod for schema validation
- **Authentication**: Passport.js with session-based authentication
- **Email Integration**: Mailjet (with fallbacks for other providers)

### Core Components

```
┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│                    │     │                    │     │                    │
│    React Client    │────▶│    Express API     │────▶│    PostgreSQL DB   │
│                    │     │                    │     │                    │
└────────────────────┘     └────────────────────┘     └────────────────────┘
         ▲                          │                          
         │                          ▼                          
         │                  ┌────────────────────┐             
         └──────────────────┤     Email Service  │
                            │                    │             
                            └────────────────────┘
```

## Database Schema

The database uses a relational schema with the following key tables:

### Core Tables

1. **users**: Stores user account information (id, username, email, password hash, admin status, etc.)
2. **skills**: Records skills associated with users (id, user_id, name, category, level, certification, etc.)
3. **skill_histories**: Tracks changes to skills over time (id, skill_id, user_id, previous_level, new_level, etc.)
4. **endorsements**: Stores skill endorsements between users (id, skill_id, endorser_id, note, etc.)
5. **notifications**: Manages user notifications (id, user_id, type, message, etc.)
6. **profile_histories**: Tracks changes to user profiles (id, user_id, field_name, previous_value, new_value, etc.)
7. **skill_templates**: Defines skill template recommendations (id, name, category, description, etc.)
8. **skill_targets**: Defines organizational skill targets (id, name, description, target_level, etc.)
9. **skill_target_skills**: Links skills to targets (many-to-many relationship)
10. **skill_target_users**: Assigns targets to users (many-to-many relationship)

### Data Relationships

```
User ────┐
  │      │ 
  │      ▼
  │   Endorsement
  │      ▲
  │      │
  ├────▶ Skill ─────┐
  │      │          │
  │      │          ▼
  │      └────▶ SkillHistory
  │
  ├────▶ Notification
  │
  └────▶ ProfileHistory
  
SkillTemplate
  
SkillTarget ───┐
  │            │
  ▼            ▼
SkillTargetSkill  SkillTargetUser
```

## API Structure

The platform exposes RESTful API endpoints organized by functionality:

### Authentication Endpoints
- `POST /api/auth/login`: User login with email and password
- `POST /api/auth/register`: Create a new user account
- `GET /api/auth/logout`: Log out current user
- `POST /api/auth/reset-password`: Request password reset

### User and Profile Endpoints
- `GET /api/user`: Get current user profile
- `PATCH /api/user`: Update current user profile
- `GET /api/users`: Get all users (with pagination)
- `GET /api/users/:userId`: Get a specific user profile

### Skills Endpoints
- `GET /api/skills`: Get all skills for the current user
- `POST /api/skills`: Create a new skill
- `PATCH /api/skills/:id`: Update an existing skill
- `DELETE /api/skills/:id`: Delete a skill
- `GET /api/skills/search`: Search for skills by criteria

### Skill History Endpoints
- `GET /api/user/skills/history`: Get history of the current user's skills
- `GET /api/org/skills/history`: Get org-wide skill history

### Skill Templates and Targets
- `GET /api/skill-templates`: Get available skill templates
- `GET /api/skill-targets`: Get global skill targets
- `GET /api/user/skill-targets`: Get targets assigned to current user
- `GET /api/skill-gap-analysis`: Get organization-wide skill gap analysis

### Admin Endpoints
- `GET /api/admin/users`: Get all users with full details
- `GET /api/admin/skills`: Get all skills across all users
- `GET /api/admin/skill-history`: Get all skill history entries
- `GET/POST/PATCH/DELETE /api/admin/skill-templates`: Manage skill templates
- `GET/POST/PATCH/DELETE /api/admin/skill-targets`: Manage skill targets

## Authentication and Authorization

The application uses session-based authentication with secure HTTP-only cookies:

1. **Session Management**: Express-session with PostgreSQL session store
2. **Password Security**: Bcrypt for password hashing
3. **Authorization Middleware**: 
   - `ensureAuth`: Ensures user is authenticated
   - `ensureAdmin`: Ensures user is an admin

## Deployment Architecture

When deployed to Google Cloud Platform, the application uses the following architecture:

```
                            ┌───────────────────┐
                            │                   │
                        ┌───┤  Google Cloud Run │
 ┌──────────────┐       │   │                   │
 │              │       │   └───────────────────┘
 │   Internet   │───────┤
 │              │       │   ┌───────────────────┐
 └──────────────┘       │   │                   │
                        └───┤  Cloud SQL Proxy  │
                            │                   │
                            └─────────┬─────────┘
                                      │
                            ┌─────────▼─────────┐
                            │                   │
                            │  Cloud SQL (PG)   │
                            │                   │
                            └───────────────────┘
```

- **Cloud Run**: Containerized application (Node.js + Express + React)
- **Cloud SQL**: PostgreSQL database for data persistence
- **Cloud SQL Proxy**: Secure connection between application and database
- **Secret Manager**: Secure storage of credentials and environment variables

## Additional Components

### Email Integration

The application integrates with email providers for:
- User registration confirmations
- Password reset emails
- Notifications (optional)

Primary integration is with Mailjet, with fallbacks to other providers or local logging.

### Environment Variables

Key environment variables required for deployment:

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`: SMTP server details
- `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`: Mailjet API credentials
- `NODE_ENV`: Environment (development/production)
- `PORT`: Application port

## Monitoring and Logging

The application includes:
- Console logging with different levels (info, warn, error)
- Request/response logging in development mode
- Error tracking and reporting

## Security Considerations

Security features implemented:
- SQL injection protection through parameterized queries
- XSS protection via React's built-in protections
- CSRF protection with tokens
- Secure password storage with bcrypt
- HTTPS enforcement in production
- Rate limiting on authentication endpoints

## Scalability

The application is designed to scale horizontally:
- Stateless backend (sessions stored in database)
- Database connection pooling
- Optimized database queries with indexes
- Cloud Run auto-scaling capabilities