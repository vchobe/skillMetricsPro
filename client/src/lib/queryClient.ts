import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { API_BASE_URL, REFRESH_ERROR_CODES, LOGOUT_ERROR_CODES } from "../api/config";

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

// Handle authentication errors
async function handleAuthError(status: number): Promise<boolean> {
  // If it's an authorization error, redirect to login
  if (REFRESH_ERROR_CODES.includes(status) || LOGOUT_ERROR_CODES.includes(status)) {
    console.log("Authentication error detected, redirecting to /auth");
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
  console.log(`Making API request: ${method} ${fullUrl}`, data);
  
  // Set up headers - we don't need Authorization header since we're using cookies
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  // Make the request with CORS support
  let res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    mode: "cors"
  });

  // Handle auth errors
  if (!res.ok && (REFRESH_ERROR_CODES.includes(res.status) || LOGOUT_ERROR_CODES.includes(res.status))) {
    await handleAuthError(res.status);
  }

  try {
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API request failed for ${method} ${fullUrl}:`, error);
    throw error;
  }
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
    
    // Set up headers - don't need Authorization since we're using cookie-based sessions
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    
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
    
    // Handle auth errors
    if (!res.ok && (REFRESH_ERROR_CODES.includes(res.status) || LOGOUT_ERROR_CODES.includes(res.status))) {
      await handleAuthError(res.status);
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
