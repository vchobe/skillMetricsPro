# Installation Guide

This document provides instructions for setting up and running the Skills Management Platform.

## Prerequisites

Before installing, ensure you have the following:

- Node.js v20.x or later
- PostgreSQL v15.x or later
- npm v10.x or later
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/skills-management-platform.git
cd skills-management-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```
DATABASE_URL=postgres://username:password@localhost:5432/skills_platform
NODE_ENV=development
SESSION_SECRET=your_session_secret
```

Replace `username`, `password`, and other values with your actual database credentials.

### 4. Set Up the Database

Create a PostgreSQL database:

```bash
createdb skills_platform
```

Run the database migration:

```bash
npm run db:push
```

### 5. Add Initial Test Data (Optional)

```bash
node scripts/create-admin.js
node scripts/create-test-users.js
node scripts/generate-test-data.js
node scripts/add-certifications.js
```

### 6. Start the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Detailed Setup Instructions

For more detailed installation instructions, see:

- [Local Development Setup](./local_setup.md)
- [Environment Variables](./environment_variables.md)
- [Database Configuration](./database_setup.md)

## Docker Installation

The application can also be run using Docker:

```bash
# Build the Docker image
docker build -t skills-management-platform .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgres://username:password@host.docker.internal:5432/skills_platform \
  -e NODE_ENV=production \
  -e SESSION_SECRET=your_session_secret \
  skills-management-platform
```

## Cloud Deployment

For deploying to Google Cloud Platform, refer to the [Deployment Documentation](../deployment/gcp.md).

## Troubleshooting

### Common Issues

1. **Database Connection Issues**

   Ensure your PostgreSQL server is running and accessible with the credentials in your `.env` file.

2. **Port Conflicts**

   If port 3000 is already in use, you can specify a different port:

   ```bash
   PORT=3001 npm run dev
   ```

3. **Dependencies Issues**

   If you encounter issues with npm dependencies, try:

   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

### Getting Help

If you encounter problems not covered here, please open an issue on the GitHub repository or contact the development team.