import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Icons
import {
  BarChart,
  Users,
  FileText,
  Database,
  Settings,
  Layers,
  Target,
  BrainCircuit,
  ChevronRight,
  Loader2,
  FileCheck,
  AlertCircle,
  SquareStack,
  Hexagon,
  FileCog,
  UserCheck
} from "lucide-react";

// Use a simplified version of the hierarchical data models
interface DashboardStats {
  totalUsers: number;
  totalSkills: number;
  totalCertifications: number;
  updatesThisMonth: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSkills: 0,
    totalCertifications: 0,
    updatesThisMonth: 0
  });

  // Queries
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"]
  });

  const { data: skills, isLoading: isLoadingSkills } = useQuery({
    queryKey: ["/api/all-skills"]
  });

  const { data: skillHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["/api/org/skills/history"]
  });

  // Update stats when data is loaded
  useEffect(() => {
    if (users && skills && skillHistory) {
      // Calculate updates from this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Safely handle array operations with type checking
      const usersArray = Array.isArray(users) ? users : [];
      const skillsArray = Array.isArray(skills) ? skills : [];
      const historyArray = Array.isArray(skillHistory) ? skillHistory : [];
      
      const updatesThisMonth = historyArray.filter(
        (history: any) => new Date(history.date) >= startOfMonth
      ).length;

      setDashboardStats({
        totalUsers: usersArray.length,
        totalSkills: skillsArray.length,
        totalCertifications: skillsArray.filter((skill: any) => skill.certification).length,
        updatesThisMonth
      });
    }
  }, [users, skills, skillHistory]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-500 mt-2">
            You must be logged in to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Check if user is admin - using both possible properties for backward compatibility
  const isAdmin = user.is_admin === true || user.isAdmin === true || user.role === "admin";
  
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-500 mt-2">
            You do not have permission to access the admin dashboard.
          </p>
          <p className="text-gray-500 mt-2">
            User: {user.email} (Admin status: {String(isAdmin)})
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Manage users, skills, and system settings
          </p>
        </header>

        <Tabs 
          defaultValue="dashboard" 
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="border-b mb-4">
            <TabsList className="flex space-x-2 pb-2">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="project-overview" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <span>Project Overview</span>
              </TabsTrigger>
              <TabsTrigger value="skill-overview" className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4" />
                <span>Skill Overview</span>
              </TabsTrigger>
              <TabsTrigger value="skills-management" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Skills Management</span>
              </TabsTrigger>
              <TabsTrigger value="certifications" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                <span>Certifications</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Reports</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5,
                delay: 0.1,
                ease: "easeOut"
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Stats Cards */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-blue-500 mr-2" />
                      <div className="text-2xl font-bold">
                        {isLoadingUsers ? <Loader2 className="animate-spin h-5 w-5" /> : dashboardStats.totalUsers}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Database className="h-5 w-5 text-green-500 mr-2" />
                      <div className="text-2xl font-bold">
                        {isLoadingSkills ? <Loader2 className="animate-spin h-5 w-5" /> : dashboardStats.totalSkills}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Certifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <FileCheck className="h-5 w-5 text-purple-500 mr-2" />
                      <div className="text-2xl font-bold">
                        {isLoadingSkills ? <Loader2 className="animate-spin h-5 w-5" /> : dashboardStats.totalCertifications}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Updates (This Month)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <BarChart className="h-5 w-5 text-orange-500 mr-2" />
                      <div className="text-2xl font-bold">
                        {isLoadingHistory ? <Loader2 className="animate-spin h-5 w-5" /> : dashboardStats.updatesThisMonth}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest skill updates and additions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingHistory ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : skillHistory && Array.isArray(skillHistory) && skillHistory.length > 0 ? (
                      <div className="space-y-4">
                        {(Array.isArray(skillHistory) ? skillHistory : []).slice(0, 5).map((history: any) => (
                          <div key={history.id || Math.random()} className="flex items-start space-x-4 border-b pb-4">
                            <div className="bg-blue-100 rounded-full p-2">
                              <UserCheck className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{history.action || "Updated"} {history.skillName || "skill"}</div>
                              <div className="text-sm text-gray-500">
                                {history.date ? new Date(history.date).toLocaleDateString() : "N/A"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No recent activity found
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="flex justify-start items-center"
                        onClick={() => setActiveTab("users")}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Manage Users
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="flex justify-start items-center"
                        onClick={() => setActiveTab("skills-management")}
                      >
                        <Database className="mr-2 h-4 w-4" />
                        Manage Skills
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="flex justify-start items-center"
                        onClick={() => setActiveTab("reports")}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Configure Reports
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="flex justify-start items-center"
                        onClick={() => setLocation("/admin/categories")}
                      >
                        <FileCog className="mr-2 h-4 w-4" />
                        Manage Categories
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          {/* Project Overview Tab */}
          <TabsContent value="project-overview">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5,
                delay: 0.1,
                ease: "easeOut"
              }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Project Hierarchy</CardTitle>
                  <CardDescription>
                    Overview of clients, projects, resources and skills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Project Hierarchy</AlertTitle>
                    <AlertDescription>
                      This section displays the hierarchical view of all projects. 
                      The original functionality will be restored soon.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Skill Overview Tab */}
          <TabsContent value="skill-overview">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5,
                delay: 0.1,
                ease: "easeOut"
              }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Skill Hierarchy</CardTitle>
                  <CardDescription>
                    Overview of skill categories, subcategories, and users with skills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Skill Hierarchy</AlertTitle>
                    <AlertDescription>
                      This section displays the hierarchical view of all skills. 
                      The original functionality will be restored soon.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* Skills Management Tab */}
          <TabsContent value="skills-management">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5,
                delay: 0.1,
                ease: "easeOut"
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-12">
                  <Tabs defaultValue="skills" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="skills" className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span>Skills</span>
                      </TabsTrigger>
                      <TabsTrigger value="targets" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span>Skill Targets</span>
                      </TabsTrigger>
                      <TabsTrigger value="approvals" className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4" />
                        <span>Skill Approvals</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="skills" className="mt-6">
                      <Card className="mb-6">
                        <CardHeader>
                          <CardTitle className="text-2xl font-bold">Skills</CardTitle>
                          <CardDescription>
                            Create and manage skills for the organization
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Alert className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Skills Management</AlertTitle>
                            <AlertDescription>
                              This section contains the skills management interface. 
                              The original functionality will be restored soon.
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="targets" className="mt-6">
                      <Card className="mb-6">
                        <CardHeader>
                          <CardTitle className="text-2xl font-bold">Skill Targets</CardTitle>
                          <CardDescription>
                            Create and manage organizational skill targets
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Alert className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Skill Targets</AlertTitle>
                            <AlertDescription>
                              This section contains the skill targets management interface. 
                              The original functionality will be restored soon.
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="approvals" className="mt-6">
                      <Card className="mb-6">
                        <CardHeader>
                          <CardTitle className="text-2xl font-bold">Skill Approvals</CardTitle>
                          <CardDescription>
                            Review and manage pending skill update requests
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Alert className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Skill Approvals</AlertTitle>
                            <AlertDescription>
                              This section contains the skill approvals interface. 
                              The original functionality will be restored soon.
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5,
                delay: 0.1,
                ease: "easeOut"
              }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Certifications</CardTitle>
                  <CardDescription>
                    Manage user certifications and credentials
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Certifications</AlertTitle>
                    <AlertDescription>
                      This section contains the certifications management interface. 
                      The original functionality will be restored soon.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5,
                delay: 0.1,
                ease: "easeOut"
              }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>User Management</AlertTitle>
                    <AlertDescription>
                      This section contains the user management interface. 
                      The original functionality will be restored soon.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* Reports Tab */}
          <TabsContent value="reports">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5,
                delay: 0.1,
                ease: "easeOut"
              }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Reports</CardTitle>
                  <CardDescription>
                    Configure automated reports and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Report Settings</AlertTitle>
                    <AlertDescription>
                      This section contains the report configuration interface. 
                      The original functionality will be restored soon.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}