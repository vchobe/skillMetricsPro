import { useState } from "react";
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
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, standardizeDate, DATE_FORMATS } from "@/lib/date-utils";
import { getQueryFn } from "@/lib/queryClient";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Header from "@/components/header";

// Schemas for form validation
const clientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
});

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  clientId: z.number().min(1, "Client is required"),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const resourceSchema = z.object({
  userId: z.number().min(1, "User is required"),
  role: z.string().min(1, "Role is required"),
  notes: z.string().optional(),
});

const projectSkillSchema = z.object({
  skillId: z.number().min(1, "Skill is required"),
  requiredLevel: z.enum(["beginner", "intermediate", "expert"]),
  notes: z.string().optional(),
});

// Type definitions
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
  
  // Create form instances
  const clientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      description: "",
    },
  });
  
  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      clientId: clientId || 0,
      status: "planning",
      startDate: "",
      endDate: "",
      location: "",
      notes: "",
    },
  });
  
  const resourceForm = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      userId: 0,
      role: "",
      notes: "",
    },
  });
  
  const projectSkillForm = useForm<ProjectSkillFormValues>({
    resolver: zodResolver(projectSkillSchema),
    defaultValues: {
      skillId: 0,
      requiredLevel: "intermediate",
      notes: "",
    },
  });

  // Fetch data
  const { data: managementData, isLoading: dataLoading } = 
    getQueryFn<ProjectManagementData>({
      url: "/api/project-management",
      queryKey: ["project-management"],
      on401: "throw",
    })();
  
  const { data: projectDetails, isLoading: projectLoading } = 
    getQueryFn<Project>({
      url: `/api/projects/${projectId}`,
      queryKey: ["project", projectId],
      on401: "throw",
      enabled: !!projectId,
    })();
  
  const { data: projectResources, isLoading: resourcesLoading } = 
    getQueryFn<ProjectResource[]>({
      url: `/api/projects/${projectId}/resources`,
      queryKey: ["project-resources", projectId],
      on401: "throw",
      enabled: !!projectId,
    })();
  
  const { data: projectSkills, isLoading: skillsLoading } = 
    getQueryFn<ProjectSkill[]>({
      url: `/api/projects/${projectId}/skills`,
      queryKey: ["project-skills", projectId],
      on401: "throw",
      enabled: !!projectId,
    })();
  
  const { data: users, isLoading: usersLoading } = 
    getQueryFn<User[]>({
      url: "/api/users",
      queryKey: ["users"],
      on401: "throw",
    })();
  
  const { data: skills, isLoading: allSkillsLoading } = 
    getQueryFn<Skill[]>({
      url: "/api/skills/all",
      queryKey: ["all-skills"],
      on401: "throw",
    })();
  
  // Mutations
  const createProject = async (data: ProjectFormValues) => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        startDate: data.startDate ? standardizeDate(data.startDate) : null,
        endDate: data.endDate ? standardizeDate(data.endDate) : null,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create project");
    }
    
    return await response.json();
  };
  
  const createClient = async (data: ClientFormValues) => {
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create client");
    }
    
    return await response.json();
  };
  
  const updateProject = async ({ id, data }: { id: number, data: ProjectFormValues }) => {
    const response = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        startDate: data.startDate ? standardizeDate(data.startDate) : null,
        endDate: data.endDate ? standardizeDate(data.endDate) : null,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update project");
    }
    
    return await response.json();
  };
  
  const updateClient = async ({ id, data }: { id: number, data: ClientFormValues }) => {
    const response = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update client");
    }
    
    return await response.json();
  };
  
  const createProjectResource = async (data: ResourceFormValues) => {
    const response = await fetch(`/api/projects/${projectId}/resources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to add resource");
    }
    
    return await response.json();
  };
  
  const removeProjectResource = async (resourceId: number) => {
    const response = await fetch(`/api/project-resources/${resourceId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to remove resource");
    }
    
    return await response.json();
  };
  
  const createProjectSkill = async (data: ProjectSkillFormValues) => {
    const response = await fetch(`/api/projects/${projectId}/skills`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to add skill");
    }
    
    return await response.json();
  };
  
  const removeProjectSkill = async (skillId: number) => {
    const response = await fetch(`/api/project-skills/${skillId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to remove skill");
    }
    
    return await response.json();
  };
  
  // Handle form submissions
  const onProjectSubmit = (data: ProjectFormValues) => {
    if (editProjectId) {
      updateProject({ id: editProjectId, data })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["project-management"] });
          queryClient.invalidateQueries({ queryKey: ["project", editProjectId] });
          toast({
            title: "Project updated",
            description: "Project has been updated successfully",
          });
          setLocation("/project-management");
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        });
    } else {
      createProject(data)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["project-management"] });
          toast({
            title: "Project created",
            description: "Project has been created successfully",
          });
          setLocation("/project-management");
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        });
    }
  };
  
  const onClientSubmit = (data: ClientFormValues) => {
    if (editClientId) {
      updateClient({ id: editClientId, data })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["project-management"] });
          toast({
            title: "Client updated",
            description: "Client has been updated successfully",
          });
          setLocation("/project-management?tab=clients");
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        });
    } else {
      createClient(data)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["project-management"] });
          toast({
            title: "Client created",
            description: "Client has been created successfully",
          });
          setLocation("/project-management?tab=clients");
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        });
    }
  };
  
  const onResourceSubmit = (data: ResourceFormValues) => {
    createProjectResource(data)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["project-resources", projectId] });
        toast({
          title: "Resource added",
          description: "Resource has been added to the project",
        });
        setAddResourceDialogOpen(false);
        resourceForm.reset();
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      });
  };
  
  const onProjectSkillSubmit = (data: ProjectSkillFormValues) => {
    createProjectSkill(data)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["project-skills", projectId] });
        toast({
          title: "Skill added",
          description: "Skill has been added to the project",
        });
        setAddSkillDialogOpen(false);
        projectSkillForm.reset();
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      });
  };
  
  const handleRemoveResource = (resourceId: number) => {
    removeProjectResource(resourceId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["project-resources", projectId] });
        toast({
          title: "Resource removed",
          description: "Resource has been removed from the project",
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      });
  };
  
  const handleRemoveSkill = (skillId: number) => {
    removeProjectSkill(skillId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["project-skills", projectId] });
        toast({
          title: "Skill removed",
          description: "Skill has been removed from the project",
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      });
  };
  
  // Filter users based on search query
  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (user.firstName && user.firstName.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
    (user.lastName && user.lastName.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );
  
  // Filter skills based on search query
  const filteredSkills = skills?.filter(skill => 
    skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
    skill.category.toLowerCase().includes(skillSearchQuery.toLowerCase())
  );
  
  // Initialize form values for edit mode
  if (editProjectId && managementData?.projects && projectForm.formState.isDirty === false) {
    const projectToEdit = managementData.projects.find(p => p.id === editProjectId);
    if (projectToEdit) {
      projectForm.reset({
        name: projectToEdit.name,
        description: projectToEdit.description,
        clientId: projectToEdit.clientId,
        status: projectToEdit.status,
        startDate: projectToEdit.startDate || "",
        endDate: projectToEdit.endDate || "",
        location: projectToEdit.location,
        notes: projectToEdit.notes,
      });
    }
  }
  
  if (editClientId && managementData?.clients && clientForm.formState.isDirty === false) {
    const clientToEdit = managementData.clients.find(c => c.id === editClientId);
    if (clientToEdit) {
      clientForm.reset({
        name: clientToEdit.name,
        contactPerson: clientToEdit.contactPerson,
        email: clientToEdit.email,
        phone: clientToEdit.phone,
        address: clientToEdit.address,
        description: clientToEdit.description,
      });
    }
  }
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  }
  
  // New dialogs for creating projects and clients
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [createClientDialogOpen, setCreateClientDialogOpen] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Project Management" toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      
      <div className="flex-1 ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Project Management</h1>
          
          {/* Dialog for creating a new project */}
          <Dialog open={createProjectDialogOpen} onOpenChange={setCreateProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Enter the details for the new project
                </DialogDescription>
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
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
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
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={projectForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
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
                  </div>
                  <FormField
                    control={projectForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Project description" {...field} />
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
                          <Textarea placeholder="Additional notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Create Project</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
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
            {projectId && (
              <>
                <TabsTrigger value="resources">
                  <Users2 className="h-4 w-4" />
                  Resources
                </TabsTrigger>
                <TabsTrigger value="skills">
                  <Brain className="h-4 w-4" />
                  Required Skills
                </TabsTrigger>
              </>
            )}
          </TabsList>
          
          <TabsContent value="projects">
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
            {!editClientId && (
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Client List</CardTitle>
                    <CardDescription>
                      Manage your existing clients
                    </CardDescription>
                  </div>
                  <Dialog open={createClientDialogOpen} onOpenChange={setCreateClientDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Client
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Client</DialogTitle>
                        <DialogDescription>
                          Enter the details for the new client
                        </DialogDescription>
                      </DialogHeader>
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
                                    <Input placeholder="Enter contact person's name" {...field} />
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
                                    <Input placeholder="Enter email address" {...field} />
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
                                    <Input placeholder="Enter phone number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={clientForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Enter client address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={clientForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Describe the client" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="submit">Create Client</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
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
                          <TableHead>Client Name</TableHead>
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
                            <TableCell>{client.contactPerson}</TableCell>
                            <TableCell>{client.email}</TableCell>
                            <TableCell>{client.phone}</TableCell>
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
                  <Button 
                    size="sm" 
                    onClick={() => setAddResourceDialogOpen(true)}
                    disabled={!projectDetails}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource
                  </Button>
                </CardHeader>
                <CardContent>
                  {resourcesLoading || projectLoading ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                    </div>
                  ) : !projectResources || projectResources.length === 0 ? (
                    <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                      <Users2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No resources have been assigned to this project yet.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Assigned Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectResources.map((resource) => (
                          <TableRow key={resource.id}>
                            <TableCell className="font-medium">
                              {resource.firstName && resource.lastName 
                                ? `${resource.firstName} ${resource.lastName}` 
                                : resource.username}
                            </TableCell>
                            <TableCell>{resource.email}</TableCell>
                            <TableCell>{resource.role}</TableCell>
                            <TableCell>{formatDate(resource.assignedDate, DATE_FORMATS.DISPLAY_SHORT)}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRemoveResource(resource.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                Remove
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
                  <Button 
                    size="sm" 
                    onClick={() => setAddSkillDialogOpen(true)}
                    disabled={!projectDetails}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skill
                  </Button>
                </CardHeader>
                <CardContent>
                  {skillsLoading || projectLoading ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                    </div>
                  ) : !projectSkills || projectSkills.length === 0 ? (
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
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectSkills.map((skill) => (
                          <TableRow key={skill.id}>
                            <TableCell className="font-medium">{skill.skillName}</TableCell>
                            <TableCell>{skill.skillCategory}</TableCell>
                            <TableCell>
                              {skill.requiredLevel === "expert" && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  Expert
                                </span>
                              )}
                              {skill.requiredLevel === "intermediate" && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  Intermediate
                                </span>
                              )}
                              {skill.requiredLevel === "beginner" && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Beginner
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{skill.notes}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRemoveSkill(skill.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                Remove
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
        
        {editProjectId && managementData?.projects && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Edit Project</CardTitle>
              <CardDescription>
                Update project details
              </CardDescription>
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
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
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
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={projectForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
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
                  </div>
                  <FormField
                    control={projectForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Project description" {...field} />
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
                          <Textarea placeholder="Additional notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/project-management")}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Update Project</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
        
        {editClientId && managementData?.clients && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Edit Client</CardTitle>
              <CardDescription>
                Update client details
              </CardDescription>
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
                            <Input placeholder="Enter contact person's name" {...field} />
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
                            <Input placeholder="Enter email address" {...field} />
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
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={clientForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter client address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clientForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the client" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/project-management?tab=clients")}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Update Client</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
        
        {/* Dialog for adding resources to project */}
        <Dialog open={addResourceDialogOpen} onOpenChange={setAddResourceDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Resource to Project</DialogTitle>
              <DialogDescription>
                Assign a team member to this project
              </DialogDescription>
            </DialogHeader>
            <div className="mb-4">
              <Input
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {usersLoading ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"></div>
                  </div>
                ) : !filteredUsers || filteredUsers.length === 0 ? (
                  <div className="text-center p-2 text-sm text-gray-500">
                    No users found
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => {
                          resourceForm.setValue("userId", user.id);
                          setUserSearchQuery("");
                        }}
                      >
                        <div className="font-medium">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.username}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Form {...resourceForm}>
              <form onSubmit={resourceForm.handleSubmit(onResourceSubmit)} className="space-y-4">
                <FormField
                  control={resourceForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input type="hidden" {...field} value={field.value} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={resourceForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Developer, Designer, PM" {...field} />
                      </FormControl>
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
                        <Textarea placeholder="Any additional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit"
                    disabled={resourceForm.getValues("userId") === 0}
                  >
                    Add Resource
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Dialog for adding skills to project */}
        <Dialog open={addSkillDialogOpen} onOpenChange={setAddSkillDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Required Skill</DialogTitle>
              <DialogDescription>
                Specify skills required for this project
              </DialogDescription>
            </DialogHeader>
            <div className="mb-4">
              <Input
                placeholder="Search skills..."
                value={skillSearchQuery}
                onChange={(e) => setSkillSearchQuery(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {allSkillsLoading ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"></div>
                  </div>
                ) : !filteredSkills || filteredSkills.length === 0 ? (
                  <div className="text-center p-2 text-sm text-gray-500">
                    No skills found
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredSkills.map((skill) => (
                      <div
                        key={skill.id}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => {
                          projectSkillForm.setValue("skillId", skill.id);
                          setSkillSearchQuery("");
                        }}
                      >
                        <div className="font-medium">{skill.name}</div>
                        <div className="text-sm text-gray-500">{skill.category}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Form {...projectSkillForm}>
              <form onSubmit={projectSkillForm.handleSubmit(onProjectSkillSubmit)} className="space-y-4">
                <FormField
                  control={projectSkillForm.control}
                  name="skillId"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input type="hidden" {...field} value={field.value} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={projectSkillForm.control}
                  name="requiredLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Level *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
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
                        <Textarea placeholder="Any additional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit"
                    disabled={projectSkillForm.getValues("skillId") === 0}
                  >
                    Add Skill
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}