FROM node:20-slim

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

# Create the application directory
RUN mkdir -p /app

# Set working directory 
WORKDIR /app

# Debug: Current directory and contents
RUN pwd && ls -la

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Debug: Verify package.json exists after copy
RUN echo "Checking package.json:" && ls -la && cat package.json

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

# Create a startup script
RUN echo '#!/bin/bash \n\
# Generate session secret if not provided \n\
if [ -z "$SESSION_SECRET" ]; then \n\
  export SESSION_SECRET=$(node -e "console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))") \n\
  echo "Generated new session secret" \n\
fi \n\
\n\
# Setup Cloud SQL if enabled \n\
if [ "$USE_CLOUD_SQL" = "true" ] && [ ! -z "$CLOUD_SQL_CONNECTION_NAME" ]; then \n\
  echo "Using Cloud SQL connection: $CLOUD_SQL_CONNECTION_NAME" \n\
  export CLOUD_SQL_URL="postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CLOUD_SQL_CONNECTION_NAME" \n\
  echo "Cloud SQL URL format set (password masked): postgresql://$DB_USER:****@/$DB_NAME?host=/cloudsql/$CLOUD_SQL_CONNECTION_NAME" \n\
fi \n\
\n\
# Debug info \n\
echo "Current directory: $(pwd)" \n\
echo "Directory contents:" \n\
ls -la \n\
echo "Server directory:" \n\
ls -la server/ 2>/dev/null || echo "Server directory not found" \n\
\n\
# Start server \n\
if [ -f "server/index.js" ]; then \n\
  echo "Starting compiled server" \n\
  node server/index.js \n\
elif [ -f "dist/server/index.js" ]; then \n\
  echo "Starting compiled server from dist folder" \n\
  node dist/server/index.js \n\
else \n\
  echo "Compiled server not found, starting with npm start" \n\
  npm start \n\
fi' > /skillmetrics/start.sh

# Make startup script executable
RUN chmod +x /app/start.sh

# Start the server with the startup script
CMD ["/app/start.sh"]