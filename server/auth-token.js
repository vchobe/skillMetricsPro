/**
 * Gmail API Direct Token Authentication Helper
 * 
 * This script allows for direct creation and storage of Gmail API tokens
 * without having to go through the full OAuth2 flow.
 */

import fs from 'fs';
import path from 'path';

// Function to directly save a token for Gmail API
export function saveGmailToken(token) {
  try {
    const tokenPath = path.join(process.cwd(), 'gmail-token.json');
    fs.writeFileSync(tokenPath, JSON.stringify(token));
    console.log('Gmail API token saved successfully to', tokenPath);
    return true;
  } catch (error) {
    console.error('Error saving Gmail API token:', error);
    return false;
  }
}

// Sample token format for reference
export const sampleTokenFormat = {
  access_token: "ya29.a0AWY_blahblahsomethinghere",
  refresh_token: "1//04blahblahsomethinghere",
  scope: "https://www.googleapis.com/auth/gmail.send",
  token_type: "Bearer",
  expiry_date: 1621234567890
};

// Create a token file from authorization code (from OAuth Playground)
export async function createTokenFromCode(authCode) {
  try {
    // Import the necessary function from gmail-auth.js
    const { getTokens, saveTokens } = await import('./gmail-auth.js');
    
    // Get tokens using the authorization code
    const tokens = await getTokens(authCode);
    
    // Save the tokens
    saveTokens(tokens);
    
    console.log('Gmail API token created and saved successfully from authorization code');
    return { success: true, tokens };
  } catch (error) {
    console.error('Failed to create token from authorization code:', error);
    return { success: false, error: error.message };
  }
}

// Export a function to directly save a token from JSON
export function saveTokenFromJson(tokenJson) {
  try {
    const token = JSON.parse(tokenJson);
    return saveGmailToken(token);
  } catch (error) {
    console.error('Error parsing token JSON:', error);
    return false;
  }
}