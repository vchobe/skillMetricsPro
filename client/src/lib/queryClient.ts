import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { API_BASE_URL, TOKEN_STORAGE_KEY, REFRESH_ERROR_CODES, LOGOUT_ERROR_CODES } from "../api/config";
import { refreshToken } from "../api/auth";

// Function to construct a full API URL
function getFullApiUrl(path: string): string {
  // Strip the /api prefix if it exists, since it's already in API_BASE_URL
  const cleanPath = path.startsWith('/api') ? path.substring(4) : path;
  
  // Make sure the path starts with a slash for consistency
  const apiPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  
  // Join the base URL with the path
  return `${API_BASE_URL}${apiPath}`;
}

// Parse error response from the backend
async function parseErrorResponse(res: Response): Promise<string> {
  try {
    const contentType = res.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      const errorJson = await res.json();
      return errorJson.message || errorJson.error || res.statusText;
    } else {
      const text = await res.text();
      return text || res.statusText;
    }
  } catch (e) {
    return res.statusText;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const errorMessage = await parseErrorResponse(res);
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

// Get the authentication token
function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

// Handle authentication errors with token refresh
async function handleAuthError(status: number): Promise<boolean> {
  // If it's a token refresh error, try refreshing the token
  if (REFRESH_ERROR_CODES.includes(status)) {
    try {
      await refreshToken();
      return true; // Retry the request with the new token
    } catch (error) {
      // If refresh fails, redirect to login
      window.location.href = '/auth';
      return false;
    }
  } else if (LOGOUT_ERROR_CODES.includes(status)) {
    // If it's a forbidden error, redirect to login
    window.location.href = '/auth';
    return false;
  }
  return false;
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get the full URL with proper base URL
  const fullUrl = getFullApiUrl(url);
  console.log(`Making API request: ${method} ${fullUrl}`);
  
  // Set up headers with auth token if available
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Make the request with CORS support
  let res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    mode: "cors"
  });

  // Handle auth errors and retry if necessary
  if (!res.ok && (REFRESH_ERROR_CODES.includes(res.status) || LOGOUT_ERROR_CODES.includes(res.status))) {
    const shouldRetry = await handleAuthError(res.status);
    
    if (shouldRetry) {
      // Update the token and retry the request
      const newToken = getAuthToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      
      res = await fetch(fullUrl, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
        mode: "cors"
      });
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Convert the queryKey to a full URL
    const fullUrl = getFullApiUrl(queryKey[0] as string);
    console.log(`Fetching data from: ${fullUrl}`);
    
    // Set up headers with auth token if available
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Make the initial request with CORS support
    let res = await fetch(fullUrl, {
      headers,
      credentials: "include",
      mode: "cors"
    });

    // Handle auth errors with special unauthorized behavior
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }
    
    // Try to refresh token if needed
    if (!res.ok && (REFRESH_ERROR_CODES.includes(res.status) || LOGOUT_ERROR_CODES.includes(res.status))) {
      const shouldRetry = await handleAuthError(res.status);
      
      if (shouldRetry) {
        // Update the token and retry the request
        const newToken = getAuthToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        
        res = await fetch(fullUrl, {
          headers,
          credentials: "include",
          mode: "cors"
        });
      }
    }

    await throwIfResNotOk(res);
    
    // Handle 204 No Content responses
    if (res.status === 204) {
      return {} as any; // Return empty object for success with no content
    }
    
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
