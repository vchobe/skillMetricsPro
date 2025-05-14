import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
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
  Card,
  CardContent,
  CardDescription,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, Plus, Calendar, Building, FileText } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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

type ProjectFormValues = z.infer<typeof projectSchema>;

type SortField = "name" | "client" | "startDate" | "status";
type SortDirection = "asc" | "desc";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.isAdmin || user?.is_admin;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [openNewProject, setOpenNewProject] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: "name",
    direction: "asc",
  });

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

  // Fetch all projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    refetchOnWindowFocus: false,
  });

  // Fetch all clients for the dropdown
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    refetchOnWindowFocus: false,
  });

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

  // Fetch all users for lead dropdown
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    refetchOnWindowFocus: false,
  });

  // Form for creating new project
  const form = useForm<ProjectFormValues>({
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

  // Create project mutation
  const createProject = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      try {
        // Convert string values to appropriate types and ensure proper null handling
        const formattedData = {
          ...data,
          clientId: typeof data.clientId === "string" && data.clientId === "null" ? null : 
                   data.clientId === null || data.clientId === undefined ? null : 
                   Number(data.clientId),
          leadId: typeof data.leadId === "string" && data.leadId === "null" ? null : 
                 data.leadId === null || data.leadId === undefined ? null : 
                 Number(data.leadId),
          deliveryLeadId: typeof data.deliveryLeadId === "string" && data.deliveryLeadId === "null" ? null : 
                         data.deliveryLeadId === null || data.deliveryLeadId === undefined ? null : 
                         Number(data.deliveryLeadId),
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          // Ensure email fields are included with proper empty string handling
          projectLeadEmail: data.projectLeadEmail || "",
          clientEngagementLeadEmail: data.clientEngagementLeadEmail || "",
          hrCoordinatorEmail: data.hrCoordinatorEmail || "",
          financeTeamEmail: data.financeTeamEmail || "",
        };
        
        console.log("Creating project with data:", formattedData);
        return await apiRequest("POST", "/api/projects", formattedData);
      } catch (err) {
        console.error("Error in project creation mutation:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project created successfully",
        variant: "default",
      });
      setOpenNewProject(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Failed to create project:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project. Please check your form data and try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ProjectFormValues) => {
    createProject.mutate(data);
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Function to render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  // Filter and sort projects
  const filteredProjects = projects
    ? projects
        .filter((project: Project) => {
          return (
            project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (project.description && 
              project.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (project.location && 
              project.location.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        })
        .sort((a: Project, b: Project) => {
          const { field, direction } = sortConfig;
          let comparison = 0;

          switch (field) {
            case "name":
              comparison = a.name.localeCompare(b.name);
              break;
            case "client":
              const clientA = a.clientId && clients ? (clients.find((c) => c.id === a.clientId)?.name || "") : "";
              const clientB = b.clientId && clients ? (clients.find((c) => c.id === b.clientId)?.name || "") : "";
              comparison = clientA.localeCompare(clientB);
              break;
            case "startDate":
              // Handle null dates
              if (!a.startDate) return direction === "asc" ? 1 : -1;
              if (!b.startDate) return direction === "asc" ? -1 : 1;
              comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
              break;
            case "status":
              comparison = a.status.localeCompare(b.status);
              break;
            default:
              comparison = 0;
          }

          return direction === "asc" ? comparison : -comparison;
        })
    : [];

  // Get client name by ID
  const getClientName = (clientId: number) => {
    if (!clients) return "Loading...";
    const client = clients.find((c: Client) => c.id === clientId);
    return client ? client.name : "N/A";
  };

  // Get user name by ID
  const getUserName = (userId: number) => {
    if (!users) return "Loading...";
    const user = users.find((u: User) => u.id === userId);
    return user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username : "N/A";
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/projects" />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header 
          title="Projects" 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Projects</h1>
              <p className="text-gray-500">
                Manage and view details of all projects in the organization
              </p>
            </div>
            
            {isAdmin && (
              <Dialog open={openNewProject} onOpenChange={setOpenNewProject}>
                <DialogTrigger asChild>
                  <Button className="mt-4 md:mt-0">
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Add details for the new project. Required fields are marked with an asterisk (*).
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
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
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="clientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => field.onChange(value === "null" ? null : value ? parseInt(value) : null)}
                                  defaultValue={field.value === null ? "null" : field.value?.toString() || undefined}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a client" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="null">None</SelectItem>
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
                          control={form.control}
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
                          control={form.control}
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
                          control={form.control}
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
                        control={form.control}
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
                        control={form.control}
                        name="confluenceLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Documentation Link</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
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
                          control={form.control}
                          name="leadId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project Lead</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => field.onChange(value === "null" ? null : value ? parseInt(value) : null)}
                                  defaultValue={field.value === null ? "null" : field.value?.toString() || undefined}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select project lead" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="null">None</SelectItem>
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
                          control={form.control}
                          name="deliveryLeadId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client Engagement Lead</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => field.onChange(value === "null" ? null : value ? parseInt(value) : null)}
                                  defaultValue={field.value === null ? "null" : field.value?.toString() || undefined}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select client engagement lead" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="null">None</SelectItem>
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="projectLeadEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project Lead Email ID</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="projectlead@example.com"
                                  type="email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="clientEngagementLeadEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client Engagement Lead Email ID</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="engagementlead@example.com"
                                  type="email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="hrCoordinatorEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>HR Coordinator Email</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="hr@example.com"
                                  type="email"
                                />
                              </FormControl>
                              <FormDescription>
                                Email for HR notifications about this project
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="financeTeamEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Finance Team Email</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="finance@example.com"
                                  type="email"
                                />
                              </FormControl>
                              <FormDescription>
                                Email for finance notifications about this project
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
                          onClick={() => setOpenNewProject(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createProject.isPending}
                        >
                          {createProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Create Project
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Search Projects</CardTitle>
              <CardDescription>
                Find projects by name, description, or location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          
          {isLoadingProjects ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="w-[250px] cursor-pointer"
                        onClick={() => handleSort("name")}
                      >
                        Name {renderSortIcon("name")}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort("client")}
                      >
                        Client {renderSortIcon("client")}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort("startDate")}
                      >
                        Dates {renderSortIcon("startDate")}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort("status")}
                      >
                        Status {renderSortIcon("status")}
                      </TableHead>
                      <TableHead>Project Lead</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No projects found. {isAdmin && "Create a new project to get started."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProjects.map((project: Project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>
                            {project.clientId ? getClientName(project.clientId) : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-gray-500">Start</span>
                              <span>{project.startDate ? formatDate(project.startDate, "MMM d, yyyy") : "—"}</span>
                              
                              {project.endDate && (
                                <>
                                  <span className="text-xs font-medium text-gray-500 mt-1">End</span>
                                  <span>{formatDate(project.endDate, "MMM d, yyyy")}</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                              ${project.status === "active" ? "bg-green-100 text-green-800" : 
                                project.status === "completed" ? "bg-blue-100 text-blue-800" : 
                                project.status === "on_hold" ? "bg-amber-100 text-amber-800" : 
                                "bg-red-100 text-red-800"}`}>
                              {project.status.replace("_", " ")}
                            </span>
                          </TableCell>
                          <TableCell>
                            {project.leadId ? getUserName(project.leadId) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/projects/${project.id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}