import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/date-utils";

// Define types for API responses
interface Project {
  id: number;
  name: string;
  description?: string;
  clientId?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  location?: string;
  confluenceLink?: string;
  leadId?: number | null;
  deliveryLeadId?: number | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface Client {
  id: number;
  name: string;
  industry?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  description?: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  location?: string;
  project?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Skill {
  id: number;
  userId: number;
  name: string;
  category: string;
  level: string;
  description?: string;
  certification?: string;
  credlyLink?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ProjectResource {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  allocation?: number; // Percentage of time allocated
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ProjectSkill {
  id: number;
  projectId: number;
  skillId: number;
  requiredLevel: string;
  importance: string; // high, medium, low
  createdAt: string;
  updatedAt?: string;
}

interface ResourceHistory {
  id: number;
  projectId: number;
  userId: number;
  action: string; // added, removed, role_changed, allocation_changed
  previousRole?: string;
  newRole?: string;
  previousAllocation?: number;
  newAllocation?: number;
  date: string;
  performedById?: number;
  note?: string;
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Users,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Edit,
  Plus,
  Trash2,
  AlertCircle,
  Download,
  FileText,
  Computer,
  Building,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SkillLevelBadge from "@/components/skill-level-badge";

// Project schema for form validation
const projectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  description: z.string().optional(),
  clientId: z.coerce.number().nullable().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  location: z.string().optional(),
  confluenceLink: z.string().optional(),
  leadId: z.coerce.number().nullable().optional(),
  deliveryLeadId: z.coerce.number().nullable().optional(),
  status: z.string().default("active")
});

// Resource schema
const resourceSchema = z.object({
  userId: z.coerce.number(),
  role: z.string().optional(),
  allocation: z.coerce.number().min(1).max(100),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// Project skill schema
const projectSkillSchema = z.object({
  skillId: z.coerce.number(),
  importance: z.string().default("medium")
});

type ProjectFormValues = z.infer<typeof projectSchema>;
type ResourceFormValues = z.infer<typeof resourceSchema>;
type ProjectSkillFormValues = z.infer<typeof projectSkillSchema>;

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.isAdmin || user?.is_admin;
  
  const [openEditProject, setOpenEditProject] = useState(false);
  const [openAddResource, setOpenAddResource] = useState(false);
  const [openRemoveResource, setOpenRemoveResource] = useState<number | null>(null);
  const [openAddSkill, setOpenAddSkill] = useState(false);
  const [openRemoveSkill, setOpenRemoveSkill] = useState<number | null>(null);
  
  // Fetch project details
  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: ["/api/projects", id],
    queryFn: () => apiRequest("GET", `/api/projects/${id}`),
    refetchOnWindowFocus: false,
  });
  
  // Fetch project resources
  const { data: resources, isLoading: isLoadingResources } = useQuery<ProjectResource[]>({
    queryKey: ["/api/projects", id, "resources"],
    queryFn: () => apiRequest("GET", `/api/projects/${id}/resources`),
    refetchOnWindowFocus: false,
  });
  
  // Fetch project skills
  const { data: projectSkills, isLoading: isLoadingProjectSkills } = useQuery<ProjectSkill[]>({
    queryKey: ["/api/projects", id, "skills"],
    queryFn: () => apiRequest("GET", `/api/projects/${id}/skills`),
    refetchOnWindowFocus: false,
  });
  
  // Fetch all skills for the skill dropdown
  const { data: allSkills, isLoading: isLoadingAllSkills } = useQuery<Skill[]>({
    queryKey: ["/api/all-skills"],
    refetchOnWindowFocus: false,
  });
  
  // Fetch all clients for the dropdown
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    refetchOnWindowFocus: false,
  });
  
  // Fetch all users for dropdowns
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    refetchOnWindowFocus: false,
  });
  
  // Fetch resource history
  const { data: resourceHistory, isLoading: isLoadingHistory } = useQuery<ResourceHistory[]>({
    queryKey: ["/api/projects", id, "resource-history"],
    queryFn: () => apiRequest("GET", `/api/projects/${id}/resource-history`),
    refetchOnWindowFocus: false,
  });
  
  // Initialize the edit project form with current project values
  const editProjectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      clientId: null,
      startDate: null,
      endDate: null,
      location: "",
      confluenceLink: "",
      leadId: null,
      deliveryLeadId: null,
      status: "active"
    },
  });
  
  // Set form values when project data is loaded
  useEffect(() => {
    if (project) {
      editProjectForm.reset({
        name: project.name,
        description: project.description || "",
        clientId: project.clientId || null,
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : null,
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : null,
        location: project.location || "",
        confluenceLink: project.confluenceLink || "",
        leadId: project.leadId || null,
        deliveryLeadId: project.deliveryLeadId || null,
        status: project.status || "active"
      });
    }
  }, [project, editProjectForm]);
  
  // Form for adding new resource
  const addResourceForm = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      userId: 0,
      role: "",
      allocation: 100,
      startDate: new Date().toISOString().split('T')[0],
      endDate: ""
    },
  });
  
  // Form for adding new project skill
  const addSkillForm = useForm<ProjectSkillFormValues>({
    resolver: zodResolver(projectSkillSchema),
    defaultValues: {
      skillId: 0,
      importance: "medium"
    },
  });
  
  // Update project mutation
  const updateProject = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      return apiRequest("PATCH", `/api/projects/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
      toast({
        title: "Success",
        description: "Project updated successfully",
        variant: "default",
      });
      setOpenEditProject(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
    },
  });
  
  // Add resource mutation
  const addResource = useMutation({
    mutationFn: async (data: ResourceFormValues) => {
      return apiRequest("POST", `/api/projects/${id}/resources`, { 
        ...data, 
        projectId: parseInt(id) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "resource-history"] });
      toast({
        title: "Success",
        description: "Resource added successfully",
        variant: "default",
      });
      setOpenAddResource(false);
      addResourceForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add resource",
        variant: "destructive",
      });
    },
  });
  
  // Remove resource mutation
  const removeResource = useMutation({
    mutationFn: async (resourceId: number) => {
      return apiRequest("DELETE", `/api/projects/resources/${resourceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "resource-history"] });
      toast({
        title: "Success",
        description: "Resource removed successfully",
        variant: "default",
      });
      setOpenRemoveResource(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove resource",
        variant: "destructive",
      });
    },
  });
  
  // Add project skill mutation
  const addProjectSkill = useMutation({
    mutationFn: async (data: ProjectSkillFormValues) => {
      return apiRequest("POST", `/api/projects/${id}/skills`, {
        ...data,
        projectId: parseInt(id)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "skills"] });
      toast({
        title: "Success",
        description: "Skill added to project successfully",
        variant: "default",
      });
      setOpenAddSkill(false);
      addSkillForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add skill to project",
        variant: "destructive",
      });
    },
  });
  
  // Remove project skill mutation
  const removeProjectSkill = useMutation({
    mutationFn: async (projectSkillId: number) => {
      return apiRequest("DELETE", `/api/projects/skills/${projectSkillId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "skills"] });
      toast({
        title: "Success",
        description: "Skill removed from project successfully",
        variant: "default",
      });
      setOpenRemoveSkill(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove skill from project",
        variant: "destructive",
      });
    },
  });
  
  // Handle edit project form submission
  const onEditProjectSubmit = (data: ProjectFormValues) => {
    updateProject.mutate(data);
  };
  
  // Handle add resource form submission
  const onAddResourceSubmit = (data: ResourceFormValues) => {
    addResource.mutate(data);
  };
  
  // Handle add project skill form submission
  const onAddSkillSubmit = (data: ProjectSkillFormValues) => {
    addProjectSkill.mutate(data);
  };
  
  // Get client name by ID
  const getClientName = (clientId: number | null) => {
    if (!clientId) return "—";
    if (!clients) return "Loading...";
    const client = clients.find((c: Client) => c.id === clientId);
    return client ? client.name : "—";
  };
  
  // Get user name by ID
  const getUserName = (userId: number | null) => {
    if (!userId) return "—";
    if (!users) return "Loading...";
    const user = users.find((u: User) => u.id === userId);
    return user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username : "—";
  };
  
  // Get skill name by ID
  const getSkillName = (skillId: number) => {
    if (!allSkills) return "Loading...";
    const skill = allSkills.find((s: Skill) => s.id === skillId);
    return skill ? skill.name : "—";
  };
  
  // Get skill by ID
  const getSkill = (skillId: number) => {
    if (!allSkills) return null;
    return allSkills.find((s: Skill) => s.id === skillId);
  };
  
  // Create an array of available skills (all skills except those already assigned)
  const availableSkills = allSkills
    ? allSkills.filter((skill: Skill) => 
        !projectSkills || !projectSkills.some((ps: ProjectSkill) => ps.skillId === skill.id)
      )
    : [];
  
  // Create an array of available users (all users except those already assigned)
  const availableUsers = users
    ? users.filter((user: User) => 
        !resources || !resources.some((r: ProjectResource) => r.userId === user.id)
      )
    : [];
  
  if (isLoadingProject) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Project Not Found</CardTitle>
            <CardDescription>
              The project you're looking for doesn't exist or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation("/projects")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
          <div className="flex items-center mb-4 sm:mb-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/projects")}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">{project.name}</h1>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              <Dialog open={openEditProject} onOpenChange={setOpenEditProject}>
                <DialogTrigger asChild>
                  <Button>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>
                      Update details for {project.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...editProjectForm}>
                    <form onSubmit={editProjectForm.handleSubmit(onEditProjectSubmit)} className="space-y-4">
                      <FormField
                        control={editProjectForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Name *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editProjectForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={editProjectForm.control}
                          name="clientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                                  value={field.value?.toString() || ""}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a client" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {clients?.map((client: Client) => (
                                      <SelectItem key={client.id} value={client.id.toString()}>
                                        {client.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editProjectForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="on_hold">On Hold</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={editProjectForm.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editProjectForm.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={editProjectForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editProjectForm.control}
                        name="confluenceLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Documentation Link</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="https://confluence.example.com/project"
                              />
                            </FormControl>
                            <FormDescription>
                              Link to Confluence page or other project documentation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={editProjectForm.control}
                          name="leadId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project Lead</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                                  value={field.value?.toString() || ""}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select project lead" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {users?.map((user: any) => (
                                      <SelectItem key={user.id} value={user.id.toString()}>
                                        {`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editProjectForm.control}
                          name="deliveryLeadId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delivery Lead</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                                  value={field.value?.toString() || ""}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select delivery lead" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {users?.map((user: any) => (
                                      <SelectItem key={user.id} value={user.id.toString()}>
                                        {`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpenEditProject(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateProject.isPending}
                        >
                          {updateProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Client</CardDescription>
              <CardTitle className="text-lg">
                {project.clientId ? (
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-gray-400" />
                    {getClientName(project.clientId)}
                  </div>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Timeline</CardDescription>
              <CardTitle className="text-lg">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>
                    {project.startDate 
                      ? formatDate(project.startDate, "MMM d, yyyy") 
                      : "—"} 
                    {project.startDate && project.endDate ? " → " : ""}
                    {project.endDate 
                      ? formatDate(project.endDate, "MMM d, yyyy") 
                      : project.startDate ? " (Ongoing)" : ""}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Location</CardDescription>
              <CardTitle className="text-lg">
                {project.location ? (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {project.location}
                  </div>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Status</CardDescription>
              <CardTitle className="text-lg">
                <span 
                  className={`
                    px-2 py-1 rounded-full text-xs font-medium 
                    ${project.status === 'active' ? 'bg-green-100 text-green-800' : ''} 
                    ${project.status === 'completed' ? 'bg-blue-100 text-blue-800' : ''} 
                    ${project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' : ''} 
                    ${project.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''} 
                  `}
                >
                  {project.status === 'active' && 'Active'}
                  {project.status === 'completed' && 'Completed'}
                  {project.status === 'on_hold' && 'On Hold'}
                  {project.status === 'cancelled' && 'Cancelled'}
                  {!['active', 'completed', 'on_hold', 'cancelled'].includes(project.status) && project.status}
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
        
        {project.description && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line">{project.description}</div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Project Leadership</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Project Lead</dt>
                  <dd>{getUserName(project.leadId || null)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Delivery Lead</dt>
                  <dd>{getUserName(project.deliveryLeadId || null)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              {project.confluenceLink ? (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">Confluence Link</div>
                  <div className="flex items-center">
                    <LinkIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <a
                      href={project.confluenceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {project.confluenceLink}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No documentation links available</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Created</dt>
                  <dd>{formatDate(project.createdAt, "MMM d, yyyy")}</dd>
                </div>
                {project.updatedAt && project.updatedAt !== project.createdAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Last Updated</dt>
                    <dd>{formatDate(project.updatedAt, "MMM d, yyyy")}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Tabs defaultValue="resources" className="w-full mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="skills">Required Skills</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        {/* Resources Tab */}
        <TabsContent value="resources">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Resources</CardTitle>
                <CardDescription>
                  Team members assigned to this project
                </CardDescription>
              </div>
              {isAdmin && (
                <Dialog open={openAddResource} onOpenChange={setOpenAddResource}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Resource
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Resource to Project</DialogTitle>
                      <DialogDescription>
                        Assign a team member to this project.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...addResourceForm}>
                      <form onSubmit={addResourceForm.handleSubmit(onAddResourceSubmit)} className="space-y-4">
                        <FormField
                          control={addResourceForm.control}
                          name="userId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>User</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  defaultValue={field.value.toString()}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select user" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableUsers.length === 0 ? (
                                      <SelectItem value="0" disabled>
                                        No available users
                                      </SelectItem>
                                    ) : (
                                      availableUsers.map((user: User) => (
                                        <SelectItem key={user.id} value={user.id.toString()}>
                                          {`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addResourceForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g. Developer, Designer, etc." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addResourceForm.control}
                          name="allocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Allocation (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  max="100"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Percentage of time allocated to this project (1-100)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={addResourceForm.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                  <Input
                                    type="date"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addResourceForm.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                  <Input
                                    type="date"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpenAddResource(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={addResource.isPending || availableUsers.length === 0}
                          >
                            {addResource.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Resource
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingResources ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : resources && resources.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Allocation</TableHead>
                        <TableHead>Timeline</TableHead>
                        {isAdmin && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resources.map((resource: ProjectResource) => (
                        <TableRow key={resource.id}>
                          <TableCell className="font-medium">
                            {getUserName(resource.userId)}
                          </TableCell>
                          <TableCell>{resource.role || "—"}</TableCell>
                          <TableCell>{resource.allocation}%</TableCell>
                          <TableCell>
                            {resource.startDate 
                              ? formatDate(resource.startDate, "MMM d, yyyy") 
                              : "—"} 
                            {resource.startDate && resource.endDate ? " → " : ""}
                            {resource.endDate 
                              ? formatDate(resource.endDate, "MMM d, yyyy") 
                              : resource.startDate ? " (Ongoing)" : ""}
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <AlertDialog
                                open={openRemoveResource === resource.id}
                                onOpenChange={(open) => !open && setOpenRemoveResource(null)}
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setOpenRemoveResource(resource.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remove
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove {getUserName(resource.userId)} from the project.
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setOpenRemoveResource(null)}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => removeResource.mutate(resource.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {removeResource.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-1">No resources assigned</h3>
                  <p className="text-gray-500 mb-4">
                    This project doesn't have any team members assigned yet.
                  </p>
                  {isAdmin && (
                    <Button
                      onClick={() => setOpenAddResource(true)}
                      disabled={availableUsers.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Resource
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Skills Tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Required Skills</CardTitle>
                <CardDescription>
                  Skills needed for this project
                </CardDescription>
              </div>
              {isAdmin && (
                <Dialog open={openAddSkill} onOpenChange={setOpenAddSkill}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Skill
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Skill to Project</DialogTitle>
                      <DialogDescription>
                        Add a required skill for this project.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...addSkillForm}>
                      <form onSubmit={addSkillForm.handleSubmit(onAddSkillSubmit)} className="space-y-4">
                        <FormField
                          control={addSkillForm.control}
                          name="skillId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Skill</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  defaultValue={field.value.toString()}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select skill" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableSkills.length === 0 ? (
                                      <SelectItem value="0" disabled>
                                        No available skills
                                      </SelectItem>
                                    ) : (
                                      availableSkills.map((skill: Skill) => (
                                        <SelectItem key={skill.id} value={skill.id.toString()}>
                                          {skill.name} - {skill.category}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addSkillForm.control}
                          name="importance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Importance</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpenAddSkill(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={addProjectSkill.isPending || availableSkills.length === 0}
                          >
                            {addProjectSkill.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Skill
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingProjectSkills ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : projectSkills && projectSkills.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Skill</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Importance</TableHead>
                        {isAdmin && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectSkills.map((projectSkill: ProjectSkill) => {
                        const skill = getSkill(projectSkill.skillId);
                        return (
                          <TableRow key={projectSkill.id}>
                            <TableCell className="font-medium">
                              {skill ? skill.name : getSkillName(projectSkill.skillId)}
                            </TableCell>
                            <TableCell>
                              {skill && <SkillLevelBadge level={skill.level} />}
                            </TableCell>
                            <TableCell>{skill?.category || "—"}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`
                                  ${projectSkill.importance === 'high' ? 'border-red-200 bg-red-50 text-red-700' : ''}
                                  ${projectSkill.importance === 'medium' ? 'border-blue-200 bg-blue-50 text-blue-700' : ''}
                                  ${projectSkill.importance === 'low' ? 'border-gray-200 bg-gray-50 text-gray-700' : ''}
                                `}
                              >
                                {projectSkill.importance.charAt(0).toUpperCase() + projectSkill.importance.slice(1)}
                              </Badge>
                            </TableCell>
                            {isAdmin && (
                              <TableCell>
                                <AlertDialog
                                  open={openRemoveSkill === projectSkill.id}
                                  onOpenChange={(open) => !open && setOpenRemoveSkill(null)}
                                >
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setOpenRemoveSkill(projectSkill.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Remove
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will remove {getSkillName(projectSkill.skillId)} from the required skills for this project.
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setOpenRemoveSkill(null)}>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => removeProjectSkill.mutate(projectSkill.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {removeProjectSkill.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Remove
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Computer className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-1">No skills specified</h3>
                  <p className="text-gray-500 mb-4">
                    This project doesn't have any required skills specified yet.
                  </p>
                  {isAdmin && (
                    <Button
                      onClick={() => setOpenAddSkill(true)}
                      disabled={availableSkills.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Skill
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Resource History</CardTitle>
              <CardDescription>
                Timeline of resource changes on this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : resourceHistory && resourceHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Changed By</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resourceHistory.map((history: ResourceHistory) => (
                        <TableRow key={history.id}>
                          <TableCell className="whitespace-nowrap">
                            {history.date ? formatDate(history.date, "MMM d, yyyy") : "—"}
                          </TableCell>
                          <TableCell>
                            {getUserName(history.userId)}
                          </TableCell>
                          <TableCell>
                            {history.action === 'added' && (
                              <Badge className="bg-green-100 text-green-800">Added</Badge>
                            )}
                            {history.action === 'removed' && (
                              <Badge className="bg-red-100 text-red-800">Removed</Badge>
                            )}
                            {history.action === 'role_changed' && (
                              <Badge className="bg-blue-100 text-blue-800">Role Changed</Badge>
                            )}
                            {history.action === 'allocation_changed' && (
                              <Badge className="bg-yellow-100 text-yellow-800">Allocation Changed</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {history.performedById ? getUserName(history.performedById) : "—"}
                          </TableCell>
                          <TableCell>
                            {history.action === 'added' && 
                              `Role: ${history.newRole || "N/A"}, Allocation: ${history.newAllocation || 0}%`}
                            {history.action === 'removed' && 
                              `Previous role: ${history.previousRole || "N/A"}`}
                            {history.action === 'role_changed' && 
                              `${history.previousRole || "None"} → ${history.newRole || "None"}`}
                            {history.action === 'allocation_changed' && 
                              `${history.previousAllocation || 0}% → ${history.newAllocation || 0}%`}
                            {history.note && `: ${history.note}`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-1">No history available</h3>
                  <p className="text-gray-500">
                    No resource changes have been recorded for this project yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}