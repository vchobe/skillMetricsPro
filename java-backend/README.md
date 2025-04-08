# Spring Boot Backend for Skills Management Application

This directory contains a Spring Boot backend application that will replace the existing Node.js/Express backend while maintaining compatibility with the React frontend.

## Architecture

The application follows a standard Spring Boot architecture:

- **Models**: JPA entities that map to database tables
- **Repositories**: Spring Data JPA repositories for database access
- **Services**: Business logic layer
- **Controllers**: REST API endpoints
- **DTOs**: Data Transfer Objects for API communication
- **Security**: JWT-based authentication and authorization

## API Endpoints

The API endpoints match the existing Node.js backend to ensure frontend compatibility:

- **Authentication**
  - POST `/auth/login`: Authenticate user and return JWT token

- **Users**
  - GET `/api/users`: Get all users
  - GET `/api/users/:id`: Get user by ID
  - PUT `/api/users/:id`: Update user
  - DELETE `/api/users/:id`: Delete user

- **Skills**
  - GET `/api/skills`: Get all skills
  - GET `/api/skills/:id`: Get skill by ID
  - POST `/api/skills`: Create new skill
  - PUT `/api/skills/:id`: Update skill
  - DELETE `/api/skills/:id`: Delete skill

- **Projects**
  - GET `/api/projects`: Get all projects
  - GET `/api/projects/:id`: Get project by ID
  - POST `/api/projects`: Create new project
  - PUT `/api/projects/:id`: Update project
  - DELETE `/api/projects/:id`: Delete project

- **Project Resources**
  - GET `/api/projects/:id/resources`: Get all resources for a project
  - POST `/api/projects/:id/resources`: Add resource to project
  - DELETE `/api/projects/:id/resources/:resourceId`: Remove resource from project

- **Project Skills**
  - GET `/api/projects/:id/skills`: Get all skills for a project
  - POST `/api/projects/:id/skills`: Add skill to project
  - DELETE `/api/projects/:id/skills/:skillId`: Remove skill from project

## Building and Running

### Local Development

1. Update application.properties with your database credentials
2. Run `./mvnw spring-boot:run` to start the application
3. API will be available at http://localhost:8080

### Building for Deployment

1. Run `./build.sh` to compile the application
2. A JAR file will be created in the target/ directory
3. The JAR can be deployed to any environment that supports Java

## Frontend Integration

To connect the React frontend to this Java backend:

1. Update API URL in the frontend configuration
2. Ensure authentication headers are set properly
3. Test all API endpoints to verify compatibility

## Deployment

Use the `deploy-java-backend.sh` script in the root directory to build and deploy the application to Google Cloud Run.
