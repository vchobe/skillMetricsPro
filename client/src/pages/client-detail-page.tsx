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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  ChevronLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Clock,
  Briefcase,
  Edit
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.is_admin || user?.isAdmin;
  const clientId = parseInt(params.id);

  // Fetch client details
  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ["client", clientId],
    queryFn: getQueryFn({
      on401: "throw",
      url: `/api/clients/${clientId}`,
    }),
    enabled: !isNaN(clientId) && isAdmin,
  });

  // Fetch client projects
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["client-projects", clientId],
    queryFn: getQueryFn({
      on401: "throw",
      url: `/api/clients/${clientId}/projects`,
    }),
    enabled: !isNaN(clientId) && isAdmin,
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

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          currentPath="/clients" 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Client Details" 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSidebarOpen={isSidebarOpen} 
          />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="flex flex-col items-center justify-center h-full">
              <Building2 className="h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
                You need administrator privileges to view client details.
              </p>
              <Button onClick={() => setLocation("/")}>
                Return to Dashboard
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Loading state
  if (clientLoading) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          currentPath="/clients" 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Client Details" 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSidebarOpen={isSidebarOpen} 
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

  // Client not found
  if (!client) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          currentPath="/clients" 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Client Details" 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSidebarOpen={isSidebarOpen} 
          />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="text-center p-12">
              <h2 className="text-2xl font-bold mb-2">Client Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The client you're looking for doesn't exist.
              </p>
              <Button onClick={() => setLocation("/clients")}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        currentPath="/clients" 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-20">
        <Header 
          title="Client Details" 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
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
                {client.contactPerson && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Contact: {client.contactPerson}
                  </p>
                )}
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
                  <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {client.description && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                        <p className="mt-1">{client.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {client.email && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                          <div className="flex items-center mt-1">
                            <Mail className="h-4 w-4 text-gray-500 mr-1" />
                            <span>{client.email}</span>
                          </div>
                        </div>
                      )}
                      
                      {client.phone && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</h3>
                          <div className="flex items-center mt-1">
                            <Phone className="h-4 w-4 text-gray-500 mr-1" />
                            <span>{client.phone}</span>
                          </div>
                        </div>
                      )}
                      
                      {client.address && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</h3>
                          <div className="flex items-start mt-1">
                            <MapPin className="h-4 w-4 text-gray-500 mr-1 mt-0.5" />
                            <span>{client.address}</span>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Added On</h3>
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 text-gray-500 mr-1" />
                          <span>{formatDate(client.createdAt, DATE_FORMATS.DISPLAY)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</h3>
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 text-gray-500 mr-1" />
                          <span>{formatDate(client.updatedAt, DATE_FORMATS.DISPLAY)}</span>
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
                    Projects ({projects?.length || 0})
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
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                    </div>
                  ) : !projects || projects.length === 0 ? (
                    <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                      <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No projects associated with this client yet.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30%]">Name</TableHead>
                          <TableHead className="w-[15%]">Status</TableHead>
                          <TableHead className="w-[20%]">Start Date</TableHead>
                          <TableHead className="w-[20%]">End Date</TableHead>
                          <TableHead className="w-[15%]">Location</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.map((project) => (
                          <TableRow 
                            key={project.id}
                            className="cursor-pointer"
                            onClick={() => setLocation(`/projects/${project.id}`)}
                          >
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(project.status)}>
                                {project.status.replace("_", " ").charAt(0).toUpperCase() + project.status.replace("_", " ").slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{project.startDate ? formatDate(project.startDate, DATE_FORMATS.DISPLAY_SHORT) : "Not set"}</TableCell>
                            <TableCell>{project.endDate ? formatDate(project.endDate, DATE_FORMATS.DISPLAY_SHORT) : "Not set"}</TableCell>
                            <TableCell>{project.location || "-"}</TableCell>
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
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {client.contactPerson && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary Contact</h3>
                        <p className="mt-1 font-medium">{client.contactPerson}</p>
                      </div>
                    )}
                    
                    {client.email && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                        <div className="flex items-center mt-1">
                          <Mail className="h-4 w-4 text-gray-500 mr-1" />
                          <a 
                            href={`mailto:${client.email}`} 
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {client.email}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {client.phone && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</h3>
                        <div className="flex items-center mt-1">
                          <Phone className="h-4 w-4 text-gray-500 mr-1" />
                          <a 
                            href={`tel:${client.phone}`} 
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {client.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {client.address && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</h3>
                        <div className="flex items-start mt-1">
                          <MapPin className="h-4 w-4 text-gray-500 mr-1 mt-0.5" />
                          <address className="not-italic">
                            {client.address}
                          </address>
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