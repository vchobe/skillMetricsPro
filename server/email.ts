import { 
  getPasswordResetEmailContent,
  getResourceAddedEmailContent,
  getResourceRemovedEmailContent,
  getProjectCreatedEmailContent,
  getProjectUpdatedEmailContent
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
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
  allocation: number,
  hrEmail: string | null = null,
  financeEmail: string | null = null
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
    
    // Use project-specific emails if provided, otherwise fall back to defaults
    const hrRecipientEmail = hrEmail || HR_COORDINATOR_EMAIL;
    const financeRecipientEmail = financeEmail || FINANCE_EXECUTIVE_EMAIL;
    
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      console.log('Mailjet not configured. Logging resource addition details instead...');
      console.log(`Resource Added: ${username} (${role}) to ${projectName}`);
      console.log(`Would have sent email to: ${hrRecipientEmail}, ${financeRecipientEmail}`);
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
                  Email: hrRecipientEmail,
                  Name: "HR Coordinator"
                },
                {
                  Email: financeRecipientEmail,
                  Name: "Finance Executive"
                }
              ],
              Subject: subject,
              TextPart: text,
              HTMLPart: html
            }
          ]
        });

      console.log(`Resource addition email sent to HR (${hrRecipientEmail}) and Finance (${financeRecipientEmail})`);
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
  role: string,
  hrEmail: string | null = null,
  financeEmail: string | null = null
): Promise<boolean> {
  try {
    const { text, html, subject } = getResourceRemovedEmailContent(
      projectName,
      username,
      userEmail,
      role
    );
    
    // Use project-specific emails if provided, otherwise fall back to defaults
    const hrRecipientEmail = hrEmail || HR_COORDINATOR_EMAIL;
    const financeRecipientEmail = financeEmail || FINANCE_EXECUTIVE_EMAIL;
    
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      console.log('Mailjet not configured. Logging resource removal details instead...');
      console.log(`Resource Removed: ${username} (${role}) from ${projectName}`);
      console.log(`Would have sent email to: ${hrRecipientEmail}, ${financeRecipientEmail}`);
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
                  Email: hrRecipientEmail,
                  Name: "HR Coordinator"
                },
                {
                  Email: financeRecipientEmail,
                  Name: "Finance Executive"
                }
              ],
              Subject: subject,
              TextPart: text,
              HTMLPart: html
            }
          ]
        });

      console.log(`Resource removal email sent to HR (${hrRecipientEmail}) and Finance (${financeRecipientEmail})`);
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

/**
 * Sends project creation notification to HR and Finance
 */
export async function sendProjectCreatedEmail(
  projectName: string,
  clientName: string | null | undefined,
  description: string | null | undefined,
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
  leadName: string | null | undefined,
  hrEmail: string | null = null,
  financeEmail: string | null = null
): Promise<boolean> {
  try {
    // Format dates for display
    const formattedStartDate = startDate ? formatDate(startDate) : null;
    const formattedEndDate = endDate ? formatDate(endDate) : null;
    
    const { text, html, subject } = getProjectCreatedEmailContent(
      projectName,
      clientName,
      description,
      formattedStartDate,
      formattedEndDate,
      leadName
    );
    
    // Use project-specific emails if provided, otherwise fall back to defaults
    const hrRecipientEmail = hrEmail || HR_COORDINATOR_EMAIL;
    const financeRecipientEmail = financeEmail || FINANCE_EXECUTIVE_EMAIL;
    
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      console.log('Mailjet not configured. Logging project creation details instead...');
      console.log(`Project Created: ${projectName} (Client: ${clientName || 'Not specified'})`);
      console.log(`Would have sent email to: ${hrRecipientEmail}, ${financeRecipientEmail}`);
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
                  Email: hrRecipientEmail,
                  Name: "HR Coordinator"
                },
                {
                  Email: financeRecipientEmail,
                  Name: "Finance Executive"
                }
              ],
              Subject: subject,
              TextPart: text,
              HTMLPart: html
            }
          ]
        });

      console.log(`Project creation email sent to HR (${hrRecipientEmail}) and Finance (${financeRecipientEmail})`);
      return true;
    } catch (sendError: any) {
      console.error('Error sending project creation email:', sendError?.message || sendError);
      console.log(`Fallback - Project Created: ${projectName}`);
      return false;
    }
  } catch (error: any) {
    console.error('Error in project creation email flow:', error?.message || error);
    return false;
  }
}

/**
 * Sends project update notification to HR and Finance
 */
export async function sendProjectUpdatedEmail(
  projectName: string,
  clientName: string | null | undefined,
  description: string | null | undefined,
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
  leadName: string | null | undefined,
  changedFields: string[],
  hrEmail: string | null = null,
  financeEmail: string | null = null
): Promise<boolean> {
  try {
    // Format dates for display
    const formattedStartDate = startDate ? formatDate(startDate) : null;
    const formattedEndDate = endDate ? formatDate(endDate) : null;
    
    const { text, html, subject } = getProjectUpdatedEmailContent(
      projectName,
      clientName,
      description,
      formattedStartDate,
      formattedEndDate,
      leadName,
      changedFields
    );
    
    // Use project-specific emails if provided, otherwise fall back to defaults
    const hrRecipientEmail = hrEmail || HR_COORDINATOR_EMAIL;
    const financeRecipientEmail = financeEmail || FINANCE_EXECUTIVE_EMAIL;
    
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      console.log('Mailjet not configured. Logging project update details instead...');
      console.log(`Project Updated: ${projectName} (Fields changed: ${changedFields.join(', ')})`);
      console.log(`Would have sent email to: ${hrRecipientEmail}, ${financeRecipientEmail}`);
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
                  Email: hrRecipientEmail,
                  Name: "HR Coordinator"
                },
                {
                  Email: financeRecipientEmail,
                  Name: "Finance Executive"
                }
              ],
              Subject: subject,
              TextPart: text,
              HTMLPart: html
            }
          ]
        });

      console.log(`Project update email sent to HR (${hrRecipientEmail}) and Finance (${financeRecipientEmail})`);
      return true;
    } catch (sendError: any) {
      console.error('Error sending project update email:', sendError?.message || sendError);
      console.log(`Fallback - Project Updated: ${projectName}`);
      return false;
    }
  } catch (error: any) {
    console.error('Error in project update email flow:', error?.message || error);
    return false;
  }
}