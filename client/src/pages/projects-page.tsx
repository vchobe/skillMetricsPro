import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/date-utils";

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
  status: z.string().default("active")
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
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: "name",
    direction: "asc",
  });

  // Fetch all projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
    refetchOnWindowFocus: false,
  });

  // Fetch all clients for the dropdown
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/clients"],
    refetchOnWindowFocus: false,
  });

  // Fetch all users for lead dropdown
  const { data: users, isLoading: isLoadingUsers } = useQuery({
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
      status: "active"
    },
  });

  // Create project mutation
  const createProject = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      return apiRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
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
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
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
        .filter((project: any) => {
          return (
            project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (project.description && 
              project.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (project.location && 
              project.location.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        })
        .sort((a: any, b: any) => {
          const { field, direction } = sortConfig;
          let comparison = 0;

          switch (field) {
            case "name":
              comparison = a.name.localeCompare(b.name);
              break;
            case "client":
              const clientA = a.clientId ? (clients?.find((c: any) => c.id === a.clientId)?.name || "") : "";
              const clientB = b.clientId ? (clients?.find((c: any) => c.id === b.clientId)?.name || "") : "";
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
    const client = clients.find((c: any) => c.id === clientId);
    return client ? client.name : "N/A";
  };

  // Get user name by ID
  const getUserName = (userId: number) => {
    if (!users) return "Loading...";
    const user = users.find((u: any) => u.id === userId);
    return user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username : "N/A";
  };

  return (
    <div className="container mx-auto py-6">
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
                              onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                              defaultValue={field.value?.toString() || ""}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a client" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {clients?.map((client: any) => (
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
                              onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                              defaultValue={field.value?.toString() || ""}
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
                      control={form.control}
                      name="deliveryLeadId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Lead</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                              defaultValue={field.value?.toString() || ""}
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
                  <TableHead>
                    Lead
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    Status {renderSortIcon("status")}
                  </TableHead>
                  <TableHead>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((project: any) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <Link href={`/projects/${project.id}`} className="text-blue-600 hover:underline">
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {project.clientId ? getClientName(project.clientId) : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
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
                      </TableCell>
                      <TableCell>
                        {project.leadId ? getUserName(project.leadId) : "—"}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/projects/${project.id}`}>
                              <FileText className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          {project.confluenceLink && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={project.confluenceLink} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-4 w-4 mr-1" />
                                Docs
                              </a>
                            </Button>
                          )}
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
  );
}