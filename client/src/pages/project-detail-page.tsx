import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/date-utils";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

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
  Mail,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SkillLevelBadge from "@/components/skill-level-badge";

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
  hrCoordinatorEmail?: string;
  financeTeamEmail?: string;
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

interface SkillTemplate {
  id: number;
  name: string;
  category?: string;
  categoryId?: number | null;
  subcategoryId?: number | null;
  description?: string;
  isRecommended?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectResource {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  // email field removed - now using getUserEmail helper function to fetch dynamically
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
  skillTemplateId: number; // Changed from skillId to skillTemplateId
  requiredLevel: string; // beginner, intermediate, expert
  userSkillId?: number; // Optional legacy reference
  createdAt: string;
  updatedAt?: string;
  skillName?: string; // From the join query
  skillCategory?: string; // From the join query
  description?: string; // From the join query
  skillLevel?: string; // From the join query
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
  projectLeadEmail: z.string().email("Invalid project lead email format").optional(),
  clientEngagementLeadEmail: z.string().email("Invalid client engagement lead email format").optional(),
  status: z.string().default("active"),
  hrCoordinatorEmail: z.string().email("Invalid HR coordinator email format").optional(),
  financeTeamEmail: z.string().email("Invalid finance team email format").optional()
});

// Resource schema
const resourceSchema = z.object({
  userId: z.coerce.number(),
  role: z.string().nullable().optional(),
  allocation: z.coerce.number().min(1).max(100),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable()
});

// Project skill schema
const projectSkillSchema = z.object({
  skillTemplateId: z.coerce.number(),
  requiredLevel: z.enum(["beginner", "intermediate", "expert"]).default("intermediate")
});

type ProjectFormValues = z.infer<typeof projectSchema>;
type ResourceFormValues = z.infer<typeof resourceSchema> & { 
  projectId?: number; // Add optional projectId for internal use
};
type ProjectSkillFormValues = z.infer<typeof projectSkillSchema>;

// Extended Project type to include the new email fields
interface ExtendedProject extends Project {
  projectLeadEmail?: string;
  clientEngagementLeadEmail?: string;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.isAdmin || user?.is_admin;
  const isSuperAdmin = user?.email === "admin@atyeti.com";
  
  // State for project editing permissions
  const [canEditProject, setCanEditProject] = useState<boolean>(false);
  
  // Function to transform role name for display (UI only change)
  const getDisplayRoleName = (roleName: string | null | undefined): string => {
    if (!roleName) return "—";
    return roleName === "Delivery Lead" ? "Client Engagement Lead" : roleName;
  };
  
  // Query to check if the user is a project lead or super admin
  const { data: projectLeadData } = useQuery({
    queryKey: ["/api/user/is-project-lead", id],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/user/is-project-lead/${id}`);
        if (!res.ok) {
          throw new Error(`Failed to check project lead status: ${res.statusText}`);
        }
        return await res.json();
      } catch (error) {
        console.error("Error checking project lead status:", error);
        // Default to no edit permissions if there's an error
        return { canEdit: false, isSuperAdmin: false, isProjectLead: false };
      }
    },
    enabled: !!user && !!id
  });
  
  // Update canEditProject when the data changes
  useEffect(() => {
    if (projectLeadData) {
      setCanEditProject(projectLeadData.canEdit);
      console.log("Project lead check result:", projectLeadData);
    } else if (user?.email === "admin@atyeti.com") {
      // Super admin fallback if API call fails but user is the super admin
      setCanEditProject(true);
      console.log("Super admin detected, enabling edit permissions");
    }
  }, [projectLeadData, user]);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openEditProject, setOpenEditProject] = useState(false);
  const [openAddResource, setOpenAddResource] = useState(false);
  const [openRemoveResource, setOpenRemoveResource] = useState<number | null>(null);
  const [openAddSkill, setOpenAddSkill] = useState(false);
  const [openRemoveSkill, setOpenRemoveSkill] = useState<number | null>(null);
  
  // Fetch project details
  const { data: project, isLoading: isLoadingProject } = useQuery<ExtendedProject>({
    queryKey: ["/api/projects", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${id}`);
      return await res.json();
    },
    refetchOnWindowFocus: false,
  });
  
  // Fetch project resources
  const { data: resources, isLoading: isLoadingResources } = useQuery<ProjectResource[]>({
    queryKey: ["/api/projects", id, "resources"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${id}/resources`);
      return await res.json();
    },
    refetchOnWindowFocus: false,
  });
  
  // Fetch project skills
  const { data: projectSkills, isLoading: isLoadingProjectSkills } = useQuery<ProjectSkill[]>({
    queryKey: ["/api/projects", id, "skills"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${id}/skills`);
      return await res.json();
    },
    refetchOnWindowFocus: false,
  });
  
  // Fetch all skill templates for the skill dropdown
  const { data: skillTemplates, isLoading: isLoadingSkillTemplates } = useQuery<SkillTemplate[]>({
    queryKey: ["/api/skill-templates"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/skill-templates");
      return await res.json();
    },
    refetchOnWindowFocus: false,
  });
  
  // Fetch all clients for the dropdown
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clients");
      return await res.json();
    },
    refetchOnWindowFocus: false,
  });
  
  // Fetch all users for dropdowns
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return await res.json();
    },
    refetchOnWindowFocus: false,
  });
  
  // Fetch resource history
  const { data: resourceHistory, isLoading: isLoadingHistory } = useQuery<ResourceHistory[]>({
    queryKey: ["/api/projects", id, "resource-history"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${id}/resource-history`);
      return await res.json();
    },
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
      projectLeadEmail: "",
      clientEngagementLeadEmail: "",
      status: "active",
      hrCoordinatorEmail: "",
      financeTeamEmail: ""
    },
  });
  
  // Set form values when project data is loaded
  useEffect(() => {
    if (project) {
      // Cast project to ExtendedProject to access the new email fields
      const extProject = project as ExtendedProject;
      editProjectForm.reset({
        name: project.name,
        description: project.description || "",
        clientId: project.clientId || null,
        startDate: project.startDate || null,
        endDate: project.endDate || null,
        location: project.location || "",
        confluenceLink: project.confluenceLink || "",
        leadId: project.leadId || null,
        deliveryLeadId: project.deliveryLeadId || null,
        projectLeadEmail: extProject.projectLeadEmail || "",
        clientEngagementLeadEmail: extProject.clientEngagementLeadEmail || "",
        status: project.status || "active",
        hrCoordinatorEmail: project.hrCoordinatorEmail || "",
        financeTeamEmail: project.financeTeamEmail || ""
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
      endDate: null
    },
  });
  
  // Form for adding new project skill
  const addSkillForm = useForm<ProjectSkillFormValues>({
    resolver: zodResolver(projectSkillSchema),
    defaultValues: {
      skillTemplateId: 0,
      requiredLevel: "intermediate"
    },
  });
  
  // Update project mutation
  const updateProject = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      // Convert string values to appropriate types
      const formattedData = {
        ...data,
        clientId: data.clientId === null || data.clientId === undefined ? null : Number(data.clientId),
        leadId: data.leadId === null || data.leadId === undefined ? null : Number(data.leadId),
        deliveryLeadId: data.deliveryLeadId === null || data.deliveryLeadId === undefined ? null : Number(data.deliveryLeadId),
      };
      console.log("Updating project with data:", formattedData);
      return apiRequest("PATCH", `/api/projects/${id}`, formattedData);
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
      console.error("Failed to update project:", error);
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
      // Create a copy of the data to avoid mutating the original
      const formattedData = { ...data };
      
      // Ensure proper projectId is included
      formattedData.projectId = parseInt(id);
      
      // Convert empty string dates to null
      if (formattedData.startDate === "") {
        formattedData.startDate = null;
      }
      
      if (formattedData.endDate === "") {
        formattedData.endDate = null;
      }
      
      console.log("Adding resource with data:", formattedData);
      
      return apiRequest("POST", `/api/projects/${id}/resources`, formattedData);
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
      console.error("Failed to add resource:", error);
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
      const res = await fetch(`/api/projects/resources/${resourceId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      
      // For 204 No Content responses, we don't parse the body
      if (res.status === 204) {
        return null;
      }
      
      return res.json();
    },
    onSuccess: () => {
      // Invalidate both resource lists and history
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "resource-history"] });
      // Also invalidate user projects as this change might affect user's project list
      queryClient.invalidateQueries({ queryKey: ["/api/user/projects"] });
      
      toast({
        title: "Success",
        description: "Resource removed successfully",
        variant: "default",
      });
      setOpenRemoveResource(null);
    },
    onError: (error: Error) => {
      console.error("Error removing resource:", error);
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
      const res = await fetch(`/api/projects/skills/${projectSkillId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      
      // For 204 No Content responses, we don't parse the body
      if (res.status === 204) {
        return null;
      }
      
      return res.json();
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
  
  // Function to convert UI role names back to backend role names
  const getBackendRoleName = (roleName: string | null | undefined): string | null | undefined => {
    if (!roleName) return roleName;
    return roleName === "Client Engagement Lead" ? "Delivery Lead" : roleName;
  };

  // Handle add resource form submission
  const onAddResourceSubmit = (data: ResourceFormValues) => {
    // Convert UI role name to backend role name
    const submissionData = {
      ...data,
      role: getBackendRoleName(data.role)
    };
    addResource.mutate(submissionData);
  };
  
  // Handle add project skill form submission
  const onAddSkillSubmit = (data: ProjectSkillFormValues) => {
    addProjectSkill.mutate(data);
  };
  
  // Get client name by ID
  const getClientName = (clientId: number | null | undefined) => {
    if (!clientId) return "—";
    if (!clients) return "Loading...";
    const client = clients.find((c: Client) => c.id === clientId);
    return client ? client.name : "—";
  };
  
  // Get user name by ID
  const getUserName = (userId: number | null | undefined) => {
    if (!userId) return "—";
    if (!users) return "Loading...";
    const user = users.find((u: User) => u.id === userId);
    return user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username : "—";
  };
  
  // Helper function to get user email
  const getUserEmail = (userId: number | null | undefined) => {
    if (!userId) return "—";
    if (!users) return "Loading...";
    const user = users.find((u: User) => u.id === userId);
    return user ? user.email : "—";
  };
  
  // Get skill name by template ID
  const getSkillName = (templateId: number) => {
    if (!skillTemplates) return "Loading...";
    const template = skillTemplates.find((t: SkillTemplate) => t.id === templateId);
    return template ? template.name : "—";
  };
  
  // Get skill template by template ID
  const getSkillTemplate = (templateId: number) => {
    if (!skillTemplates) return null;
    return skillTemplates.find((t: SkillTemplate) => t.id === templateId);
  };
  
  // Create an array of available skill templates to choose from
  // Filter out templates that are already assigned to the project
  const availableSkillTemplates = skillTemplates
    ? skillTemplates.filter((template: SkillTemplate) => 
        !projectSkills || !projectSkills.some((ps: ProjectSkill) => ps.skillTemplateId === template.id)
      )
    : [];
    
  // Create an array of available users (all users except those already assigned)
  const availableUsers = users
    ? users.filter((user: User) => 
        !resources || !resources.some((r: ProjectResource) => r.userId === user.id)
      )
    : [];
  
  if (isLoadingProject || !project) {
    return (
      <div className="min-h-screen flex">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/projects" />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'} flex items-center justify-center`}>
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-lg text-gray-600">Loading project details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/projects" />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header title={project.name} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />
        
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="flex space-x-2">
                  {canEditProject ? (
                    <>
                      <Button variant="outline" onClick={() => setOpenEditProject(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Project
                      </Button>
                      <Button onClick={() => setOpenAddResource(true)}>
                        <Users className="mr-2 h-4 w-4" />
                        Add Resource
                      </Button>
                      <Button variant="outline" onClick={() => setOpenAddSkill(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Skill
                      </Button>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      Only project leads or super admins can edit projects
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{getClientName(project.clientId)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Dates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-md">
                    <span className="font-medium">Start:</span> {project.startDate ? formatDate(project.startDate) : "Not set"}
                  </p>
                  <p className="text-md">
                    <span className="font-medium">End:</span> {project.endDate ? formatDate(project.endDate) : "Not set"}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{project.location || "Not specified"}</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Leadership
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-md">
                    <span className="font-medium">Project Lead:</span> {getUserName(project.leadId)}
                  </p>
                  <p className="text-md">
                    <span className="font-medium">Client Engagement Lead:</span> {getUserName(project.deliveryLeadId)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge 
                    className={
                      project.status === "active" ? "bg-green-100 text-green-800" :
                      project.status === "planning" ? "bg-blue-100 text-blue-800" :
                      project.status === "completed" ? "bg-gray-100 text-gray-800" :
                      "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Badge>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-md">
                    <span className="font-medium">HR:</span> {project.hrCoordinatorEmail || "Not set"}
                  </p>
                  <p className="text-md">
                    <span className="font-medium">Finance:</span> {project.financeTeamEmail || "Not set"}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {project.description && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{project.description}</p>
                </CardContent>
              </Card>
            )}
            
            {project.confluenceLink && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Project Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a 
                    href={project.confluenceLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline flex items-center"
                  >
                    {project.confluenceLink}
                    <LinkIcon className="ml-2 h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
          
          <Tabs defaultValue="resources">
            <TabsList>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="skills">Required Skills</TabsTrigger>
              <TabsTrigger value="history">Resource History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="resources">
              <Card>
                <CardHeader>
                  <CardTitle>Project Resources</CardTitle>
                  <CardDescription>
                    Team members assigned to this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingResources ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !resources || resources.length === 0 ? (
                    <div className="text-center py-6">
                      <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-1">No resources assigned</h3>
                      <p className="text-gray-500">
                        This project doesn't have any team members assigned to it yet.
                      </p>
                      {isAdmin && (
                        <Button
                          onClick={() => setOpenAddResource(true)}
                          className="mt-4"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Add Resource
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Allocation</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {resources.map((resource: ProjectResource) => (
                            <TableRow key={resource.id}>
                              <TableCell className="font-medium">{getUserName(resource.userId)}</TableCell>
                              <TableCell>
                                {getUserEmail(resource.userId) || "Not set"}
                              </TableCell>
                              <TableCell>
                                {getDisplayRoleName(resource.role)}
                              </TableCell>
                              <TableCell>{resource.allocation || 100}%</TableCell>
                              <TableCell>
                                {resource.startDate ? formatDate(resource.startDate) : "Not set"}
                              </TableCell>
                              <TableCell>
                                {resource.endDate ? formatDate(resource.endDate) : "Not set"}
                              </TableCell>
                              <TableCell>
                                {isAdmin && canEditProject && (
                                  <AlertDialog open={openRemoveResource === resource.id} onOpenChange={(isOpen) => {
                                    if (!isOpen) setOpenRemoveResource(null);
                                  }}>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setOpenRemoveResource(resource.id)}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Resource</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to remove {getUserName(resource.userId)} from this project?
                                          This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-red-600 text-white hover:bg-red-700"
                                          onClick={() => removeResource.mutate(resource.id)}
                                        >
                                          {removeResource.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            "Remove"
                                          )}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="skills">
              <Card>
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                  <CardDescription>
                    Skills needed for this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProjectSkills ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !projectSkills || projectSkills.length === 0 ? (
                    <div className="text-center py-6">
                      <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-1">No skills defined</h3>
                      <p className="text-gray-500">
                        No specific skills have been identified for this project yet.
                      </p>
                      {isAdmin && (
                        <Button
                          onClick={() => setOpenAddSkill(true)}
                          className="mt-4"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Skill
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Skill</TableHead>
                            <TableHead>Available Level</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Required Level</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectSkills.map((projectSkill: ProjectSkill) => {
                            const template = getSkillTemplate(projectSkill.skillTemplateId);
                            return (
                              <TableRow key={projectSkill.id}>
                                <TableCell className="font-medium">
                                  {projectSkill.skillName || (template ? template.name : "—")}
                                </TableCell>
                                <TableCell>
                                  {/* Display the required level for the project */}
                                  <SkillLevelBadge level={projectSkill.requiredLevel} />
                                </TableCell>
                                <TableCell>{projectSkill.skillCategory || template?.category || "—"}</TableCell>
                                <TableCell>
                                  {isAdmin && canEditProject && (
                                    <AlertDialog open={openRemoveSkill === projectSkill.id} onOpenChange={(isOpen) => {
                                      if (!isOpen) setOpenRemoveSkill(null);
                                    }}>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setOpenRemoveSkill(projectSkill.id)}
                                        >
                                          <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Remove Skill</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to remove this skill from the project requirements?
                                            This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-red-600 text-white hover:bg-red-700"
                                            onClick={() => removeProjectSkill.mutate(projectSkill.id)}
                                          >
                                            {removeProjectSkill.isPending ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              "Remove"
                                            )}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Resource History</CardTitle>
                  <CardDescription>
                    Record of resource changes on this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingHistory ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !resourceHistory || resourceHistory.length === 0 ? (
                    <div className="text-center py-6">
                      <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-1">No history available</h3>
                      <p className="text-gray-500">
                        No resource changes have been recorded for this project yet.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Resource</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Performed By</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {resourceHistory.map((history: ResourceHistory) => (
                            <TableRow key={history.id}>
                              <TableCell>
                                {formatDate(history.date)}
                              </TableCell>
                              <TableCell className="font-medium">
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
                                  `Role: ${getDisplayRoleName(history.newRole)}, Allocation: ${history.newAllocation || 0}%`}
                                {history.action === 'removed' && 
                                  `Previous role: ${getDisplayRoleName(history.previousRole)}`}
                                {history.action === 'role_changed' && 
                                  `${getDisplayRoleName(history.previousRole)} → ${getDisplayRoleName(history.newRole)}`}
                                {history.action === 'allocation_changed' && 
                                  `${history.previousAllocation || 0}% → ${history.newAllocation || 0}%`}
                                {history.note && `: ${history.note}`}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Edit Project Dialog */}
      <Dialog open={openEditProject} onOpenChange={setOpenEditProject}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the project details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editProjectForm}>
            <form onSubmit={editProjectForm.handleSubmit(onEditProjectSubmit)} className="space-y-4">
              <FormField
                control={editProjectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
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
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editProjectForm.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                        value={field.value !== null && field.value !== undefined ? field.value.toString() : "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {clients?.map((client: Client) => (
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
                  control={editProjectForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editProjectForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
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
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editProjectForm.control}
                  name="leadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Lead</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                        value={field.value !== null && field.value !== undefined ? field.value.toString() : "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project lead" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {users?.map((user: User) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : user.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editProjectForm.control}
                  name="deliveryLeadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Engagement Lead</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                        value={field.value !== null && field.value !== undefined ? field.value.toString() : "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client engagement lead" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {users?.map((user: User) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : user.username}
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
                control={editProjectForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Confluence Link</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editProjectForm.control}
                  name="projectLeadEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Lead Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormDescription>
                        For project notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editProjectForm.control}
                  name="clientEngagementLeadEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Engagement Lead Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormDescription>
                        For client communications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editProjectForm.control}
                  name="hrCoordinatorEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HR Coordinator Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormDescription>
                        For resource notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editProjectForm.control}
                  name="financeTeamEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Finance Team Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormDescription>
                        For resource notifications
                      </FormDescription>
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
                  {updateProject.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Resource Dialog */}
      <Dialog open={openAddResource} onOpenChange={setOpenAddResource}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
            <DialogDescription>
              Add a team member to this project.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addResourceForm}>
            <form onSubmit={addResourceForm.handleSubmit(onAddResourceSubmit)} className="space-y-4">
              <FormField
                control={addResourceForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Member</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const userId = parseInt(value);
                        field.onChange(userId);
                      }}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUsers.map((user: User) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Input 
                        {...field} 
                        value={field.value || ''} 
                        placeholder="e.g. Developer, Client Engagement Lead, Designer" 
                      />
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
                        {...field} 
                        type="number" 
                        min={1} 
                        max={100} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Percentage of time allocated to this project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addResourceForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
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
                        <Input type="date" {...field} value={field.value || ""} />
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
                  disabled={addResource.isPending}
                >
                  {addResource.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Resource"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Skill Dialog */}
      <Dialog open={openAddSkill} onOpenChange={setOpenAddSkill}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Required Skill</DialogTitle>
            <DialogDescription>
              Add a skill requirement to this project.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addSkillForm}>
            <form onSubmit={addSkillForm.handleSubmit(onAddSkillSubmit)} className="space-y-4">
              <FormField
                control={addSkillForm.control}
                name="skillTemplateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select skill" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableSkillTemplates.map((template: SkillTemplate) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name} ({template.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addSkillForm.control}
                name="requiredLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? ""}
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
                  disabled={addProjectSkill.isPending}
                >
                  {addProjectSkill.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Skill"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}