import { API_BASE_URL } from './config';
import { getAccessToken } from './auth';

/**
 * API utilities for working with the backend
 */

// Standard Spring Data pagination response
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // page number
  first: boolean;
  last: boolean;
  empty: boolean;
  pageable: {
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  numberOfElements: number;
}

// API error response
export interface ApiErrorResponse {
  status: number;
  timestamp: string;
  message: string;
  error?: string;
  path?: string;
  details?: Record<string, any>;
}

// Base API request parameters
export interface ApiRequestParams {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  queryParams?: Record<string, string | string[] | number | boolean | null | undefined>;
  headers?: Record<string, string>;
}

// Convert parameters to query string
export function buildQueryString(params: Record<string, string | string[] | number | boolean | null | undefined>): string {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    
    if (Array.isArray(value)) {
      value.forEach(v => {
        if (v !== undefined && v !== null) {
          queryParams.append(key, v.toString());
        }
      });
    } else {
      queryParams.append(key, value.toString());
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

// Generic API request function with authentication and error handling
export async function apiRequest<T>({
  path,
  method = 'GET',
  body,
  queryParams,
  headers = {}
}: ApiRequestParams): Promise<T> {
  try {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Build URL with query parameters
    const queryString = queryParams ? buildQueryString(queryParams) : '';
    const url = `${API_BASE_URL}${path}${queryString}`;
    
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
    
    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }
    
    // Parse response based on content type
    const contentType = response.headers.get('Content-Type') || '';
    
    if (!response.ok) {
      if (contentType.includes('application/json')) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      } else {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
      }
    }
    
    // Return the data for successful responses
    if (contentType.includes('application/json')) {
      return await response.json() as T;
    } else {
      // For non-JSON responses, return response object
      return response as any;
    }
  } catch (error) {
    // Log the error
    console.error('API request error:', error);
    throw error;
  }
}

// Helper to convert a PageResponse to a simpler format
export function simplifyPageResponse<T, R>(
  pageResponse: PageResponse<T>,
  mapFn?: (item: T) => R
): {
  items: R[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
} {
  const items = mapFn 
    ? pageResponse.content.map(mapFn)
    : pageResponse.content as unknown as R[];
    
  return {
    items,
    totalItems: pageResponse.totalElements,
    totalPages: pageResponse.totalPages,
    currentPage: pageResponse.number,
    hasMore: !pageResponse.last,
  };
}

// Helper to extract error message from API responses
export function extractErrorMessage(error: any): string {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else if (typeof error === 'object' && error !== null) {
    return error.message || error.error || JSON.stringify(error);
  } else {
    return 'An unknown error occurred';
  }
}