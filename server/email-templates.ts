export function getPasswordResetEmailContent(
  username: string,
  temporaryPassword: string
) {
  const text = `
    Hello ${username},
    
    Your password has been reset successfully.
    Please use the following temporary password to log in:
    
    Temporary Password: ${temporaryPassword}
    
    Please change your password immediately after logging in.
    
    Best regards,
    The Employee Skill Metrics Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Password Reset Confirmation</h2>
      <p>Hello ${username},</p>
      <p>Your password has been reset successfully.</p>
      <p>Please use the following temporary password to log in:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      </div>
      <p style="color: #ef4444;"><strong>Important:</strong> Please change your password immediately after logging in.</p>
      <p>Best regards,<br>The Employee Skill Metrics Team</p>
    </div>
  `;

  return { text, html };
}