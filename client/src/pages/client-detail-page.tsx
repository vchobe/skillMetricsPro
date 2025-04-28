import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/date-utils";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Building,
  Briefcase,
  Mail,
  Phone,
  Globe,
  Info,
  ArrowLeft,
  Edit,
  Loader2,
  Trash2,
  User,
  CalendarDays,
  Link as LinkIcon,
} from "lucide-react";

// Client form schema for validation
const clientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  industry: z.string().optional(),
  accountManagerId: z.number().nullable().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

export default function ClientDetailPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || user?.is_admin;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openEditClient, setOpenEditClient] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Extract client ID from URL
  const clientId = parseInt(location.split("/")[2]);
  
  // Client data query
  const {
    data: client,
    isLoading: isLoadingClient,
    error
  } = useQuery({
    queryKey: ['/api/clients', clientId],
    queryFn: async () => {
      const res = await apiRequest<any>("GET", `/api/clients/${clientId}`);
      return await res.json();
    },
    enabled: !isNaN(clientId)
  });
  
  // Projects for this client query
  const {
    data: clientProjects,
    isLoading: isLoadingProjects
  } = useQuery({
    queryKey: ['/api/clients', clientId, 'projects'],
    queryFn: async () => {
      const res = await apiRequest<any[]>("GET", `/api/clients/${clientId}/projects`);
      return await res.json();
    },
    enabled: !isNaN(clientId)
  });
  
  // Fetch all users for account manager dropdown
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ["/api/users"],
    refetchOnWindowFocus: false,
  });

  // Edit client form
  const editClientForm = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      industry: "",
      accountManagerId: null,
      website: "",
      notes: ""
    }
  });
  
  // Reset form values when client data loads or changes
  React.useEffect(() => {
    if (client) {
      editClientForm.reset({
        name: client.name || "",
        industry: client.industry || "",
        accountManagerId: client.accountManagerId || null,
        website: client.website || "",
        notes: client.notes || ""
      });
    }
  }, [client, editClientForm]);
  
  // Update client mutation
  const updateClient = useMutation({
    mutationFn: async (data: z.infer<typeof clientSchema>) => {
      const res = await apiRequest<any>("PATCH", `/api/clients/${clientId}`, data);
      if (res.status === 204) {
        return {}; // Return empty object for success with no content
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Client updated",
        description: "Client information has been updated successfully.",
      });
      setOpenEditClient(false);
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update client",
        description: error.message || "An error occurred while updating the client.",
        variant: "destructive"
      });
    }
  });
  
  // Delete client mutation
  const deleteClient = useMutation({
    mutationFn: async () => {
      const res = await apiRequest<any>("DELETE", `/api/clients/${clientId}`);
      if (res.status === 204) {
        return {}; // Return empty object for success with no content
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Client deleted",
        description: "Client has been deleted successfully.",
      });
      setLocation("/clients");
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete client",
        description: error.message || "An error occurred while deleting the client.",
        variant: "destructive"
      });
    }
  });
  
  // Handle client form submission
  const onEditClientSubmit = (data: z.infer<typeof clientSchema>) => {
    updateClient.mutate(data);
  };
  
  // Loading state
  if (isLoadingClient || !client) {
    return (
      <div className="min-h-screen flex">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/clients" />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'} flex items-center justify-center`}>
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-lg text-gray-600">Loading client details...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/clients" />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'} flex items-center justify-center`}>
          <div className="text-center max-w-md mx-auto">
            <Info className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Client</h2>
            <p className="text-gray-600 mb-4">
              {(error as Error).message || "An error occurred while loading the client information."}
            </p>
            <Button onClick={() => setLocation("/clients")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/clients" />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header 
          title={client.name} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
              <div className="flex items-center mb-4 sm:mb-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/clients")}
                  className="mr-4"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <h1 className="text-3xl font-bold">{client.name}</h1>
              </div>
              
              {isAdmin && (
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setOpenEditClient(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Client
                  </Button>
                  <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the client "{client.name}" and cannot be undone.
                          Any projects associated with this client will have their client reference removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteClient.mutate()}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleteClient.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Industry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{client.industry || "Not specified"}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Client Since
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{formatDate(client.createdAt)}</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Account Manager
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {client.accountManagerId ? (
                    (() => {
                      const manager = users.find(user => user.id === client.accountManagerId);
                      return manager ? (
                        <div>
                          <p className="text-md font-medium">
                            {manager.firstName && manager.lastName
                              ? `${manager.firstName} ${manager.lastName}`
                              : manager.username}
                          </p>
                          <a 
                            href={`mailto:${manager.email}`} 
                            className="text-blue-500 hover:underline text-sm"
                          >
                            {manager.email}
                          </a>
                        </div>
                      ) : "Not specified";
                    })()
                  ) : (
                    <p className="text-gray-500">Not specified</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Address field has been removed from schema and UI */}
            </div>
            
            {client.website && (
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a 
                    href={client.website.startsWith('http') ? client.website : `https://${client.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline flex items-center"
                  >
                    {client.website}
                    <LinkIcon className="ml-2 h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            )}
            
            {client.notes && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{client.notes}</p>
                </CardContent>
              </Card>
            )}
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Projects</CardTitle>
                <CardDescription>
                  Projects associated with this client
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProjects ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !clientProjects || clientProjects.length === 0 ? (
                  <div className="text-center py-6">
                    <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-1">No projects yet</h3>
                    <p className="text-gray-500">
                      This client doesn't have any projects associated with it.
                    </p>
                    {isAdmin && (
                      <Button
                        onClick={() => setLocation("/projects")}
                        className="mt-4"
                      >
                        <Briefcase className="mr-2 h-4 w-4" />
                        View All Projects
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientProjects.map((project: any) => (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${project.status === 'active' ? 'bg-green-100 text-green-800' : 
                                  project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                                  project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                  'bg-yellow-100 text-yellow-800'}`}
                              >
                                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {project.startDate ? formatDate(project.startDate) : "Not set"}
                            </TableCell>
                            <TableCell>
                              {project.endDate ? formatDate(project.endDate) : "Not set"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLocation(`/projects/${project.id}`)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Edit Client Dialog */}
          <Dialog open={openEditClient} onOpenChange={setOpenEditClient}>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Edit Client</DialogTitle>
                <DialogDescription>
                  Update details for {client.name}.
                </DialogDescription>
              </DialogHeader>
              <Form {...editClientForm}>
                <form onSubmit={editClientForm.handleSubmit(onEditClientSubmit)} className="space-y-4">
                  <FormField
                    control={editClientForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editClientForm.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editClientForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editClientForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <h3 className="text-lg font-medium mt-6 mb-2">Account Manager</h3>
                  
                  <FormField
                    control={editClientForm.control}
                    name="accountManagerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Manager</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value && value !== "none" ? parseInt(value) : null)}
                          value={field.value?.toString() || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an account manager" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {users.map((user) => (
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
                  
                  {/* Address field has been removed */}
                  
                  <DialogFooter>
                    <Button type="submit" disabled={updateClient.isPending}>
                      {updateClient.isPending ? (
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
        </div>
      </div>
    </div>
  );
}