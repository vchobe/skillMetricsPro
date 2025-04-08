# Skills Management Platform

A comprehensive Employee Skill Management platform that enables organizations to track, develop, and optimize workforce capabilities through advanced skill tracking, analytics, and collaborative features.

![Skills Management Platform](./generated-icon.png)

## Features

- **User Management**: Registration, authentication, and profile management
- **Skills Tracking**: Define, categorize, and track employee skills
- **Skill Levels**: Track skill progression (beginner, intermediate, expert)
- **Endorsements**: Peer endorsements for skill validation
- **Certifications**: Track professional certifications and credentials
- **Skill Gap Analysis**: Compare target skill levels with actual competencies
- **Analytics Dashboard**: Visualize skill distribution and trends
- **Notifications**: Real-time alerts for skill changes and endorsements
- **Admin Tools**: User management, skill template creation, reporting

## Tech Stack

- **Frontend**: React.js with TypeScript
- **UI Library**: Tailwind CSS with ShadCN UI components
- **State Management**: React Query & Context API
- **Backend**: Express.js on Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with Passport.js
- **Deployment**: Google Cloud Platform (Cloud Run & Cloud SQL)

## Quick Start

### Prerequisites

- Node.js v20.x or later
- PostgreSQL v15.x or later
- npm v10.x or later

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/skills-management-platform.git
cd skills-management-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with:
```
DATABASE_URL=postgres://username:password@localhost:5432/skills_platform
NODE_ENV=development
SESSION_SECRET=your_session_secret
```

4. Set up the database:
```bash
# Create database
createdb skills_platform

# Run migrations
npm run db:push
```

5. Add test data (optional):
```bash
node scripts/create-admin.js
node scripts/create-test-users.js
node scripts/generate-test-data.js
```

6. Start the application:
```bash
npm run dev
```

7. Access the application:
Open your browser and navigate to `http://localhost:3000`

## Deployment

### Google Cloud Platform

To deploy to Google Cloud Platform:

```bash
# Make deployment scripts executable
chmod +x deployment/*.sh

# Run the deployment
./deployment/deploy-all.sh
```

For detailed deployment instructions, see the [GCP Deployment Guide](./docs/deployment/gcp.md).

## Documentation

- [Application Documentation](./docs/README.md)
- [Installation Guide](./docs/installation/README.md)
- [API Documentation](./docs/api/README.md)
- [Database Schema](./docs/database/schema_overview.md)
- [Deployment Guide](./docs/deployment/gcp.md)

## Development Workflow

1. **Local Development**:
   ```bash
   npm run dev
   ```

2. **Database Migration**:
   ```bash
   npm run db:push
   ```

3. **Linting**:
   ```bash
   npm run lint
   ```

4. **Testing**:
   ```bash
   npm test
   ```

## Project Structure

```
├── client/                # Frontend code
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Entry point
├── deployment/            # Deployment scripts
├── docs/                  # Documentation
├── scripts/               # Utility scripts
├── server/                # Backend code
│   ├── auth.ts            # Authentication logic
│   ├── db.ts              # Database connection
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   └── storage.ts         # Storage interface
├── shared/                # Shared code
│   └── schema.ts          # Database schema
└── package.json           # Project metadata
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgements

- [React.js](https://reactjs.org/)
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Drizzle ORM](https://github.com/drizzle-team/drizzle-orm)
- [TanStack Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Wouter](https://github.com/molefrog/wouter)