import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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
import ProjectsPage from "@/pages/projects-page";
import ProjectDetailPage from "@/pages/project-detail-page";
import ClientsPage from "@/pages/clients-page";
import ClientDetailPage from "@/pages/client-detail-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

// This wrapper ensures admin components get fully remounted on user change but not on tab changes
const AdminWrapper = ({ Component }: { Component: React.ComponentType }) => {
  // Use a reference to sessionId from localStorage to force remount on user changes only
  const [sessionId, setSessionId] = useState<string>(() => localStorage.getItem("sessionId") || "initial");
  const { user } = useAuth(); // Use the useAuth hook to detect user changes
  
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
  
  // Use both sessionId and admin status as the key to ensure proper remounting
  // Check both is_admin and isAdmin properties as backend might use either
  const isAdmin = user?.is_admin === true || user?.isAdmin === true;
  const adminStatus = isAdmin ? "admin" : "regular";
  
  // Logging for debugging
  console.log("User in AdminWrapper:", user);
  console.log("Admin status:", adminStatus);
  
  return <Component key={`${sessionId}-${adminStatus}`} />;
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
        path="/admin/:tab?" 
        component={() => <AdminWrapper Component={AdminDashboard} />} 
        adminOnly={true} 
      />
      <Route path="/auth" component={AuthPage} />
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
