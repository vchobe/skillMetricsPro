# SkillMetrics Architecture

## Overview

SkillMetrics is a comprehensive Employee Skill Management platform designed to track, develop, and optimize workforce capabilities. The application enables organizations to manage employee skills through advanced tracking, analytics, and collaborative features.

The system follows a modern full-stack JavaScript architecture with TypeScript for type safety, using React for the frontend and Node.js/Express for the backend. It employs PostgreSQL for data persistence, with Drizzle ORM for database operations.

## System Architecture

### High-Level Architecture

The application follows a client-server architecture with clear separation of concerns:

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

### Dual Backend Support

The application has been designed to work with two different backend implementations:

1. **Node.js Backend**: The primary backend implementation using Express.js
2. **Java Backend**: An alternative Spring Boot implementation 

The frontend is configured to work with either backend through API compatibility layers.

## Key Components

### Frontend

- **Framework**: React with TypeScript
- **UI Library**: Tailwind CSS with ShadCN UI components
- **State Management**: React Query & Context API
- **Build System**: Vite (for fast development and optimized production builds)

### Backend (Node.js)

- **Framework**: Express.js on Node.js
- **API Design**: RESTful API endpoints
- **Authentication**: Session-based with Passport.js
- **Real-time Updates**: WebSocket for notifications and live updates
- **Email Integration**: Mailjet (with fallbacks for other providers)

### Data Storage

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod for schema validation
- **Migration Strategy**: Schema-based migrations using Drizzle

### Core Entities

1. **Users**: User accounts with authentication and profiles
2. **Skills**: Individual skills associated with users
3. **Skill Templates**: Pre-defined skill definitions for consistency
4. **Skill Targets**: Organizational skill expectations
5. **Endorsements**: Peer validations of skills
6. **Notifications**: System notifications for users
7. **Projects**: Work projects users are associated with
8. **Clients**: Business clients the organization works with
9. **Report Settings**: Configuration for automated reports

## Data Flow

### User Authentication Flow

1. User submits login credentials
2. Server authenticates and creates a session
3. Session token is stored in a cookie
4. Subsequent requests include the session cookie
5. Server validates the session on each request

### Skill Management Flow

1. Users can add skills to their profile from templates or custom definitions
2. Skills can be updated with new proficiency levels
3. Skill updates trigger notifications to supervisors
4. Skill history is maintained for tracking progression
5. Peers can endorse skills to validate proficiency claims

### Reporting Flow

1. Scheduled reports are configured via report settings
2. Report generation is triggered based on frequency settings
3. Data is compiled from the relevant tables
4. Reports are delivered via email to configured recipients

## Database Schema

The database uses a relational schema with these key tables:

1. **users**: User account information
2. **skills**: Skills associated with users
3. **skill_histories**: Tracks changes to skills over time
4. **endorsements**: Stores skill endorsements between users
5. **notifications**: Manages user notifications
6. **profile_histories**: Tracks changes to user profiles
7. **skill_templates**: Defines skill template recommendations
8. **skill_targets**: Defines organizational skill targets
9. **report_settings**: Configures automated reporting

## External Dependencies

1. **Email Service**: Integration with Mailjet for sending notifications and reports
2. **Authentication**: Session-based authentication with Passport.js
3. **Cloud Services**: Google Cloud Platform for hosting

## Deployment Strategy

### Google Cloud Platform Deployment

The application is deployed on Google Cloud Run with a connection to Google Cloud SQL for PostgreSQL, supporting two database connection methods:

1. **Direct IP Connection**:
   - Connects directly to the PostgreSQL database IP address
   - Simpler configuration without the Cloud SQL Auth Proxy
   - Works in all environments (development, staging, production)

2. **Unix Socket Connection**:
   - Uses Unix socket connections via the Cloud SQL Auth Proxy
   - Enhanced security without exposing database IP
   - Automatic IAM authentication and SSL encryption

### Containerization

- Docker is used to containerize the application
- Custom Dockerfiles are provided for different deployment scenarios
- Cloud Run specific optimizations ensure proper port configuration (8080)

### CI/CD Pipeline

- Cloud Build is used for continuous integration and deployment
- Custom build scripts enforce Cloud Run compatibility
- Deployment scripts handle environment variable configuration

### Environment Configuration

The application uses environment variables for configuration:

1. **Database Connection**: 
   - `DATABASE_URL` for direct connection string
   - Individual `PGHOST`, `PGUSER`, etc. variables as alternatives

2. **Application Settings**:
   - `NODE_ENV`: Runtime environment (development/production)
   - `PORT`: Server port (8080 for Cloud Run)
   - `HOST`: Server host binding (0.0.0.0 for Cloud Run)
   - `SESSION_SECRET`: Secret for session encryption

### Health Monitoring

- Health check endpoints are implemented for Cloud Run compatibility
- Structured logging enables monitoring in Google Cloud
- Custom scripts assist with deployment verification and diagnostics

## Security Considerations

1. **Database Security**:
   - Connection strings are stored as environment variables
   - SSL is used for secure connections when possible
   
2. **Application Security**:
   - Session-based authentication with secure cookies
   - Clear separation between admin and regular user permissions
   - Environment variable encryption for sensitive values in Cloud Run

3. **Infrastructure Security**:
   - Service accounts with minimal required permissions
   - Secure deployment using Cloud Run's containerized approach
   - Regular security audits and updates