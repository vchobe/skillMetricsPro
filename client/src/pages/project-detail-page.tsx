import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { getQueryFn } from "../lib/queryClient";
import { formatDate, DATE_FORMATS } from "../lib/date-utils";

import Header from "../components/header";
import Sidebar from "../components/sidebar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  ChevronLeft,
  Building2,
  CalendarDays,
  Clock,
  CircleCheck,
  CircleAlert,
  MapPin,
  Edit,
  Users,
  Lightbulb,
  Award,
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
  
  // Calculate project dates info
  const getProjectDates = () => {
    if (!project) return { duration: 'N/A', status: 'Unknown' };
    
    if (!project.startDate && !project.endDate) {
      return { duration: 'Not set', status: 'No dates defined' };
    }
    
    if (project.startDate && !project.endDate) {
      return { duration: 'Ongoing', status: 'Started' };
    }
    
    if (project.startDate && project.endDate) {
      const start = new Date(project.startDate);
      const end = new Date(project.endDate);
      const durationMs = end.getTime() - start.getTime();
      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
      
      const today = new Date();
      
      if (today > end) {
        return { duration: `${durationDays} days`, status: 'Completed' };
      } else if (today < start) {
        return { duration: `${durationDays} days`, status: 'Scheduled' };
      } else {
        const remainingMs = end.getTime() - today.getTime();
        const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
        return { 
          duration: `${durationDays} days`, 
          status: `In progress (${remainingDays} days remaining)` 
        };
      }
    }
    
    return { duration: 'N/A', status: 'Unknown' };
  };
  
  // Get skill level badge color
  const getSkillLevelColor = (level: string) => {
    switch(level) {
      case "beginner": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "intermediate": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "expert": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };
  
  // Loading state
  if (projectLoading) {
    return (
      <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
        <Sidebar currentPath="/projects" />
        
        <div className="flex-1 ml-64 flex flex-col overflow-hidden">
          <Header 
            title="Project Details" 
            toggleSidebar={() => {}} 
            isSidebarOpen={false} 
          />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  // Project not found
  if (!project) {
    return (
      <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
        <Sidebar currentPath="/projects" />
        
        <div className="flex-1 ml-64 flex flex-col overflow-hidden">
          <Header 
            title="Project Details" 
            toggleSidebar={() => {}} 
            isSidebarOpen={false} 
          />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
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
          </main>
        </div>
      </div>
    );
  }

  const projectDates = getProjectDates();
  const activeResourceCount = resources?.filter(r => !r.removedDate).length || 0;

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      <Sidebar currentPath="/projects" />
      
      <div className="flex-1 ml-64 flex flex-col overflow-hidden">
        <Header 
          title="Project Details" 
          toggleSidebar={() => {}} 
          isSidebarOpen={false} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
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
                <div className="flex items-center mt-2">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace("_", " ").charAt(0).toUpperCase() + project.status.replace("_", " ").slice(1)}
                  </Badge>
                  {project.clientName && (
                    <span className="ml-3 text-gray-600 dark:text-gray-400 flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      <Link href={`/clients/${project.clientId}`} className="hover:underline">
                        {project.clientName}
                      </Link>
                    </span>
                  )}
                </div>
              </div>
              
              <Button 
                onClick={() => setLocation(`/project-management?tab=projects&edit=${project.id}`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Project
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Project Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.description && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                        <p className="mt-1">{project.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Status</h3>
                        <div className="flex items-center mt-1">
                          {project.status === "active" || project.status === "completed" ? (
                            <CircleCheck className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <CircleAlert className="h-4 w-4 text-yellow-500 mr-1" />
                          )}
                          <span className="capitalize">{project.status.replace("_", " ")}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Timeline</h3>
                        <div className="flex items-center mt-1">
                          <CalendarDays className="h-4 w-4 text-gray-500 mr-1" />
                          <span>{projectDates.status} ({projectDates.duration})</span>
                        </div>
                      </div>
                      
                      {project.location && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
                          <div className="flex items-center mt-1">
                            <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                            <span>{project.location}</span>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created On</h3>
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 text-gray-500 mr-1" />
                          <span>{formatDate(project.createdAt, DATE_FORMATS.DISPLAY)}</span>
                        </div>
                      </div>
                      
                      {project.startDate && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</h3>
                          <div className="flex items-center mt-1">
                            <CalendarDays className="h-4 w-4 text-gray-500 mr-1" />
                            <span>{formatDate(project.startDate, DATE_FORMATS.DISPLAY)}</span>
                          </div>
                        </div>
                      )}
                      
                      {project.endDate && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</h3>
                          <div className="flex items-center mt-1">
                            <CalendarDays className="h-4 w-4 text-gray-500 mr-1" />
                            <span>{formatDate(project.endDate, DATE_FORMATS.DISPLAY)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {project.notes && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</h3>
                        <p className="mt-1 text-sm">{project.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Tabs defaultValue="team" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="team" className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Team Members
                  </TabsTrigger>
                  <TabsTrigger value="skills" className="flex items-center gap-1">
                    <Lightbulb className="h-4 w-4" />
                    Required Skills
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="team">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Project Team ({activeResourceCount})
                      </CardTitle>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setLocation(`/project-management?tab=resources&project=${project.id}`)}
                      >
                        Add Team Member
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {resourcesLoading ? (
                        <div className="flex justify-center p-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                        </div>
                      ) : !resources || resources.length === 0 ? (
                        <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No team members assigned to this project yet.</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[25%]">Name</TableHead>
                              <TableHead className="w-[20%]">Role</TableHead>
                              <TableHead className="w-[20%]">Assigned Date</TableHead>
                              <TableHead className="w-[20%]">Removed Date</TableHead>
                              <TableHead className="w-[15%]">Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {resources.map((resource) => (
                              <TableRow 
                                key={resource.id}
                                className={resource.removedDate ? "opacity-60" : ""}
                              >
                                <TableCell className="font-medium">
                                  <Link 
                                    href={`/users/${resource.userId}`} 
                                    className="hover:underline flex items-center"
                                  >
                                    {resource.firstName} {resource.lastName}
                                    <span className="text-xs text-gray-500 ml-1">({resource.username})</span>
                                  </Link>
                                </TableCell>
                                <TableCell>{resource.role || "Not specified"}</TableCell>
                                <TableCell>{formatDate(resource.assignedDate, DATE_FORMATS.DISPLAY_SHORT)}</TableCell>
                                <TableCell>
                                  {resource.removedDate 
                                    ? formatDate(resource.removedDate, DATE_FORMATS.DISPLAY_SHORT)
                                    : "Active"}
                                </TableCell>
                                <TableCell className="truncate max-w-[150px]">
                                  {resource.notes || "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="skills">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Lightbulb className="h-5 w-5 mr-2" />
                        Required Skills
                      </CardTitle>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setLocation(`/project-management?tab=project-skills&project=${project.id}`)}
                      >
                        Add Skill Requirement
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {skillsLoading ? (
                        <div className="flex justify-center p-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                        </div>
                      ) : !skills || skills.length === 0 ? (
                        <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                          <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No skill requirements defined for this project yet.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {skills.map((skill) => (
                            <Card key={skill.id} className="border shadow-sm">
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center">
                                      <Award className="h-4 w-4 text-indigo-500 mr-2" />
                                      <h3 className="font-medium">{skill.skillName}</h3>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                      {skill.skillCategory}
                                    </p>
                                  </div>
                                  <Badge className={getSkillLevelColor(skill.requiredLevel)}>
                                    {skill.requiredLevel}
                                  </Badge>
                                </div>
                                {skill.notes && (
                                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                    <p className="text-sm">{skill.notes}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Project Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {project.startDate ? (
                      <div className="flex">
                        <div className="flex flex-col items-center mr-4">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <div className="w-1 flex-grow bg-gray-300 dark:bg-gray-700"></div>
                        </div>
                        <div className="pb-6">
                          <h3 className="text-sm font-medium">Project Start</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(project.startDate, DATE_FORMATS.DISPLAY)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex">
                        <div className="flex flex-col items-center mr-4">
                          <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                          <div className="w-1 flex-grow bg-gray-300 dark:bg-gray-700"></div>
                        </div>
                        <div className="pb-6">
                          <h3 className="text-sm font-medium">Project Start</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Not specified
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className={`w-4 h-4 ${project.status === "active" ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-700"} rounded-full`}></div>
                        <div className="w-1 flex-grow bg-gray-300 dark:bg-gray-700"></div>
                      </div>
                      <div className="pb-6">
                        <h3 className="text-sm font-medium">Current Status</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {project.status.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    
                    {project.endDate ? (
                      <div className="flex">
                        <div className="flex flex-col items-center mr-4">
                          <div className={`w-4 h-4 ${project.status === "completed" ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"} rounded-full`}></div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Project End</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(project.endDate, DATE_FORMATS.DISPLAY)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex">
                        <div className="flex flex-col items-center mr-4">
                          <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Project End</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Not specified
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}