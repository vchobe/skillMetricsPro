# Environment Variables

The Skills Management Platform uses environment variables for configuration. This document describes all available environment variables and their purpose.

## Required Variables

These variables are required for the application to function properly:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://username:password@localhost:5432/skills_platform` |
| `NODE_ENV` | Application environment | `development`, `production` |
| `SESSION_SECRET` | Secret for session encryption | `random_string_at_least_32_chars` |

## Optional Variables

These variables are optional and have default values:

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PORT` | Port for the Express server | `3000` | `8080` |
| `HOST` | Host address to bind to | `0.0.0.0` | `localhost` |
| `LOG_LEVEL` | Logging verbosity | `info` | `debug`, `warn`, `error` |
| `SESSION_MAX_AGE` | Session duration in milliseconds | `86400000` (24 hours) | `3600000` (1 hour) |
| `COOKIE_SECURE` | Require HTTPS for cookies | `false` in development, `true` in production | `true` |

## Development Variables

These variables are only used in development:

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_DEV_SERVER_PORT` | Port for Vite dev server | `5173` | `5174` |
| `VITE_CARTOGRAPHER_ENABLED` | Enable source mapping | `true` | `false` |

## Authentication Variables

These variables control authentication settings:

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `BCRYPT_SALT_ROUNDS` | Number of salt rounds for password hashing | `10` | `12` |
| `PASSWORD_MIN_LENGTH` | Minimum password length | `8` | `12` |
| `SESSION_NAME` | Name of the session cookie | `skills_platform_session` | `custom_session_name` |

## Database Variables

These variables provide additional database configuration:

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DB_SSL` | Enable SSL for database connections | `false` | `true` |
| `DB_POOL_MIN` | Minimum pool connections | `2` | `5` |
| `DB_POOL_MAX` | Maximum pool connections | `10` | `20` |
| `DB_IDLE_TIMEOUT` | Connection idle timeout in ms | `30000` | `60000` |

## Environment Specific Configuration

### Development Environment

For local development, create a `.env` file in the root directory:

```
DATABASE_URL=postgres://username:password@localhost:5432/skills_platform
NODE_ENV=development
SESSION_SECRET=your_development_secret
LOG_LEVEL=debug
```

### Production Environment

In production environments, it's recommended to set environment variables securely using your hosting platform's environment configuration:

```
DATABASE_URL=postgres://username:password@production-db-host:5432/skills_platform
NODE_ENV=production
SESSION_SECRET=your_strong_production_secret
COOKIE_SECURE=true
LOG_LEVEL=warn
```

### Google Cloud Platform

When deploying to Google Cloud Run, environment variables can be set during deployment:

```bash
gcloud run deploy skills-management-app \
  --image gcr.io/project-id/skills-management-app \
  --update-env-vars "DATABASE_URL=postgres://user:pass@host/db,NODE_ENV=production,SESSION_SECRET=secret"
```

## Secret Management

For production environments, it's recommended to use a secure secret management service:

### Google Cloud Secret Manager

```bash
# Store a secret
gcloud secrets create session-secret --replication-policy="automatic" --data-file=- <<< "your_secret_value"

# Reference in deployment
gcloud run deploy skills-management-app \
  --image gcr.io/project-id/skills-management-app \
  --update-secrets=SESSION_SECRET=session-secret:latest
```

## Testing Variables

Additional variables used for testing:

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TEST_DATABASE_URL` | Database URL for tests | N/A | `postgres://test:test@localhost:5432/skills_platform_test` |
| `TEST_USER_EMAIL` | Email for test user | `test@example.com` | `admin@test.com` |
| `TEST_USER_PASSWORD` | Password for test user | `password123` | `TestPass123!` |