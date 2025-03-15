import nodemailer from 'nodemailer';
import { getPasswordResetEmailContent } from './email-templates';

// Create a transporter using SMTP
/**
 * Creates and tests an email transporter with the given configuration
 * Improved to handle Gmail's specific authentication requirements
 */
const createTransporter = () => {
  const isGmail = process.env.EMAIL_HOST?.includes('gmail');
  const isSecure = process.env.EMAIL_PORT === '465';
  
  // Gmail-specific configuration
  const transporterConfig = {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: isSecure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Gmail-specific settings
    ...(isGmail ? {
      requireTLS: true,
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      debug: true, // Enable debugging to see detailed logs
      logger: true,
      // Override authentication for OAuth2 if implementing in the future
      // authMethod: 'PLAIN' // Force PLAIN authentication
    } : {})
  };
  
  console.log(`Creating email transporter with host: ${process.env.EMAIL_HOST}, port: ${process.env.EMAIL_PORT}, secure: ${isSecure}`);
  
  return nodemailer.createTransport(transporterConfig);
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

// Verify email configuration on startup
if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || 
    !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('Missing email configuration. Email functionality will be limited.');
} else {
  // Verify SMTP connection on startup (disabled to prevent connection issues)
  /*
  try {
    const tempTransporter = createTransporter();
    tempTransporter.verify((error) => {
      if (error) {
        console.error('Email verification failed:', error);
        console.log('Fallback mechanism will be used for email operations');
      } else {
        console.log('Email server connection verified successfully');
      }
    });
  } catch (error) {
    console.error('Failed to create email transporter for verification:', error);
  }
  */
  
  // Gmail-specific recommendations
  if (process.env.EMAIL_HOST?.includes('gmail')) {
    console.log('Gmail SMTP detected. Make sure you:');
    console.log('1. Have enabled "Less secure app access" or');
    console.log('2. Created an App Password if using 2FA');
    console.log('3. Allowed access at https://accounts.google.com/DisplayUnlockCaptcha');
  }
}

/**
 * Sends registration email with enhanced error handling
 * Includes a fallback mechanism if email sending fails
 */
export async function sendRegistrationEmail(
  to: string,
  username: string,
  password: string
): Promise<void> {
  try {
    // Import fallback mechanism
    const { logRegistrationDetails } = await import('./email-fallback');
    
    // Create a transporter for this operation
    if (!transporter) {
      try {
        transporter = createTransporter();
      } catch (error: any) {
        console.error('Failed to create email transporter:', error?.message || error);
        // Fallback to logging the details
        logRegistrationDetails(to, username, password);
        throw new Error('Email service configuration error');
      }
    }
    
    if (!transporter) {
      // Fallback to logging the details
      logRegistrationDetails(to, username, password);
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

    // Configure more detailed options
    const mailOptions = {
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
      headers: {
        'Priority': 'high'
      },
      // Nodemailer priority - defaults to normal
      priority: 'high' as const
    };

    try {
      // Attempt to send the email
      await transporter.sendMail(mailOptions);
      console.log(`Registration email sent successfully to ${to}`);
    } catch (sendError: any) {
      console.error('Error sending registration email:', sendError?.message || sendError);
      
      // Fallback to logging the details
      logRegistrationDetails(to, username, password);
      
      // Check for specific gmail errors
      if (sendError?.message?.includes('535-5.7.8') || 
          sendError?.message?.includes('BadCredentials')) {
        console.error('Gmail authentication error - please check:');
        console.error('1. Email address and password are correct');
        console.error('2. "Less secure app access" is enabled or you\'re using App Password');
        console.error('3. You\'ve completed https://accounts.google.com/DisplayUnlockCaptcha');
      }
      
      throw new Error('Failed to send registration email');
    }
  } catch (error: any) {
    console.error('Error in registration email flow:', error?.message || error);
    throw new Error('Failed to send registration email');
  }
}

/**
 * Sends password reset email with enhanced error handling
 * Includes a fallback mechanism if email sending fails
 */
export async function sendPasswordResetEmail(
  to: string,
  username: string,
  temporaryPassword: string
): Promise<void> {
  try {
    // Import fallback mechanism
    const { logPasswordResetDetails } = await import('./email-fallback');
    
    // Create a transporter for this operation
    if (!transporter) {
      try {
        transporter = createTransporter();
      } catch (error: any) {
        console.error('Failed to create email transporter:', error?.message || error);
        // Fallback to logging the details
        logPasswordResetDetails(to, username, temporaryPassword);
        throw new Error('Email service configuration error');
      }
    }
    
    if (!transporter) {
      // Fallback to logging the details
      logPasswordResetDetails(to, username, temporaryPassword);
      throw new Error('Failed to initialize email transporter');
    }
    
    const { text, html } = getPasswordResetEmailContent(username, temporaryPassword);

    // Configure more detailed options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Your Password Has Been Reset',
      text,
      html,
      headers: {
        'Priority': 'high'
      },
      // Nodemailer priority - defaults to normal
      priority: 'high' as const
    };

    try {
      // Attempt to send the email
      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent successfully to ${to}`);
    } catch (sendError: any) {
      console.error('Error sending password reset email:', sendError?.message || sendError);
      
      // Fallback to logging the details
      logPasswordResetDetails(to, username, temporaryPassword);
      
      // Check for specific gmail errors
      if (sendError?.message?.includes('535-5.7.8') || 
          sendError?.message?.includes('BadCredentials')) {
        console.error('Gmail authentication error - please check:');
        console.error('1. Email address and password are correct');
        console.error('2. "Less secure app access" is enabled or you\'re using App Password');
        console.error('3. You\'ve completed https://accounts.google.com/DisplayUnlockCaptcha');
      }
      
      throw new Error('Failed to send password reset email');
    }
  } catch (error: any) {
    console.error('Error in password reset flow:', error?.message || error);
    throw new Error('Failed to send password reset email');
  }
}