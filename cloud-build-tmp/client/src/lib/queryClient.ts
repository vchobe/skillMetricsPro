import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get the API base URL - use relative URL for local development,
// or absolute URL for deployed environments
function getApiBaseUrl(): string {
  // For local development, use a relative path
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '';
  }
  
  // For deployed environments, use the current origin
  return window.location.origin;
}

// Function to construct a full API URL
function getFullApiUrl(path: string): string {
  // Make sure the path starts with a slash for consistency
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  
  // Join the base URL with the path
  return `${getApiBaseUrl()}${apiPath}`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get the full URL with proper base URL
  const fullUrl = getFullApiUrl(url);
  console.log(`Making API request: ${method} ${fullUrl}`);
  
  // Return the Response object directly instead of parsing JSON
  // This allows the calling function to decide whether to read the body as JSON
  // or handle empty responses (like 204 No Content from logout)
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

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
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
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
