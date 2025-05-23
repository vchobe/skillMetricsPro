import { useState } from "react";
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
import { AlertCircle, Loader2, Search, Plus, Building, Edit, Trash2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Client schema for form validation
const clientSchema = z.object({
  name: z.string().min(2, "Client name is required"),
  industry: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  accountManagerId: z.number().optional().nullable(),
  address: z.string().optional()
});

type ClientFormValues = z.infer<typeof clientSchema>;

type SortField = "name" | "industry" | "accountManager";
type SortDirection = "asc" | "desc";

export default function ClientsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.isAdmin || user?.is_admin;
  const isSuperUser = user?.email === "admin@atyeti.com";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openNewClient, setOpenNewClient] = useState(false);
  const [editClientId, setEditClientId] = useState<number | null>(null);
  const [deleteClientId, setDeleteClientId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: "name",
    direction: "asc",
  });

  // Define Client interface
  interface Client {
    id: number;
    name: string;
    industry?: string;
    accountManagerId?: number;
    website?: string;
    description?: string;
    address?: string;
    createdAt: string;
    updatedAt?: string;
    // Keep old contact fields for backward compatibility
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  }

  // Fetch all clients
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    refetchOnWindowFocus: false,
  });

  // Fetch all users for account manager dropdown
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    refetchOnWindowFocus: false,
  });

  // Define User interface
  interface User {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }

  // Form for creating new client
  const newClientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      industry: "",
      description: "",
      website: "",
      accountManagerId: null,
      address: ""
    },
  });

  // Form for editing client
  const editClientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      industry: "",
      description: "",
      website: "",
      accountManagerId: null,
      address: ""
    },
  });

  // Populate edit form when a client is selected for editing
  const populateEditForm = (clientId: number) => {
    const client = clients.find((c: Client) => c.id === clientId);
    if (!client) return;
    
    editClientForm.reset({
      name: client.name,
      industry: client.industry || "",
      description: client.description || "",
      website: client.website || "",
      accountManagerId: client.accountManagerId || null,
      address: client.address || ""
    });
    
    setEditClientId(clientId);
  };

  // Create client mutation
  const createClient = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      return apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Client created successfully",
        variant: "default",
      });
      setOpenNewClient(false);
      newClientForm.reset();
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
  const updateClient = useMutation({
    mutationFn: async (data: { id: number; formData: ClientFormValues }) => {
      return apiRequest("PATCH", `/api/clients/${data.id}`, data.formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Client updated successfully",
        variant: "default",
      });
      setEditClientId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update client",
        variant: "destructive",
      });
    },
  });

  // Delete client mutation
  const deleteClient = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
        variant: "default",
      });
      setDeleteClientId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onNewClientSubmit = (data: ClientFormValues) => {
    createClient.mutate(data);
  };

  const onEditClientSubmit = (data: ClientFormValues) => {
    if (editClientId) {
      updateClient.mutate({ id: editClientId, formData: data });
    }
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

  // Filter and sort clients
  const filteredClients = clients
    ? clients
        .filter((client: Client) => {
          // Get account manager name if exists
          const accountManager = users.find(user => user.id === client.accountManagerId);
          const accountManagerName = accountManager 
            ? `${accountManager.firstName || ''} ${accountManager.lastName || ''} ${accountManager.username || ''}` 
            : '';
            
          return (
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.industry && 
              client.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
            accountManagerName.toLowerCase().includes(searchTerm.toLowerCase())
          );
        })
        .sort((a: Client, b: Client) => {
          const { field, direction } = sortConfig;
          let comparison = 0;

          switch (field) {
            case "name":
              comparison = a.name.localeCompare(b.name);
              break;
            case "industry":
              // Handle null industry
              if (!a.industry) return direction === "asc" ? 1 : -1;
              if (!b.industry) return direction === "asc" ? -1 : 1;
              comparison = a.industry.localeCompare(b.industry);
              break;
            case "accountManager":
              // We can't sort by account manager name since we only have the ID
              // Sort by ID instead
              const aId = a.accountManagerId || 0;
              const bId = b.accountManagerId || 0;
              comparison = aId - bId;
              break;
            default:
              comparison = 0;
          }

          return direction === "asc" ? comparison : -comparison;
        })
    : [];

  // Function to count projects for a client
  const countProjects = (clientId: number) => {
    // In a real implementation, this would fetch from API
    // For now, just return a placeholder
    return "—";
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/clients" />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header 
          title="Clients" 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Clients</h1>
              <p className="text-gray-500">
                Manage client information and contact details
                {isAdmin && !isSuperUser && (
                  <span className="block mt-1 text-amber-500">
                    <AlertCircle className="inline-block mr-1 h-4 w-4" />
                    Only super users can add, edit or delete clients.
                  </span>
                )}
              </p>
            </div>
            
            {isSuperUser && (
              <Dialog open={openNewClient} onOpenChange={setOpenNewClient}>
                <DialogTrigger asChild>
                  <Button className="mt-4 md:mt-0">
                    <Plus className="h-4 w-4 mr-2" />
                    New Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle>Create New Client</DialogTitle>
                    <DialogDescription>
                      Add details for the new client. Required fields are marked with an asterisk (*).
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...newClientForm}>
                    <form onSubmit={newClientForm.handleSubmit(onNewClientSubmit)} className="space-y-4">
                      <FormField
                        control={newClientForm.control}
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
                          control={newClientForm.control}
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
                          control={newClientForm.control}
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
                        control={newClientForm.control}
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
                      
                      <FormField
                        control={newClientForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <h3 className="text-lg font-medium mt-6 mb-2">Account Manager</h3>
                      
                      <FormField
                        control={newClientForm.control}
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
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpenNewClient(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createClient.isPending}
                        >
                          {createClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Create Client
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
              <CardTitle>Search Clients</CardTitle>
              <CardDescription>
                Find clients by name, industry, or account manager
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search clients..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          
          {isLoadingClients ? (
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
                        onClick={() => handleSort("industry")}
                      >
                        Industry {renderSortIcon("industry")}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort("accountManager")}
                      >
                        Account Manager {renderSortIcon("accountManager")}
                      </TableHead>
                      <TableHead>
                        Projects
                      </TableHead>
                      <TableHead>
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                          No clients found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client: Client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-2 text-gray-400" />
                              <Link to={`/clients/${client.id}`} className="text-blue-600 hover:underline cursor-pointer">
                                {client.name}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.industry || "—"}
                          </TableCell>
                          <TableCell>
                            {client.accountManagerId ? (
                              (() => {
                                const manager = users.find(user => user.id === client.accountManagerId);
                                return manager ? (
                                  <div>
                                    <div>
                                      {manager.firstName && manager.lastName
                                        ? `${manager.firstName} ${manager.lastName}`
                                        : manager.username}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {manager.email}
                                    </div>
                                  </div>
                                ) : "—";
                              })()
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            {countProjects(client.id)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {isSuperUser && (
                                <>
                                  <Dialog
                                    open={editClientId === client.id}
                                    onOpenChange={(open) => {
                                      if (!open) setEditClientId(null);
                                      if (open) populateEditForm(client.id);
                                    }}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => populateEditForm(client.id)}
                                      >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit
                                      </Button>
                                    </DialogTrigger>
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
                                          
                                          <FormField
                                            control={editClientForm.control}
                                            name="address"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Address</FormLabel>
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
                                          
                                          <DialogFooter>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              onClick={() => setEditClientId(null)}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              type="submit"
                                              disabled={updateClient.isPending}
                                            >
                                              {updateClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                              Update Client
                                            </Button>
                                          </DialogFooter>
                                          
                                          {/* Client metadata with formatted dates */}
                                          <div className="text-xs text-gray-500 mt-4 pt-4 border-t">
                                            <p>
                                              Client created: {formatDate(client.createdAt, "MMM d, yyyy")}
                                              {client.updatedAt && client.updatedAt !== client.createdAt && 
                                                ` • Last updated: ${formatDate(client.updatedAt, "MMM d, yyyy")}`}
                                            </p>
                                          </div>
                                        </form>
                                      </Form>
                                    </DialogContent>
                                  </Dialog>
                                  
                                  <AlertDialog
                                    open={deleteClientId === client.id}
                                    onOpenChange={(open) => !open && setDeleteClientId(null)}
                                  >
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-500 border-red-200 hover:bg-red-50"
                                        onClick={() => setDeleteClientId(client.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete the client "{client.name}" and cannot be undone.
                                          Any project relationships with this client will be removed.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteClient.mutate(client.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          {deleteClient.isPending && deleteClientId === client.id && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          )}
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
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
      </div>
    </div>
  );
}