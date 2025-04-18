/**
 * API Configuration for connecting to the backend
 * This file contains configuration for API endpoints, headers, and error handling
 */

// In Replit, it's better to use relative URLs rather than localhost
const USE_RELATIVE_URLS = true;

// Determine if we're running in Replit
const isReplit = window.location.hostname.includes('replit');

// Backend API base URL configuration
export const API_BASE_URL = isReplit
  ? '/api' // In Replit - use relative URL
  : 'http://localhost:3000/api'; // Local development

// WebSocket URL configuration
export const WS_BASE_URL = isReplit
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
  : 'ws://localhost:3000/ws';

console.log('Environment:', isReplit ? 'Replit' : 'Local');
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