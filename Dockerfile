FROM node:20-slim

WORKDIR /app

# Copy package files for installation
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the application code
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]