/**
 * Simple script to create only an admin user
 */

import pg from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const { Pool } = pg;
const scryptAsync = promisify(scrypt);

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

// These credentials will be displayed to the user
const adminEmail = 'admin@atyeti.com';
const adminPassword = 'Admin@123';
const adminUsername = 'admin';

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Check if admin exists
    const checkResult = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    
    if (checkResult.rows.length > 0) {
      console.log('Admin user already exists. Updating password...');
      const hashedPassword = await hashPassword(adminPassword);
      
      await pool.query(
        'UPDATE users SET password = $1, is_admin = true WHERE email = $2',
        [hashedPassword, adminEmail]
      );
    } else {
      console.log('Creating new admin user...');
      const hashedPassword = await hashPassword(adminPassword);
      
      await pool.query(`
        INSERT INTO users (email, username, password, first_name, last_name, role, is_admin)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        adminEmail,
        adminUsername,
        hashedPassword,
        'Admin',
        'User',
        'Administrator',
        true
      ]);
    }
    
    console.log('Admin user setup completed successfully!');
    console.log('Login credentials:');
    console.log(`- Email: ${adminEmail}`);
    console.log(`- Password: ${adminPassword}`);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

// Execute the function
createAdminUser();