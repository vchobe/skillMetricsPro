import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";

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
  const [isApprover, setIsApprover] = useState<boolean | null>(null);
  const [checkingApprover, setCheckingApprover] = useState<boolean>(false);
  
  // Check if user is an approver when needed
  useEffect(() => {
    if (!user || !approversAllowed || checkingApprover) return;
    
    async function checkApproverStatus() {
      try {
        setCheckingApprover(true);
        const response = await fetch('/api/user/is-approver');
        if (response.ok) {
          const approverStatus = await response.json();
          setIsApprover(!!approverStatus); // Convert to boolean
        } else {
          setIsApprover(false);
        }
      } catch (error) {
        console.error("Error checking approver status:", error);
        setIsApprover(false);
      } finally {
        setCheckingApprover(false);
      }
    }
    
    checkApproverStatus();
  }, [user, approversAllowed, checkingApprover]);

  if (isLoading || (approversAllowed && isApprover === null && !checkingApprover)) {
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
  // - route allows approvers and user is an approver
  const hasAccess = isAdmin || (approversAllowed && isApprover === true);
  
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
