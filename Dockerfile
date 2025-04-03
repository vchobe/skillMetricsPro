FROM node:20-slim

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    lsb-release \
    curl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create the PostgreSQL directory for Cloud SQL Auth Proxy
RUN mkdir -p /cloudsql

# Set working directory using the project's root directory name
WORKDIR /usr/src/app

# Copy package files for better layer caching
COPY package.json package-lock.json ./

# Install dependencies with optimized settings for Node
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm ci --omit=dev

# Copy only the necessary project files
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY public/ ./public/
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY tsconfig.json ./
COPY theme.json ./
COPY drizzle.config.ts ./

# Build the application in production mode
ENV NODE_ENV=production
RUN npm run build

# Create startup script for handling environment variables and starting the app
RUN echo '#!/bin/bash \n\
# Generate session secret if not provided \n\
if [ -z "$SESSION_SECRET" ]; then \n\
  export SESSION_SECRET=$(node -e "console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))") \n\
  echo "Generated new session secret" \n\
fi \n\
\n\
# Handle Cloud SQL connection \n\
if [ "$USE_CLOUD_SQL" = "true" ]; then \n\
  # If CLOUD_SQL_URL is already provided, use it directly \n\
  if [ -n "$CLOUD_SQL_URL" ]; then \n\
    echo "Using provided Cloud SQL URL (password masked): $(echo $CLOUD_SQL_URL | sed 's/:[^:@]*@/:\\*\\*\\*\\*@/')" \n\
  # Otherwise build the URL from individual parts \n\
  elif [ -n "$CLOUD_SQL_CONNECTION_NAME" ]; then \n\
    echo "Using Cloud SQL connection: $CLOUD_SQL_CONNECTION_NAME" \n\
    export CLOUD_SQL_URL="postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CLOUD_SQL_CONNECTION_NAME" \n\
    echo "Cloud SQL URL configured (password masked): postgresql://$DB_USER:****@/$DB_NAME?host=/cloudsql/$CLOUD_SQL_CONNECTION_NAME" \n\
  else \n\
    echo "WARNING: USE_CLOUD_SQL is set to true but no CLOUD_SQL_URL or CLOUD_SQL_CONNECTION_NAME provided" \n\
  fi \n\
  # Set DATABASE_URL to CLOUD_SQL_URL if it exists \n\
  if [ -n "$CLOUD_SQL_URL" ]; then \n\
    export DATABASE_URL="$CLOUD_SQL_URL" \n\
    echo "Set DATABASE_URL to use Cloud SQL connection" \n\
  fi \n\
fi \n\
\n\
# Check required environment variables \n\
if [ -z "$DATABASE_URL" ]; then \n\
  echo "WARNING: DATABASE_URL is not set. Application may not be able to connect to the database." \n\
fi \n\
\n\
# Debug info \n\
echo "Starting server with:" \n\
echo "Node version: $(node -v)" \n\
echo "Node environment: $NODE_ENV" \n\
echo "Process running as user: $(whoami)" \n\
echo "Current working directory: $(pwd)" \n\
\n\
# Show available files \n\
echo "Directory contents:" \n\
ls -la \n\
\n\
# Check for dist directory \n\
if [ -d "./dist" ]; then \n\
  echo "Dist directory contents:" \n\
  ls -la ./dist \n\
else \n\
  echo "WARNING: Dist directory not found" \n\
fi \n\
\n\
# Check for cloudsql directory \n\
if [ -d "/cloudsql" ]; then \n\
  echo "Cloud SQL directory exists" \n\
  ls -la /cloudsql 2>/dev/null || echo "No permission to list /cloudsql contents" \n\
else \n\
  echo "WARNING: /cloudsql directory not found" \n\
fi \n\
\n\
# Start application with correct entry point based on build output \n\
if [ -f "./dist/index.js" ]; then \n\
  echo "Starting from compiled ESM bundle" \n\
  node ./dist/index.js \n\
else \n\
  echo "WARNING: Production build not found. Starting with npm start" \n\
  npm start \n\
fi' > /usr/src/app/start.sh

# Make startup script executable
RUN chmod +x /usr/src/app/start.sh

# Expose the application port
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

# Start the application using the startup script
CMD ["/usr/src/app/start.sh"]