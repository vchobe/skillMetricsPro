import { API_BASE_URL } from './config';
import { getAccessToken } from './auth';

/**
 * Search API service
 */

// Generic search result interface
export interface SearchResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // page number
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Combined search response
export interface CombinedSearchResponse {
  users?: SearchResult<any>;
  skills?: SearchResult<any>;
  projects?: SearchResult<any>;
  clients?: SearchResult<any>;
}

// Search parameters
export interface SearchParams {
  query: string;
  scope?: 'users' | 'skills' | 'projects' | 'clients' | 'all';
  page?: number;
  size?: number;
  filters?: Record<string, string | string[]>;
}

// Global search across all entities
export const globalSearch = async (params: SearchParams): Promise<CombinedSearchResponse> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('query', params.query);
  
  if (params.scope && params.scope !== 'all') {
    queryParams.append('scope', params.scope);
  }
  
  if (params.page !== undefined) {
    queryParams.append('page', params.page.toString());
  }
  
  if (params.size !== undefined) {
    queryParams.append('size', params.size.toString());
  }
  
  // Add any custom filters
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, value);
      }
    });
  }

  const response = await fetch(`${API_BASE_URL}/search?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to perform search');
  }

  return response.json();
};

// Search users
export const searchUsersByKeyword = async (
  query: string,
  page: number = 0,
  size: number = 20,
  filters?: Record<string, string | string[]>
): Promise<SearchResult<any>> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('query', query);
  queryParams.append('page', page.toString());
  queryParams.append('size', size.toString());
  
  // Add any custom filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, value);
      }
    });
  }

  const response = await fetch(`${API_BASE_URL}/search/users?${queryParams.toString()}`, {
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

// Search skills
export const searchSkillsByKeyword = async (
  query: string,
  page: number = 0,
  size: number = 20,
  filters?: Record<string, string | string[]>
): Promise<SearchResult<any>> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('query', query);
  queryParams.append('page', page.toString());
  queryParams.append('size', size.toString());
  
  // Add any custom filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, value);
      }
    });
  }

  const response = await fetch(`${API_BASE_URL}/search/skills?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to search skills');
  }

  return response.json();
};

// Search projects
export const searchProjects = async (
  query: string,
  page: number = 0,
  size: number = 20,
  filters?: Record<string, string | string[]>
): Promise<SearchResult<any>> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('query', query);
  queryParams.append('page', page.toString());
  queryParams.append('size', size.toString());
  
  // Add any custom filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, value);
      }
    });
  }

  const response = await fetch(`${API_BASE_URL}/search/projects?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to search projects');
  }

  return response.json();
};

// Search clients
export const searchClients = async (
  query: string,
  page: number = 0,
  size: number = 20,
  filters?: Record<string, string | string[]>
): Promise<SearchResult<any>> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('query', query);
  queryParams.append('page', page.toString());
  queryParams.append('size', size.toString());
  
  // Add any custom filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, value);
      }
    });
  }

  const response = await fetch(`${API_BASE_URL}/search/clients?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to search clients');
  }

  return response.json();
};