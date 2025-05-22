/**
 * Gmail Email Service
 * 
 * This module provides email sending services using Gmail API with OAuth2 authentication.
 * It replaces the previous Mailjet-based implementation.
 */

import * as gmailAuth from './gmail-auth.js';
import * as emailTemplates from './email-templates-v2.js';
import fs from 'fs';
import path from 'path';

// Credentials file path
const CREDENTIALS_PATH = path.join(process.cwd(), 'client_secret_59463544587-echtadanm4lifuuj47gujio6gkg6f309.apps.googleusercontent.com.json');
// Token storage path
const TOKEN_PATH = path.join(process.cwd(), 'gmail-token.json');

/**
 * Initialize Gmail API authentication
 * If tokens exist, load them; otherwise provide auth URL
 */
export const initializeGmailAuth = () => {
  try {
    // Check if credentials file exists
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error('Missing Gmail API credentials file. Place it at:', CREDENTIALS_PATH);
      throw new Error('Gmail API credentials not found');
    }
    
    // Check if token exists
    if (fs.existsSync(TOKEN_PATH)) {
      const tokens = gmailAuth.loadTokens();
      console.log('Gmail API tokens loaded successfully');
      return { authenticated: true, tokens };
    } else {
      // Generate auth URL for first-time setup
      const authUrl = gmailAuth.getAuthUrl();
      console.log('Gmail API not authenticated yet. Auth URL:', authUrl);
      return { authenticated: false, authUrl };
    }
  } catch (error) {
    console.error('Gmail API initialization error:', error);
    throw new Error('Failed to initialize Gmail API');
  }
};

/**
 * Complete OAuth2 authentication with the provided code
 */
export const completeAuthentication = async (code) => {
  try {
    const tokens = await gmailAuth.getTokens(code);
    gmailAuth.saveTokens(tokens);
    return { success: true, tokens };
  } catch (error) {
    console.error('Failed to complete Gmail authentication:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send skill status notification email (approval or rejection)
 */
export const sendSkillStatusEmail = async (options) => {
  try {
    const { to, username, status, skillName, reviewerName, comments, level } = options;
    
    const { text, html, subject } = emailTemplates.getSkillStatusNotificationEmail({
      username,
      status,
      skillName,
      reviewerName,
      comments,
      level
    });
    
    return await gmailAuth.sendEmail({
      to,
      subject,
      html,
      from: 'Skill Metrics App'
    });
  } catch (error) {
    console.error('Failed to send skill status email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (to, username, temporaryPassword) => {
  try {
    const { text, html, subject } = emailTemplates.getPasswordResetEmailContent(username, temporaryPassword);
    
    return await gmailAuth.sendEmail({
      to,
      subject,
      html,
      from: 'Skill Metrics App'
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};

/**
 * Send registration email
 */
export const sendRegistrationEmail = async (to, username, password) => {
  try {
    const { text, html, subject } = emailTemplates.getRegistrationEmailContent(username, password);
    
    return await gmailAuth.sendEmail({
      to,
      subject,
      html,
      from: 'Skill Metrics App'
    });
  } catch (error) {
    console.error('Failed to send registration email:', error);
    throw error;
  }
};

/**
 * Send project skills notification email
 */
export const sendProjectSkillsEmail = async (options) => {
  try {
    const { to, username, projectName, skills } = options;
    
    const { text, html, subject } = emailTemplates.getProjectSkillsNotificationEmail({
      username,
      projectName,
      skills
    });
    
    return await gmailAuth.sendEmail({
      to,
      subject,
      html,
      from: 'Skill Metrics App'
    });
  } catch (error) {
    console.error('Failed to send project skills email:', error);
    throw error;
  }
};

export default {
  initializeGmailAuth,
  completeAuthentication,
  sendSkillStatusEmail,
  sendPasswordResetEmail,
  sendRegistrationEmail,
  sendProjectSkillsEmail
};