FROM node:20-slim

# Set working directory
WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    lsb-release \
    curl \
    ca-certificates \
    && apt-get clean

# Setup directory for Cloud SQL Auth Proxy connection
RUN mkdir -p /cloudsql

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Verify package.json exists after copy
RUN ls -la && cat package.json

# Install dependencies with more memory for Node
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm ci

# Copy the application code
COPY . .

# Build the application
RUN npm run build

# Expose the port - Cloud Run default is 8080
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production 
ENV PORT=8080
ENV HOST=0.0.0.0

# Start the server with environment variable setup
CMD if [ -z "$SESSION_SECRET" ]; then \
      export SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"); \
    fi && \
    # If USE_CLOUD_SQL is set, set up appropriate environment variables
    if [ "$USE_CLOUD_SQL" = "true" ] && [ ! -z "$CLOUD_SQL_CONNECTION_NAME" ]; then \
      echo "Using Cloud SQL connection: $CLOUD_SQL_CONNECTION_NAME"; \
      export CLOUD_SQL_URL="postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CLOUD_SQL_CONNECTION_NAME"; \
      echo "Cloud SQL URL format set (password masked): postgresql://$DB_USER:****@/$DB_NAME?host=/cloudsql/$CLOUD_SQL_CONNECTION_NAME"; \
    fi && \
    # For debugging purposes, list important directories
    echo "Current directory:" && pwd && \
    echo "Directory contents:" && ls -la && \
    # Start the application
    if [ -f "server/index.js" ]; then \
      echo "Starting compiled server" && \
      node server/index.js; \
    else \
      echo "Starting with npm script" && \
      npm start; \
    fi