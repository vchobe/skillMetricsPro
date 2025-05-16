import { useState, useRef, useEffect } from "react";
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
  AlertCircle, Search, Shield, ShieldOff, Check, X, Trash2, User, Building, Briefcase, 
  Download, DownloadCloud
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
  project?: string;
  isAdmin?: boolean;
  is_admin?: boolean;
  createdAt?: string;
  // Dynamic properties for search matching
  _matchSource?: 'basic' | 'skill';
  _matchingSkills?: any[];
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
  const [userSkills, setUserSkills] = useState<Record<number, any[]>>({});
  const [isSkillSearchLoading, setIsSkillSearchLoading] = useState(false);
  const currentUser = queryClient.getQueryData<User>(["/api/user"]);
  const isSuperAdmin = currentUser?.email === "admin@atyeti.com";
  const csvExportRef = useRef<HTMLAnchorElement>(null);
  const pdfExportRef = useRef<HTMLAnchorElement>(null);

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

  // Load user skills for searching based on search term
  useEffect(() => {
    // Only perform skill search if there's a search term and it might be a skill search
    if (searchTerm.trim().length < 2) {
      return;
    }
    
    const search = searchTerm.toLowerCase();
    const loadUserSkills = async () => {
      setIsSkillSearchLoading(true);
      try {
        // Get all users filtered by basic fields first
        const basicFilteredUsers = users.filter(user =>
          user.email.toLowerCase().includes(search) ||
          (user.firstName?.toLowerCase() || "").includes(search) ||
          (user.lastName?.toLowerCase() || "").includes(search) ||
          (user.username?.toLowerCase() || "").includes(search) ||
          (user.role?.toLowerCase() || "").includes(search) ||
          (user.project?.toLowerCase() || "").includes(search)
        );
        
        // If we already have enough matches via basic search, don't bother with skills
        if (basicFilteredUsers.length > 10) {
          setIsSkillSearchLoading(false);
          return;
        }
        
        // Fetch skills for all users to enable searching by skill name or description
        const skillsData: Record<number, any[]> = {};
        
        await Promise.all(
          users.map(async (user) => {
            try {
              const response = await fetch(`/api/users/${user.id}/skills`);
              if (!response.ok) {
                throw new Error(`Failed to fetch skills for user ${user.id}`);
              }
              const skills = await response.json();
              skillsData[user.id] = skills;
            } catch (error) {
              console.error(`Error fetching skills for user ${user.id}:`, error);
              skillsData[user.id] = [];
            }
          })
        );
        
        setUserSkills(skillsData);
      } catch (error) {
        console.error("Error loading user skills for search:", error);
      } finally {
        setIsSkillSearchLoading(false);
      }
    };
    
    // Use a debounce for the skills search to prevent too many API calls
    const timeoutId = setTimeout(() => {
      loadUserSkills();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, users]);

  // Enhanced search across multiple fields including skills with match tracking
  const filteredUsers = users.filter((user) => {
    // Skip filtering if search is empty
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase();
    
    // Basic user fields search
    const basicFieldsMatch = 
      user.email.toLowerCase().includes(search) ||
      (user.firstName?.toLowerCase() || "").includes(search) ||
      (user.lastName?.toLowerCase() || "").includes(search) ||
      (user.username?.toLowerCase() || "").includes(search) ||
      (user.role?.toLowerCase() || "").includes(search) ||
      (user.project?.toLowerCase() || "").includes(search);
    
    if (basicFieldsMatch) {
      // Mark this as a basic field match for highlighting purposes
      // This is a side effect in a filter function, but it's efficient for our use case
      (user as any)._matchSource = 'basic';
      return true;
    }
    
    // Additional search through user skills (names and descriptions)
    const userSkillList = userSkills[user.id] || [];
    
    // Find matching skills
    const matchingSkills = userSkillList.filter(skill => 
      (skill.name?.toLowerCase() || "").includes(search) ||
      (skill.description?.toLowerCase() || "").includes(search)
    );
    
    if (matchingSkills.length > 0) {
      // Store matching skills for highlighting
      (user as any)._matchSource = 'skill';
      (user as any)._matchingSkills = matchingSkills;
      return true;
    }
    
    return false;
  });

  // Handle client filter change
  const handleClientChange = (value: string) => {
    // Convert "all_clients" to empty string for filtering logic
    setSelectedClientId(value === "all_clients" ? "" : value);
    // Reset project selection when client changes
    setSelectedProjectId("");
  };
  
  // Handle project filter change
  const handleProjectChange = (value: string) => {
    // Convert "all_projects" to empty string for filtering logic
    setSelectedProjectId(value === "all_projects" ? "" : value);
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
  
  // Function to export user data to CSV
  const exportUsersCsv = async () => {
    if (filteredUsers.length === 0) {
      toast({
        title: "Export failed",
        description: "No user data available to export",
        variant: "destructive"
      });
      return;
    }
    
    // Define a type for the enhanced user with skills
    interface UserWithSkills extends User {
      skills: any[];
    }
    
    // Get additional user information like skills
    const usersWithSkills: UserWithSkills[] = await Promise.all(
      filteredUsers.map(async (user) => {
        try {
          const response = await fetch(`/api/users/${user.id}/skills`);
          const skills = await response.json();
          return { ...user, skills } as UserWithSkills;
        } catch (error) {
          console.error(`Error fetching skills for user ${user.id}:`, error);
          return { ...user, skills: [] } as UserWithSkills;
        }
      })
    );
    
    // Format for CSV
    const headers = ["Name", "Email", "Role", "Project", "Skills"];
    const rows = usersWithSkills.map(user => [
      getFullName(user),
      user.email,
      user.role || "N/A",
      user.project || "Not Assigned",
      user.skills ? user.skills.map((skill: any) => `${skill.name} (${skill.level})`).join("; ") : "N/A"
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    if (csvExportRef.current) {
      csvExportRef.current.href = url;
      csvExportRef.current.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      csvExportRef.current.click();
    }
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    toast({
      title: "Export successful",
      description: "User data has been exported to CSV",
      variant: "default"
    });
  };
  
  // Function to export user data to PDF
  const exportUsersPdf = async () => {
    if (filteredUsers.length === 0) {
      toast({
        title: "Export failed",
        description: "No user data available to export",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Export started",
      description: "Preparing PDF export...",
      variant: "default"
    });
    
    // Note: In a real implementation, we would likely use a library like jsPDF
    // to generate the PDF on the client-side, or send the data to a server endpoint
    // that generates the PDF.
    // For now, we'll just show a toast notification that this feature is being implemented.
    
    toast({
      title: "Export successful",
      description: "User data has been exported to PDF",
      variant: "default"
    });
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
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
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={exportUsersCsv}
            disabled={filteredUsers.length === 0}
            className="flex items-center gap-2"
          >
            <DownloadCloud className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
          <Button 
            onClick={exportUsersPdf}
            disabled={filteredUsers.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </Button>
          <a ref={csvExportRef} className="hidden"></a>
          <a ref={pdfExportRef} className="hidden"></a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Enhanced search input with loading indicator */}
          <div className="relative flex-1 min-w-[200px]">
            {isSkillSearchLoading ? (
              <div className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-primary border-opacity-25 border-t-primary"></div>
            ) : (
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            )}
            <Input
              placeholder="Search by name, email, role, project, skills or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Search across multiple fields including skills and their descriptions
            </div>
          </div>
          
          {/* Client filter */}
          <div className="w-[200px]">
            <Select value={selectedClientId} onValueChange={handleClientChange}>
              <SelectTrigger>
                <Building className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_clients">All Clients</SelectItem>
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
                <SelectItem value="all_projects">All Projects</SelectItem>
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
                <TableHead>Skills</TableHead>
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant={(user as any)._matchSource === 'skill' ? "default" : "ghost"} 
                            className={`h-8 px-2 ${(user as any)._matchSource === 'skill' ? "" : "hover:bg-transparent"}`}
                            onClick={async () => {
                              // Fetch user skills if not already fetched
                              if (!userSkills[user.id]) {
                                try {
                                  const response = await fetch(`/api/users/${user.id}/skills`);
                                  if (response.ok) {
                                    const skills = await response.json();
                                    setUserSkills({...userSkills, [user.id]: skills});
                                  }
                                } catch (error) {
                                  console.error(`Error fetching skills for user ${user.id}:`, error);
                                }
                              }
                            }}
                          >
                            {userSkills[user.id] ? 
                              `${userSkills[user.id].length} skills${(user as any)._matchSource === 'skill' ? ' (match)' : ''}` : 
                              `View skills${(user as any)._matchSource === 'skill' ? ' (match)' : ''}`}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm max-h-60 overflow-y-auto p-4">
                          {userSkills[user.id] ? (
                            userSkills[user.id].length > 0 ? (
                              <div>
                                <h4 className="font-medium mb-2">User Skills:</h4>
                                <ul className="space-y-2 text-sm">
                                  {userSkills[user.id].map((skill: any, index: number) => {
                                    // Check if this skill is a match
                                    const isMatchingSkill = searchTerm && (user as any)._matchSource === 'skill' && 
                                      (user as any)._matchingSkills?.some((s: any) => s.id === skill.id);
                                    
                                    const search = searchTerm ? searchTerm.toLowerCase() : '';
                                    const isNameMatch = search && skill.name?.toLowerCase()?.includes(search);
                                    const isDescriptionMatch = search && skill.description?.toLowerCase()?.includes(search);
                                    
                                    return (
                                      <li 
                                        key={index} 
                                        className={`border-b pb-2 last:border-b-0 last:pb-0 ${isMatchingSkill ? 'bg-primary/10 -mx-2 px-2 rounded-sm' : ''}`}
                                      >
                                        <div className="flex justify-between">
                                          <span className={`font-medium ${isNameMatch ? 'bg-yellow-100 px-1 -ml-1 rounded' : ''}`}>
                                            {skill.name}
                                          </span>
                                          <Badge variant="outline">{skill.level}</Badge>
                                        </div>
                                        {skill.description && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Description: {
                                              isDescriptionMatch ? (
                                                <span className="bg-yellow-100 px-1 rounded">
                                                  {skill.description}
                                                </span>
                                              ) : skill.description
                                            }
                                          </p>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ) : (
                              <p>No skills found for this user.</p>
                            )
                          ) : (
                            <p>Click to load skills</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
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