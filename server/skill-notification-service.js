/**
 * Skill Notification Service
 * 
 * This module handles sending skill status notifications (approval/rejection)
 * using Gmail API with OAuth2 authentication.
 */

import * as gmailService from './gmail-service.js';

/**
 * Send a skill status notification email (approval or rejection)
 * 
 * @param {Object} options Notification options
 * @param {string} options.to Recipient email
 * @param {string} options.username User's name/username
 * @param {string} options.status 'approved' or 'rejected'
 * @param {string} options.skillName Name of the skill
 * @param {string} options.reviewerName Name of the reviewer
 * @param {string} options.comments Optional reviewer comments
 * @param {string} options.level Optional skill level
 * @returns {Promise<boolean>} Success status
 */
export async function sendSkillStatusNotification(options) {
  const { to, username, status, skillName, reviewerName, comments = '', level = '' } = options;
  
  try {
    console.log(`Sending skill ${status} notification to ${to} for skill: ${skillName}`);
    
    // Initialize Gmail authentication
    const authStatus = gmailService.initializeGmailAuth();
    
    // If not authenticated, log message and return
    if (!authStatus.authenticated) {
      console.log(`Gmail API not authenticated. Cannot send ${status} notification. Authentication URL:`, authStatus.authUrl);
      console.log(`Skill ${status} notification details:`, { to, username, skillName, reviewerName });
      return false;
    }
    
    // Send the email using Gmail service
    await gmailService.sendSkillStatusEmail({
      to,
      username,
      status,
      skillName,
      reviewerName,
      comments,
      level
    });
    
    console.log(`Skill ${status} email sent successfully to ${to} for skill: ${skillName}`);
    return true;
  } catch (error) {
    console.error(`Error sending skill ${status} email:`, error);
    console.log(`Failed to send skill ${status} notification to ${to} for skill: ${skillName}`);
    return false;
  }
}

/**
 * Send skill approval notification
 * 
 * @param {string} to Recipient email
 * @param {string} firstName User's first name
 * @param {string} skillName Skill name
 * @param {string} reviewerName Reviewer's name
 * @param {string} level Optional skill level
 * @returns {Promise<boolean>} Success status
 */
export async function sendSkillApprovedEmail(to, firstName, skillName, reviewerName = 'Admin', level = '') {
  return sendSkillStatusNotification({
    to,
    username: firstName,
    status: 'approved',
    skillName,
    reviewerName,
    level
  });
}

/**
 * Send skill rejection notification
 * 
 * @param {string} to Recipient email
 * @param {string} firstName User's first name
 * @param {string} skillName Skill name
 * @param {string} reviewerName Reviewer's name
 * @param {string} comments Rejection reason/comments
 * @returns {Promise<boolean>} Success status
 */
export async function sendSkillRejectedEmail(to, firstName, skillName, reviewerName = 'Admin', comments = '') {
  return sendSkillStatusNotification({
    to,
    username: firstName,
    status: 'rejected',
    skillName,
    reviewerName,
    comments
  });
}

export default {
  sendSkillStatusNotification,
  sendSkillApprovedEmail,
  sendSkillRejectedEmail
};