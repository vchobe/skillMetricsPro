/**
 * API Service Modules - Export all API functionality
 * This file serves as a central point for importing all API services
 */

// API Config exports with selective re-export to avoid name conflicts
export { 
  API_BASE_URL,
  WS_BASE_URL,
  DEFAULT_HEADERS,
  REQUEST_TIMEOUT,
  REFRESH_ERROR_CODES,
  LOGOUT_ERROR_CODES,
  TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY
} from './config';

// Selectively export from utils to avoid conflict
export {
  apiRequest,
  buildQueryString,
  simplifyPageResponse,
  extractErrorMessage,
  PageResponse
} from './utils';

// All other API exports
export * from './auth';
export * from './websocket';
export * from './users';
export * from './skills';
export * from './projects';
export * from './clients';
export * from './notifications';
export * from './analytics';
export * from './reports';
export * from './search';

/**
 * Initialize API services and establish connections
 * This function should be called during application startup
 */
export const initializeApiServices = (): void => {
  console.log('Initializing API Services for Java backend integration');
  
  // Check if the API is in production or development mode
  const isProduction = process.env.NODE_ENV === 'production';
  const apiBasePath = isProduction ? '/api' : 'http://localhost:8080/api';
  
  console.log(`API Services initialized. Base path: ${apiBasePath}`);
  
  // Log startup information
  console.log('API integration ready for:');
  console.log('- Authentication (JWT-based)');
  console.log('- Real-time notifications (WebSocket)');
  console.log('- User management');
  console.log('- Skill tracking');
  console.log('- Project management');
  console.log('- Analytics and reporting');
};