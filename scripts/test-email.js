/**
 * Test Email Script
 * 
 * This script tests sending an email to a specific address using Mailjet
 * without going through the normal application flow.
 */

import Mailjet from 'node-mailjet';
import * as dotenv from 'dotenv';

// Import environment variables
dotenv.config();

async function sendTestEmail(recipientEmail) {
  try {
    // Check if Mailjet API keys are available
    const apiKey = process.env.MAILJET_API_KEY;
    const secretKey = process.env.MAILJET_SECRET_KEY;
    
    if (!apiKey || !secretKey) {
      console.error('Mailjet API keys not found. Please set MAILJET_API_KEY and MAILJET_SECRET_KEY environment variables.');
      return;
    }
    
    // Initialize Mailjet client
    const mailjet = new Mailjet({
      apiKey: apiKey,
      apiSecret: secretKey,
    });
    
    console.log(`Attempting to send test email to ${recipientEmail}...`);
    
    // Send the email
    const request = mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: "support@mailjet.com",
            Name: "Skills Management"
          },
          To: [
            {
              Email: recipientEmail,
              Name: "Test Recipient"
            }
          ],
          Subject: "Test Email from Skills Management Application",
          TextPart: "This is a test email to verify email delivery functionality.",
          HTMLPart: `
            <h3>Test Email</h3>
            <p>This is a test email sent from the Skills Management Application.</p>
            <p>If you received this email, it means our email service is working correctly.</p>
            <p>Thank you for your help in testing!</p>
          `,
        }
      ]
    });
    
    const response = await request;
    console.log('Email sent successfully!');
    console.log('Response:', JSON.stringify(response.body, null, 2));
    return true;
  } catch (error) {
    console.error('Error sending email:', error.message);
    if (error.statusCode) {
      console.error(`Status code: ${error.statusCode}`);
    }
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Check if email is provided as command-line argument
const recipientEmail = process.argv[2] || 'vinayak3.chobe@gmail.com';

// Execute the function
sendTestEmail(recipientEmail)
  .then(success => {
    if (success) {
      console.log(`Test email successfully sent to ${recipientEmail}`);
    } else {
      console.log(`Failed to send test email to ${recipientEmail}`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });