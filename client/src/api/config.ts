/**
 * API Configuration for connecting to the backend
 * This file contains configuration for API endpoints, headers, and error handling
 */

// Always use relative URLs in production to avoid CORS issues, even if URLs change
// Only use absolute URLs for local development

/**
 * Detect if we're running in a local development environment
 * Everything else (Replit, Cloud Run, custom domains) should use relative URLs
 */
const isLocalDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';

// Environment detection for logging purposes
const isCloudRun = window.location.hostname.includes('.run.app') || 
                   window.location.hostname.includes('.cloudrun.app');
                   
const isReplit = window.location.hostname.includes('replit') || 
                window.location.hostname.includes('repl.co');

// Get environment name for logging
const environment = isLocalDevelopment ? 'Local Development' : 
                   isCloudRun ? 'Cloud Run' :
                   isReplit ? 'Replit' : 
                   'Production';

// Backend API base URL configuration - ALWAYS use relative paths in production
export const API_BASE_URL = isLocalDevelopment
  ? 'http://localhost:5000/api' // Local development - explicit URL
  : '/api'; // In production - use relative URL regardless of hostname

// WebSocket URL configuration - ALWAYS use relative/dynamic paths in production
export const WS_BASE_URL = isLocalDevelopment
  ? 'ws://localhost:5000/ws' // Local development
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`; // Production

// Log the configuration for debugging
console.log('Environment:', environment);
console.log('API Base URL:', API_BASE_URL);
console.log('WebSocket URL:', WS_BASE_URL);

// Default request headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// API request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Error codes that should trigger a refresh token attempt
export const REFRESH_ERROR_CODES = [401];

// Error codes that should trigger a logout
export const LOGOUT_ERROR_CODES = [403];

/**
 * Common API error response structure
 */
export interface ApiErrorResponse {
  status: number;
  timestamp?: string;
  message?: string;
  error?: string;
  path?: string;
  details?: any;
}

/**
 * Authentication token storage keys
 */
export const TOKEN_STORAGE_KEY = 'accessToken';
export const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';