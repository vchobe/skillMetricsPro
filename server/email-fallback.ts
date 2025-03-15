/**
 * Email Fallback Service
 * 
 * This module provides fallback mechanisms when the main email service is unavailable.
 * It logs detailed information that would normally be sent via email.
 */

export function logRegistrationDetails(email: string, username: string, password: string): void {
  console.log(`
========== BACKUP: REGISTRATION DETAILS ==========
Email: ${email}
Username: ${username}
Password: ${password}
===============================================
  `);
}

export function logPasswordResetDetails(email: string, username: string, temporaryPassword: string): void {
  console.log(`
========== BACKUP: PASSWORD RESET DETAILS ==========
Email: ${email}
Username: ${username}
Temporary Password: ${temporaryPassword}
===============================================
  `);
}