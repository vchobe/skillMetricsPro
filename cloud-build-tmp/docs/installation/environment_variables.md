# Environment Variables

This document provides a comprehensive guide to the environment variables used in the Skills Management Platform.

## Core Environment Variables

These environment variables are essential for the application to function correctly:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string (e.g., `postgres://username:password@localhost:5432/skills_platform`) |
| `NODE_ENV` | Yes | `development` | Application environment (`development`, `test`, or `production`) |
| `SESSION_SECRET` | Yes | - | Secret key for session encryption (should be a random string) |
| `PORT` | No | `3000` | Port number for the application server |

## Database Configuration

If you prefer to configure the database connection individually instead of using `DATABASE_URL`, you can use these variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | No | `localhost` | PostgreSQL server hostname |
| `DB_PORT` | No | `5432` | PostgreSQL server port |
| `DB_NAME` | No | `skills_platform` | PostgreSQL database name |
| `DB_USER` | No | - | PostgreSQL username |
| `DB_PASSWORD` | No | - | PostgreSQL password |
| `DB_SSL` | No | `false` | Enable SSL for database connection (`true` or `false`) |

**Note**: If `DATABASE_URL` is provided, it takes precedence over individual database configuration variables.

## Session Configuration

Variables related to session management:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SESSION_SECRET` | Yes | - | Secret key for session encryption |
| `SESSION_MAX_AGE` | No | `86400000` (1 day) | Maximum session age in milliseconds |
| `SESSION_SECURE` | No | `false` | Require HTTPS for cookies (`true` or `false`) |
| `SESSION_DOMAIN` | No | - | Cookie domain (e.g., `.example.com`) |

## Security Settings

Variables related to application security:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CORS_ORIGIN` | No | `*` | CORS allowed origins (can be comma-separated list) |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` (1 minute) | Rate limiting window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Maximum requests per IP within the rate limit window |
| `BCRYPT_SALT_ROUNDS` | No | `10` | Number of bcrypt salt rounds for password hashing |

## Admin Setup

Variables for initial admin user setup:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_EMAIL` | No | `admin@skillsplatform.com` | Email for the default admin user |
| `ADMIN_PASSWORD` | No | `Admin@2025` | Password for the default admin user |
| `ADMIN_USERNAME` | No | `admin` | Username for the default admin user |
| `ADMIN_FIRST_NAME` | No | `Admin` | First name for the default admin user |
| `ADMIN_LAST_NAME` | No | `User` | Last name for the default admin user |

## Logging Configuration

Variables for application logging:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOG_LEVEL` | No | `info` | Log level (`error`, `warn`, `info`, `debug`) |
| `LOG_FORMAT` | No | `combined` | Log format (`combined`, `common`, `dev`, `short`, `tiny`) |

## Cloud Deployment Variables

Additional variables for cloud deployments:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_CONNECTION_NAME` | No | - | Cloud SQL connection name for Google Cloud Platform |
| `GCP_PROJECT_ID` | No | - | Google Cloud Platform project ID |
| `GCP_REGION` | No | `us-central1` | Google Cloud Platform region |
| `GCP_BUCKET` | No | - | Google Cloud Storage bucket name for backups |

## Example .env File

Here's a complete example of a `.env` file with commonly used variables:

```
# Core Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=postgres://postgres:password@localhost:5432/skills_platform

# Session Configuration
SESSION_SECRET=your_very_long_random_session_secret_key
SESSION_MAX_AGE=86400000
SESSION_SECURE=false

# Security Settings
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_SALT_ROUNDS=10

# Admin Setup
ADMIN_EMAIL=admin@skillsplatform.com
ADMIN_PASSWORD=Admin@2025
ADMIN_USERNAME=admin
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=dev
```

## Environment-Specific Configurations

### Development Environment

For development environments, you can use a minimal configuration:

```
NODE_ENV=development
DATABASE_URL=postgres://postgres:password@localhost:5432/skills_platform
SESSION_SECRET=dev_session_secret
```

### Test Environment

For test environments, use a separate database:

```
NODE_ENV=test
DATABASE_URL=postgres://postgres:password@localhost:5432/skills_platform_test
SESSION_SECRET=test_session_secret
```

### Production Environment

For production environments, ensure all security settings are properly configured:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://username:strong_password@database-host:5432/skills_platform
SESSION_SECRET=very_long_random_secret_key
SESSION_SECURE=true
SESSION_DOMAIN=yourcompany.com
CORS_ORIGIN=https://skills.yourcompany.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=50
BCRYPT_SALT_ROUNDS=12
LOG_LEVEL=warn
```

## Setting Environment Variables

### Local Development

For local development, create a `.env` file in the root directory of the project.

### Docker

When using Docker, you can pass environment variables using the `-e` flag:

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgres://username:password@host.docker.internal:5432/skills_platform \
  -e NODE_ENV=development \
  -e SESSION_SECRET=your_secret \
  skills-platform:latest
```

### Docker Compose

With Docker Compose, define environment variables in your `docker-compose.yml` file:

```yaml
services:
  app:
    image: skills-platform:latest
    environment:
      - DATABASE_URL=postgres://username:password@db:5432/skills_platform
      - NODE_ENV=production
      - SESSION_SECRET=your_secret
```

### Cloud Deployment

When deploying to Google Cloud Run, set environment variables through the Google Cloud Console or using the `gcloud` CLI:

```bash
gcloud run deploy skills-platform \
  --image gcr.io/project-id/skills-platform:latest \
  --set-env-vars="NODE_ENV=production,PORT=8080"
```

## Best Practices

1. **Never commit sensitive environment variables to version control**
2. **Use strong, unique values for secrets**
3. **Rotate secrets regularly**
4. **Use different values for different environments**
5. **Keep a template `.env.example` file in version control with dummy values**
6. **Set stricter security settings in production**

## Troubleshooting

### Missing Environment Variables

If the application fails to start with an error about missing environment variables:

1. Check that your `.env` file exists in the project root
2. Verify that all required variables are defined
3. Restart the application after making changes to environment variables

### Environment File Not Loading

If your environment file isn't being loaded:

1. Make sure the file is named exactly `.env` (with the dot)
2. Check file permissions
3. Verify the file is in the project root
4. Ensure your application is starting from the correct directory

### Security Issues

If you encounter security warnings:

1. Ensure `SESSION_SECRET` is a strong, random string
2. Set `SESSION_SECURE=true` in production
3. Configure `CORS_ORIGIN` with specific origins instead of wildcard `*`