import nodemailer from 'nodemailer';
import { getPasswordResetEmailContent } from './email-templates';

// Create a transporter using SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Additional security options for Gmail
    ...(process.env.EMAIL_HOST?.includes('gmail') ? {
      requireTLS: true,
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    } : {})
  });
};

// Create transporter only when needed to prevent connection timeouts
let transporter: nodemailer.Transporter | null = null;

// Log email configuration (without password)
console.log('Email configuration:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER?.substring(0, 3) + '***@' + 
        (process.env.EMAIL_USER?.split('@')[1] || 'unknown'),
  secure: process.env.EMAIL_PORT === '465'
});

// Check email configuration on startup
if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || 
    !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('Missing email configuration. Email functionality will be limited.');
}

export async function sendRegistrationEmail(
  to: string,
  username: string,
  password: string
): Promise<void> {
  try {
    // Create a transporter for this operation
    if (!transporter) {
      try {
        transporter = createTransporter();
      } catch (error) {
        console.error('Failed to create email transporter:', error);
        throw new Error('Email service configuration error');
      }
    }
    
    if (!transporter) {
      throw new Error('Failed to initialize email transporter');
    }
    
    const emailContent = `
      Hello ${username},

      Your account has been created successfully. 
      Please use the following credentials to log in:

      Email: ${to}
      Password: ${password}

      Please change your password after logging in.

      Best regards,
      The Employee Skill Metrics Team
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Your Employee Skill Metrics Account',
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Welcome to Employee Skill Metrics!</h2>
          <p>Hello ${username},</p>
          <p>Your account has been created successfully.</p>
          <p>Please use the following credentials to log in:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${to}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
          </div>
          <p style="color: #ef4444;"><strong>Important:</strong> Please change your password after logging in.</p>
          <p>Best regards,<br>The Employee Skill Metrics Team</p>
        </div>
      `,
    });

    console.log(`Registration email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending registration email:', error);
    throw new Error('Failed to send registration email');
  }
}

export async function sendPasswordResetEmail(
  to: string,
  username: string,
  temporaryPassword: string
): Promise<void> {
  try {
    // Create a transporter for this operation
    if (!transporter) {
      try {
        transporter = createTransporter();
      } catch (error) {
        console.error('Failed to create email transporter:', error);
        throw new Error('Email service configuration error');
      }
    }
    
    if (!transporter) {
      throw new Error('Failed to initialize email transporter');
    }
    
    const { text, html } = getPasswordResetEmailContent(username, temporaryPassword);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Your Password Has Been Reset',
      text,
      html,
    });

    console.log(`Password reset email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}