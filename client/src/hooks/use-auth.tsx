import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User, InsertUser, loginUserSchema, LoginUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: Omit<User, 'password'> | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<User, 'password'>, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<User, 'password'>, Error, InsertUser>;
  resetPasswordMutation: UseMutationResult<void, Error, { email: string }>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<Omit<User, 'password'> | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const res = await apiRequest("POST", "/api/auth", credentials);
      // For login, we expect a JSON response with user data
      if (res.status === 204) {
        // Handle empty success response (unlikely for login)
        return {} as Omit<User, 'password'>;
      }
      return await res.json();
    },
    onSuccess: (user: Omit<User, 'password'>) => {
      // Set the user data in query cache
      queryClient.setQueryData(["/api/user"], user);
      
      // Update session ID to force remounting admin components
      const newSessionId = Date.now().toString();
      localStorage.setItem("sessionId", newSessionId);
      
      // Trigger a storage event so other components can detect the change
      window.dispatchEvent(new Event('storage'));
      
      // Invalidate notifications and other user-specific queries
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      
      toast({
        title: "Login successful",
        description: "You have been successfully logged in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", userData);
      if (res.status === 204) {
        // Handle empty success response
        return { message: "Registration successful" };
      }
      return await res.json();
    },
    onSuccess: (response) => {
      // Don't set user data, since user shouldn't be logged in automatically
      // Instead, just show a toast with the success message from the server
      toast({
        title: "Registration successful",
        description: "Please check your email for login credentials and then sign in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear the user data
      queryClient.setQueryData(["/api/user"], null);
      
      // Reset the entire query cache to ensure no stale data persists between sessions
      queryClient.resetQueries();
      queryClient.clear();
      
      // Clear session ID to signal user change to components
      localStorage.removeItem("sessionId");
      
      // Trigger storage event to notify components of the change
      window.dispatchEvent(new Event('storage'));
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const res = await apiRequest("POST", "/api/reset-password", { email });
      // No need to return data for reset password
      return;
    },
    onSuccess: () => {
      toast({
        title: "Password reset request sent",
        description: "If your email exists in our system, you will receive reset instructions.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        resetPasswordMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
