import { getPasswordResetEmailContent } from './email-templates';
import Mailjet from 'node-mailjet';

// Initialize Mailjet client
const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY || 'your-api-key',
  apiSecret: process.env.MAILJET_SECRET_KEY || 'your-secret-key'
});

// Verify email configuration on startup
if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
  console.warn('Missing Mailjet configuration. Email functionality will be limited.');
} else {
  console.log('Mailjet configuration found. Email service is ready.');
}

/**
 * Sends registration email using Mailjet
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
    
    const html = `
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
    `;

    const text = `
      Hello ${username},

      Your account has been created successfully. 
      Please use the following credentials to log in:

      Email: ${to}
      Password: ${password}

      Please change your password after logging in.

      Best regards,
      The Employee Skill Metrics Team
    `;

    try {
      const data = await mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: "vinayak.chobe@atyeti.com",
                Name: "Employee Skill Metrics"
              },
              To: [
                {
                  Email: to,
                  Name: username
                }
              ],
              Subject: "Your Employee Skill Metrics Account",
              TextPart: text,
              HTMLPart: html
            }
          ]
        });

      console.log(`Registration email sent successfully to ${to}`);
      return;
    } catch (sendError: any) {
      console.error('Error sending registration email:', sendError?.message || sendError);
      logRegistrationDetails(to, username, password);
      throw new Error('Failed to send registration email');
    }
  } catch (error: any) {
    console.error('Error in registration email flow:', error?.message || error);
    throw new Error('Failed to send registration email');
  }
}

/**
 * Sends password reset email using Mailjet
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
    
    const { text, html } = getPasswordResetEmailContent(username, temporaryPassword);

    try {
      const data = await mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: "vinayak.chobe@atyeti.com",
                Name: "Employee Skill Metrics"
              },
              To: [
                {
                  Email: to,
                  Name: username
                }
              ],
              Subject: "Your Password Has Been Reset",
              TextPart: text,
              HTMLPart: html
            }
          ]
        });

      console.log(`Password reset email sent successfully to ${to}`);
      return;
    } catch (sendError: any) {
      console.error('Error sending password reset email:', sendError?.message || sendError);
      logPasswordResetDetails(to, username, temporaryPassword);
      throw new Error('Failed to send password reset email');
    }
  } catch (error: any) {
    console.error('Error in password reset flow:', error?.message || error);
    throw new Error('Failed to send password reset email');
  }
}