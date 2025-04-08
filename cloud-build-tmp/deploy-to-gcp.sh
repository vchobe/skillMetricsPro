#!/bin/bash
# ==============================================================================
# Employee Skills Management Platform Deployment Script for Google Cloud
# ==============================================================================
# This script deploys the application to Google Cloud Run and sets up the PostgreSQL
# database, schema, tables, and initial data.
#
# Prerequisites:
# - Google Cloud SDK installed
# - Docker installed
# - Git installed
# - Logged in to gcloud (run 'gcloud auth login')
# - Project already created in GCP
#
# Usage: ./deploy-to-gcp.sh [PROJECT_ID]
# ==============================================================================

set -e  # Exit on error

# Set text colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables with default values
GCP_PROJECT_ID=${1:-"skillmetrics-platform"}
GCP_REGION="us-central1"
CLOUD_RUN_SERVICE_NAME="skill-metrics"
DB_INSTANCE_NAME="skillmetrics-db"
DB_NAME="skillmetrics"
DB_USER="skillmetrics_admin"
DB_PASSWORD=$(openssl rand -base64 16)  # Generate a random password
ADMIN_EMAIL="admin@atyeti.com"
ADMIN_PASSWORD="Admin@123"  # Default password, should be changed after deployment
ENV_VARS_FILE=".env.gcp"
DOCKER_IMAGE_NAME="gcr.io/${GCP_PROJECT_ID}/${CLOUD_RUN_SERVICE_NAME}"
APP_DIR="skillmetrics-app"

echo -e "${BLUE}===============================================================${NC}"
echo -e "${BLUE}Employee Skills Management Platform Deployment Script for GCP${NC}"
echo -e "${BLUE}===============================================================${NC}"
echo -e "${YELLOW}Project ID: ${GCP_PROJECT_ID}${NC}"
echo -e "${YELLOW}Region: ${GCP_REGION}${NC}"
echo -e "${BLUE}===============================================================${NC}"

# Confirm before proceeding
read -p "Do you want to proceed with deployment (y/n)? " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 1
fi

echo -e "\n${GREEN}Starting deployment...${NC}"

# =========================================================================
# 1. Set up Google Cloud Project configuration
# =========================================================================
echo -e "\n${BLUE}[1/9] Setting up Google Cloud Project Configuration...${NC}"

# Set the project
echo -e "${YELLOW}Setting GCP project to: ${GCP_PROJECT_ID}${NC}"
gcloud config set project ${GCP_PROJECT_ID}

# Enable required APIs
echo -e "${YELLOW}Enabling required GCP APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com \
    containerregistry.googleapis.com \
    run.googleapis.com \
    sql-component.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com

echo -e "${GREEN}✓ GCP project configuration complete.${NC}"

# =========================================================================
# 2. Clone the repository
# =========================================================================
echo -e "\n${BLUE}[2/9] Cloning the repository...${NC}"

if [ ! -d "$APP_DIR" ]; then
    # Update this URL to your repository location
    git clone https://github.com/yourusername/employee-skills-platform.git ${APP_DIR}
    cd ${APP_DIR}
else
    echo -e "${YELLOW}Directory already exists. Using existing code.${NC}"
    cd ${APP_DIR}
    echo -e "${YELLOW}Pulling latest changes...${NC}"
    git pull
fi

echo -e "${GREEN}✓ Repository setup complete.${NC}"

# =========================================================================
# 3. Create a Cloud SQL PostgreSQL instance
# =========================================================================
echo -e "\n${BLUE}[3/9] Creating Cloud SQL PostgreSQL instance...${NC}"
echo -e "${YELLOW}This may take several minutes...${NC}"

# Check if DB instance already exists
DB_EXISTS=$(gcloud sql instances list --filter="name:${DB_INSTANCE_NAME}" --format="value(name)" 2>/dev/null || echo "")

if [ -z "$DB_EXISTS" ]; then
    gcloud sql instances create ${DB_INSTANCE_NAME} \
        --database-version=POSTGRES_13 \
        --tier=db-f1-micro \
        --region=${GCP_REGION} \
        --storage-size=10GB \
        --storage-type=SSD \
        --backup-start-time=04:00 \
        --availability-type=zonal \
        --root-password=${DB_PASSWORD}
    
    echo -e "${GREEN}✓ Cloud SQL instance created.${NC}"
else
    echo -e "${YELLOW}Cloud SQL instance already exists, skipping creation.${NC}"
fi

# Create database
echo -e "${YELLOW}Creating database: ${DB_NAME}...${NC}"
gcloud sql databases create ${DB_NAME} --instance=${DB_INSTANCE_NAME} || echo -e "${YELLOW}Database might already exist, continuing...${NC}"

# Create user
echo -e "${YELLOW}Creating database user: ${DB_USER}...${NC}"
gcloud sql users create ${DB_USER} --instance=${DB_INSTANCE_NAME} --password=${DB_PASSWORD} || echo -e "${YELLOW}User might already exist, continuing...${NC}"

# Get the database connection details
DB_HOST=$(gcloud sql instances describe ${DB_INSTANCE_NAME} --format="value(connectionName)")
echo -e "${GREEN}✓ Database setup complete. Connection name: ${DB_HOST}${NC}"

# =========================================================================
# 4. Set up environment variables file
# =========================================================================
echo -e "\n${BLUE}[4/9] Setting up environment variables...${NC}"

# Create .env file for the application
cat > ${ENV_VARS_FILE} << EOL
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}?host=/cloudsql/${DB_HOST}
SESSION_SECRET=$(openssl rand -hex 24)
EMAIL_HOST=smtp.mailjet.com
EMAIL_PORT=587
EMAIL_USER=${EMAIL_USER:-"your_email_user"}
EMAIL_PASS=${EMAIL_PASS:-"your_email_pass"}
MAILJET_API_KEY=${MAILJET_API_KEY:-"your_mailjet_api_key"}
MAILJET_SECRET_KEY=${MAILJET_SECRET_KEY:-"your_mailjet_secret_key"}
NODE_ENV=production
PORT=8080
EOL

echo -e "${GREEN}✓ Environment variables setup complete.${NC}"

# =========================================================================
# 5. Add database migration and initial data scripts
# =========================================================================
echo -e "\n${BLUE}[5/9] Preparing database setup scripts...${NC}"

# Create a script to initialize the database schema and data
cat > db-init.js << EOL
const { sql } = require('@vercel/postgres');
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function setupDatabase() {
  try {
    console.log('Creating database schema...');
    
    // Create enum types
    await sql\`CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'expert');\`;
    await sql\`CREATE TYPE notification_type AS ENUM ('endorsement', 'level_up', 'achievement');\`;
    
    // Create users table
    await sql\`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        project VARCHAR(255),
        role VARCHAR(255),
        location VARCHAR(255)
      );
    \`;
    
    // Create skills table
    await sql\`
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        level skill_level NOT NULL,
        certification VARCHAR(255),
        credly_link VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP
      );
    \`;
    
    // Create skill histories table
    await sql\`
      CREATE TABLE IF NOT EXISTS skill_histories (
        id SERIAL PRIMARY KEY,
        skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        previous_level skill_level,
        new_level skill_level NOT NULL,
        change_note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \`;
    
    // Create profile histories table
    await sql\`
      CREATE TABLE IF NOT EXISTS profile_histories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        field_name VARCHAR(255) NOT NULL,
        previous_value TEXT,
        new_value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \`;
    
    // Create notifications table
    await sql\`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type notification_type NOT NULL,
        message TEXT NOT NULL,
        related_id INTEGER,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \`;
    
    // Create endorsements table
    await sql\`
      CREATE TABLE IF NOT EXISTS endorsements (
        id SERIAL PRIMARY KEY,
        skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
        endorser_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \`;
    
    // Create skill templates table
    await sql\`
      CREATE TABLE IF NOT EXISTS skill_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        description TEXT,
        is_recommended BOOLEAN DEFAULT FALSE,
        target_level skill_level,
        target_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \`;
    
    // Create skill targets table
    await sql\`
      CREATE TABLE IF NOT EXISTS skill_targets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        description TEXT,
        target_level skill_level NOT NULL,
        target_date DATE,
        target_number INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \`;
    
    // Create skill target skills table (many-to-many)
    await sql\`
      CREATE TABLE IF NOT EXISTS skill_target_skills (
        target_id INTEGER REFERENCES skill_targets(id) ON DELETE CASCADE,
        skill_id INTEGER NOT NULL,
        PRIMARY KEY (target_id, skill_id)
      );
    \`;
    
    // Create skill target users table (many-to-many)
    await sql\`
      CREATE TABLE IF NOT EXISTS skill_target_users (
        target_id INTEGER REFERENCES skill_targets(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (target_id, user_id)
      );
    \`;
    
    console.log('Schema created successfully');
    
    // Create admin user
    const hashedPassword = await hashPassword('${ADMIN_PASSWORD}');
    await sql\`
      INSERT INTO users (username, email, password, is_admin, first_name, last_name, role)
      VALUES ('admin', '${ADMIN_EMAIL}', \${hashedPassword}, TRUE, 'Admin', 'User', 'Administrator')
      ON CONFLICT (email) DO UPDATE SET
        password = \${hashedPassword},
        is_admin = TRUE,
        updated_at = CURRENT_TIMESTAMP;
    \`;
    
    console.log('Admin user created successfully');
    
    // Add sample skill templates
    await sql\`
      INSERT INTO skill_templates (name, category, description, is_recommended)
      VALUES 
        ('JavaScript', 'Programming', 'Modern JavaScript including ES6+ features', TRUE),
        ('React.js', 'Programming', 'Frontend development with React', TRUE),
        ('Node.js', 'Programming', 'Server-side JavaScript', TRUE),
        ('Python', 'Programming', 'Python programming language', TRUE),
        ('Java', 'Programming', 'Java programming language', TRUE),
        ('PostgreSQL', 'Database', 'SQL and PostgreSQL database management', TRUE),
        ('AWS', 'Cloud', 'Amazon Web Services cloud infrastructure', TRUE),
        ('Docker', 'DevOps', 'Containerization with Docker', TRUE),
        ('Kubernetes', 'DevOps', 'Container orchestration with Kubernetes', TRUE),
        ('UI/UX Design', 'Design', 'User interface and experience design', TRUE)
      ON CONFLICT DO NOTHING;
    \`;
    
    console.log('Sample skill templates created successfully');
    
    return { success: true, message: 'Database setup completed successfully' };
  } catch (error) {
    console.error('Error setting up database:', error);
    return { success: false, error };
  }
}

setupDatabase().then(result => {
  console.log(result);
  process.exit(result.success ? 0 : 1);
});
EOL

echo -e "${GREEN}✓ Database scripts prepared.${NC}"

# =========================================================================
# 6. Create/Update the Dockerfile
# =========================================================================
echo -e "\n${BLUE}[6/9] Creating Docker configuration...${NC}"

cat > Dockerfile << EOL
FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Start command
CMD ["npm", "run", "start"]
EOL

echo -e "${GREEN}✓ Docker configuration complete.${NC}"

# =========================================================================
# 7. Build and push the Docker image
# =========================================================================
echo -e "\n${BLUE}[7/9] Building and pushing Docker image...${NC}"

# Build the Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
gcloud builds submit --tag ${DOCKER_IMAGE_NAME} .

echo -e "${GREEN}✓ Docker image built and pushed successfully.${NC}"

# =========================================================================
# 8. Deploy to Cloud Run
# =========================================================================
echo -e "\n${BLUE}[8/9] Deploying to Cloud Run...${NC}"

# Create a service account for Cloud Run
SERVICE_ACCOUNT="skillmetrics-service-account"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

# Check if service account exists
SA_EXISTS=$(gcloud iam service-accounts list --filter="email:${SERVICE_ACCOUNT_EMAIL}" --format="value(email)" 2>/dev/null || echo "")

if [ -z "$SA_EXISTS" ]; then
    echo -e "${YELLOW}Creating service account...${NC}"
    gcloud iam service-accounts create ${SERVICE_ACCOUNT} \
        --display-name="Skill Metrics Service Account"
fi

# Grant necessary permissions
echo -e "${YELLOW}Granting Cloud SQL access to service account...${NC}"
gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/cloudsql.client"

echo -e "${YELLOW}Granting Secret Manager access to service account...${NC}"
gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/secretmanager.secretAccessor"

# Store environment variables in Secret Manager
echo -e "${YELLOW}Storing environment variables in Secret Manager...${NC}"
ENV_SECRET_NAME="skillmetrics-env"

# Check if secret exists
SECRET_EXISTS=$(gcloud secrets list --filter="name:${ENV_SECRET_NAME}" --format="value(name)" 2>/dev/null || echo "")

if [ -z "$SECRET_EXISTS" ]; then
    gcloud secrets create ${ENV_SECRET_NAME} --replication-policy="automatic"
fi

# Update secret with environment variables
cat ${ENV_VARS_FILE} | gcloud secrets versions add ${ENV_SECRET_NAME} --data-file=-

# Deploy to Cloud Run
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
gcloud run deploy ${CLOUD_RUN_SERVICE_NAME} \
    --image=${DOCKER_IMAGE_NAME} \
    --platform=managed \
    --region=${GCP_REGION} \
    --service-account=${SERVICE_ACCOUNT_EMAIL} \
    --set-env-vars="NODE_ENV=production,PORT=8080" \
    --set-secrets="/app/.env=skillmetrics-env:latest" \
    --allow-unauthenticated \
    --add-cloudsql-instances=${DB_HOST}

SERVICE_URL=$(gcloud run services describe ${CLOUD_RUN_SERVICE_NAME} --platform=managed --region=${GCP_REGION} --format="value(status.url)")

echo -e "${GREEN}✓ Deployment to Cloud Run complete.${NC}"
echo -e "${GREEN}Service URL: ${SERVICE_URL}${NC}"

# =========================================================================
# 9. Initialize the database
# =========================================================================
echo -e "\n${BLUE}[9/9] Initializing the database...${NC}"

# Create a job to initialize the database
cat > cloudbuild.yaml << EOL
steps:
  - name: node:20-slim
    entrypoint: "bash"
    args:
      - "-c"
      - |
        npm install @vercel/postgres bcrypt
        node db-init.js
    env:
      - 'DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}?host=/cloudsql/${DB_HOST}'
EOL

# Run the database initialization job
gcloud builds submit --config cloudbuild.yaml .

echo -e "${GREEN}✓ Database initialization complete.${NC}"

# =========================================================================
# Deployment summary
# =========================================================================
echo -e "\n${BLUE}===============================================================${NC}"
echo -e "${GREEN}DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo -e "${BLUE}===============================================================${NC}"
echo -e "${YELLOW}Application URL: ${SERVICE_URL}${NC}"
echo -e "${YELLOW}Admin Credentials:${NC}"
echo -e "${YELLOW}  Email: ${ADMIN_EMAIL}${NC}"
echo -e "${YELLOW}  Password: ${ADMIN_PASSWORD}${NC}"
echo -e "${YELLOW}Database Information:${NC}"
echo -e "${YELLOW}  Instance: ${DB_INSTANCE_NAME}${NC}"
echo -e "${YELLOW}  Database: ${DB_NAME}${NC}"
echo -e "${YELLOW}  Username: ${DB_USER}${NC}"
echo -e "${YELLOW}  Password: [Stored in Secret Manager as part of env vars]${NC}"
echo -e "${BLUE}===============================================================${NC}"
echo -e "${RED}IMPORTANT: For security, please change the admin password after first login.${NC}"
echo -e "${BLUE}===============================================================${NC}"

# Clean up sensitive files
rm -f ${ENV_VARS_FILE}

echo -e "\n${GREEN}Done!${NC}"