/**
 * Gmail API Authentication and Email Sending
 * 
 * This module handles OAuth2 authentication with Gmail API and provides
 * functionality to send emails using the authenticated client.
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Load OAuth2 credentials from file
const loadCredentials = () => {
  try {
    const credentialsPath = path.join(process.cwd(), 'client_secret_59463544587-echtadanm4lifuuj47gujio6gkg6f309.apps.googleusercontent.com.json');
    const content = fs.readFileSync(credentialsPath);
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading client secret file:', error);
    throw new Error('Failed to load OAuth2 credentials');
  }
};

// Create OAuth2 client
const createOAuth2Client = () => {
  const credentials = loadCredentials();
  const { client_id, client_secret, redirect_uris } = credentials.web;
  
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0] || 'http://localhost:5000/oauth2callback'
  );
  
  return oAuth2Client;
};

// Get Gmail API service
const getGmailService = (auth) => {
  return google.gmail({ version: 'v1', auth });
};

// Generate authentication URL
export const getAuthUrl = () => {
  const oAuth2Client = createOAuth2Client();
  
  const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
  
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  
  return authUrl;
};

// Get tokens from code
export const getTokens = async (code) => {
  const oAuth2Client = createOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
};

// Set credentials on OAuth2 client
export const setTokens = (tokens) => {
  const oAuth2Client = createOAuth2Client();
  oAuth2Client.setCredentials(tokens);
  return oAuth2Client;
};

// Save tokens to file
export const saveTokens = (tokens) => {
  try {
    const tokenPath = path.join(process.cwd(), 'gmail-token.json');
    fs.writeFileSync(tokenPath, JSON.stringify(tokens));
    console.log('Token stored to', tokenPath);
  } catch (error) {
    console.error('Error saving token:', error);
    throw new Error('Failed to save token');
  }
};

// Load tokens from file
export const loadTokens = () => {
  try {
    const tokenPath = path.join(process.cwd(), 'gmail-token.json');
    if (fs.existsSync(tokenPath)) {
      const content = fs.readFileSync(tokenPath);
      return JSON.parse(content);
    }
    return null;
  } catch (error) {
    console.error('Error loading token:', error);
    return null;
  }
};

// Create OAuth2 client with stored tokens
export const getAuthClient = () => {
  const tokens = loadTokens();
  if (!tokens) {
    console.log('No tokens found, need to authenticate');
    return null;
  }
  
  return setTokens(tokens);
};

// Make an authorized Gmail API request
export const makeGmailApiRequest = async (requestName, requestData) => {
  const auth = getAuthClient();
  if (!auth) {
    throw new Error('Authentication required');
  }
  
  const gmail = getGmailService(auth);
  
  try {
    // Handle token refresh if needed
    auth.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        saveTokens({
          ...loadTokens(),
          ...tokens
        });
      }
    });
    
    // Execute the API request
    return await gmail.users[requestName](requestData);
  } catch (error) {
    console.error('Gmail API error:', error);
    
    // If token is expired, handle refresh
    if (error.response && error.response.status === 401) {
      console.log('Token expired, attempting refresh...');
      try {
        const tokens = await auth.refreshAccessToken();
        auth.setCredentials(tokens.credentials);
        saveTokens(tokens.credentials);
        
        // Retry the request
        return await gmail.users[requestName](requestData);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        throw new Error('Authentication refresh failed');
      }
    }
    
    throw error;
  }
};

// Encode email to base64 format
const encodeEmail = (message) => {
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Send email using Gmail API
 * 
 * @param {Object} options Email options
 * @param {string} options.to Recipient email
 * @param {string} options.subject Email subject
 * @param {string} options.html HTML content
 * @param {string} options.from Sender name (email will be from authenticated user)
 * @returns {Promise<Object>} Gmail API response
 */
export const sendEmail = async ({ to, subject, html, from = 'Skill Metrics App' }) => {
  // Create email content
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    html
  ];
  
  const email = emailLines.join('\r\n');
  const encodedEmail = encodeEmail(email);
  
  // Make the API request
  try {
    const response = await makeGmailApiRequest('messages.send', {
      userId: 'me',
      resource: {
        raw: encodedEmail
      }
    });
    
    console.log('Email sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
};

export default {
  getAuthUrl,
  getTokens,
  setTokens,
  saveTokens,
  loadTokens,
  getAuthClient,
  sendEmail
};