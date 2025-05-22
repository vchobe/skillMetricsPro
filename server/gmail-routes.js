/**
 * Gmail API Authentication Routes
 * 
 * This module provides routes for handling Gmail API OAuth2 authentication flow
 */

import express from 'express';
import * as gmailService from './gmail-service.js';
import fs from 'fs';
import path from 'path';

// Create router
const router = express.Router();

// Route to start the OAuth2 flow
router.get('/gmail/auth', (req, res) => {
  try {
    const authStatus = gmailService.initializeGmailAuth();
    
    if (authStatus.authenticated) {
      res.json({ 
        status: 'authenticated', 
        message: 'Gmail API already authenticated'
      });
    } else {
      res.json({ 
        status: 'authentication_required',
        authUrl: authStatus.authUrl,
        message: 'Gmail API authentication required'
      });
    }
  } catch (error) {
    console.error('Gmail auth route error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to initialize Gmail authentication'
    });
  }
});

// OAuth2 callback route
router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({
      status: 'error',
      message: 'Authentication code is missing'
    });
  }
  
  try {
    const result = await gmailService.completeAuthentication(code);
    
    if (result.success) {
      res.send(`
        <html>
          <head>
            <title>Authentication Successful</title>
          </head>
          <body>
            <h1>Authentication Successful</h1>
            <p>You can close this window and return to the application.</p>
          </body>
        </html>
      `);
    } else {
      res.status(400).send(`
        <html>
          <head>
            <title>Authentication Failed</title>
          </head>
          <body>
            <h1>Authentication Failed</h1>
            <p>Error: ${result.error}</p>
            <p>Please try again.</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>Authentication Error</title>
        </head>
        <body>
          <h1>Authentication Error</h1>
          <p>An unexpected error occurred during authentication.</p>
          <p>Error: ${error.message}</p>
        </body>
      </html>
    `);
  }
});

// Direct token setup route (admin only)
router.post('/gmail/setup-token', async (req, res) => {
  // In production, this should check if user is admin
  try {
    // Import the auth token utility
    const { createTokenFromCode, saveTokenFromJson } = await import('./auth-token.js');
    
    const { authCode, tokenJson } = req.body;
    
    if (authCode) {
      // Create token from OAuth authorization code
      const result = await createTokenFromCode(authCode);
      
      if (result.success) {
        res.json({
          status: 'success',
          message: 'Gmail API token created successfully using authorization code',
          authenticated: true
        });
      } else {
        res.status(400).json({
          status: 'error',
          message: `Failed to create token: ${result.error}`,
          authenticated: false
        });
      }
    } else if (tokenJson) {
      // Save token directly from JSON
      const success = saveTokenFromJson(tokenJson);
      
      if (success) {
        res.json({
          status: 'success',
          message: 'Gmail API token saved successfully',
          authenticated: true
        });
      } else {
        res.status(400).json({
          status: 'error',
          message: 'Failed to save token JSON',
          authenticated: false
        });
      }
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Missing required parameter: either authCode or tokenJson must be provided',
        authenticated: false
      });
    }
  } catch (error) {
    console.error('Error in setup-token route:', error);
    res.status(500).json({
      status: 'error',
      message: `Server error: ${error.message}`,
      authenticated: false
    });
  }
});

// Route to check authentication status
router.get('/gmail/status', (req, res) => {
  try {
    const authStatus = gmailService.initializeGmailAuth();
    res.json({ 
      authenticated: authStatus.authenticated,
      ...(!authStatus.authenticated && { authUrl: authStatus.authUrl })
    });
  } catch (error) {
    console.error('Gmail status check error:', error);
    res.status(500).json({ 
      authenticated: false,
      error: error.message
    });
  }
});

// Route to test sending an email (admin only)
router.post('/gmail/test-email', async (req, res) => {
  // Check if user is admin
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ 
      status: 'error',
      message: 'Only administrators can test email sending'
    });
  }
  
  const { to, subject, message } = req.body;
  
  if (!to || !subject || !message) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: to, subject, message'
    });
  }
  
  try {
    // Create a simple test email
    const username = to.split('@')[0]; // Simple extraction of name from email
    const { html } = gmailService.createStandardEmailTemplate(
      username,
      subject,
      message,
      'Visit Our App',
      '/'
    );
    
    // Send the test email
    await gmailService.sendEmail({ to, subject, html });
    
    res.json({
      status: 'success',
      message: `Test email sent to ${to}`
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to send test email: ${error.message}`
    });
  }
});

export default router;