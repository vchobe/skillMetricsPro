/**
 * Email Templates V2
 * 
 * Provides standardized email templates using Gmail API
 * with consistent HTML structure for all email types.
 */

/**
 * Standard email template with consistent styling
 * 
 * @param {string} username Recipient's name
 * @param {string} title Email title/heading
 * @param {string} message Main message content
 * @param {string} actionText Call-to-action text
 * @param {string} actionUrl Call-to-action URL
 * @param {Object} options Additional options
 * @returns {Object} Email template with text and HTML versions
 */
export function createStandardEmailTemplate(username, title, message, actionText = null, actionUrl = null, options = {}) {
  const { 
    footer = 'This is an automated message from the Employee Skill Metrics platform.',
    color = '#4f46e5'  // Default primary color
  } = options;

  // Text version of the email (plain text fallback)
  const text = `
Hello ${username},

${title}

${message}

${actionText && actionUrl ? `${actionText}: ${actionUrl}` : ''}

${footer}
Best regards,
The Employee Skill Metrics Team
  `.trim();

  // HTML version of the email with consistent styling
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    .content {
      padding: 20px 0;
    }
    .button {
      display: inline-block;
      background-color: ${color};
      color: white !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
    }
    h1 {
      color: ${color};
    }
    p {
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      <p>Hello ${username},</p>
      ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
      ${actionText && actionUrl ? `
      <div style="text-align: center;">
        <a href="${actionUrl}" class="button">${actionText}</a>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>${footer}</p>
      <p>Best regards,<br>The Employee Skill Metrics Team</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { text, html, subject: title };
}

/**
 * Skill approval/rejection notification template
 * Uses the same template for both approval and rejection
 * 
 * @param {Object} params Template parameters
 * @param {string} params.username User's name
 * @param {string} params.status 'approved' or 'rejected'
 * @param {string} params.skillName Name of the skill
 * @param {string} params.reviewerName Name of the reviewer
 * @param {string} params.comments Optional reviewer comments
 * @param {string} params.level Skill level (beginner, intermediate, expert)
 * @returns {Object} Email template with text and HTML versions
 */
export function getSkillStatusNotificationEmail({ 
  username, 
  status, 
  skillName, 
  reviewerName,
  comments = '',
  level = ''
}) {
  // Determine title and color based on status
  const isApproved = status.toLowerCase() === 'approved';
  const title = `Skill ${isApproved ? 'Approved' : 'Rejected'}: ${skillName}`;
  const color = isApproved ? '#22c55e' : '#ef4444';
  
  // Construct message content
  let message = `
Your skill "${skillName}" has been ${status.toLowerCase()}.
${level ? `Skill Level: ${level}` : ''}
Reviewed by: ${reviewerName}
  `.trim();
  
  // Add comments if provided
  if (comments && comments.trim()) {
    message += `\n\nReviewer Comments:\n${comments}`;
  }
  
  // Add next steps based on status
  if (isApproved) {
    message += `\n\nThis skill has been added to your profile and will be visible in reports and analytics.`;
  } else {
    message += `\n\nPlease review the comments and consider resubmitting with the suggested changes.`;
  }
  
  // Create the email using standard template
  return createStandardEmailTemplate(
    username,
    title,
    message,
    'View Your Skills',
    '/skills',
    { color }
  );
}

/**
 * Password reset email template
 * 
 * @param {string} username User's name
 * @param {string} temporaryPassword Temporary password
 * @returns {Object} Email template with text and HTML versions
 */
export function getPasswordResetEmailContent(username, temporaryPassword) {
  const title = 'Password Reset Confirmation';
  
  const message = `
Your password has been reset successfully.

Please use the following temporary password to log in:

Temporary Password: ${temporaryPassword}

Important: Please change your password immediately after logging in.
  `.trim();
  
  return createStandardEmailTemplate(
    username,
    title,
    message,
    'Log In Now',
    '/login'
  );
}

/**
 * New user registration email template
 * 
 * @param {string} username User's name
 * @param {string} password Initial password
 * @returns {Object} Email template with text and HTML versions
 */
export function getRegistrationEmailContent(username, password) {
  const title = 'Welcome to Employee Skill Metrics';
  
  const message = `
Your account has been created successfully.

Please use the following credentials to log in:
Username: ${username}
Password: ${password}

Important: Please change your password after your first login.
  `.trim();
  
  return createStandardEmailTemplate(
    username,
    title,
    message,
    'Log In Now',
    '/login'
  );
}

/**
 * Project skills notification email template
 * 
 * @param {Object} params Template parameters
 * @param {string} params.username User's name
 * @param {string} params.projectName Project name
 * @param {Array} params.skills List of skills
 * @returns {Object} Email template with text and HTML versions
 */
export function getProjectSkillsNotificationEmail({ username, projectName, skills = [] }) {
  const title = `Skills Required for Project: ${projectName}`;
  
  let message = `
You have been assigned to the project "${projectName}" which requires the following skills:

${skills.map(skill => `• ${skill.name}${skill.level ? ` (${skill.level})` : ''}`).join('\n')}

Please review these skills and update your profile accordingly if you need to add any missing skills.
  `.trim();
  
  return createStandardEmailTemplate(
    username,
    title,
    message,
    'View Project Details',
    `/projects/${encodeURIComponent(projectName)}`
  );
}

export default {
  createStandardEmailTemplate,
  getSkillStatusNotificationEmail,
  getPasswordResetEmailContent,
  getRegistrationEmailContent,
  getProjectSkillsNotificationEmail
};