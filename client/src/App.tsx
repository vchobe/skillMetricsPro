import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import HomePage from "@/pages/home-page";
import SkillsPage from "@/pages/skills-page";
import SkillDetailPage from "@/pages/skill-detail-page";
import SkillHistoryPage from "@/pages/skill-history-page";
import AddSkillsPage from "@/pages/add-skills-page";
import ProfilePage from "@/pages/profile-page";
import UserProfilePage from "@/pages/user-profile-page";
import UsersPage from "@/pages/users-page";
import AdminDashboard from "@/pages/admin-dashboard";
import OrgDashboard from "@/pages/org-dashboard";
import LeaderboardPage from "@/pages/leaderboard-page";
import SkillManagementPage from "@/pages/skill-management-page";
import CategoryManagementPage from "@/pages/category-management";
import ProjectsPage from "@/pages/projects-page";
import ProjectDetailPage from "@/pages/project-detail-page";
import ClientsPage from "@/pages/clients-page";
import ClientDetailPage from "@/pages/client-detail-page";
import AuthPage from "@/pages/auth-page";
import ApiTestPage from "./pages/ApiTestPage";
import NotFound from "@/pages/not-found";

// This wrapper ensures admin components get fully remounted on user change but not on tab changes
const AdminWrapper = ({ Component }: { Component: React.ComponentType }) => {
  // Use a reference to sessionId from localStorage to force remount on user changes only
  const [sessionId, setSessionId] = useState<string>(() => localStorage.getItem("sessionId") || "initial");
  const { user } = useAuth(); // Use the useAuth hook to detect user changes
  
  // Determine user admin status
  const userIsAdmin = user?.is_admin === true || user?.isAdmin === true;
  
  // Always fetch approver status to ensure it's available with optimal settings
  const { data: isUserApprover = false, isLoading: isApproverLoading } = useQuery<boolean>({
    queryKey: ['/api/user/is-approver'],
    enabled: !!user, // Always check for authenticated users
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 3, // Retry up to 3 times if the query fails
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: true, // Always refetch when component mounts
  });
  
  // Set a specific tab for non-admin approvers
  useEffect(() => {
    if (user && !userIsAdmin && isUserApprover === true) {
      // Force the approvals tab for non-admin approvers
      const url = new URL(window.location.href);
      const currentTab = url.searchParams.get('tab');
      
      if (!currentTab || currentTab !== 'approvals') {
        url.searchParams.set('tab', 'approvals');
        window.history.replaceState({}, '', url.toString());
        console.log("AdminWrapper: Redirected approver to approvals tab");
      }
    }
  }, [user, userIsAdmin, isUserApprover]);
  
  // Add comprehensive logging
  console.log("AdminWrapper state:", { 
    userId: user?.id,
    email: user?.email,
    userIsAdmin, 
    isUserApprover,
    isApproverLoading
  });
  
  // Listen for storage events (login/logout)
  useEffect(() => {
    // Function to update session ID state
    const updateSessionId = () => {
      const newId = localStorage.getItem("sessionId") || "guest";
      setSessionId(newId);
    };

    // Listen for storage events (triggered in useAuth on login/logout)
    window.addEventListener('storage', updateSessionId);
    return () => window.removeEventListener('storage', updateSessionId);
  }, []);
  
  // Also listen for direct user changes from useAuth
  useEffect(() => {
    if (user) {
      const newId = localStorage.getItem("sessionId") || String(user.id) || "authenticated";
      setSessionId(newId);
    } else {
      setSessionId("guest");
    }
  }, [user]);
  
  // Determine the user role based on admin status and approver permissions
  const userRole = userIsAdmin ? "admin" : (isUserApprover ? "approver" : "regular");
  
  // Logging for debugging
  console.log("User in AdminWrapper:", user);
  console.log("User role:", userRole);
  
  return <Component key={`${sessionId}-${userRole}`} />;
};

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/skills" component={SkillsPage} />
      <ProtectedRoute path="/skills/add" component={AddSkillsPage} />
      <ProtectedRoute path="/skills/:id" component={SkillDetailPage} />
      <ProtectedRoute path="/history" component={SkillHistoryPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/users/:userId" component={UserProfilePage} />
      <ProtectedRoute path="/organization" component={OrgDashboard} />
      <ProtectedRoute path="/leaderboard" component={LeaderboardPage} />
      <ProtectedRoute path="/projects/:id" component={ProjectDetailPage} />
      <ProtectedRoute path="/projects" component={ProjectsPage} />
      <ProtectedRoute path="/clients/:id" component={ClientDetailPage} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute 
        path="/admin/skills" 
        component={() => <AdminWrapper Component={SkillManagementPage} />} 
        adminOnly={true} 
      />
      <ProtectedRoute 
        path="/admin/categories" 
        component={() => <AdminWrapper Component={CategoryManagementPage} />} 
        adminOnly={true} 
      />
      <ProtectedRoute 
        path="/category-management" 
        component={() => <AdminWrapper Component={CategoryManagementPage} />} 
        adminOnly={true} 
      />
      <ProtectedRoute 
        path="/admin/:tab?" 
        component={() => <AdminWrapper Component={AdminDashboard} />} 
        adminOnly={true}
        approversAllowed={true}
      />
      <Route path="/auth" component={AuthPage} />
      <Route path="/api-test" component={ApiTestPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
