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
  
  // Use React Query for proper caching and loading state management
  const { data: isApprover, isLoading: isLoadingApprover } = useQuery<boolean>({
    queryKey: ['/api/user/is-approver'],
    enabled: !!user && adminOnly && approversAllowed && !(user.is_admin === true || user.isAdmin === true), // Only check for non-admin users on protected routes
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Show loading indicator while checking auth or approver status (only when needed)
  const needsApproverCheck = approversAllowed && adminOnly && !!user && !(user.is_admin === true || user.isAdmin === true);
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
  
  // Check both is_admin and isAdmin properties for admin access
  const isAdmin = user.is_admin === true || user.isAdmin === true;
  
  // Allow access if:
  // - user is admin, or
  // - route allows approvers and user is an approver (check needs to handle undefined case)
  // - for approvers, we only need to check if route allows them and we know they're an approver from the API
  const hasAccess = isAdmin || (approversAllowed && isApprover === true);
  
  // For admins, we know they have access to all admin routes
  // For approvers, if we're still loading data, we'll handle it below
  // If user is neither admin nor approver, they don't have access
  
  if (adminOnly && !hasAccess) {
    console.log("Access denied: User is not authorized", { 
      user,
      isAdmin,
      isApprover,
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
