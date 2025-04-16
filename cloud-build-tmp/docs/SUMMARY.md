# Skills Management Platform Documentation

## Table of Contents

### [Introduction](./README.md)
- System Overview
- Key Features
- Architecture

### Installation
- [Installation Guide](./installation/README.md)
- [Environment Variables](./installation/environment_variables.md)

### Database
- [Schema Overview](./database/schema_overview.md)

### API
- [API Overview](./api/README.md)

### Frontend Components
- [Components Overview](./components/README.md)

### Deployment
- [Google Cloud Platform](./deployment/gcp.md)

### [Deployment Scripts](../deployment/README.md)
- Deploy to GCP
- Database Setup
- Monitoring & Logging
- Backup & Restore

## File Structure Index

### Installation
- [docs/installation/README.md](./installation/README.md) - Installation guide overview
- [docs/installation/environment_variables.md](./installation/environment_variables.md) - Environment variables reference

### Database
- [docs/database/schema_overview.md](./database/schema_overview.md) - Database schema documentation

### API
- [docs/api/README.md](./api/README.md) - API documentation overview

### Components
- [docs/components/README.md](./components/README.md) - Frontend components overview

### Deployment
- [docs/deployment/gcp.md](./deployment/gcp.md) - GCP deployment guide
- [deployment/README.md](../deployment/README.md) - Deployment scripts overview
- [deployment/deploy-to-gcp.sh](../deployment/deploy-to-gcp.sh) - Main GCP deployment script
- [deployment/setup-database.sh](../deployment/setup-database.sh) - Database setup script
- [deployment/check-deployment.sh](../deployment/check-deployment.sh) - Deployment verification script
- [deployment/backup-restore-db.sh](../deployment/backup-restore-db.sh) - Database backup and restore script
- [deployment/deploy-all.sh](../deployment/deploy-all.sh) - All-in-one deployment script

## Source Code Reference

### Server
- [server/auth.ts](../server/auth.ts) - Authentication logic
- [server/db.ts](../server/db.ts) - Database connection
- [server/index.ts](../server/index.ts) - Main server entry point
- [server/routes.ts](../server/routes.ts) - API routes
- [server/storage.ts](../server/storage.ts) - Data storage interface
- [server/vite.ts](../server/vite.ts) - Vite server configuration

### Shared
- [shared/schema.ts](../shared/schema.ts) - Data schema definitions

### Client
- [client/src/App.tsx](../client/src/App.tsx) - Main application component
- [client/src/main.tsx](../client/src/main.tsx) - Application entry point

#### Pages
- [client/src/pages/admin-dashboard.tsx](../client/src/pages/admin-dashboard.tsx) - Admin dashboard
- [client/src/pages/auth-page.tsx](../client/src/pages/auth-page.tsx) - Authentication page
- [client/src/pages/home-page.tsx](../client/src/pages/home-page.tsx) - Home page
- [client/src/pages/leaderboard-page.tsx](../client/src/pages/leaderboard-page.tsx) - Leaderboard
- [client/src/pages/profile-page.tsx](../client/src/pages/profile-page.tsx) - User profile
- [client/src/pages/skills-page.tsx](../client/src/pages/skills-page.tsx) - Skills management

#### Components
- [client/src/components/activity-feed.tsx](../client/src/components/activity-feed.tsx) - Activity feed
- [client/src/components/add-skill-modal.tsx](../client/src/components/add-skill-modal.tsx) - Add skill modal
- [client/src/components/endorsement-card.tsx](../client/src/components/endorsement-card.tsx) - Endorsement card
- [client/src/components/header.tsx](../client/src/components/header.tsx) - Header component
- [client/src/components/sidebar.tsx](../client/src/components/sidebar.tsx) - Sidebar navigation
- [client/src/components/skill-card.tsx](../client/src/components/skill-card.tsx) - Skill card

#### Hooks
- [client/src/hooks/use-auth.tsx](../client/src/hooks/use-auth.tsx) - Authentication hook
- [client/src/hooks/use-mobile.tsx](../client/src/hooks/use-mobile.tsx) - Mobile detection hook
- [client/src/hooks/use-toast.ts](../client/src/hooks/use-toast.ts) - Toast notification hook

#### Utilities
- [client/src/lib/date-utils.ts](../client/src/lib/date-utils.ts) - Date utility functions
- [client/src/lib/protected-route.tsx](../client/src/lib/protected-route.tsx) - Protected route component
- [client/src/lib/queryClient.ts](../client/src/lib/queryClient.ts) - Query client configuration
- [client/src/lib/utils.ts](../client/src/lib/utils.ts) - Utility functions