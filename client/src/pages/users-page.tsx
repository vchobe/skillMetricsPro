import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User, Skill } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import UserProfileDialog from "@/components/user-profile-dialog";
import { useAuth } from "@/hooks/use-auth";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Search,
  SortAsc,
  SortDesc,
  UserCircle,
  Mail,
  Building,
  MapPin,
  Filter,
  X
} from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type SortField = "username" | "email" | "role" | "createdAt";
type SortDirection = "asc" | "desc";

export default function UsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("username");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [dateFilter, setDateFilter] = useState<string | undefined>();
  const [skillLevelFilter, setSkillLevelFilter] = useState<string | undefined>();
  const [certificationFilter, setCertificationFilter] = useState<boolean | undefined>();
  const [skillCategoryFilter, setSkillCategoryFilter] = useState<string | undefined>();
  const [skillCategories, setSkillCategories] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const { user } = useAuth();
  
  // Fetch all users
  const { data: users, isLoading: isLoadingUsers } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ["/api/users"],
  });
  
  // Fetch all skills to get user skill data and categories
  const { data: allSkills, isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  
  // Extract all unique skill categories
  useEffect(() => {
    if (allSkills) {
      const categoriesSet = new Set<string>();
      allSkills.forEach(skill => {
        if (skill.category) {
          categoriesSet.add(skill.category);
        }
      });
      setSkillCategories(Array.from(categoriesSet).sort());
    }
  }, [allSkills]);
  
  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Process user skills data to add skill-related properties to the users
  const usersWithSkillData = useMemo(() => {
    if (!users || !allSkills) return [];

    return users.map(user => {
      // Find all skills for this user
      const userSkills = allSkills.filter(skill => skill.userId === user.id);
      
      // Count skills by level
      const expertSkills = userSkills.filter(s => s.level === 'expert').length;
      const intermediateSkills = userSkills.filter(s => s.level === 'intermediate').length;
      const beginnerSkills = userSkills.filter(s => s.level === 'beginner').length;
      
      // Check if user has certifications
      const hasCertifications = userSkills.some(s => 
        s.certification && 
        s.certification !== 'true' &&
        s.certification !== 'false'
      );
      
      // Get user's skill categories
      const userCategories = userSkills
        .map(s => s.category)
        .filter((category): category is string => !!category);
      
      return {
        ...user,
        userSkills,
        expertSkills,
        intermediateSkills,
        beginnerSkills,
        totalSkills: userSkills.length,
        hasCertifications,
        skillCategories: userCategories
      };
    });
  }, [users, allSkills]);

  // Filter and sort users
  const filteredUsers = usersWithSkillData ? usersWithSkillData.filter(user => {
    // Search filter
    const searchTerms = searchQuery.toLowerCase().split(" ");
    const userString = `${user.username || ""} ${user.email} ${user.role || ""} ${user.location || ""}`.toLowerCase();
    const matchesSearch = searchTerms.every(term => userString.includes(term));
    
    // Role filter
    const matchesRole = !roleFilter || 
      (roleFilter === "admin" && user.is_admin) || 
      (roleFilter === "user" && !user.is_admin);
    
    // Date filter
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const userCreatedAt = new Date(user.createdAt);
    const matchesDate = !dateFilter || 
      (dateFilter === "recent" && userCreatedAt >= thirtyDaysAgo) ||
      (dateFilter === "older" && userCreatedAt < thirtyDaysAgo);
    
    // Skill level filter
    const matchesSkillLevel = !skillLevelFilter || (
      skillLevelFilter === 'expert' && user.expertSkills > 0 ||
      skillLevelFilter === 'intermediate' && user.intermediateSkills > 0 ||
      skillLevelFilter === 'beginner' && user.beginnerSkills > 0
    );
    
    // Certification filter
    const matchesCertification = !certificationFilter || 
      (certificationFilter === true && user.hasCertifications);
    
    // Category filter
    const matchesCategory = !skillCategoryFilter || 
      user.skillCategories?.includes(skillCategoryFilter);
    
    return matchesSearch && matchesRole && matchesDate && 
           matchesSkillLevel && matchesCertification && matchesCategory;
  }) : [];
  
  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortField === "username") {
      const aValue = a.username || "";
      const bValue = b.username || "";
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else if (sortField === "email") {
      return sortDirection === "asc" 
        ? a.email.localeCompare(b.email)
        : b.email.localeCompare(a.email);
    } else if (sortField === "role") {
      const aValue = a.role || "";
      const bValue = b.role || "";
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else if (sortField === "createdAt") {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
    }
    return 0;
  });
  
  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />;
  };
  
  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/users" />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-16' : 'ml-0'}`}>
        <Header 
          title="Employee Directory" 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>User Directory</CardTitle>
              <CardDescription>
                Browse and connect with colleagues across the organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and filter */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search users by name, email, role, or location..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Filters */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                        {(roleFilter || dateFilter) && (
                          <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                            {(roleFilter ? 1 : 0) + (dateFilter ? 1 : 0)}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Filter Users</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <span>Role</span>
                          {roleFilter && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48">
                          <DropdownMenuCheckboxItem
                            checked={roleFilter === "admin"}
                            onCheckedChange={() => setRoleFilter(roleFilter === "admin" ? undefined : "admin")}
                          >
                            Admin
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={roleFilter === "user"}
                            onCheckedChange={() => setRoleFilter(roleFilter === "user" ? undefined : "user")}
                          >
                            Regular User
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setRoleFilter(undefined)}>
                            Clear Filter
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <span>Created Date</span>
                          {dateFilter && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48">
                          <DropdownMenuCheckboxItem
                            checked={dateFilter === "recent"}
                            onCheckedChange={() => setDateFilter(dateFilter === "recent" ? undefined : "recent")}
                          >
                            Recent (Last 30 days)
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={dateFilter === "older"}
                            onCheckedChange={() => setDateFilter(dateFilter === "older" ? undefined : "older")}
                          >
                            Older than 30 days
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDateFilter(undefined)}>
                            Clear Filter
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <span>Skill Level</span>
                          {skillLevelFilter && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48">
                          <DropdownMenuCheckboxItem
                            checked={skillLevelFilter === "expert"}
                            onCheckedChange={() => setSkillLevelFilter(skillLevelFilter === "expert" ? undefined : "expert")}
                          >
                            Expert
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={skillLevelFilter === "intermediate"}
                            onCheckedChange={() => setSkillLevelFilter(skillLevelFilter === "intermediate" ? undefined : "intermediate")}
                          >
                            Intermediate
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={skillLevelFilter === "beginner"}
                            onCheckedChange={() => setSkillLevelFilter(skillLevelFilter === "beginner" ? undefined : "beginner")}
                          >
                            Beginner
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSkillLevelFilter(undefined)}>
                            Clear Filter
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <span>Skill Category</span>
                          {skillCategoryFilter && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48 max-h-40 overflow-auto">
                          {skillCategories.map(category => (
                            <DropdownMenuCheckboxItem
                              key={category}
                              checked={skillCategoryFilter === category}
                              onCheckedChange={() => setSkillCategoryFilter(skillCategoryFilter === category ? undefined : category)}
                            >
                              {category}
                            </DropdownMenuCheckboxItem>
                          ))}
                          {skillCategories.length > 0 && <DropdownMenuSeparator />}
                          <DropdownMenuItem onClick={() => setSkillCategoryFilter(undefined)}>
                            Clear Filter
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <span>Certifications</span>
                          {certificationFilter !== undefined && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48">
                          <DropdownMenuCheckboxItem
                            checked={certificationFilter === true}
                            onCheckedChange={() => setCertificationFilter(certificationFilter === true ? undefined : true)}
                          >
                            Has Certifications
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setCertificationFilter(undefined)}>
                            Clear Filter
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        setRoleFilter(undefined);
                        setDateFilter(undefined);
                        setSkillLevelFilter(undefined);
                        setSkillCategoryFilter(undefined);
                        setCertificationFilter(undefined);
                      }}>
                        Reset All Filters
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Active filters display */}
                {(roleFilter || dateFilter || skillLevelFilter || skillCategoryFilter || certificationFilter !== undefined) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {roleFilter && (
                      <div className="bg-muted rounded-md px-2 py-1 text-sm flex items-center gap-1">
                        <span>Role: {roleFilter === "admin" ? "Admin" : "Regular User"}</span>
                        <button 
                          onClick={() => setRoleFilter(undefined)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    
                    {dateFilter && (
                      <div className="bg-muted rounded-md px-2 py-1 text-sm flex items-center gap-1">
                        <span>
                          {dateFilter === "recent" ? "Recent (Last 30 days)" : "Older than 30 days"}
                        </span>
                        <button 
                          onClick={() => setDateFilter(undefined)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    
                    {skillLevelFilter && (
                      <div className="bg-muted rounded-md px-2 py-1 text-sm flex items-center gap-1">
                        <span>Skill Level: {skillLevelFilter.charAt(0).toUpperCase() + skillLevelFilter.slice(1)}</span>
                        <button 
                          onClick={() => setSkillLevelFilter(undefined)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    
                    {skillCategoryFilter && (
                      <div className="bg-muted rounded-md px-2 py-1 text-sm flex items-center gap-1">
                        <span>Category: {skillCategoryFilter}</span>
                        <button 
                          onClick={() => setSkillCategoryFilter(undefined)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    
                    {certificationFilter !== undefined && (
                      <div className="bg-muted rounded-md px-2 py-1 text-sm flex items-center gap-1">
                        <span>Has Certifications</span>
                        <button 
                          onClick={() => setCertificationFilter(undefined)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => {
                        setRoleFilter(undefined);
                        setDateFilter(undefined);
                        setSkillLevelFilter(undefined);
                        setSkillCategoryFilter(undefined);
                        setCertificationFilter(undefined);
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
              
              {/* Users table */}
              {isLoadingUsers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">
                          <Button 
                            variant="ghost" 
                            className="flex items-center px-0 font-medium"
                            onClick={() => handleSort("username")}
                          >
                            Name {renderSortIcon("username")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            className="flex items-center px-0 font-medium"
                            onClick={() => handleSort("email")}
                          >
                            Email {renderSortIcon("email")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            className="flex items-center px-0 font-medium"
                            onClick={() => handleSort("role")}
                          >
                            Role {renderSortIcon("role")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            className="flex items-center px-0 font-medium"
                            onClick={() => handleSort("createdAt")}
                          >
                            Joined {renderSortIcon("createdAt")}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                            No users found matching your search criteria.
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-3">
                                  <AvatarImage src="" alt={user.username || user.email} />
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {user.username?.[0] || user.email?.[0] || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {user.firstName && user.lastName 
                                      ? `${user.firstName} ${user.lastName}` 
                                      : (user.username || user.email.split('@')[0])}
                                  </div>
                                  {user.username && user.username !== user.email.split('@')[0] && (
                                    <div className="text-xs text-muted-foreground">@{user.username}</div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{user.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {user.role ? (
                                  <>
                                    <UserCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>{user.role}</span>
                                    {user.project && (
                                      <>
                                        <span className="mx-1 text-muted-foreground">•</span>
                                        <Building className="h-4 w-4 mr-1 text-muted-foreground" />
                                        <span>{user.project}</span>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">Not specified</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDate(user.createdAt, "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              {/* Always use dialog for non-admin users */}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedUserId(user.id);
                                  setIsProfileDialogOpen(true);
                                }}
                              >
                                View Profile
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* User Profile Dialog */}
      <UserProfileDialog 
        userId={selectedUserId} 
        isOpen={isProfileDialogOpen} 
        onClose={() => {
          setIsProfileDialogOpen(false);
          setSelectedUserId(null);
        }}
      />
    </div>
  );
}