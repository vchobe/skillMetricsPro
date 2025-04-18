import { API_BASE_URL } from './config';
import { getAccessToken } from './auth';

/**
 * Users API service
 */

// User model
export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  location?: string;
  project?: string;
  enabled: boolean;
  profileComplete: boolean;
  createdAt: string;
  updatedAt?: string;
}

// User profile update request
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  location?: string;
  email?: string;
}

// User password change request
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// User search parameters
export interface UserSearchParams {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  location?: string;
  skillId?: number;
  skillName?: string;
  skillCategory?: string;
  skillLevel?: string;
  projectId?: number;
  page?: number;
  size?: number;
  sort?: string;
}

// Profile history model
export interface ProfileHistory {
  id: number;
  userId: number;
  field: string;
  oldValue?: string;
  newValue?: string;
  changedAt: string;
  changedBy?: number;
}

// Get current user profile
export const getCurrentUser = async (): Promise<User> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/user`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch user profile');
  }

  return response.json();
};

// Get user by ID
export const getUserById = async (userId: number): Promise<User> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch user');
  }

  return response.json();
};

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch users');
  }

  return response.json();
};

// Update user profile
export const updateProfile = async (profileData: UpdateProfileRequest): Promise<User> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/user/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update profile');
  }

  return response.json();
};

// Change user password
export const changePassword = async (passwordData: ChangePasswordRequest): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/user/change-password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(passwordData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to change password');
  }
};

// Search for users
export const searchUsers = async (params: UserSearchParams): Promise<User[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  // Build query string from params
  const queryParams = new URLSearchParams();
  
  if (params.username) queryParams.append('username', params.username);
  if (params.email) queryParams.append('email', params.email);
  if (params.firstName) queryParams.append('firstName', params.firstName);
  if (params.lastName) queryParams.append('lastName', params.lastName);
  if (params.role) queryParams.append('role', params.role);
  if (params.location) queryParams.append('location', params.location);
  if (params.skillId) queryParams.append('skillId', params.skillId.toString());
  if (params.skillName) queryParams.append('skillName', params.skillName);
  if (params.skillCategory) queryParams.append('skillCategory', params.skillCategory);
  if (params.skillLevel) queryParams.append('skillLevel', params.skillLevel);
  if (params.projectId) queryParams.append('projectId', params.projectId.toString());
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size !== undefined) queryParams.append('size', params.size.toString());
  if (params.sort) queryParams.append('sort', params.sort);

  const response = await fetch(`${API_BASE_URL}/users/search?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to search users');
  }

  return response.json();
};

// Get profile history
export const getProfileHistory = async (userId?: number): Promise<ProfileHistory[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const url = userId 
    ? `${API_BASE_URL}/users/${userId}/profile-history` 
    : `${API_BASE_URL}/user/profile-history`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch profile history');
  }

  return response.json();
};

// Get projects for a user
export const getUserProjects = async (userId?: number): Promise<any[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const url = userId 
    ? `${API_BASE_URL}/users/${userId}/projects` 
    : `${API_BASE_URL}/user/projects`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch user projects');
  }

  return response.json();
};