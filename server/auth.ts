import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, loginUserSchema, insertUserSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Use environment variable for session secret or a default for development
  const sessionSecret = process.env.SESSION_SECRET || "employee-skill-metrics-secret";
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        // Using email as the username field
        usernameField: 'email',
        passwordField: 'password', // We need a password field for passport-local
        // Allow passReqToCallback to get the full request
        passReqToCallback: true
      },
      async (req, email, password, done) => {
        try {
          console.log(`Attempting login with email: ${email}`);
          if (!email) {
            console.log('No email provided');
            return done(null, false, { message: 'Email is required' });
          }
          
          // Find the user by email
          const user = await storage.getUserByEmail(email);
          if (!user) {
            console.log(`No user found with email: ${email}`);
            return done(null, false, { message: 'Invalid email address' });
          }
          console.log(`User found: ${user.email}`);
          
          // Since we're using email-only auth for this app, we don't check the password
          // In a real app, you would verify the password here
          return done(null, user);
        } catch (error) {
          console.error(`Login error: ${error}`);
          return done(error);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      
      // Ensure the admin flag is available under both property names (snake_case and camelCase)
      if (user) {
        // Handle the user object with dynamically added properties safely
        const userObj = user as any;
        
        // Get the admin status, prioritizing is_admin (from database) if available
        const isAdminValue = userObj.is_admin !== undefined ? userObj.is_admin : false;
        
        // Make sure it's consistently available in both formats
        if (typeof isAdminValue === 'boolean' || 
            typeof isAdminValue === 'string') {
          userObj.isAdmin = isAdminValue;
          userObj.is_admin = isAdminValue;
          console.log(`Passport deserialize: Ensured admin status (${isAdminValue}) is available under both properties for user ${userObj.email}`);
        }
      }
      
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("POST /api/register - Body:", req.body);
      
      // For email-only registration, we only need an email
      if (!req.body.email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Validate that it's a valid email
      if (!req.body.email.includes('@')) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // Check if the email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        console.log("POST /api/register - Email already exists:", req.body.email);
        return res.status(400).json({ message: "Email already exists" });
      }

      // Generate a random password
      const generatedPassword = randomBytes(6).toString("hex");
      console.log(`Generated password for ${req.body.email}: ${generatedPassword}`);
      
      // Hash the generated password
      const hashedPassword = await hashPassword(generatedPassword);

      // Create user with email and a username derived from email
      const userData = {
        email: req.body.email,
        username: req.body.email.split('@')[0], // Use the part before @ as username
        password: hashedPassword,
        is_admin: req.body.is_admin || false,
      };
      
      console.log("Creating user with data:", { ...userData, password: "[REDACTED]" });
      const user = await storage.createUser(userData);
      console.log("POST /api/register - User created:", { ...user, password: "[REDACTED]" });

      // In a real app, you would send an email with the password
      // For demo purposes, we'll just log it to the console
      console.log(`
      ========== REGISTRATION CONFIRMATION ==========
      To: ${user.email}
      Subject: Your Employee Skill Metrics Account

      Hello ${user.username},

      Your account has been created successfully. 
      Please use the following credentials to log in:

      Email: ${user.email}
      Password: ${generatedPassword}

      Please change your password after logging in.

      Best regards,
      The Employee Skill Metrics Team
      ============================================
      `);

      req.login(user, (err) => {
        if (err) {
          console.log("POST /api/register - Login error:", err);
          return next(err);
        }
        
        console.log("POST /api/register - User logged in successfully");
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.log("POST /api/register - Exception:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    try {
      console.log("POST /api/login - Body:", req.body);
      
      // Check if email exists in the request body
      if (!req.body.email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Validate login data (simplified for email-only auth)
      const parsedData = loginUserSchema.safeParse({
        email: req.body.email,
        password: req.body.password || '' // Default to empty string for Passport
      });
      
      if (!parsedData.success) {
        console.log("POST /api/login - Validation failed:", parsedData.error.format());
        return res.status(400).json({ message: "Invalid login data", errors: parsedData.error.format() });
      }

      console.log("POST /api/login - Validation succeeded. Parsed data:", parsedData.data);
      
      passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
        console.log("POST /api/login - Passport auth result:", { err, user: user ? user.email : null, info });
        
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: "Invalid email address" });

        req.login(user, (err: any) => {
          if (err) {
            console.log("POST /api/login - Login error:", err);
            return next(err);
          }
          
          console.log("POST /api/login - Login successful for user:", user.email);
          
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      console.log("POST /api/login - Exception:", error);
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("GET /api/user - Authentication status:", req.isAuthenticated());
    console.log("GET /api/user - Session:", req.session);
    console.log("GET /api/user - User:", req.user);
    
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  // Password reset route (simplified for in-memory storage)
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal whether a user exists or not
        return res.status(200).json({ message: "If your email exists, a password reset link will be sent" });
      }

      // In a real application, send an email with a reset token
      // For demo, we're just resetting to a temporary password
      const temporaryPassword = randomBytes(8).toString("hex");
      const hashedPassword = await hashPassword(temporaryPassword);
      
      await storage.updateUserPassword(user.id, hashedPassword);
      
      // In a real implementation, send an email with the temp password
      console.log(`Temporary password for ${email}: ${temporaryPassword}`);
      
      res.status(200).json({ message: "If your email exists, a password reset link will be sent" });
    } catch (error) {
      next(error);
    }
  });
}
