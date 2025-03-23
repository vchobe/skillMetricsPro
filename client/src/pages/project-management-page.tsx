import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { getQueryFn, apiRequest } from "../lib/queryClient";
import { formatDate, DATE_FORMATS, standardizeDate } from "../lib/date-utils";
import { useToast } from "../hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Header from "../components/header";
import Sidebar from "../components/sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "../components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Building2,
  Briefcase,
  Users,
  Brain,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  Check,
  X
} from "lucide-react";
import { format } from "date-fns";

// Project form schema
const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  clientId: z.number({
    required_error: "Client selection is required",
    invalid_type_error: "Please select a client",
  }),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"], {
    required_error: "Status is required",
  }),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// Client form schema
const clientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
});

// Project Resource form schema
const resourceSchema = z.object({
  userId: z.number({
    required_error: "User selection is required",
    invalid_type_error: "Please select a user",
  }),
  role: z.string().optional(),
  assignedDate: z.date({
    required_error: "Assigned date is required",
  }),
  notes: z.string().optional(),
});

// Project Skill form schema
const projectSkillSchema = z.object({
  skillId: z.number({
    required_error: "Skill selection is required",
    invalid_type_error: "Please select a skill",
  }),
  requiredLevel: z.enum(["beginner", "intermediate", "expert"], {
    required_error: "Required level is required",
  }),
  notes: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;
type ClientFormValues = z.infer<typeof clientSchema>;
type ResourceFormValues = z.infer<typeof resourceSchema>;
type ProjectSkillFormValues = z.infer<typeof projectSkillSchema>;

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

type User = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
};

type Skill = {
  id: number;
  name: string;
  category: string;
  level: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  certified?: boolean;
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

type ProjectManagementData = {
  projects: Project[];
  clients: Client[];
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
  const editProjectId = searchParams.get("edit") ? parseInt(searchParams.get("edit") as string) : null;
  const editClientId = searchParams.get("tab") === "clients" && searchParams.get("edit") 
    ? parseInt(searchParams.get("edit") as string) 
    : null;
  const projectId = searchParams.get("project") ? parseInt(searchParams.get("project") as string) : null;
  const clientId = searchParams.get("client") ? parseInt(searchParams.get("client") as string) : null;
  const initialTab = searchParams.get("tab") || "projects";
  
  const [addResourceDialogOpen, setAddResourceDialogOpen] = useState(false);
  const [addSkillDialogOpen, setAddSkillDialogOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [skillSearchQuery, setSkillSearchQuery] = useState("");

  // Fetch projects and clients
  const { data: managementData, isLoading: dataLoading } = useQuery<ProjectManagementData>({
    queryKey: ["project-management-data"],
    queryFn: async () => {
      const [projectsResponse, clientsResponse] = await Promise.all([
        apiRequest("GET", "/api/projects"),
        apiRequest("GET", "/api/clients")
      ]);
      
      const projects = await projectsResponse.json();
      const clients = await clientsResponse.json();
      
      return {
        projects,
        clients
      };
    },
    enabled: isAdmin,
  });

  // Fetch all users for resource assignment
  const { data: users } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: getQueryFn({
      on401: "throw",
      url: "/api/users",
    }),
    enabled: isAdmin,
  });

  // Fetch all skills for project skill requirements
  const { data: skills } = useQuery<Skill[]>({
    queryKey: ["skills"],
    queryFn: getQueryFn({
      on401: "throw",
      url: "/api/skills",
    }),
    enabled: isAdmin,
  });

  // Filter users based on search query
  const filteredUsers = users?.filter(user => 
    userSearchQuery === "" || 
    user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (user.firstName && user.firstName.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
    (user.lastName && user.lastName.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
    (user.role && user.role.toLowerCase().includes(userSearchQuery.toLowerCase()))
  ) || [];

  // Filter skills based on search query
  const filteredSkills = skills?.filter(skill => 
    skillSearchQuery === "" || 
    skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
    skill.category.toLowerCase().includes(skillSearchQuery.toLowerCase())
  ) || [];

  // Fetch project details if editing
  const { data: editProject } = useQuery<Project>({
    queryKey: ["project", editProjectId],
    queryFn: getQueryFn({
      on401: "throw",
      url: `/api/projects/${editProjectId}`,
    }),
    enabled: isAdmin && !!editProjectId,
  });

  // Fetch client details if editing
  const { data: editClient } = useQuery<Client>({
    queryKey: ["client", editClientId],
    queryFn: getQueryFn({
      on401: "throw",
      url: `/api/clients/${editClientId}`,
    }),
    enabled: isAdmin && !!editClientId,
  });

  // Fetch project resources if project is selected
  const { data: projectResources, refetch: refetchResources } = useQuery<ProjectResource[]>({
    queryKey: ["project-resources", projectId],
    queryFn: getQueryFn({
      on401: "throw",
      url: `/api/projects/${projectId}/resources`,
    }),
    enabled: isAdmin && !!projectId,
  });

  // Fetch project skills if project is selected
  const { data: projectSkills, refetch: refetchSkills } = useQuery<ProjectSkill[]>({
    queryKey: ["project-skills", projectId],
    queryFn: getQueryFn({
      on401: "throw",
      url: `/api/projects/${projectId}/skills`,
    }),
    enabled: isAdmin && !!projectId,
  });

  // Project form
  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      clientId: clientId || 0,
      status: "planning",
      startDate: null,
      endDate: null,
      location: "",
      notes: "",
    }
  });

  // Client form
  const clientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      description: "",
    }
  });

  // Resource form
  const resourceForm = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      userId: 0,
      role: "",
      assignedDate: new Date(),
      notes: "",
    }
  });

  // Project Skill form
  const projectSkillForm = useForm<ProjectSkillFormValues>({
    resolver: zodResolver(projectSkillSchema),
    defaultValues: {
      skillId: 0,
      requiredLevel: "intermediate",
      notes: "",
    }
  });

  // Set project form values if editing a project
  useEffect(() => {
    if (editProject) {
      projectForm.reset({
        name: editProject.name,
        description: editProject.description || "",
        clientId: editProject.clientId,
        status: editProject.status,
        startDate: editProject.startDate ? new Date(editProject.startDate) : null,
        endDate: editProject.endDate ? new Date(editProject.endDate) : null,
        location: editProject.location || "",
        notes: editProject.notes || "",
      });
    } else if (clientId) {
      projectForm.setValue("clientId", clientId);
    }
  }, [editProject, clientId, projectForm]);

  // Set client form values if editing a client
  useEffect(() => {
    if (editClient) {
      clientForm.reset({
        name: editClient.name,
        contactPerson: editClient.contactPerson || "",
        email: editClient.email || "",
        phone: editClient.phone || "",
        address: editClient.address || "",
        description: editClient.description || "",
      });
    }
  }, [editClient, clientForm]);

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      console.log("Original dates:", {startDate: data.startDate, endDate: data.endDate});
      const formattedData = {
        ...data,
        startDate: data.startDate ? standardizeDate(data.startDate) : null,
        endDate: data.endDate ? standardizeDate(data.endDate) : null,
      };
      console.log("Formatted data to send:", formattedData);
      return apiRequest("POST", "/api/projects", formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-management-data"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      projectForm.reset();
      setLocation("/projects");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues & { id: number }) => {
      const { id, ...rest } = data;
      const formattedData = {
        ...rest,
        startDate: rest.startDate ? standardizeDate(rest.startDate) : null,
        endDate: rest.endDate ? standardizeDate(rest.endDate) : null,
      };
      return apiRequest("PUT", `/api/projects/${id}`, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-management-data"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", editProjectId] });
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
      setLocation(`/projects/${editProjectId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
    },
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      return apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-management-data"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Success",
        description: "Client created successfully",
      });
      clientForm.reset();
      setLocation("/clients");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      });
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (data: ClientFormValues & { id: number }) => {
      const { id, ...rest } = data;
      return apiRequest("PUT", `/api/clients/${id}`, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-management-data"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", editClientId] });
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      setLocation(`/clients/${editClientId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update client",
        variant: "destructive",
      });
    },
  });

  // Add resource to project mutation
  const addResourceMutation = useMutation({
    mutationFn: async (data: ResourceFormValues & { projectId: number }) => {
      const { projectId, ...rest } = data;
      const formattedData = {
        ...rest,
        assignedDate: standardizeDate(rest.assignedDate),
      };
      return apiRequest("POST", `/api/projects/${projectId}/resources`, formattedData);
    },
    onSuccess: () => {
      refetchResources();
      toast({
        title: "Success",
        description: "Resource added to project successfully",
      });
      resourceForm.reset();
      setAddResourceDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add resource to project",
        variant: "destructive",
      });
    },
  });

  // Remove resource from project mutation
  const removeResourceMutation = useMutation({
    mutationFn: async ({ projectId, resourceId }: { projectId: number, resourceId: number }) => {
      return apiRequest("DELETE", `/api/projects/${projectId}/resources/${resourceId}`);
    },
    onSuccess: () => {
      refetchResources();
      toast({
        title: "Success",
        description: "Resource removed from project successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove resource from project",
        variant: "destructive",
      });
    },
  });

  // Add skill to project mutation
  const addSkillMutation = useMutation({
    mutationFn: async (data: ProjectSkillFormValues & { projectId: number }) => {
      const { projectId, ...rest } = data;
      return apiRequest("POST", `/api/projects/${projectId}/skills`, rest);
    },
    onSuccess: () => {
      refetchSkills();
      toast({
        title: "Success",
        description: "Skill added to project successfully",
      });
      projectSkillForm.reset();
      setAddSkillDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add skill to project",
        variant: "destructive",
      });
    },
  });

  // Remove skill from project mutation
  const removeSkillMutation = useMutation({
    mutationFn: async ({ projectId, skillId }: { projectId: number, skillId: number }) => {
      return apiRequest("DELETE", `/api/projects/${projectId}/skills/${skillId}`);
    },
    onSuccess: () => {
      refetchSkills();
      toast({
        title: "Success",
        description: "Skill removed from project successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove skill from project",
        variant: "destructive",
      });
    },
  });

  // Handle project form submission
  const onProjectSubmit = (data: ProjectFormValues) => {
    if (editProjectId) {
      updateProjectMutation.mutate({ id: editProjectId, ...data });
    } else {
      createProjectMutation.mutate(data);
    }
  };

  // Handle client form submission
  const onClientSubmit = (data: ClientFormValues) => {
    if (editClientId) {
      updateClientMutation.mutate({ id: editClientId, ...data });
    } else {
      createClientMutation.mutate(data);
    }
  };

  // Handle resource form submission
  const onResourceSubmit = (data: ResourceFormValues) => {
    if (projectId) {
      addResourceMutation.mutate({ projectId, ...data });
    }
  };

  // Handle project skill form submission
  const onProjectSkillSubmit = (data: ProjectSkillFormValues) => {
    if (projectId) {
      addSkillMutation.mutate({ projectId, ...data });
    }
  };

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          currentPath="/project-management" 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Project Management" 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSidebarOpen={isSidebarOpen} 
          />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="flex flex-col items-center justify-center h-full">
              <Building2 className="h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
                You need administrator privileges to access project management.
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

  // Format status text
  const formatStatus = (status: string) => {
    return status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar wrapper with lower z-index */}
      <div className="z-10 relative">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          currentPath="/project-management" 
        />
      </div>
      
      {/* Main content with higher z-index */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-40 ml-64">
        <Header 
          title="Project Management" 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-full">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation(projectId ? `/projects/${projectId}` : editProjectId ? `/projects/${editProjectId}` : editClientId ? `/clients/${editClientId}` : "/projects")}
              className="mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to {projectId ? "Project Details" : editProjectId ? "Project Details" : editClientId ? "Client Details" : "Projects"}
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h1 className="text-2xl font-bold">
                {projectId ? "Manage Project Resources and Skills" : 
                editProjectId ? "Edit Project" : 
                editClientId ? "Edit Client" : "Project Management"}
              </h1>
              
              {!projectId && !editProjectId && !editClientId && isAdmin && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="flex items-center gap-2 mt-2 md:mt-0"
                    >
                      <Plus className="h-4 w-4" />
                      Create Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[725px]">
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                    </DialogHeader>
                    
                    <Form {...projectForm}>
                      <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={projectForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Project Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter project name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={projectForm.control}
                            name="clientId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client *</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange(parseInt(value))} 
                                  defaultValue={field.value.toString()}
                                  value={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a client" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {!clientId && <SelectItem value="0">Select a client</SelectItem>}
                                    {managementData?.clients?.map((client) => (
                                      <SelectItem key={client.id} value={client.id.toString()}>
                                        {client.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={projectForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status *</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="planning">Planning</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="on_hold">On Hold</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={projectForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                  <Input placeholder="Project location" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={projectForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Add project description..." 
                                  className="min-h-[100px]" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end gap-3">
                          <Button 
                            type="submit" 
                            disabled={createProjectMutation.isPending}
                          >
                            {createProjectMutation.isPending ? (
                              <>
                                <span className="animate-spin mr-2">◌</span>
                                Creating...
                              </>
                            ) : (
                              "Create Project"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          
          <Tabs defaultValue={initialTab} className="space-y-6">
            <TabsList className="mb-4">
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Clients
              </TabsTrigger>
              {projectId && (
                <>
                  <TabsTrigger value="resources" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Members
                  </TabsTrigger>
                  <TabsTrigger value="skills" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Required Skills
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            
            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editProjectId ? "Edit Project" : "Add New Project"}
                  </CardTitle>
                  {!editProjectId && (
                    <CardDescription>
                      Create a new project and assign it to a client
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Form {...projectForm}>
                    <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={projectForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter project name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={projectForm.control}
                          name="clientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client *</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                defaultValue={field.value.toString()}
                                value={field.value.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a client" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {!clientId && <SelectItem value="0">Select a client</SelectItem>}
                                  {managementData?.clients?.map((client) => (
                                    <SelectItem key={client.id} value={client.id.toString()}>
                                      {client.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={projectForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status *</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="planning">Planning</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="on_hold">On Hold</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={projectForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="Project location" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={projectForm.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Start Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className="w-full pl-3 text-left font-normal"
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span className="text-gray-500">Select start date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value || undefined}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={projectForm.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>End Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className="w-full pl-3 text-left font-normal"
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span className="text-gray-500">Select end date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value || undefined}
                                    onSelect={field.onChange}
                                    initialFocus
                                    disabled={(date) => {
                                      const startDate = projectForm.getValues("startDate");
                                      return startDate ? date < startDate : false;
                                    }}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={projectForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Project description"
                                className="min-h-32"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={projectForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Additional notes"
                                className="min-h-24"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setLocation("/projects")}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                        >
                          {createProjectMutation.isPending || updateProjectMutation.isPending ? (
                            <div className="flex items-center">
                              <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white"></div>
                              Saving...
                            </div>
                          ) : (
                            editProjectId ? "Update Project" : "Create Project"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              {!editProjectId && !projectId && (
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
                        <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No projects have been created yet.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
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
                                <Badge className={getStatusColor(project.status)}>
                                  {formatStatus(project.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>{project.startDate ? formatDate(project.startDate, DATE_FORMATS.DISPLAY_SHORT) : "Not set"}</TableCell>
                              <TableCell>{project.endDate ? formatDate(project.endDate, DATE_FORMATS.DISPLAY_SHORT) : "Not set"}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setLocation(`/project-management?edit=${project.id}`)}
                                  className="mr-1"
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setLocation(`/project-management?project=${project.id}&tab=resources`)}
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
              )}
            </TabsContent>
            
            <TabsContent value="clients">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editClientId ? "Edit Client" : "Add New Client"}
                  </CardTitle>
                  {!editClientId && (
                    <CardDescription>
                      Create a new client for project assignments
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Form {...clientForm}>
                    <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={clientForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter client name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={clientForm.control}
                          name="contactPerson"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Person</FormLabel>
                              <FormControl>
                                <Input placeholder="Primary contact person" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={clientForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Contact email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={clientForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Contact phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={clientForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input placeholder="Client address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={clientForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Client description"
                                className="min-h-24"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setLocation("/clients")}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createClientMutation.isPending || updateClientMutation.isPending}
                        >
                          {createClientMutation.isPending || updateClientMutation.isPending ? (
                            <div className="flex items-center">
                              <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white"></div>
                              Saving...
                            </div>
                          ) : (
                            editClientId ? "Update Client" : "Create Client"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              {!editClientId && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Client List</CardTitle>
                    <CardDescription>
                      Manage your existing clients
                    </CardDescription>
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
                              <TableCell>{client.contactPerson || "-"}</TableCell>
                              <TableCell>{client.email || "-"}</TableCell>
                              <TableCell>{client.phone || "-"}</TableCell>
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
                                  onClick={() => setLocation(`/project-management?tab=projects&client=${client.id}`)}
                                >
                                  Add Project
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {projectId && (
              <TabsContent value="resources">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Team Members</CardTitle>
                      <CardDescription>
                        Manage team members assigned to this project
                      </CardDescription>
                    </div>
                    <Dialog open={addResourceDialogOpen} onOpenChange={setAddResourceDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Team Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Add Team Member to Project</DialogTitle>
                          <DialogDescription>
                            Assign a team member to this project
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="mb-4">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <Input
                              type="search"
                              placeholder="Search users..."
                              className="w-full bg-white dark:bg-gray-800 pl-9"
                              value={userSearchQuery}
                              onChange={(e) => setUserSearchQuery(e.target.value)}
                            />
                          </div>
                          
                          <div className="mt-2 border rounded-md max-h-[200px] overflow-y-auto">
                            {filteredUsers.map((user) => (
                              <div
                                key={user.id}
                                className={`flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                                  resourceForm.getValues("userId") === user.id ? "bg-gray-100 dark:bg-gray-800" : ""
                                }`}
                                onClick={() => resourceForm.setValue("userId", user.id)}
                              >
                                <Avatar className="h-9 w-9 mr-2">
                                  <AvatarImage src="" alt={`${user.firstName || ''} ${user.lastName || ''}`} />
                                  <AvatarFallback className="text-xs">
                                    {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">{user.firstName} {user.lastName}</div>
                                  <div className="text-sm text-gray-500 truncate">{user.email}</div>
                                </div>
                                {resourceForm.getValues("userId") === user.id && (
                                  <Check className="h-5 w-5 text-green-500" />
                                )}
                              </div>
                            ))}
                            {filteredUsers.length === 0 && (
                              <div className="p-4 text-center text-gray-500">
                                No users found matching your search
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Form {...resourceForm}>
                          <form onSubmit={resourceForm.handleSubmit(onResourceSubmit)} className="space-y-4">
                            <FormField
                              control={resourceForm.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Role in Project</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Developer, Designer, PM, etc." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={resourceForm.control}
                              name="assignedDate"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Assignment Date *</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          className="w-full pl-3 text-left font-normal"
                                        >
                                          {field.value ? (
                                            format(field.value, "PPP")
                                          ) : (
                                            <span className="text-gray-500">Select assignment date</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={resourceForm.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Additional notes about this assignment"
                                      className="min-h-24"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="flex justify-end gap-2 pt-4">
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => setAddResourceDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="submit"
                                disabled={!resourceForm.getValues("userId") || addResourceMutation.isPending}
                              >
                                {addResourceMutation.isPending ? (
                                  <div className="flex items-center">
                                    <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white"></div>
                                    Adding...
                                  </div>
                                ) : (
                                  "Add to Project"
                                )}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="active">
                      <TabsList className="w-full mb-4">
                        <TabsTrigger value="active" className="flex-1">
                          Active Team
                        </TabsTrigger>
                        <TabsTrigger value="past" className="flex-1">
                          Past Members
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="active">
                        {projectResources?.filter(r => !r.removedDate).length === 0 ? (
                          <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No active team members assigned to this project.</p>
                            <Button 
                              onClick={() => setAddResourceDialogOpen(true)}
                              className="mt-4"
                              variant="outline"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Team Member
                            </Button>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Team Member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Assigned Date</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {projectResources?.filter(r => !r.removedDate).map((resource) => (
                                <TableRow key={resource.id}>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Avatar className="h-8 w-8 mr-2">
                                        <AvatarImage src="" alt={`${resource.firstName} ${resource.lastName}`} />
                                        <AvatarFallback className="text-xs">
                                          {resource.firstName?.[0]}{resource.lastName?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium">{resource.firstName} {resource.lastName}</div>
                                        <div className="text-sm text-gray-500">{resource.email}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{resource.role || "-"}</TableCell>
                                  <TableCell>{formatDate(resource.assignedDate, DATE_FORMATS.DISPLAY_SHORT)}</TableCell>
                                  <TableCell className="max-w-[200px] truncate">{resource.notes || "-"}</TableCell>
                                  <TableCell className="text-right">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        if (confirm("Are you sure you want to remove this team member from the project?")) {
                                          removeResourceMutation.mutate({ projectId, resourceId: resource.id });
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="past">
                        {projectResources?.filter(r => r.removedDate).length === 0 ? (
                          <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No past team members for this project.</p>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Team Member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Notes</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {projectResources?.filter(r => r.removedDate).map((resource) => (
                                <TableRow key={resource.id}>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Avatar className="h-8 w-8 mr-2">
                                        <AvatarImage src="" alt={`${resource.firstName} ${resource.lastName}`} />
                                        <AvatarFallback className="text-xs">
                                          {resource.firstName?.[0]}{resource.lastName?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium">{resource.firstName} {resource.lastName}</div>
                                        <div className="text-sm text-gray-500">{resource.email}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{resource.role || "-"}</TableCell>
                                  <TableCell>
                                    {formatDate(resource.assignedDate, DATE_FORMATS.DISPLAY_SHORT)} - {resource.removedDate ? formatDate(resource.removedDate, DATE_FORMATS.DISPLAY_SHORT) : "Present"}
                                  </TableCell>
                                  <TableCell className="max-w-[300px] truncate">{resource.notes || "-"}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            {projectId && (
              <TabsContent value="skills">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Required Skills</CardTitle>
                      <CardDescription>
                        Manage skills required for this project
                      </CardDescription>
                    </div>
                    <Dialog open={addSkillDialogOpen} onOpenChange={setAddSkillDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Required Skill
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Add Required Skill to Project</DialogTitle>
                          <DialogDescription>
                            Add a skill requirement for this project
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="mb-4">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <Input
                              type="search"
                              placeholder="Search skills..."
                              className="w-full bg-white dark:bg-gray-800 pl-9"
                              value={skillSearchQuery}
                              onChange={(e) => setSkillSearchQuery(e.target.value)}
                            />
                          </div>
                          
                          <div className="mt-2 border rounded-md max-h-[200px] overflow-y-auto">
                            {filteredSkills.map((skill) => (
                              <div
                                key={skill.id}
                                className={`flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                                  projectSkillForm.getValues("skillId") === skill.id ? "bg-gray-100 dark:bg-gray-800" : ""
                                }`}
                                onClick={() => projectSkillForm.setValue("skillId", skill.id)}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">{skill.name}</div>
                                  <div className="text-sm text-gray-500">{skill.category}</div>
                                </div>
                                <Badge className={getSkillLevelColor(skill.level)}>
                                  {skill.level.charAt(0).toUpperCase() + skill.level.slice(1)}
                                </Badge>
                                {projectSkillForm.getValues("skillId") === skill.id && (
                                  <Check className="h-5 w-5 text-green-500 ml-2" />
                                )}
                              </div>
                            ))}
                            {filteredSkills.length === 0 && (
                              <div className="p-4 text-center text-gray-500">
                                No skills found matching your search
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Form {...projectSkillForm}>
                          <form onSubmit={projectSkillForm.handleSubmit(onProjectSkillSubmit)} className="space-y-4">
                            <FormField
                              control={projectSkillForm.control}
                              name="requiredLevel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Required Level *</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select required level" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="beginner">Beginner</SelectItem>
                                      <SelectItem value="intermediate">Intermediate</SelectItem>
                                      <SelectItem value="expert">Expert</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={projectSkillForm.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Additional notes about this skill requirement"
                                      className="min-h-24"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="flex justify-end gap-2 pt-4">
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => setAddSkillDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="submit"
                                disabled={!projectSkillForm.getValues("skillId") || addSkillMutation.isPending}
                              >
                                {addSkillMutation.isPending ? (
                                  <div className="flex items-center">
                                    <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white"></div>
                                    Adding...
                                  </div>
                                ) : (
                                  "Add Skill"
                                )}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {projectSkills?.length === 0 ? (
                      <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                        <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No skills have been added to this project yet.</p>
                        <Button 
                          onClick={() => setAddSkillDialogOpen(true)}
                          className="mt-4"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Required Skill
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Skill</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Required Level</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectSkills?.map((skill) => (
                            <TableRow key={skill.id}>
                              <TableCell className="font-medium">{skill.skillName}</TableCell>
                              <TableCell>{skill.skillCategory}</TableCell>
                              <TableCell>
                                <Badge className={getSkillLevelColor(skill.requiredLevel)}>
                                  {skill.requiredLevel.charAt(0).toUpperCase() + skill.requiredLevel.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[300px] truncate">{skill.notes || "-"}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to remove this skill from the project?")) {
                                      removeSkillMutation.mutate({ projectId, skillId: skill.id });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
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
            )}
          </Tabs>
        </main>
      </div>
    </div>
  );
}