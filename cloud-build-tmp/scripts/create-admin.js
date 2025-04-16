import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { users } from '../shared/schema.js';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { eq } from 'drizzle-orm';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  // Set up database connection
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL
  });

  // Create drizzle instance
  const db = drizzle({ client: pool });

  // Admin credentials
  const password = "Admin@2025";
  const email = "admin@skillsplatform.com";
  
  try {
    // Check if admin user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    
    if (existingUser.length > 0) {
      console.log("Admin user already exists!");
      console.log("Email:", email);
      console.log("Password:", password);
      process.exit(0);
    }
    
    // Create admin user
    const hashedPassword = await hashPassword(password);
    
    const [newUser] = await db.insert(users).values({
      email,
      username: "admin",
      firstName: "Admin",
      lastName: "User",
      role: "System Administrator",
      is_admin: true,
      password: hashedPassword,
    }).returning();
    
    console.log("Admin user created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
    
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Execute the function
createAdminUser();