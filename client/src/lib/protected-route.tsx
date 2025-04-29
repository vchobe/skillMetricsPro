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
  
  // Use React Query for proper caching and loading state management
  const { data: isUserApprover, isLoading: isLoadingApprover } = useQuery<boolean>({
    queryKey: ['/api/user/is-approver'],
    enabled: needsApproverCheck, // Only check for non-admin users on protected routes that allow approvers
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 3, // Retry up to 3 times if the query fails
  });

  // Show loading indicator while checking auth or approver status (only when needed)
  if (isLoading || (needsApproverCheck && isLoadingApprover)) {
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
  
  if (!adminOnly) {
    // Regular routes accessible to all authenticated users
    hasAccess = true;
  } else if (userIsAdmin) {
    // Admin routes accessible to admins
    hasAccess = true;
  } else if (approversAllowed && isUserApprover === true) {
    // Admin routes that allow approvers
    hasAccess = true;
  }
  
  if (!hasAccess) {
    console.log("Access denied: User is not authorized", { 
      userId: user.id,
      userIsAdmin,
      isUserApprover,
      approversAllowed
    });
    
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
