import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  AlertCircle, Search, Shield, ShieldOff, Check, X, Trash2, User, Building, Briefcase
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// User type definition
interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isAdmin?: boolean;
  is_admin?: boolean;
  createdAt?: string;
}

// Client type definition
interface Client {
  id: number;
  name: string;
}

// Project type definition
interface Project {
  id: number;
  name: string;
  clientId: number;
}

const AdminUsersManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteUserEmail, setDeleteUserEmail] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const currentUser = queryClient.getQueryData<User>(["/api/user"]);
  const isSuperAdmin = currentUser?.email === "admin@atyeti.com";

  // Fetch all users with optional filters
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users", selectedClientId, selectedProjectId],
    queryFn: async () => {
      let url = "/api/users";
      
      // Add client or project filter if selected
      if (selectedClientId) {
        url += `?clientId=${selectedClientId}`;
      } else if (selectedProjectId) {
        url += `?projectId=${selectedProjectId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    }
  });
  
  // Fetch all clients for dropdown
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const response = await fetch("/api/clients");
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      return response.json();
    }
  });
  
  // Fetch projects, filtered by client if one is selected
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects", selectedClientId],
    queryFn: async () => {
      let url = "/api/projects";
      if (selectedClientId) {
        url += `?clientId=${selectedClientId}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      return response.json();
    },
    enabled: clients.length > 0 // Only run this query if clients loaded
  });

  // Toggle admin status mutation
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/toggle-admin`, { isAdmin });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Admin status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update admin status: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("DELETE", "/api/admin/users/delete-by-email", { email });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "User deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Function to handle admin toggle
  const handleToggleAdmin = (user: User) => {
    if (user.email === "admin@atyeti.com") {
      toast({
        title: "Prohibited Action",
        description: "Cannot modify super admin privileges",
        variant: "destructive",
      });
      return;
    }
    
    const newAdminStatus = !(user.isAdmin || user.is_admin);
    toggleAdminMutation.mutate({ 
      userId: user.id, 
      isAdmin: newAdminStatus 
    });
  };

  // Handle delete user
  const handleDeleteUser = () => {
    if (deleteUserEmail === "admin@atyeti.com") {
      toast({
        title: "Prohibited Action",
        description: "Cannot delete the super admin account",
        variant: "destructive",
      });
      return;
    }
    deleteUserMutation.mutate(deleteUserEmail);
  };

  // Filter users based on search term
  const filteredUsers = users.filter((user) => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (user.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (user.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (user.role?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // Handle client filter change
  const handleClientChange = (value: string) => {
    setSelectedClientId(value);
    // Reset project selection when client changes
    setSelectedProjectId("");
  };
  
  // Handle project filter change
  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
  };
  
  // Handle clearing filters
  const handleClearFilters = () => {
    setSelectedClientId("");
    setSelectedProjectId("");
  };

  // Get full name helper function
  const getFullName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    }
    return "N/A";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Loading users...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage user access and permissions. 
          {!isSuperAdmin && (
            <span className="text-amber-500 font-semibold block mt-1">
              <AlertCircle className="inline-block mr-1 h-4 w-4" />
              Only the super admin can change admin privileges.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Search input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {/* Client filter */}
          <div className="w-[200px]">
            <Select value={selectedClientId} onValueChange={handleClientChange}>
              <SelectTrigger>
                <Building className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Clients</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Project filter - disabled if no client is selected */}
          <div className="w-[200px]">
            <Select 
              value={selectedProjectId} 
              onValueChange={handleProjectChange} 
              disabled={selectedClientId === "" && projects.length === 0}
            >
              <SelectTrigger>
                <Briefcase className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Projects</SelectItem>
                {projects
                  .filter(project => !selectedClientId || project.clientId.toString() === selectedClientId)
                  .map(project => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          
          {/* Clear filters button - only show if filters are applied */}
          {(selectedClientId || selectedProjectId) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearFilters}
              className="h-10"
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Admin Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{getFullName(user)}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={user.isAdmin || user.is_admin || false}
                        onCheckedChange={() => handleToggleAdmin(user)}
                        disabled={!isSuperAdmin || user.email === "admin@atyeti.com"}
                      />
                      <span className="text-sm">
                        {user.email === "admin@atyeti.com" ? (
                          <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                            <Shield className="mr-1 h-3 w-3" />
                            Super Admin
                          </Badge>
                        ) : (user.isAdmin || user.is_admin) ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100">
                            <User className="mr-1 h-3 w-3" />
                            Regular
                          </Badge>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteUserEmail(user.email);
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={user.email === "admin@atyeti.com" || !isSuperAdmin}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete User</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Delete User Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm User Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the user <span className="font-semibold">{deleteUserEmail}</span>? 
                This action cannot be undone and will remove all associated data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteUser}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminUsersManagement;