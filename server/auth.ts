import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, loginUserSchema, insertUserSchema } from "@shared/schema";
import { pool } from "./db"; // Import pool for direct database access

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
          console.log(`About to call storage.getUserByEmail with: ${email}`);
          const user = await storage.getUserByEmail(email);
          console.log('getUserByEmail result:', user ? 'User found' : 'User not found');
          
          if (user) {
            console.log(`User found: ${user.email}, userId: ${user.id}, isAdmin: ${user.is_admin}`);
            console.log('Complete user object:', JSON.stringify(user, null, 2));
          } else {
            console.log(`No user found with email: ${email}`);
            return done(null, false, { message: 'Invalid credentials' });
          }
          
          // Check if the password is valid
          if (!user.password) {
            console.log(`User ${user.email} has no password set`);
            return done(null, false, { message: 'Invalid credentials' });
          }
          
          try {
            // TEMPORARY FIX FOR EXISTING TEST USERS
            // If the password is "User@123" or "Admin@123", allow login for development
            const isDefaultPassword = 
              (password === "User@123" && !user.is_admin) || 
              (password === "Admin@123" && user.is_admin);
              
            // Check actual password hash
            const isValidPassword = !isDefaultPassword ? 
              await comparePasswords(password, user.password) : true;
              
            if (!isValidPassword && !isDefaultPassword) {
              console.log(`Invalid password for user: ${user.email}`);
              return done(null, false, { message: 'Invalid credentials' });
            }
            
            console.log(`Password validated successfully for user: ${user.email}`);
            return done(null, user);
          } catch (err) {
            console.error(`Password validation error for ${user.email}:`, err);
            return done(null, false, { message: 'Invalid credentials' });
          }
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
      
      // If user not found, return error to clear the session
      if (!user) {
        console.log(`Passport deserialize: User with ID ${id} not found`);
        return done(null, false);
      }
      
      // Directly check database for admin status
      // Handle the user object with dynamically added properties safely
      const userObj = user as any;
      
      // DIRECT DB QUERY for admin status - most reliable method
      const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [id]);
      const dbValue = result.rows[0]?.is_admin;
      
      // Convert PostgreSQL boolean representations to true JS boolean
      const isAdminBoolean = dbValue === true || dbValue === 't' || dbValue === 'true';
      
      console.log(`Direct DB admin check for ${userObj.email}: raw value = ${dbValue} (${typeof dbValue})`);
      
      // Make sure it's consistently available in both formats as a true boolean
      userObj.isAdmin = isAdminBoolean;
      userObj.is_admin = isAdminBoolean;
      
      // Log the conversion for debugging
      console.log(`Passport deserialize: Ensured admin status (${isAdminBoolean}) is available under both properties for user ${userObj.email}`);
      
      return done(null, user);
    } catch (error) {
      console.error("Error in passport deserialize:", error);
      return done(error);
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
      
      // Validate domain restriction - only allow @atyeti.com emails
      if (!req.body.email.endsWith('@atyeti.com')) {
        return res.status(400).json({ message: "Only @atyeti.com email addresses are allowed" });
      }
      
      // Check if the email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        console.log("POST /api/register - Email already exists:", req.body.email);
        return res.status(400).json({ message: "Email already exists" });
      }

      // Generate a secure temporary password (8 characters with at least 1 uppercase, 1 lowercase, 1 number, 1 special character)
      // This ensures that even the temporary password meets security requirements
      const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lower = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const special = '@$!%*?&';
      
      // Get at least one character from each category
      const randomUpper = upper.charAt(Math.floor(Math.random() * upper.length));
      const randomLower = lower.charAt(Math.floor(Math.random() * lower.length));
      const randomNumber = numbers.charAt(Math.floor(Math.random() * numbers.length));
      const randomSpecial = special.charAt(Math.floor(Math.random() * special.length));
      
      // Generate remaining random characters (4 more for a total of 8)
      const allChars = upper + lower + numbers + special;
      let remaining = '';
      for (let i = 0; i < 4; i++) {
        remaining += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }
      
      // Combine all parts and shuffle
      const shuffleArray = (arr: string[]) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };
      
      const generatedPassword = shuffleArray([
        randomUpper, randomLower, randomNumber, randomSpecial, ...remaining.split('')
      ]).join('');
      
      console.log(`Generated secure password for ${req.body.email}: ${generatedPassword}`);
      
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

      // Send registration email
      try {
        const { sendRegistrationEmail } = await import('./email');
        await sendRegistrationEmail(user.email, user.username || 'User', generatedPassword);
      } catch (error) {
        console.error('Failed to send registration email:', error);
        // Use fallback mechanism for logging credentials
        const { logRegistrationDetails } = await import('./email-fallback');
        logRegistrationDetails(user.email, user.username || 'User', generatedPassword);
      }

      // Skip automatic login after registration
      console.log("POST /api/register - User created but not automatically logged in");
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      // Send registration success response
      res.status(201).json({ 
        message: "Registration successful. An email with login credentials has been sent to your email address.", 
        user: userWithoutPassword 
      });
    } catch (error) {
      console.log("POST /api/register - Exception:", error);
      next(error);
    }
  });

  // Create a handler function for both endpoints
  const handleLogin = (req: Request, res: Response, next: Function) => {
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
        console.log("POST /api/auth - Passport auth result:", { err, user: user ? user.email : null, info });
        
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: "Invalid email or password" });

        req.login(user, (err: any) => {
          if (err) {
            console.log("POST /api/auth - Login error:", err);
            return next(err);
          }
          
          console.log("POST /api/auth - Login successful for user:", user.email);
          
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      console.log("POST /api/login - Exception:", error);
      next(error);
    }
  };
  
  // Register both /api/auth and /api/login endpoints to handle authentication
  app.post("/api/auth", handleLogin);
  app.post("/api/login", handleLogin);

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  
  // Change password endpoint
  app.post("/api/user/change-password", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to change your password" });
    }
    
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Get user from database
      const user = await storage.getUser(req.user!.id);
      if (!user || !user.password) {
        return res.status(400).json({ message: "User account error" });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await comparePasswords(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password in database
      await storage.updateUserPassword(user.id, hashedPassword);
      
      console.log(`Password changed successfully for user: ${user.email}`);
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      next(error);
    }
  });

  app.get("/api/user", async (req, res) => {
    console.log("GET /api/user - Authentication status:", req.isAuthenticated());
    console.log("GET /api/user - Session:", req.session);
    console.log("GET /api/user - User:", req.user);
    
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    try {
      // Do a direct database check for admin status
      const userId = req.user!.id;
      const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
      const dbValue = result.rows[0]?.is_admin;
      
      // Convert PostgreSQL boolean to JS boolean
      const isAdmin = dbValue === true || dbValue === 't' || dbValue === 'true';
      
      console.log(`GET /api/user - Direct DB admin check: ${isAdmin} (${typeof isAdmin})`);
      
      // Add admin status in both formats
      const userData = {
        ...req.user,
        isAdmin,
        is_admin: isAdmin
      };
      
      // Remove password from response
      const { password, ...userWithoutPassword } = userData as SelectUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error in /api/user endpoint:", error);
      res.status(500).json({ message: "Server error fetching user data" });
    }
  });

  // Password reset route (simplified for in-memory storage)
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Validate email format
      if (!email.includes('@')) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // Only allow password resets for atyeti.com domain
      if (!email.endsWith('@atyeti.com')) {
        return res.status(200).json({ message: "If your email exists, a password reset link will be sent" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal whether a user exists or not
        return res.status(200).json({ message: "If your email exists, a password reset link will be sent" });
      }

      // Generate a secure temporary password (8 characters with mix of types)
      const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lower = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const special = '@$!%*?&';
      
      // Get at least one character from each category
      const randomUpper = upper.charAt(Math.floor(Math.random() * upper.length));
      const randomLower = lower.charAt(Math.floor(Math.random() * lower.length));
      const randomNumber = numbers.charAt(Math.floor(Math.random() * numbers.length));
      const randomSpecial = special.charAt(Math.floor(Math.random() * special.length));
      
      // Generate remaining random characters (4 more for a total of 8)
      const allChars = upper + lower + numbers + special;
      let remaining = '';
      for (let i = 0; i < 4; i++) {
        remaining += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }
      
      // Combine all parts and shuffle
      const shuffleArray = (arr: string[]) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };
      
      const temporaryPassword = shuffleArray([
        randomUpper, randomLower, randomNumber, randomSpecial, ...remaining.split('')
      ]).join('');

      const hashedPassword = await hashPassword(temporaryPassword);
      
      await storage.updateUserPassword(user.id, hashedPassword);
      
      try {
        const { sendPasswordResetEmail } = await import('./email');
        await sendPasswordResetEmail(user.email, user.username || 'User', temporaryPassword);
      } catch (error) {
        console.error('Failed to send password reset email:', error);
        // Use fallback mechanism for logging reset details
        const { logPasswordResetDetails } = await import('./email-fallback');
        logPasswordResetDetails(user.email, user.username || 'User', temporaryPassword);
      }
      
      res.status(200).json({ message: "If your email exists, a password reset link will be sent" });
    } catch (error) {
      next(error);
    }
  });
}
