import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { getQueryFn, apiRequest } from "../lib/queryClient";
import { formatDate, DATE_FORMATS } from "../lib/date-utils";
import { useToast } from "../hooks/use-toast";

import Header from "../components/header";
import Sidebar from "../components/sidebar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  ChevronLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Edit,
  Calendar,
  Briefcase,
  FileText,
  Users,
  CircleCheck,
  CircleAlert,
  Plus,
  Check,
  Link as LinkIcon,
} from "lucide-react";

type Client = {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type Project = {
  id: number;
  name: string;
  description: string;
  clientId: number;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  startDate: string | null;
  endDate: string | null;
  location: string;
  createdAt: string;
};

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [showLinkProjectDialog, setShowLinkProjectDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const clientId = parseInt(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch client details
  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ["client", clientId],
    queryFn: getQueryFn({
      on401: "throw",
      url: `/api/clients/${clientId}`,
    }),
    enabled: !isNaN(clientId),
  });
  
  // Fetch client projects
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["client-projects", clientId],
    queryFn: getQueryFn({
      on401: "throw",
      url: `/api/clients/${clientId}/projects`,
    }),
    enabled: !isNaN(clientId),
  });
  
  // Fetch all available projects for linking
  const { data: availableProjects = [], isLoading: loadingAvailableProjects } = useQuery<Project[]>({
    queryKey: ["all-projects"],
    queryFn: getQueryFn({
      on401: "throw",
      url: "/api/projects",
    }),
    enabled: showLinkProjectDialog,
  });
  
  // Mutation for linking a project to this client
  const linkProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await apiRequest(
        "PUT",
        `/api/projects/${projectId}`,
        { clientId }
      );
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Project linked successfully",
        description: "The project has been assigned to this client.",
        variant: "default",
      });
      setShowLinkProjectDialog(false);
      setSelectedProjectId(null);
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["client-projects", clientId] });
      queryClient.invalidateQueries({ queryKey: ["all-projects"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to link project",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case "planning": return "bg-yellow-100 text-yellow-800";
      case "active": return "bg-green-100 text-green-800";
      case "on_hold": return "bg-orange-100 text-orange-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  // Calculate project timeline
  const getProjectTimeline = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return "Not scheduled";
    if (startDate && !endDate) return `Started ${formatDate(startDate, DATE_FORMATS.DISPLAY_SHORT)}`;
    if (!startDate && endDate) return `Due ${formatDate(endDate, DATE_FORMATS.DISPLAY_SHORT)}`;
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const now = new Date();
    
    if (now < start) {
      return `Scheduled (${formatDate(startDate, DATE_FORMATS.DISPLAY_SHORT)} - ${formatDate(endDate, DATE_FORMATS.DISPLAY_SHORT)})`;
    } else if (now > end) {
      return `Completed (${formatDate(startDate, DATE_FORMATS.DISPLAY_SHORT)} - ${formatDate(endDate, DATE_FORMATS.DISPLAY_SHORT)})`;
    } else {
      const total = end.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      const progress = Math.round((elapsed / total) * 100);
      return `In progress ${progress}% (${formatDate(startDate, DATE_FORMATS.DISPLAY_SHORT)} - ${formatDate(endDate, DATE_FORMATS.DISPLAY_SHORT)})`;
    }
  };
  
  // Count projects by status
  const getProjectCounts = () => {
    if (!projects) return { total: 0, active: 0, completed: 0, planned: 0 };
    
    const active = projects.filter(p => p.status === "active").length;
    const completed = projects.filter(p => p.status === "completed").length;
    const planned = projects.filter(p => p.status === "planning").length;
    
    return {
      total: projects.length,
      active,
      completed,
      planned,
    };
  };
  
  // Loading state
  if (clientLoading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar 
          isOpen={isOpen} 
          setIsOpen={setIsOpen} 
          currentPath="/clients" 
        />
        
        <div className="flex-1 md:ml-64">
          <Header 
            title="Client Details" 
            toggleSidebar={() => setIsOpen(!isOpen)} 
            isSidebarOpen={isOpen} 
          />
          
          <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Client not found
  if (!client) {
    return (
      <div className="min-h-screen flex">
        <Sidebar 
          isOpen={isOpen} 
          setIsOpen={setIsOpen} 
          currentPath="/clients" 
        />
        
        <div className="flex-1 md:ml-64">
          <Header 
            title="Client Details" 
            toggleSidebar={() => setIsOpen(!isOpen)} 
            isSidebarOpen={isOpen} 
          />
          
          <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center p-12">
              <h2 className="text-2xl font-bold mb-2">Client Not Found</h2>
              <p className="text-gray-600 mb-4">
                The client you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => setLocation("/clients")}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const projectCounts = getProjectCounts();

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        isOpen={isOpen} 
        setIsOpen={setIsOpen} 
        currentPath="/clients" 
      />
      
      <div className="flex-1 md:ml-64">
        <Header 
          title="Client Details" 
          toggleSidebar={() => setIsOpen(!isOpen)} 
          isSidebarOpen={isOpen} 
        />
        
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/clients")}
              className="mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Clients
            </Button>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{client.name}</h1>
                <div className="flex items-center mt-2 text-gray-600">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{client.contactPerson}</span>
                </div>
              </div>
              
              <Button 
                onClick={() => setLocation(`/project-management?tab=clients&edit=${client.id}`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Client
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Client Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {client.description && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Description</h3>
                        <p className="mt-1">{client.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Contact Person</h3>
                        <div className="flex items-center mt-1">
                          <Users className="h-4 w-4 text-gray-500 mr-1" />
                          <span>{client.contactPerson}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                        <div className="flex items-center mt-1">
                          <Mail className="h-4 w-4 text-gray-500 mr-1" />
                          <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                            {client.email}
                          </a>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                        <div className="flex items-center mt-1">
                          <Phone className="h-4 w-4 text-gray-500 mr-1" />
                          <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                            {client.phone}
                          </a>
                        </div>
                      </div>
                      
                      {client.address && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Address</h3>
                          <div className="flex items-center mt-1">
                            <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                            <span>{client.address}</span>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Client Since</h3>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                          <span>{formatDate(client.createdAt, DATE_FORMATS.DISPLAY)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Projects ({projectCounts.total})
                  </CardTitle>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation(`/project-management?tab=projects&client=${client.id}`)}
                  >
                    Add Project
                  </Button>
                </CardHeader>
                <CardContent>
                  {projectsLoading ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    </div>
                  ) : !projects || projects.length === 0 ? (
                    <div className="text-center p-6 text-gray-500">
                      <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No projects for this client yet.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30%]">Project Name</TableHead>
                          <TableHead className="w-[15%]">Status</TableHead>
                          <TableHead className="w-[40%]">Timeline</TableHead>
                          <TableHead className="w-[15%]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">
                              <Link 
                                href={`/projects/${project.id}`} 
                                className="hover:underline"
                              >
                                {project.name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(project.status)}>
                                {project.status.replace("_", " ").charAt(0).toUpperCase() + project.status.replace("_", " ").slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getProjectTimeline(project.startDate, project.endDate)}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                asChild
                              >
                                <Link href={`/projects/${project.id}`}>
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Client Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Total Projects</div>
                      <div className="mt-1 text-2xl font-bold">{projectCounts.total}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-blue-600 text-sm font-medium">Active</div>
                        <div className="text-lg font-bold">{projectCounts.active}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-green-600 text-sm font-medium">Completed</div>
                        <div className="text-lg font-bold">{projectCounts.completed}</div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="text-yellow-600 text-sm font-medium">Planned</div>
                        <div className="text-lg font-bold">{projectCounts.planned}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Client Since</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <div className="text-lg font-bold">
                        {formatDate(client.createdAt, DATE_FORMATS.DISPLAY)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(client.createdAt, DATE_FORMATS.RELATIVE)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation(`/project-management?tab=clients&edit=${client.id}`)}
                      className="w-full justify-start"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Client Details
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation(`/project-management?tab=projects&client=${client.id}`)}
                      className="w-full justify-start"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Project
                    </Button>
                    
                    <Dialog open={showLinkProjectDialog} onOpenChange={setShowLinkProjectDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Link Existing Project
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Link Project to {client.name}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          {loadingAvailableProjects ? (
                            <div className="flex justify-center p-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                            </div>
                          ) : !availableProjects || availableProjects.length === 0 ? (
                            <div className="text-center text-gray-500">
                              <p>No available projects to link.</p>
                            </div>
                          ) : (
                            <>
                              <div className="mb-4">
                                <p className="text-sm text-gray-500">
                                  Select a project to link to this client:
                                </p>
                              </div>
                              <ScrollArea className="h-60">
                                <div className="space-y-2">
                                  {availableProjects
                                    .filter(p => p.clientId !== clientId)
                                    .map(project => (
                                      <div 
                                        key={project.id} 
                                        className={`p-3 border rounded cursor-pointer ${
                                          selectedProjectId === project.id 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                        onClick={() => setSelectedProjectId(project.id)}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="font-medium">{project.name}</div>
                                            <div className="text-sm text-gray-500 truncate w-full max-w-xs">
                                              {project.description || "No description"}
                                            </div>
                                          </div>
                                          {selectedProjectId === project.id && (
                                            <Check className="h-5 w-5 text-blue-500" />
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </ScrollArea>
                              <div className="mt-6 flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setShowLinkProjectDialog(false);
                                    setSelectedProjectId(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  disabled={!selectedProjectId}
                                  onClick={() => {
                                    if (selectedProjectId) {
                                      linkProjectMutation.mutate(selectedProjectId);
                                    }
                                  }}
                                >
                                  Link Project
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}