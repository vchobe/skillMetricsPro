# Server Architecture Documentation

## Core Components

### 1. Server Entry Point (`index.ts`)
- Initializes Express application
- Configures middleware
- Sets up route handlers
- Manages server startup
- Handles Java backend detection and proxy setup

### 2. Authentication (`auth.ts`)
- Implements Passport.js strategies
- Manages user sessions
- Handles registration/login flows
- Implements password reset functionality

### 3. Storage Layer (`storage.ts`)
- Provides database abstraction
- Implements PostgreSQL operations
- Handles data migrations
- Manages relationships between entities

### 4. Email System (`email.ts`)
- Sends transactional emails
- Manages email templates
- Handles weekly reports
- Provides fallback mechanisms

### 5. Database (`db.ts`)
- Configures database connection
- Manages connection pool
- Handles reconnection logic
- Provides query helpers

### 6. Routes (`routes.ts`)
- Defines API endpoints
- Implements request handlers
- Manages authorization
- Handles data validation

## Data Flow
1. Request arrives at server
2. Authentication middleware validates
3. Route handler processes request
4. Storage layer performs database operations
5. Response sent to client

## Security Features
- Password hashing with scrypt
- Session management
- CORS protection
- Input validation
- Role-based access control

## Error Handling
- Consistent error responses
- Error logging
- Fallback mechanisms
- Transaction management

## Monitoring
- Request logging
- Performance tracking
- Error tracking
- Health checks

## Deployment
- Cloud Run support
- Environment configuration
- Database migration handling
- Health endpoint monitoring
```

### Server Entry Point (`server/index.ts`)

The entry point for the Express.js server, responsible for:

- Setting up middleware
- Initializing database connection
- Configuring session management
- Registering routes
- Error handling
- Starting the HTTP server

```typescript
// Main server setup in server/index.ts
import express from 'express';
import session from 'express-session';
import { testDatabaseConnection } from './db';
import { setupAuth } from './auth';
import { registerRoutes } from './routes';
import { setupVite, serveStatic } from './vite';

const app = express();
const port = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Authentication setup
setupAuth(app);

// Register API routes
registerRoutes(app);

// Setup Vite middleware (development) or static file serving (production)
if (process.env.NODE_ENV === 'production') {
  serveStatic(app);
} else {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  setupVite(app, server);
}

// Test database connection
testDatabaseConnection().catch(console.error);
```

### Database Connection (`server/db.ts`)

Handles the connection to PostgreSQL using `pg` and Drizzle ORM:

```typescript
import { drizzle } from 'drizzle-orm/pg'; 
import { Pool } from 'pg';
import * as schema from '../shared/schema';

// Create PostgreSQL connection pool
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
export async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

// Create Drizzle ORM instance
export const db = drizzle({ client: pool, schema });
```

### Authentication System (`server/auth.ts`)

Manages user authentication using Passport.js with local strategy:

```typescript
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Express } from 'express';
import bcrypt from 'bcrypt';
import { storage } from './storage';

async function hashPassword(password: string) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function comparePasswords(supplied: string, stored: string) {
  return bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express) {
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for username/password authentication
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Incorrect email.' });
        }
        
        const passwordMatch = await comparePasswords(password, user.password);
        if (!passwordMatch) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Serialization for session storage
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialization from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
```

### Storage Layer (`server/storage.ts`)

Provides a unified interface for database operations:

- Abstracts database access from controllers
- Implements CRUD operations for all entities
- Handles schema validation
- Manages transactions
- Converts between database and application types

For detailed implementation, see the [Storage Layer Documentation](./storage.md).

### Routes (`server/routes.ts`)

Defines API endpoints and connects them to storage operations:

```typescript
import { Express, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { storage } from './storage';
import { loginUserSchema, registerSchema, insertSkillSchema } from '../shared/schema';

export async function registerRoutes(app: Express) {
  // Authentication middleware
  const ensureAuth = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
  };

  // Admin middleware
  const ensureAdmin = async (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user && await checkIsUserAdminDirectly(req.user.id)) {
      return next();
    }
    res.status(403).json({ error: 'Admin access required' });
  };

  // Authentication routes
  app.post('/api/auth/login', (req, res, next) => {
    try {
      const validatedInput = loginUserSchema.parse(req.body);
      passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: info.message });
        
        req.logIn(user, (err) => {
          if (err) return next(err);
          return res.json(user);
        });
      })(req, res, next);
    } catch (error) {
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedInput = registerSchema.parse(req.body);
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(validatedInput.email);
      if (existingUserByEmail) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      
      const existingUserByUsername = await storage.getUserByUsername(validatedInput.username);
      if (existingUserByUsername) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      
      // Create new user
      const newUser = await storage.createUser({
        username: validatedInput.username,
        email: validatedInput.email,
        password: validatedInput.password,
        firstName: validatedInput.firstName,
        lastName: validatedInput.lastName,
        role: validatedInput.role,
        location: validatedInput.location
      });
      
      req.logIn(newUser, (err) => {
        if (err) throw err;
        return res.status(201).json(newUser);
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout(function(err) {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // User routes
  app.get('/api/user', ensureAuth, (req, res) => {
    res.json(req.user);
  });

  app.get('/api/users', ensureAuth, ensureAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/users/:id', ensureAuth, async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Skills routes
  app.get('/api/skills', ensureAuth, async (req, res) => {
    try {
      const skills = await storage.getAllSkills();
      res.json(skills);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Additional routes for all entities...
}
```

### Vite Integration (`server/vite.ts`)

Handles integration with Vite for development and static file serving for production:

```typescript
import { Express, Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

// Logger function
export function log(message: string, source = "express") {
  const time = new Date().toLocaleTimeString();
  console.log(`${time} [${source}] ${message}`);
}

// Setup Vite for development
export async function setupVite(app: Express, server: any) {
  try {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
    log("Vite middleware initialized", "vite");
  } catch (error) {
    console.error("Error setting up Vite middleware:", error);
  }
}

// Serve static files in production
export function serveStatic(app: Express) {
  const publicDir = path.resolve(process.cwd(), 'client/dist');
  const indexPath = path.join(publicDir, 'index.html');
  
  // Serve static files
  app.use(express.static(publicDir));
  
  // Serve index.html for all routes not handled by the API
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    res.sendFile(indexPath);
  });
  
  log("Static file serving initialized", "express");
}
```

## Data Flow
1. Request arrives at server
2. Authentication middleware validates
3. Route handler processes request
4. Storage layer performs database operations
5. Response sent to client

## Security Features
- Password hashing with scrypt
- Session management
- CORS protection
- Input validation
- Role-based access control

## Error Handling
- Consistent error responses
- Error logging
- Fallback mechanisms
- Transaction management

## Monitoring
- Request logging
- Performance tracking
- Error tracking
- Health checks

## Deployment
- Cloud Run support
- Environment configuration
- Database migration handling
- Health endpoint monitoring
```

## Request Flow

1. **Client Request**: The client makes an HTTP request to an API endpoint
2. **Middleware Processing**:
   - Request parsing (express.json)
   - Session management
   - Authentication validation 
   - Admin role verification (if needed)
3. **Route Handler**: The appropriate route handler receives the request
4. **Validation**: Input data is validated against schemas
5. **Storage Operation**: The route handler calls storage methods to interact with the database
6. **Database Access**: Drizzle ORM executes SQL queries against PostgreSQL
7. **Response Formatting**: Results are formatted and sent back to the client
8. **Error Handling**: If errors occur, appropriate status codes and error messages are returned

## Authentication Flow

1. **Registration**:
   - Client submits username, email, password, and profile information
   - Server validates input against schema
   - Server checks for existing users with the same email or username
   - Password is hashed using bcrypt
   - User record is created in the database
   - User is automatically logged in with a new session

2. **Login**:
   - Client submits email and password
   - Server validates the credentials 
   - Server compares the password hash
   - If valid, a session is created and user details are returned

3. **Session Management**:
   - User sessions are stored in the PostgreSQL database
   - Sessions expire after 24 hours (configurable)
   - Session cookies are secured in production environments

4. **Authorization**:
   - Protected routes use the `ensureAuth` middleware to verify authentication
   - Admin routes use the `ensureAdmin` middleware to verify admin privileges
   - Resource access is validated against the user's permissions

## Error Handling

The server implements centralized error handling:

```typescript
// Global error handler middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  // Determine appropriate status code
  const statusCode = err.statusCode || 500;
  
  // Format error response
  const errorResponse = {
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };
  
  res.status(statusCode).json(errorResponse);
});
```

## Database Transactions

For operations that require multiple database changes, transactions are used to ensure data consistency:

```typescript
// Example transaction in storage.ts
async createSkillWithHistory(skillData: InsertSkill, historyNote: string): Promise<Skill> {
  return db.transaction(async (tx) => {
    // Create the skill
    const skill = await tx.insert(skills).values(skillData).returning();
    
    // Create an entry in skill history
    await tx.insert(skillHistories).values({
      skillId: skill[0].id,
      userId: skillData.userId,
      previousLevel: null,
      newLevel: skillData.level,
      date: new Date(),
      note: historyNote
    });
    
    return skill[0];
  });
}