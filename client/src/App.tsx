import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import HomePage from "@/pages/home-page";
import SkillsPage from "@/pages/skills-page";
import SkillDetailPage from "@/pages/skill-detail-page";
import SkillHistoryPage from "@/pages/skill-history-page";
import ProfilePage from "@/pages/profile-page";
import UserProfilePage from "@/pages/user-profile-page";
import UsersPage from "@/pages/users-page";
import AdminDashboard from "@/pages/admin-dashboard";
import OrgDashboard from "@/pages/org-dashboard";
import LeaderboardPage from "@/pages/leaderboard-page";
import SkillManagementPage from "@/pages/skill-management-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

// This wrapper ensures admin components get fully remounted on user change but not on tab changes
const AdminWrapper = ({ Component }: { Component: React.ComponentType }) => {
  // Get current user session ID from localStorage to force remount on user changes only
  const [userId, setUserId] = useState<string>("");
  const { user } = useAuth(); // Use the useAuth hook to detect user changes
  
  useEffect(() => {
    // Update user ID whenever the authenticated user changes
    if (user) {
      const currentUserId = String(user.id) || user.email || "authenticated";
      setUserId(currentUserId);
    } else {
      setUserId("guest");
    }
  }, [user]); // This dependency array ensures the effect runs when the user changes
  
  // Use both userId and admin status as key to remount on user/role changes
  const adminStatus = user?.is_admin ? "admin" : "regular";
  return <Component key={`${userId}-${adminStatus}`} />;
};

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/skills" component={SkillsPage} />
      <ProtectedRoute path="/skills/:id" component={SkillDetailPage} />
      <ProtectedRoute path="/history" component={SkillHistoryPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/users/:userId" component={UserProfilePage} />
      <ProtectedRoute path="/organization" component={OrgDashboard} />
      <ProtectedRoute path="/leaderboard" component={LeaderboardPage} />
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
