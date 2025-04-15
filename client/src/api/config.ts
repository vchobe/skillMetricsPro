/**
 * API Configuration for connecting to backend API servers
 * This file contains configuration for API endpoints, headers, and error handling
 */

// Toggle flag to switch between Node and Java backends for testing
export const USE_JAVA_BACKEND = false;

// Backend ports
const NODE_PORT = 8080;
const JAVA_PORT = 8081;

// Backend API base URL configuration
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' // Production - relative to the domain
  : USE_JAVA_BACKEND 
    ? `http://localhost:${JAVA_PORT}/api` // Development - Java backend 
    : `http://localhost:${NODE_PORT}/api`; // Development - Node backend

// WebSocket URL configuration
export const WS_BASE_URL = process.env.NODE_ENV === 'production'
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
  : USE_JAVA_BACKEND
    ? `ws://localhost:${JAVA_PORT}/ws`
    : `ws://localhost:${NODE_PORT}/ws`;

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
 * Common API error response structure from Java backend
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