import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { getQueryFn } from "../lib/queryClient";
import { formatDate, DATE_FORMATS } from "../lib/date-utils";

import Header from "../components/header";
import Sidebar from "../components/sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Briefcase, Search, Calendar, Building2, MapPin, UserCircle, Plus } from "lucide-react";

type Project = {
  id: number;
  name: string;
  description: string;
  clientId: number;
  clientName: string;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  startDate: string | null;
  endDate: string | null;
  location: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export default function ProjectsPage() {
  const [, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.is_admin || user?.isAdmin;

  // Fetch projects based on user role
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["projects", isAdmin ? "all" : "user"],
    queryFn: getQueryFn({
      on401: "throw",
      url: isAdmin ? "/api/projects" : `/api/users/${user?.id}/projects`,
    }),
  });

  // Filter projects by search query and status
  const filteredProjects = projects?.filter((project) => {
    const matchesSearch = searchQuery === "" || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === null || project.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Get status counts for tabs
  const statusCounts = projects?.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case "planning": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "on_hold": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "completed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        currentPath="/projects" 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Projects" 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="search"
                placeholder="Search projects, clients, locations..."
                className="w-full bg-white dark:bg-gray-800 pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {isAdmin && (
              <Button 
                onClick={() => setLocation("/project-management")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            )}
          </div>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger 
                value="all" 
                onClick={() => setSelectedStatus(null)}
                className="flex items-center gap-2"
              >
                All
                <Badge variant="outline" className="ml-1">
                  {projects?.length || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="active" 
                onClick={() => setSelectedStatus("active")}
                className="flex items-center gap-2"
              >
                Active
                <Badge variant="outline" className="ml-1">
                  {statusCounts.active || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="planning" 
                onClick={() => setSelectedStatus("planning")}
                className="flex items-center gap-2"
              >
                Planning
                <Badge variant="outline" className="ml-1">
                  {statusCounts.planning || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                onClick={() => setSelectedStatus("completed")}
                className="flex items-center gap-2"
              >
                Completed
                <Badge variant="outline" className="ml-1">
                  {statusCounts.completed || 0}
                </Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center p-12 border rounded-lg bg-white dark:bg-gray-800">
                  <Briefcase className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium">No projects found</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {searchQuery ? "Try a different search term" : "No projects are currently assigned to you"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map((project) => (
                    <Card 
                      key={project.id} 
                      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setLocation(`/projects/${project.id}`)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg font-bold truncate">{project.name}</CardTitle>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status.replace("_", " ").charAt(0).toUpperCase() + project.status.replace("_", " ").slice(1)}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <Building2 className="h-3.5 w-3.5" />
                          {project.clientName}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        <p className="text-sm line-clamp-2 text-gray-600 dark:text-gray-300 mb-4">
                          {project.description || "No description provided"}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          {project.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-gray-500" />
                              <span className="truncate">{project.location}</span>
                            </div>
                          )}
                          
                          {project.startDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-gray-500" />
                              <span>{formatDate(project.startDate, DATE_FORMATS.DISPLAY_SHORT)}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="pt-2 border-t">
                        <Button variant="ghost" size="sm" className="text-xs w-full">
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="active" className="mt-0">
              {/* Content shown when Active tab is selected - handled by filter state */}
            </TabsContent>
            
            <TabsContent value="planning" className="mt-0">
              {/* Content shown when Planning tab is selected - handled by filter state */}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-0">
              {/* Content shown when Completed tab is selected - handled by filter state */}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}