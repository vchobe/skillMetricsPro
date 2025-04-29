import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export function ProtectedRoute({
  path,
  component: Component,
  adminOnly = false,
  approversAllowed = false
}: {
  path: string;
  component: () => React.JSX.Element;
  adminOnly?: boolean;
  approversAllowed?: boolean;
}) {
  const { user, isLoading } = useAuth();
  
  // Determine user admin status using consistent variable naming
  const userIsAdmin = user && (user.is_admin === true || user.isAdmin === true);
  
  // For non-admins on protected routes that allow approvers, check approver status
  const needsApproverCheck = !!user && adminOnly && approversAllowed && !userIsAdmin;
  
  // Always check for approver status if the user is authenticated and the route might need it
  // This ensures we have the approver status available when needed
  const { data: isUserApprover, isLoading: isLoadingApprover } = useQuery<boolean>({
    queryKey: ['/api/user/is-approver'],
    enabled: !!user && adminOnly && approversAllowed, // Always check for users on admin routes that allow approvers
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 3, // Retry up to 3 times if the query fails
  });

  // Show loading indicator while checking auth or approver status
  // For admin routes that allow approvers, always wait for approver status to load
  if (isLoading || (adminOnly && approversAllowed && isLoadingApprover)) {
    console.log("Showing loading state:", { isLoading, isLoadingApprover, adminOnly, approversAllowed });
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }
  
  // Determine access based on user role and route permissions
  let hasAccess = false;
  
  // Always log approver status for debugging
  console.log("Access check in ProtectedRoute:", { 
    userId: user.id,
    email: user.email,
    userIsAdmin,
    isUserApprover,
    adminOnly,
    approversAllowed,
    path
  });
  
  if (!adminOnly) {
    // Regular routes accessible to all authenticated users
    hasAccess = true;
  } else if (userIsAdmin) {
    // Admin routes accessible to admins
    hasAccess = true;
    console.log("Access granted: User is admin");
  } else if (approversAllowed && isUserApprover === true) {
    // Admin routes that allow approvers
    hasAccess = true;
    console.log("Access granted: User is approver");
  }
  
  if (!hasAccess) {
    console.log("Access denied: User is not authorized", { 
      userId: user.id,
      email: user.email,
      userIsAdmin,
      isUserApprover,
      adminOnly,
      approversAllowed
    });
    
    // If this is an admin page and approvers are allowed, check if approver status is undefined
    // This could happen if the query hasn't completed yet
    if (adminOnly && approversAllowed && isUserApprover === undefined) {
      console.log("Approver status is undefined, showing loading state");
      return (
        <Route path={path}>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        </Route>
      );
    }
    
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
