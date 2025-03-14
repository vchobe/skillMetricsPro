# Installation Guide

This guide provides step-by-step instructions for installing and setting up the Skills Management Platform.

## Prerequisites

Before installing the Skills Management Platform, ensure you have the following:

- **Node.js**: Version 20.x or later
- **NPM**: Version 10.x or later
- **PostgreSQL**: Version 15.x or later
- **Git**: Latest stable version

## System Requirements

- **CPU**: Dual core or better
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: 1GB for application code and dependencies
- **OS**: Any operating system that supports Node.js (Windows, macOS, Linux)

## Installation Steps

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

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgres://username:password@localhost:5432/skills_platform
NODE_ENV=development
SESSION_SECRET=your_session_secret
```

For more details on environment variables, see [Environment Variables Documentation](./environment_variables.md).

### 4. Create the Database

Using PostgreSQL command-line tools:

```bash
createdb skills_platform
```

Or using pgAdmin or another PostgreSQL administration tool, create a new database named `skills_platform`.

### 5. Run Database Migrations

Apply the database schema:

```bash
npm run db:push
```

### 6. (Optional) Add Sample Data

For development or testing purposes, you can populate the database with sample data:

```bash
# Create an admin user
node scripts/create-admin.js

# Create test users
node scripts/create-test-users.js

# Generate skill data
node scripts/generate-test-data.js
```

### 7. Start the Application

Start the development server:

```bash
npm run dev
```

The application should now be running at `http://localhost:3000`.

## Docker Installation

Alternatively, you can use Docker to run the application.

### 1. Build the Docker Image

```bash
docker build -t skills-platform:latest .
```

### 2. Run the Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgres://username:password@host.docker.internal:5432/skills_platform \
  -e NODE_ENV=development \
  -e SESSION_SECRET=your_session_secret \
  skills-platform:latest
```

## Verifying Installation

To verify that the installation was successful:

1. Open your browser and navigate to `http://localhost:3000`
2. You should see the login page
3. Login with the default admin credentials:
   - Email: `admin@skillsplatform.com`
   - Password: `Admin@2025`

## Troubleshooting

### Database Connection Issues

If you encounter database connection problems:

1. Verify that PostgreSQL is running:
   ```bash
   pg_isready -h localhost -p 5432
   ```

2. Check that the database was created:
   ```bash
   psql -l | grep skills_platform
   ```

3. Verify your `.env` file has the correct `DATABASE_URL` value

### Node.js or NPM Issues

If you encounter problems with Node.js or NPM:

1. Verify your Node.js version:
   ```bash
   node --version
   ```

2. Verify your NPM version:
   ```bash
   npm --version
   ```

3. If you have version problems, consider using nvm (Node Version Manager) to install the correct version:
   ```bash
   nvm install 20
   nvm use 20
   ```

### Application Won't Start

If the application won't start:

1. Check the console for error messages
2. Verify all environment variables are correctly set
3. Ensure the database is accessible
4. Check that the port 3000 is not already in use:
   ```bash
   lsof -i :3000
   ```

## Next Steps

Now that you have installed the Skills Management Platform, you may want to:

1. [Configure environment variables](./environment_variables.md) for your specific needs
2. Review [deployment options](../deployment/gcp.md) for production environments
3. Explore the [API documentation](../api/README.md)
4. Understand the [database schema](../database/schema_overview.md)