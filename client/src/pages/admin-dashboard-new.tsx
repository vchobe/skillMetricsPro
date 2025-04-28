import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Icons
import {
  BarChart,
  Users,
  FileText,
  Database,
  Target,
  Settings,
  Layers,
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

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

  // Check if user is admin
  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-500 mt-2">
            You do not have permission to access the admin dashboard.
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
                <Database className="h-4 w-4" />
                <span>Skill Overview</span>
              </TabsTrigger>
              <TabsTrigger value="certifications" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Certifications</span>
              </TabsTrigger>
              <TabsTrigger value="skills-management" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Skills Management</span>
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
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard Overview</CardTitle>
                  <CardDescription>
                    Key metrics and system status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Dashboard content will appear here.</p>
                </CardContent>
              </Card>
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
                  <p>Project hierarchy visualization will appear here.</p>
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
                  <p>Skill hierarchy visualization will appear here.</p>
                </CardContent>
              </Card>
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
                  <p>Certification management content will appear here.</p>
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
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="skills" className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span>Skills</span>
                      </TabsTrigger>
                      <TabsTrigger value="targets" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span>Skill Targets</span>
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
                          <p>Skills management content will appear here.</p>
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
                          <p>Skill targets content will appear here.</p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
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
                  <p>User management content will appear here.</p>
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
                  <p>Reports configuration content will appear here.</p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}