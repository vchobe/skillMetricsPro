import nodemailer from 'nodemailer';
import { getPasswordResetEmailContent } from './email-templates';

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

export async function sendRegistrationEmail(
  to: string,
  username: string,
  password: string
): Promise<void> {
  try {
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