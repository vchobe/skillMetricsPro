import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { getQueryFn } from "../lib/queryClient";
import { formatDate, DATE_FORMATS } from "../lib/date-utils";

import Header from "../components/header";
import Sidebar from "../components/sidebar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  ChevronLeft,
  Building2,
  Calendar,
  MapPin,
  Clock,
  FileText,
  Users,
  Brain,
  Edit,
  Plus
} from "lucide-react";

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

type ProjectResource = {
  id: number;
  projectId: number;
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  assignedDate: string;
  removedDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type ProjectSkill = {
  id: number;
  projectId: number;
  skillId: number;
  skillName: string;
  skillCategory: string;
  requiredLevel: "beginner" | "intermediate" | "expert";
  notes: string;
  createdAt: string;
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.is_admin || user?.isAdmin;
  const projectId = parseInt(params.id);

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: getQueryFn({
      on401: "throw",
      url: `/api/projects/${projectId}`,
    }),
    enabled: !isNaN(projectId),
  });

  // Fetch project resources (team members)
  const { data: resources, isLoading: resourcesLoading } = useQuery<ProjectResource[]>({
    queryKey: ["project-resources", projectId],
    queryFn: getQueryFn({
      on401: "throw",
      url: `/api/projects/${projectId}/resources`,
    }),
    enabled: !isNaN(projectId),
  });

  // Fetch project skills
  const { data: skills, isLoading: skillsLoading } = useQuery<ProjectSkill[]>({
    queryKey: ["project-skills", projectId],
    queryFn: getQueryFn({
      on401: "throw",
      url: `/api/projects/${projectId}/skills`,
    }),
    enabled: !isNaN(projectId),
  });

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

  // Get skill level color
  const getSkillLevelColor = (level: string) => {
    switch(level) {
      case "beginner": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "intermediate": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "expert": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Loading state
  if (projectLoading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          currentPath="/projects" 
        />
        
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <Header 
            title="Project Details" 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSidebarOpen={isSidebarOpen} 
          />
          
          <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Project not found
  if (!project) {
    return (
      <div className="min-h-screen flex">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          currentPath="/projects" 
        />
        
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <Header 
            title="Project Details" 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSidebarOpen={isSidebarOpen} 
          />
          
          <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center p-12">
              <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The project you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => setLocation("/projects")}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active team members (not removed)
  const activeResources = resources?.filter(resource => !resource.removedDate) || [];
  
  // Past team members (removed)
  const pastResources = resources?.filter(resource => resource.removedDate) || [];

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        currentPath="/projects" 
      />
      
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header 
          title="Project Details" 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen} 
        />
        
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/projects")}
              className="mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Projects
            </Button>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <div className="flex items-center mt-1">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace("_", " ").charAt(0).toUpperCase() + project.status.replace("_", " ").slice(1)}
                  </Badge>
                  <span className="mx-2 text-gray-400">•</span>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Building2 className="h-4 w-4 mr-1" />
                    {project.clientName}
                  </div>
                </div>
              </div>
              
              {isAdmin && (
                <Button 
                  onClick={() => setLocation(`/project-management?edit=${project.id}`)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Project
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                      <p className="mt-1">{project.description || "No description provided"}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                          <span>{project.location || "Not specified"}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Client</h3>
                        <div className="flex items-center mt-1">
                          <Building2 className="h-4 w-4 text-gray-500 mr-1" />
                          <span>{project.clientName}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</h3>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                          <span>{project.startDate ? formatDate(project.startDate, DATE_FORMATS.DISPLAY) : "Not set"}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</h3>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                          <span>{project.endDate ? formatDate(project.endDate, DATE_FORMATS.DISPLAY) : "Not set"}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</h3>
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 text-gray-500 mr-1" />
                          <span>{formatDate(project.createdAt, DATE_FORMATS.DISPLAY)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</h3>
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 text-gray-500 mr-1" />
                          <span>{formatDate(project.updatedAt, DATE_FORMATS.DISPLAY)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {project.notes && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</h3>
                        <div className="flex items-start mt-1">
                          <FileText className="h-4 w-4 text-gray-500 mr-1 mt-1" />
                          <p className="flex-1">{project.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    Required Skills
                  </CardTitle>
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation(`/project-management?project=${project.id}&tab=skills`)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Skill
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {skillsLoading ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                    </div>
                  ) : !skills || skills.length === 0 ? (
                    <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                      <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No skills have been added to this project yet.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Skill</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Required Level</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {skills.map((skill) => (
                          <TableRow key={skill.id}>
                            <TableCell className="font-medium">{skill.skillName}</TableCell>
                            <TableCell>{skill.skillCategory}</TableCell>
                            <TableCell>
                              <Badge className={getSkillLevelColor(skill.requiredLevel)}>
                                {skill.requiredLevel.charAt(0).toUpperCase() + skill.requiredLevel.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{skill.notes || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Team Members
                  </CardTitle>
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation(`/project-management?project=${project.id}&tab=resources`)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Member
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="active">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="active" className="flex-1">
                        Active ({activeResources.length})
                      </TabsTrigger>
                      <TabsTrigger value="past" className="flex-1">
                        Past ({pastResources.length})
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="active">
                      {resourcesLoading ? (
                        <div className="flex justify-center p-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                        </div>
                      ) : activeResources.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No active team members</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activeResources.map((resource) => (
                            <div 
                              key={resource.id} 
                              className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                              onClick={() => setLocation(`/users/${resource.userId}`)}
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src="" alt={`${resource.firstName} ${resource.lastName}`} />
                                <AvatarFallback className="bg-indigo-600 text-white">
                                  {resource.firstName?.[0]}{resource.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-3 flex-1 min-w-0">
                                <p className="text-sm font-medium">{resource.firstName} {resource.lastName}</p>
                                <p className="text-xs text-gray-500 truncate">{resource.role || "Team Member"}</p>
                              </div>
                              <div className="text-xs text-gray-500">
                                Since {formatDate(resource.assignedDate, DATE_FORMATS.DISPLAY_SHORT)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="past">
                      {resourcesLoading ? (
                        <div className="flex justify-center p-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                        </div>
                      ) : pastResources.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No past team members</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {pastResources.map((resource) => (
                            <div 
                              key={resource.id} 
                              className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                              onClick={() => setLocation(`/users/${resource.userId}`)}
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src="" alt={`${resource.firstName} ${resource.lastName}`} />
                                <AvatarFallback className="bg-gray-400 text-white">
                                  {resource.firstName?.[0]}{resource.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-3 flex-1 min-w-0">
                                <p className="text-sm font-medium">{resource.firstName} {resource.lastName}</p>
                                <p className="text-xs text-gray-500 truncate">{resource.role || "Team Member"}</p>
                              </div>
                              <div className="text-xs text-gray-500">
                                {resource.removedDate && 
                                  `${formatDate(resource.assignedDate, DATE_FORMATS.DISPLAY_SHORT)} - ${formatDate(resource.removedDate, DATE_FORMATS.DISPLAY_SHORT)}`
                                }
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}