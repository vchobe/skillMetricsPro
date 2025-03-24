import { 
  getPasswordResetEmailContent,
  getResourceAddedEmailContent,
  getResourceRemovedEmailContent
} from './email-templates';
import Mailjet from 'node-mailjet';
import { formatDate } from '../client/src/lib/date-utils';

// Email addresses for HR and Finance
const HR_COORDINATOR_EMAIL = process.env.HR_COORDINATOR_EMAIL || 'hr@skillsplatform.com';
const FINANCE_EXECUTIVE_EMAIL = process.env.FINANCE_EXECUTIVE_EMAIL || 'finance@skillsplatform.com';

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
    
    const { text, html, subject } = getPasswordResetEmailContent(username, temporaryPassword);

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
              Subject: subject || "Your Password Has Been Reset",
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

/**
 * Sends resource addition notification to HR and Finance
 */
export async function sendResourceAddedEmail(
  projectName: string,
  username: string,
  userEmail: string,
  role: string,
  startDate: Date | string | null,
  endDate: Date | string | null,
  allocation: number
): Promise<boolean> {
  try {
    // Format dates for display
    const formattedStartDate = startDate ? formatDate(startDate) : null;
    const formattedEndDate = endDate ? formatDate(endDate) : null;
    
    const { text, html, subject } = getResourceAddedEmailContent(
      projectName,
      username,
      userEmail,
      role,
      formattedStartDate,
      formattedEndDate,
      allocation
    );
    
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      console.log('Mailjet not configured. Logging resource addition details instead...');
      console.log(`Resource Added: ${username} (${role}) to ${projectName}`);
      console.log(`Would have sent email to: ${HR_COORDINATOR_EMAIL}, ${FINANCE_EXECUTIVE_EMAIL}`);
      return true;
    }

    try {
      await mailjet
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
                  Email: HR_COORDINATOR_EMAIL,
                  Name: "HR Coordinator"
                },
                {
                  Email: FINANCE_EXECUTIVE_EMAIL,
                  Name: "Finance Executive"
                }
              ],
              Subject: subject,
              TextPart: text,
              HTMLPart: html
            }
          ]
        });

      console.log(`Resource addition email sent to HR (${HR_COORDINATOR_EMAIL}) and Finance (${FINANCE_EXECUTIVE_EMAIL})`);
      return true;
    } catch (sendError: any) {
      console.error('Error sending resource addition email:', sendError?.message || sendError);
      console.log(`Fallback - Resource Added: ${username} (${role}) to ${projectName}`);
      return false;
    }
  } catch (error: any) {
    console.error('Error in resource addition email flow:', error?.message || error);
    return false;
  }
}

/**
 * Sends resource removal notification to HR and Finance
 */
export async function sendResourceRemovedEmail(
  projectName: string,
  username: string,
  userEmail: string,
  role: string
): Promise<boolean> {
  try {
    const { text, html, subject } = getResourceRemovedEmailContent(
      projectName,
      username,
      userEmail,
      role
    );
    
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      console.log('Mailjet not configured. Logging resource removal details instead...');
      console.log(`Resource Removed: ${username} (${role}) from ${projectName}`);
      console.log(`Would have sent email to: ${HR_COORDINATOR_EMAIL}, ${FINANCE_EXECUTIVE_EMAIL}`);
      return true;
    }

    try {
      await mailjet
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
                  Email: HR_COORDINATOR_EMAIL,
                  Name: "HR Coordinator"
                },
                {
                  Email: FINANCE_EXECUTIVE_EMAIL,
                  Name: "Finance Executive"
                }
              ],
              Subject: subject,
              TextPart: text,
              HTMLPart: html
            }
          ]
        });

      console.log(`Resource removal email sent to HR (${HR_COORDINATOR_EMAIL}) and Finance (${FINANCE_EXECUTIVE_EMAIL})`);
      return true;
    } catch (sendError: any) {
      console.error('Error sending resource removal email:', sendError?.message || sendError);
      console.log(`Fallback - Resource Removed: ${username} (${role}) from ${projectName}`);
      return false;
    }
  } catch (error: any) {
    console.error('Error in resource removal email flow:', error?.message || error);
    return false;
  }
}