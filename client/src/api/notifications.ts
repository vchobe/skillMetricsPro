import { API_BASE_URL } from './config';
import { getAccessToken } from './auth';
import { Notification } from './websocket';

/**
 * Notifications API service for interacting with Java backend
 */

// Notification status update request
export interface NotificationStatusUpdateRequest {
  notificationIds: number[];
  read: boolean;
}

// Notification count response
export interface NotificationCountResponse {
  total: number;
  unread: number;
}

// Get all notifications for the current user
export const getNotifications = async (page: number = 0, size: number = 20): Promise<Notification[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/notifications?page=${page}&size=${size}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch notifications');
  }

  return response.json();
};

// Get unread notifications for the current user
export const getUnreadNotifications = async (page: number = 0, size: number = 20): Promise<Notification[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/notifications/unread?page=${page}&size=${size}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch unread notifications');
  }

  return response.json();
};

// Mark notifications as read or unread
export const updateNotificationStatus = async (request: NotificationStatusUpdateRequest): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/notifications/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update notification status');
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to mark all notifications as read');
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: number): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete notification');
  }
};

// Clear all notifications
export const clearAllNotifications = async (): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/notifications/clear`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to clear notifications');
  }
};

// Get notification count
export const getNotificationCount = async (): Promise<NotificationCountResponse> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/notifications/count`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch notification count');
  }

  return response.json();
};