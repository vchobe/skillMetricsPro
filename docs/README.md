# Skills Management Platform Documentation

## Project Overview
This is a comprehensive skill management platform built with TypeScript, React, Express.js, and PostgreSQL.

## Core Components

### Frontend (`/client/src/`)
- **App.tsx**: Main application entry point - handles routing and app-wide state
- **Components**: Reusable UI components in `/components/`
  - `skill-card.tsx`: Displays individual skill cards with endorsements
  - `header.tsx`: Main navigation header with user menu
  - `sidebar.tsx`: Navigation sidebar with skill categories
  - See [Frontend Components](./components/README.md)

### Backend (`/server/`)
- **index.ts**: Express.js server setup and middleware configuration
- **routes.ts**: API route definitions for skills, users, and endorsements
- **auth.ts**: Authentication logic using Passport.js
- **storage.ts**: Database operations and data access layer
- **db.ts**: Database connection and configuration
- See [Server Architecture](./server/architecture.md)

### Database Schema (`/shared/schema.ts`)
- Core data models using Drizzle ORM
- Tables for users, skills, endorsements, and skill history
- See [Database Schema](./database/schema_overview.md)

### API Reference
Detailed API documentation available in [API Reference](./api/README.md)

## Key Features

### User Management
- Authentication & Authorization
- User Profiles
- Role-based Access Control

### Skill Management  
- Create/Update Skills
- Skill Categories
- Skill History Tracking
- Endorsements System

### Project Integration
- Project-Skill Mapping
- Team Skill Analytics
- Resource Planning

## Development Guide
See [Installation Guide](./installation/README.md) for setup instructions