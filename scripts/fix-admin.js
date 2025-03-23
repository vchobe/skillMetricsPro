// Script to create an admin user with proper password hashing
import pg from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const { Pool } = pg;
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    // Admin credentials
    const email = "admin@atyeti.com";
    const password = "Admin@123";
    const username = "admin";
    
    // Check if user exists
    const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (checkUser.rows.length > 0) {
      console.log("Admin user exists, updating password...");
      const userId = checkUser.rows[0].id;
      const hashedPassword = await hashPassword(password);
      
      await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, userId]
      );
      
      console.log("Admin password updated successfully!");
    } else {
      console.log("Creating new admin user...");
      // Create new admin user
      const hashedPassword = await hashPassword(password);
      
      await pool.query(`
        INSERT INTO users (email, username, password, first_name, last_name, role, is_admin)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        email,
        username,
        hashedPassword,
        "Admin",
        "User",
        "Administrator",
        true
      ]);
      
      console.log("Admin user created successfully!");
    }
    
    console.log("Email:", email);
    console.log("Password:", password);
    
  } catch (error) {
    console.error("Error managing admin user:", error);
  } finally {
    await pool.end();
  }
}

// Run the function
createAdminUser();