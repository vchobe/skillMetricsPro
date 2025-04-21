import { 
  API_BASE_URL, 
  TOKEN_STORAGE_KEY, 
  REFRESH_TOKEN_STORAGE_KEY 
} from './config';

/**
 * Authentication service for backend interaction
 */

// Interface for login request
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

// Interface for registration request
export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Interface for authentication response
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  username: string;
  email: string;
  roles: string[];
}

// Login API call
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to login');
  }

  const authData = await response.json();
  // Store tokens
  localStorage.setItem(TOKEN_STORAGE_KEY, authData.accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, authData.refreshToken);
  
  return authData;
};

// Register API call
export const register = async (userData: SignupRequest): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to register');
  }

  const authData = await response.json();
  // Store tokens
  localStorage.setItem(TOKEN_STORAGE_KEY, authData.accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, authData.refreshToken);
  
  return authData;
};

// Logout API call
export const logout = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem(TOKEN_STORAGE_KEY)}`,
      },
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear tokens regardless of API success
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
};

// Refresh token API call
export const refreshToken = async (): Promise<AuthResponse> => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
    credentials: 'include',
  });

  if (!response.ok) {
    // If refresh fails, clear tokens and throw error
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    throw new Error('Failed to refresh token');
  }

  const authData = await response.json();
  // Update tokens
  localStorage.setItem(TOKEN_STORAGE_KEY, authData.accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, authData.refreshToken);
  
  return authData;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem(TOKEN_STORAGE_KEY);
};

// Get the current access token
export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

// Reset password request
export const requestPasswordReset = async (email: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to request password reset');
  }
};

// Reset password with token
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to reset password');
  }
};