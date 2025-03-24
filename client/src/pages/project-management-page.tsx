import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Users2,
  X,
  Brain,
  Plus,
  MoreHorizontal,
  FileEdit,
  Trash,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, standardizeDate, DATE_FORMATS } from "@/lib/date-utils";
import { getQueryFn, apiRequest } from "@/lib/queryClient";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";

// Type definitions
type ProjectManagementData = {
  projects: any[];
  clients: any[];
};

export default function ProjectManagementPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.is_admin || user?.isAdmin;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Parse URL parameters
  const searchParams = new URLSearchParams(search);
  const projectId = searchParams.get("project") ? parseInt(searchParams.get("project") as string) : null;
  const initialTab = searchParams.get("tab") || "projects";
  
  // Define states for our data
  const [managementData, setManagementData] = useState<ProjectManagementData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Fetch management data
  useEffect(() => {
    const fetchManagementData = async () => {
      try {
        const response = await fetch("/api/project-management");
        if (!response.ok) {
          throw new Error("Failed to fetch project management data");
        }
        const data = await response.json();
        setManagementData(data);
      } catch (error) {
        console.error("Error fetching management data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch project management data",
          variant: "destructive",
        });
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchManagementData();
  }, []);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} currentPath="/project-management" />
      
      <div className="flex-1 md:ml-64">
        <Header title="Project Management" toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Project Management</h1>
          </div>
          
          <Tabs defaultValue={initialTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="projects">
                <Calendar className="h-4 w-4 mr-2" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="clients">
                <Building2 className="h-4 w-4 mr-2" />
                Clients
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="projects">
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Project List</CardTitle>
                  <CardDescription>
                    Manage your existing projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dataLoading ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                    </div>
                  ) : !managementData?.projects || managementData.projects.length === 0 ? (
                    <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No projects have been created yet.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project Name</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {managementData.projects.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell>{project.clientName}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {project.status === "active" && (
                                  <span className="flex items-center">
                                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                    Active
                                  </span>
                                )}
                                {project.status === "planning" && (
                                  <span className="flex items-center">
                                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                                    Planning
                                  </span>
                                )}
                                {project.status === "on_hold" && (
                                  <span className="flex items-center">
                                    <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                                    On Hold
                                  </span>
                                )}
                                {project.status === "completed" && (
                                  <span className="flex items-center">
                                    <span className="h-2 w-2 rounded-full bg-gray-500 mr-2"></span>
                                    Completed
                                  </span>
                                )}
                                {project.status === "cancelled" && (
                                  <span className="flex items-center">
                                    <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                                    Cancelled
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{project.startDate ? formatDate(project.startDate, DATE_FORMATS.DISPLAY) : "Not set"}</TableCell>
                            <TableCell>{project.endDate ? formatDate(project.endDate, DATE_FORMATS.DISPLAY) : "Not set"}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setLocation(`/project-management?tab=projects&edit=${project.id}`)}
                                className="mr-1"
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setLocation(`/projects/${project.id}`)}
                              >
                                Manage
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="clients">
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Client List</CardTitle>
                    <CardDescription>
                      Manage your existing clients
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {dataLoading ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                    </div>
                  ) : !managementData?.clients || managementData.clients.length === 0 ? (
                    <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                      <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No clients have been created yet.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Contact Person</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {managementData.clients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>{client.contactPerson || "—"}</TableCell>
                            <TableCell>{client.email || "—"}</TableCell>
                            <TableCell>{client.phone || "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setLocation(`/project-management?tab=clients&edit=${client.id}`)}
                                className="mr-1"
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setLocation(`/clients/${client.id}`)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}