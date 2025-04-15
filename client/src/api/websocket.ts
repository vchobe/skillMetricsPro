import { WS_BASE_URL } from './config';
import { getAccessToken } from './auth';

/**
 * WebSocket client for real-time notifications
 * Uses native WebSocket API to connect to Spring WebSocket endpoints
 */

// Notification data structure
export interface Notification {
  id: number;
  userId: number;
  type: string;
  message: string;
  read: boolean;
  data?: any;
  createdAt: string;
  updatedAt?: string;
}

// WebSocket message structure
interface WebSocketMessage {
  type: string;
  payload: any;
}

// Callback types for notification events
export type NotificationCallback = (notification: Notification) => void;
export type ConnectionCallback = () => void;
export type ErrorCallback = (error: any) => void;

// WebSocket client instance
let websocket: WebSocket | null = null;
let isConnected = false;
let isConnecting = false;
let reconnectTimeout: number | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

// Event listeners
const notificationListeners: NotificationCallback[] = [];
const connectListeners: ConnectionCallback[] = [];
const errorListeners: ErrorCallback[] = [];

/**
 * Connect to WebSocket server
 */
export const connectWebSocket = (): void => {
  if (isConnected || isConnecting) return;
  
  isConnecting = true;
  
  try {
    // Clear any existing reconnect timeouts
    if (reconnectTimeout) {
      window.clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    // Get authentication token
    const token = getAccessToken();
    const wsUrl = token ? `${WS_BASE_URL}?token=${token}` : WS_BASE_URL;
    
    // Create new WebSocket connection
    websocket = new WebSocket(wsUrl);
    
    // Connection opened
    websocket.onopen = () => {
      console.log('WebSocket connection established');
      isConnected = true;
      isConnecting = false;
      reconnectAttempts = 0;
      
      // Notify all connection listeners
      connectListeners.forEach(listener => listener());
      
      // Subscribe to notifications
      sendSubscriptionRequest();
    };
    
    // Connection closed
    websocket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      isConnected = false;
      isConnecting = false;
      
      // Attempt to reconnect if not closed cleanly
      if (event.code !== 1000) { // 1000 is normal closure
        scheduleReconnect();
      }
    };
    
    // Connection error
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      handleConnectionError(error);
    };
    
    // Listen for messages
    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        
        // Handle different message types
        switch (message.type) {
          case 'NOTIFICATION':
            // Process notification message
            notificationListeners.forEach(listener => listener(message.payload));
            break;
          case 'NOTIFICATION_COUNT':
            // Process notification count update
            console.log('Notification count:', message.payload);
            break;
          default:
            console.log('Received message:', message);
        }
      } catch (e) {
        console.error('Error processing message:', e);
      }
    };
  } catch (e) {
    handleConnectionError(e);
  }
};

/**
 * Send subscription request to server
 */
const sendSubscriptionRequest = (): void => {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) return;
  
  try {
    const userId = getUserIdFromToken();
    if (!userId) return;
    
    // Send subscription message
    const subscriptionMessage: WebSocketMessage = {
      type: 'SUBSCRIBE',
      payload: { userId }
    };
    
    websocket.send(JSON.stringify(subscriptionMessage));
    console.log('Sent subscription request');
  } catch (e) {
    console.error('Error sending subscription request:', e);
  }
};

/**
 * Handle connection errors
 */
const handleConnectionError = (error: any): void => {
  console.error('WebSocket error:', error);
  isConnected = false;
  isConnecting = false;
  
  // Notify all error listeners
  errorListeners.forEach(listener => listener(error));
  
  // Schedule reconnection attempt
  scheduleReconnect();
};

/**
 * Schedule a reconnection attempt
 */
const scheduleReconnect = (): void => {
  if (reconnectTimeout) {
    window.clearTimeout(reconnectTimeout);
  }
  
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    
    // Exponential backoff
    const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts - 1);
    
    console.log(`Scheduling reconnect attempt ${reconnectAttempts} in ${delay}ms`);
    reconnectTimeout = window.setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      connectWebSocket();
    }, delay);
  } else {
    console.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
  }
};

/**
 * Disconnect from WebSocket server
 */
export const disconnectWebSocket = (): void => {
  if (websocket) {
    websocket.close(1000, 'User initiated disconnect');
    websocket = null;
  }
  
  if (reconnectTimeout) {
    window.clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  isConnected = false;
  isConnecting = false;
  console.log('Disconnected from WebSocket server');
};

/**
 * Register a notification listener
 */
export const onNotification = (callback: NotificationCallback): () => void => {
  notificationListeners.push(callback);
  
  // Return a function to remove this listener
  return () => {
    const index = notificationListeners.indexOf(callback);
    if (index !== -1) {
      notificationListeners.splice(index, 1);
    }
  };
};

/**
 * Register a connection listener
 */
export const onConnect = (callback: ConnectionCallback): () => void => {
  connectListeners.push(callback);
  
  // Return a function to remove this listener
  return () => {
    const index = connectListeners.indexOf(callback);
    if (index !== -1) {
      connectListeners.splice(index, 1);
    }
  };
};

/**
 * Register an error listener
 */
export const onError = (callback: ErrorCallback): () => void => {
  errorListeners.push(callback);
  
  // Return a function to remove this listener
  return () => {
    const index = errorListeners.indexOf(callback);
    if (index !== -1) {
      errorListeners.splice(index, 1);
    }
  };
};

/**
 * Check if WebSocket is connected
 */
export const isWebSocketConnected = (): boolean => {
  return isConnected;
};

/**
 * Send a message through the WebSocket
 */
export const sendWebSocketMessage = (type: string, payload: any): void => {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket not connected, unable to send message');
    return;
  }
  
  try {
    const message: WebSocketMessage = { type, payload };
    websocket.send(JSON.stringify(message));
  } catch (e) {
    console.error('Error sending WebSocket message:', e);
  }
};

/**
 * Get user ID from JWT token
 */
const getUserIdFromToken = (): string | null => {
  const token = getAccessToken();
  if (!token) return null;
  
  try {
    // JWT tokens consist of three parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload part (middle part)
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || payload.userId || null;
  } catch (e) {
    console.error('Error parsing token:', e);
    return null;
  }
};