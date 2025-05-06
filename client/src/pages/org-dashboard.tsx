import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skill, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SkillLevelBadge from "@/components/skill-level-badge";
import ActivityFeed from "@/components/activity-feed";
import { formatDate } from "@/lib/date-utils";
import {
  BarChart3,
  Brain,
  Award,
  ChevronUp,
  ChevronDown,
  Loader2,
  Search,
  SortAsc,
  SortDesc,
  Trophy,
  Users,
  Filter,
  Calendar,
  FileText,
  BarChart,
  LineChart,
  Activity,
  X,
  Clock,
  Bookmark,
  BadgeCheck,
  Layers,
  Code2,
  Check,
  Building,
  Briefcase,
} from "lucide-react";
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

// Define Activity interface for proper typing
interface ActivityItem {
  id: number;
  type: "update" | "add";
  skillId?: number;
  userSkillId?: number;
  skillTemplateId?: number;
  skillName?: string;
  userId: number;
  previousLevel: string | null;
  newLevel: string;
  date: Date | string;
  note?: string;
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

// Type definitions
type SortField = "username" | "email" | "totalSkills" | "expertSkills" | "certifications" | "createdAt";
type SortDirection = "asc" | "desc";
type Filters = {
  skillLevel?: string;
  category?: string;
  skillName?: string;
  hasCertification?: boolean;
  dateJoined?: string;
  skillCount?: string;
  clientId?: string;
  projectId?: string;
};

// Type for user stats
type UserStats = {
  id: number;
  username: string;
  email: string;
  role: string | null | undefined;
  totalSkills: number;
  expertSkills: number;
  intermediateSkills: number;
  beginnerSkills: number;
  certifications: number;
  createdAt: string;
  updatedAt?: string;
};

export default function OrgDashboard() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("expertSkills");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filters, setFilters] = useState<Filters>({});
  const [skillCategories, setSkillCategories] = useState<string[]>([]);
  const [skillNames, setSkillNames] = useState<string[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>("");
  
  // Fetch all users and their skills with optional filtering
  const { data: users, isLoading: isLoadingUsers } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ["/api/users", filters.clientId, filters.projectId],
    queryFn: async () => {
      let url = "/api/users";
      const queryParams = [];
      
      if (filters.clientId) {
        queryParams.push(`clientId=${filters.clientId}`);
      } else if (filters.projectId) {
        queryParams.push(`projectId=${filters.projectId}`);
      }
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    }
  });
  
  // Get all skills across organization
  const { data: allSkills, isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ["/api/all-skills"],
  });
  
  // Get all skill history across organization
  const { data: skillHistoryData, isLoading: isLoadingHistory } = useQuery<any[]>({
    queryKey: ["/api/admin/skill-history"],
  });
  
  // Fetch all clients for dropdown
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
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
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects", filters.clientId],
    queryFn: async () => {
      let url = "/api/projects";
      if (filters.clientId) {
        url += `?clientId=${filters.clientId}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      return response.json();
    },
    enabled: clients.length > 0 // Only run this query if clients loaded
  });
  
  // Extract all unique skill categories and names
  useEffect(() => {
    if (allSkills) {
      const categoriesSet = new Set<string>();
      const namesSet = new Set<string>();
      
      allSkills.forEach(skill => {
        categoriesSet.add(skill.category || 'Other');
        namesSet.add(skill.name);
      });
      
      setSkillCategories(Array.from(categoriesSet));
      setSkillNames(Array.from(namesSet).sort());
    }
  }, [allSkills]);
  
  // Calculate user statistics
  const userStats: UserStats[] = users && allSkills ? users.map(user => {
    const userSkills = allSkills.filter(skill => skill.userId === user.id);
    // Create user stats with appropriate type conversions and fallbacks
    return {
      id: user.id,
      username: user.username || user.email.split('@')[0],
      email: user.email,
      role: user.role || undefined,
      totalSkills: userSkills.length,
      expertSkills: userSkills.filter(s => s.level === 'expert').length,
      intermediateSkills: userSkills.filter(s => s.level === 'intermediate').length,
      beginnerSkills: userSkills.filter(s => s.level === 'beginner').length,
      certifications: userSkills.filter(s => 
        s.certification && 
        s.certification !== 'true' && 
        s.certification !== 'false'
      ).length,
      createdAt: user.createdAt?.toString() || '',
      updatedAt: undefined // User type doesn't have updatedAt field
    };
  }) : [];
  
  // Organization-wide statistics
  const orgStats = userStats.reduce((acc, user) => {
    return {
      totalUsers: acc.totalUsers + 1,
      totalSkills: acc.totalSkills + user.totalSkills,
      expertSkills: acc.expertSkills + user.expertSkills,
      intermediateSkills: acc.intermediateSkills + user.intermediateSkills,
      beginnerSkills: acc.beginnerSkills + user.beginnerSkills,
      certifications: acc.certifications + user.certifications
    };
  }, {
    totalUsers: 0,
    totalSkills: 0,
    expertSkills: 0,
    intermediateSkills: 0,
    beginnerSkills: 0,
    certifications: 0
  });
  
  // Filter users based on search query and filters
  const filteredUsers = userStats.filter(user => {
    // Search filter
    const searchTerms = searchQuery.toLowerCase().split(" ");
    const userString = `${user.username} ${user.email} ${user.role || ''}`.toLowerCase();
    const matchesSearch = searchTerms.every(term => userString.includes(term));
    
    // Skill level filter
    const matchesSkillLevel = !filters.skillLevel || (
      filters.skillLevel === 'expert' ? user.expertSkills > 0 :
      filters.skillLevel === 'intermediate' ? user.intermediateSkills > 0 :
      filters.skillLevel === 'beginner' ? user.beginnerSkills > 0 : true
    );
    
    // Certification filter
    const matchesCertification = !filters.hasCertification || user.certifications > 0;
    
    // Date joined filter
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const userCreatedAt = new Date(user.createdAt || 0);
    const matchesDateJoined = !filters.dateJoined || (
      filters.dateJoined === 'recent' ? userCreatedAt >= thirtyDaysAgo :
      filters.dateJoined === 'quarter' ? (userCreatedAt >= ninetyDaysAgo && userCreatedAt < thirtyDaysAgo) :
      filters.dateJoined === 'older' ? userCreatedAt < ninetyDaysAgo : true
    );
    
    // Skill count filter
    const matchesSkillCount = !filters.skillCount || (
      filters.skillCount === 'high' ? user.totalSkills >= 5 :
      filters.skillCount === 'medium' ? (user.totalSkills >= 2 && user.totalSkills < 5) :
      filters.skillCount === 'low' ? user.totalSkills < 2 : true
    );
    
    // Category and skill name filters
    let matchesCategory = true;
    let matchesSkillName = true;
    
    if (filters.category || filters.skillName) {
      // Find the user's skills
      const userSkills = allSkills?.filter(skill => skill.userId === user.id) || [];
      
      // Check if any of the user's skills match the selected category
      if (filters.category) {
        matchesCategory = userSkills.some(skill => skill.category === filters.category);
      }
      
      // Check if any of the user's skills match the selected skill name
      if (filters.skillName) {
        matchesSkillName = userSkills.some(skill => skill.name === filters.skillName);
      }
    }
    
    return matchesSearch && matchesSkillLevel && matchesCertification && 
           matchesDateJoined && matchesSkillCount && matchesCategory && matchesSkillName;
  });
  
  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue, bValue;
    
    // Determine sort values based on the field
    switch (sortField) {
      case 'username':
        aValue = a.username;
        bValue = b.username;
        break;
      case 'email':
        aValue = a.email;
        bValue = b.email;
        break;
      case 'totalSkills':
        aValue = a.totalSkills;
        bValue = b.totalSkills;
        break;
      case 'expertSkills':
        aValue = a.expertSkills;
        bValue = b.expertSkills;
        break;
      case 'certifications':
        aValue = a.certifications;
        bValue = b.certifications;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt || 0).getTime();
        bValue = new Date(b.createdAt || 0).getTime();
        break;
      default:
        aValue = a[sortField as keyof UserStats];
        bValue = b[sortField as keyof UserStats];
    }
    
    // Sort strings
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    // Sort numbers
    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });
  
  // Leaderboard - top users by expert skills and certifications
  const leaderboard = [...userStats]
    .sort((a, b) => {
      // Sort first by expert skills
      const expertDiff = b.expertSkills - a.expertSkills;
      if (expertDiff !== 0) return expertDiff;
      
      // Then by certifications
      const certDiff = b.certifications - a.certifications;
      if (certDiff !== 0) return certDiff;
      
      // Then by total skills
      return b.totalSkills - a.totalSkills;
    })
    .slice(0, 5);
  
  // Calculate skill distribution by category
  const skillsByCategory = allSkills ? allSkills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for new field
    }
  };
  
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />;
  };
  
  const applyFilter = (filterType: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value === prev[filterType] ? undefined : value
    }));
  };
  
  const isLoading = isLoadingUsers || isLoadingSkills || isLoadingHistory || isLoadingClients || isLoadingProjects;

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/org" />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header 
          title="Organization Dashboard" 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    <span className="hidden sm:inline">Leaderboard</span>
                  </TabsTrigger>
                  <TabsTrigger value="directory" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Directory</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">Activity</span>
                  </TabsTrigger>
                </TabsList>
                
                {/* Overview Tab */}
                <TabsContent value="overview">
                  <div className="mb-8">
                    <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-6 rounded-xl text-white mb-6">
                      <h2 className="text-2xl font-bold mb-2">Organization Skills Overview</h2>
                      <p className="opacity-90">
                        Explore our collective expertise and skills across the organization
                      </p>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-3 rounded-full">
                              <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-500">Total Employees</p>
                              <h3 className="text-2xl font-bold text-gray-900">{orgStats.totalUsers}</h3>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center">
                            <div className="bg-indigo-100 p-3 rounded-full">
                              <Brain className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-500">Total Skills</p>
                              <h3 className="text-2xl font-bold text-gray-900">{orgStats.totalSkills}</h3>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center">
                            <div className="bg-green-100 p-3 rounded-full">
                              <Trophy className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-500">Expert Skills</p>
                              <h3 className="text-2xl font-bold text-gray-900">{orgStats.expertSkills}</h3>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center">
                            <div className="bg-purple-100 p-3 rounded-full">
                              <Award className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-500">Certifications</p>
                              <h3 className="text-2xl font-bold text-gray-900">{orgStats.certifications}</h3>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Skills by Category */}
                    <Card className="mb-8">
                      <CardHeader>
                        <CardTitle>Skills by Category</CardTitle>
                        <CardDescription>Distribution of skills across different categories</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(skillsByCategory).sort((a, b) => b[1] - a[1]).map(([category, count]) => (
                            <div key={category} className="flex items-center">
                              <div className="w-32 font-medium">{category}</div>
                              <div className="w-full ml-4">
                                <div className="flex items-center">
                                  <div 
                                    className="bg-indigo-500 h-4 rounded-full"
                                    style={{ width: `${Math.min(100, (count / orgStats.totalSkills) * 100)}%` }}
                                  ></div>
                                  <span className="ml-2 text-sm text-gray-500">{count} skills</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Skill Growth */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Skill Distribution by Level</CardTitle>
                        <CardDescription>Breakdown of skill proficiency across the organization</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <div className="w-32">
                              <div className="flex items-center">
                                <span className="font-medium mr-2">Expert</span>
                                <SkillLevelBadge level="expert" size="sm" />
                              </div>
                            </div>
                            <div className="w-full ml-4">
                              <div className="flex items-center">
                                <div 
                                  className="bg-green-500 h-4 rounded-full"
                                  style={{ width: `${(orgStats.expertSkills / orgStats.totalSkills) * 100}%` }}
                                ></div>
                                <span className="ml-2 text-sm text-gray-500">{orgStats.expertSkills} skills</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="w-32">
                              <div className="flex items-center">
                                <span className="font-medium mr-2">Intermediate</span>
                                <SkillLevelBadge level="intermediate" size="sm" />
                              </div>
                            </div>
                            <div className="w-full ml-4">
                              <div className="flex items-center">
                                <div 
                                  className="bg-blue-500 h-4 rounded-full"
                                  style={{ width: `${(orgStats.intermediateSkills / orgStats.totalSkills) * 100}%` }}
                                ></div>
                                <span className="ml-2 text-sm text-gray-500">{orgStats.intermediateSkills} skills</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="w-32">
                              <div className="flex items-center">
                                <span className="font-medium mr-2">Beginner</span>
                                <SkillLevelBadge level="beginner" size="sm" />
                              </div>
                            </div>
                            <div className="w-full ml-4">
                              <div className="flex items-center">
                                <div 
                                  className="bg-yellow-500 h-4 rounded-full"
                                  style={{ width: `${(orgStats.beginnerSkills / orgStats.totalSkills) * 100}%` }}
                                ></div>
                                <span className="ml-2 text-sm text-gray-500">{orgStats.beginnerSkills} skills</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Leaderboard Tab */}
                <TabsContent value="leaderboard">
                  <Card>
                    <CardHeader>
                      <CardTitle>Skill Leaders</CardTitle>
                      <CardDescription>Employees with the most expert skills and certifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto scrollable-container">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">Rank</TableHead>
                              <TableHead>Employee</TableHead>
                              <TableHead className="text-center">Expert Skills</TableHead>
                              <TableHead className="text-center">Certifications</TableHead>
                              <TableHead className="text-center">Total Skills</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {leaderboard.map((user, index) => (
                              <TableRow key={user.id} className={index < 3 ? "bg-amber-50" : ""}>
                                <TableCell>
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                                    {index + 1}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <Avatar className="h-10 w-10 mr-3">
                                      <AvatarImage src="" alt={user.username} />
                                      <AvatarFallback className="bg-primary/10 text-primary">
                                        {user.username?.[0] || user.email?.[0] || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">{user.username}</div>
                                      <div className="text-xs text-muted-foreground">{user.role || ""}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="font-bold">{user.expertSkills}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="font-bold">{user.certifications}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="font-bold">{user.totalSkills}</div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Link href={`/users/${user.id}`}>
                                    <Button variant="outline" size="sm">View Profile</Button>
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))}
                            {leaderboard.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                  No skill data available.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="mt-6">
                        <Link href="/leaderboard">
                          <Button variant="outline" className="w-full">View Full Leaderboard</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Directory Tab */}
                <TabsContent value="directory">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <CardTitle>Employee Directory</CardTitle>
                          <CardDescription>Browse and connect with colleagues across the organization</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {/* Client Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                <span>Client</span>
                                {filters.clientId && (
                                  <Badge variant="secondary" className="ml-1 rounded-sm">
                                    1
                                  </Badge>
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px] max-h-[300px] overflow-y-auto">
                              <DropdownMenuLabel>Filter by Client</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {clients.map((client) => (
                                <DropdownMenuItem 
                                  key={client.id}
                                  onClick={() => {
                                    // When selecting a client, clear any project filter
                                    if (filters.projectId && filters.clientId !== client.id.toString()) {
                                      setFilters(prev => ({
                                        ...prev,
                                        projectId: undefined,
                                        clientId: client.id.toString()
                                      }));
                                    } else {
                                      applyFilter('clientId', client.id.toString());
                                    }
                                  }}
                                  className="flex items-center justify-between"
                                >
                                  <span>{client.name}</span>
                                  {filters.clientId === client.id.toString() && <Check className="h-4 w-4" />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          {/* Project Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                <span>Project</span>
                                {filters.projectId && (
                                  <Badge variant="secondary" className="ml-1 rounded-sm">
                                    1
                                  </Badge>
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px] max-h-[300px] overflow-y-auto">
                              <DropdownMenuLabel>Filter by Project</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {projects
                                .filter(project => !filters.clientId || project.clientId.toString() === filters.clientId)
                                .map((project) => (
                                  <DropdownMenuItem 
                                    key={project.id}
                                    onClick={() => applyFilter('projectId', project.id.toString())}
                                    className="flex items-center justify-between"
                                  >
                                    <span>{project.name}</span>
                                    {filters.projectId === project.id.toString() && <Check className="h-4 w-4" />}
                                  </DropdownMenuItem>
                                ))}
                              {projects.filter(project => !filters.clientId || project.clientId.toString() === filters.clientId).length === 0 && (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                                  {filters.clientId ? "No projects for selected client" : "No projects available"}
                                </div>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          {/* Skill Category Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Layers className="h-4 w-4" />
                                <span>Category</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px]">
                              <DropdownMenuLabel>Select Category</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {skillCategories.map((category) => (
                                <DropdownMenuItem 
                                  key={category}
                                  onClick={() => applyFilter('category', category)}
                                  className="flex items-center justify-between"
                                >
                                  <span>{category}</span>
                                  {filters.category === category && <Check className="h-4 w-4" />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          {/* Skill Name Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Code2 className="h-4 w-4" />
                                <span>Skill</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px] max-h-[300px] overflow-y-auto">
                              <DropdownMenuLabel>Select Skill</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                                <Input 
                                  placeholder="Search skills..." 
                                  className="pl-7 h-8 text-sm"
                                  onChange={(e) => {
                                    // This is just a filter for the dropdown, not actual filtering
                                    const input = e.target.value.toLowerCase();
                                    // UI would filter the dropdown items based on input
                                  }}
                                />
                              </div>
                              <DropdownMenuSeparator />
                              {skillNames.map((skillName) => (
                                <DropdownMenuItem 
                                  key={skillName}
                                  onClick={() => applyFilter('skillName', skillName)}
                                  className="flex items-center justify-between"
                                >
                                  <span>{skillName}</span>
                                  {filters.skillName === skillName && <Check className="h-4 w-4" />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Search and filter */}
                      <div className="mb-6">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                              placeholder="Search users by name, email, or role..." 
                              className="pl-10"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                          
                          {/* Advanced Filters Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                                <Filter className="h-4 w-4" />
                                <span>Filters</span>
                                {(filters.skillLevel || filters.hasCertification || filters.dateJoined || filters.skillCount || filters.category || filters.clientId || filters.projectId) && (
                                  <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                    {Object.values(filters).filter(Boolean).length}
                                  </span>
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Filter Employees</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              {/* Skill Level Filter */}
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <span className="flex items-center">
                                    <Trophy className="mr-2 h-4 w-4" />
                                    <span>Skill Level</span>
                                  </span>
                                  {filters.skillLevel && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-48">
                                  <DropdownMenuCheckboxItem
                                    checked={filters.skillLevel === "expert"}
                                    onCheckedChange={() => applyFilter('skillLevel', filters.skillLevel === "expert" ? undefined : "expert")}
                                  >
                                    Expert Level
                                  </DropdownMenuCheckboxItem>
                                  <DropdownMenuCheckboxItem
                                    checked={filters.skillLevel === "intermediate"}
                                    onCheckedChange={() => applyFilter('skillLevel', filters.skillLevel === "intermediate" ? undefined : "intermediate")}
                                  >
                                    Intermediate Level
                                  </DropdownMenuCheckboxItem>
                                  <DropdownMenuCheckboxItem
                                    checked={filters.skillLevel === "beginner"}
                                    onCheckedChange={() => applyFilter('skillLevel', filters.skillLevel === "beginner" ? undefined : "beginner")}
                                  >
                                    Beginner Level
                                  </DropdownMenuCheckboxItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => applyFilter('skillLevel', undefined)}>
                                    Clear Filter
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              
                              {/* Skill Category Filter */}
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <span className="flex items-center">
                                    <Layers className="mr-2 h-4 w-4" />
                                    <span>Skill Category</span>
                                  </span>
                                  {filters.category && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-48 max-h-[300px] overflow-y-auto">
                                  {skillCategories.map(category => (
                                    <DropdownMenuCheckboxItem
                                      key={category}
                                      checked={filters.category === category}
                                      onCheckedChange={() => applyFilter('category', filters.category === category ? undefined : category)}
                                    >
                                      {category}
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => applyFilter('category', undefined)}>
                                    Clear Filter
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              
                              {/* Specific Skill Filter */}
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <span className="flex items-center">
                                    <Code2 className="mr-2 h-4 w-4" />
                                    <span>Specific Skill</span>
                                  </span>
                                  {filters.skillName && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-48 max-h-[300px] overflow-y-auto">
                                  {skillNames.map(name => (
                                    <DropdownMenuCheckboxItem
                                      key={name}
                                      checked={filters.skillName === name}
                                      onCheckedChange={() => applyFilter('skillName', filters.skillName === name ? undefined : name)}
                                    >
                                      {name}
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => applyFilter('skillName', undefined)}>
                                    Clear Filter
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              
                              {/* Date Joined Filter */}
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <span className="flex items-center">
                                    <Clock className="mr-2 h-4 w-4" />
                                    <span>Date Joined</span>
                                  </span>
                                  {filters.dateJoined && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-48">
                                  <DropdownMenuCheckboxItem
                                    checked={filters.dateJoined === "recent"}
                                    onCheckedChange={() => applyFilter('dateJoined', filters.dateJoined === "recent" ? undefined : "recent")}
                                  >
                                    Last 30 days
                                  </DropdownMenuCheckboxItem>
                                  <DropdownMenuCheckboxItem
                                    checked={filters.dateJoined === "quarter"}
                                    onCheckedChange={() => applyFilter('dateJoined', filters.dateJoined === "quarter" ? undefined : "quarter")}
                                  >
                                    1-3 months ago
                                  </DropdownMenuCheckboxItem>
                                  <DropdownMenuCheckboxItem
                                    checked={filters.dateJoined === "older"}
                                    onCheckedChange={() => applyFilter('dateJoined', filters.dateJoined === "older" ? undefined : "older")}
                                  >
                                    Older than 3 months
                                  </DropdownMenuCheckboxItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => applyFilter('dateJoined', undefined)}>
                                    Clear Filter
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              
                              {/* Skill Count Filter */}
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <span className="flex items-center">
                                    <Bookmark className="mr-2 h-4 w-4" />
                                    <span>Skill Count</span>
                                  </span>
                                  {filters.skillCount && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-48">
                                  <DropdownMenuCheckboxItem
                                    checked={filters.skillCount === "high"}
                                    onCheckedChange={() => applyFilter('skillCount', filters.skillCount === "high" ? undefined : "high")}
                                  >
                                    High (5+ skills)
                                  </DropdownMenuCheckboxItem>
                                  <DropdownMenuCheckboxItem
                                    checked={filters.skillCount === "medium"}
                                    onCheckedChange={() => applyFilter('skillCount', filters.skillCount === "medium" ? undefined : "medium")}
                                  >
                                    Medium (2-4 skills)
                                  </DropdownMenuCheckboxItem>
                                  <DropdownMenuCheckboxItem
                                    checked={filters.skillCount === "low"}
                                    onCheckedChange={() => applyFilter('skillCount', filters.skillCount === "low" ? undefined : "low")}
                                  >
                                    Low (0-1 skills)
                                  </DropdownMenuCheckboxItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => applyFilter('skillCount', undefined)}>
                                    Clear Filter
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              
                              {/* Certification Filter */}
                              <DropdownMenuCheckboxItem
                                checked={!!filters.hasCertification}
                                onCheckedChange={() => applyFilter('hasCertification', !filters.hasCertification)}
                                className="flex items-center"
                              >
                                <BadgeCheck className="mr-2 h-4 w-4" />
                                <span>Has Certifications</span>
                              </DropdownMenuCheckboxItem>
                              
                              {/* Client Filter */}
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <span className="flex items-center">
                                    <Building className="mr-2 h-4 w-4" />
                                    <span>Client</span>
                                  </span>
                                  {filters.clientId && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-48 max-h-[300px] overflow-y-auto">
                                  {clients.map(client => (
                                    <DropdownMenuCheckboxItem
                                      key={client.id}
                                      checked={filters.clientId === client.id.toString()}
                                      onCheckedChange={() => {
                                        if (filters.clientId === client.id.toString()) {
                                          applyFilter('clientId', undefined);
                                        } else {
                                          // When selecting a client, clear any project filter
                                          if (filters.projectId) {
                                            setFilters(prev => ({
                                              ...prev,
                                              projectId: undefined,
                                              clientId: client.id.toString()
                                            }));
                                          } else {
                                            applyFilter('clientId', client.id.toString());
                                          }
                                        }
                                      }}
                                    >
                                      {client.name}
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => applyFilter('clientId', undefined)}>
                                    Clear Filter
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              
                              {/* Project Filter */}
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <span className="flex items-center">
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    <span>Project</span>
                                  </span>
                                  {filters.projectId && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-48 max-h-[300px] overflow-y-auto">
                                  {projects
                                    .filter(project => !filters.clientId || project.clientId.toString() === filters.clientId)
                                    .map(project => (
                                      <DropdownMenuCheckboxItem
                                        key={project.id}
                                        checked={filters.projectId === project.id.toString()}
                                        onCheckedChange={() => applyFilter('projectId', filters.projectId === project.id.toString() ? undefined : project.id.toString())}
                                      >
                                        {project.name}
                                      </DropdownMenuCheckboxItem>
                                    ))}
                                  {projects.filter(project => !filters.clientId || project.clientId.toString() === filters.clientId).length === 0 && (
                                    <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                                      {filters.clientId ? "No projects for selected client" : "No projects available"}
                                    </div>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => applyFilter('projectId', undefined)}>
                                    Clear Filter
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setFilters({});
                              }}>
                                Reset All Filters
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {/* Active filters display */}
                        {(filters.skillLevel || filters.hasCertification || filters.dateJoined || filters.skillCount || filters.category || filters.skillName || filters.clientId || filters.projectId) && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {filters.clientId && (
                              <div className="bg-muted rounded-md px-2 py-1 text-sm flex items-center gap-1">
                                <Building className="h-3 w-3 mr-1" />
                                <span>Client: {clients.find(c => c.id.toString() === filters.clientId)?.name || 'Unknown'}</span>
                                <button 
                                  onClick={() => applyFilter('clientId', undefined)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            
                            {filters.projectId && (
                              <div className="bg-muted rounded-md px-2 py-1 text-sm flex items-center gap-1">
                                <Briefcase className="h-3 w-3 mr-1" />
                                <span>Project: {projects.find(p => p.id.toString() === filters.projectId)?.name || 'Unknown'}</span>
                                <button 
                                  onClick={() => applyFilter('projectId', undefined)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            
                            {filters.category && (
                              <div className="bg-muted rounded-md px-2 py-1 text-sm flex items-center gap-1">
                                <Layers className="h-3 w-3 mr-1" />
                                <span>Category: {filters.category}</span>
                                <button 
                                  onClick={() => applyFilter('category', undefined)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            
                            {filters.skillName && (
                              <div className="bg-muted rounded-md px-2 py-1 text-sm flex items-center gap-1">
                                <Code2 className="h-3 w-3 mr-1" />
                                <span>Skill: {filters.skillName}</span>
                                <button 
                                  onClick={() => applyFilter('skillName', undefined)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            
                            {filters.skillLevel && (
                              <div className="bg-muted rounded-md px-2 py-1 text-sm flex items-center gap-1">
                                <Trophy className="h-3 w-3 mr-1" />
                                <span>Level: {filters.skillLevel}</span>
                                <button 
                                  onClick={() => applyFilter('skillLevel', undefined)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            
                            {filters.dateJoined && (
                              <div className="bg-muted rounded-md px-2 py-1 text-sm flex items-center gap-1">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  {filters.dateJoined === 'recent' ? 'Joined: Last 30 days' : 
                                   filters.dateJoined === 'quarter' ? 'Joined: 1-3 months ago' : 
                                   'Joined: Over 3 months ago'}
                                </span>
                                <button 
                                  onClick={() => applyFilter('dateJoined', undefined)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            
                            {filters.skillCount && (
                              <div className="bg-muted rounded-md px-2 py-1 text-sm flex items-center gap-1">
                                <Bookmark className="h-3 w-3 mr-1" />
                                <span>
                                  {filters.skillCount === 'high' ? 'Skills: 5+' : 
                                   filters.skillCount === 'medium' ? 'Skills: 2-4' : 
                                   'Skills: 0-1'}
                                </span>
                                <button 
                                  onClick={() => applyFilter('skillCount', undefined)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            
                            {filters.hasCertification && (
                              <div className="bg-muted rounded-md px-2 py-1 text-sm flex items-center gap-1">
                                <BadgeCheck className="h-3 w-3 mr-1" />
                                <span>Has certifications</span>
                                <button 
                                  onClick={() => applyFilter('hasCertification', undefined)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            
                            <button 
                              onClick={() => setFilters({})}
                              className="text-sm text-primary hover:underline"
                            >
                              Clear all
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Users table */}
                      <div className="overflow-x-auto scrollable-container">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>
                                <Button 
                                  variant="ghost" 
                                  className="flex items-center px-0 font-medium"
                                  onClick={() => handleSort("username")}
                                >
                                  Employee {renderSortIcon("username")}
                                </Button>
                              </TableHead>
                              <TableHead className="text-center">
                                <Button 
                                  variant="ghost" 
                                  className="flex items-center justify-center px-0 font-medium"
                                  onClick={() => handleSort("totalSkills")}
                                >
                                  Total Skills {renderSortIcon("totalSkills")}
                                </Button>
                              </TableHead>
                              <TableHead className="text-center">
                                <Button 
                                  variant="ghost" 
                                  className="flex items-center justify-center px-0 font-medium"
                                  onClick={() => handleSort("expertSkills")}
                                >
                                  Expert Skills {renderSortIcon("expertSkills")}
                                </Button>
                              </TableHead>
                              <TableHead className="text-center">
                                <Button 
                                  variant="ghost" 
                                  className="flex items-center justify-center px-0 font-medium"
                                  onClick={() => handleSort("certifications")}
                                >
                                  Certifications {renderSortIcon("certifications")}
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
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Avatar className="h-10 w-10 mr-3">
                                        <AvatarImage src="" alt={user.username} />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                          {user.username?.[0] || user.email?.[0] || '?'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium">{user.username}</div>
                                        <div className="text-xs text-muted-foreground">{user.role || ""}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="font-bold">{user.totalSkills}</div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="font-bold">{user.expertSkills}</div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="font-bold">{user.certifications}</div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Link href={`/users/${user.id}`}>
                                      <Button variant="outline" size="sm">View Profile</Button>
                                    </Link>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Activity Tab */}
                <TabsContent value="activity">
                  <Card>
                    <CardHeader>
                      <CardTitle>Organization Activity</CardTitle>
                      <CardDescription>Recent skill updates and certifications across the organization</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingHistory ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : !skillHistoryData || skillHistoryData.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No recent activity.
                        </div>
                      ) : (
                        <div>
                          {/* Create formatted activity items for the feed */}
                          {(() => {
                            const activityItems: ActivityItem[] = skillHistoryData.map((history: any) => ({
                              id: history.id,
                              type: history.previousLevel || history.previous_level ? "update" : "add",
                              skillId: history.skillId || history.skill_id,
                              userSkillId: history.userSkillId || history.user_skill_id,
                              skillTemplateId: history.skillTemplateId || history.skill_template_id,
                              skillName: history.skillName || history.skill_name,
                              userId: history.userId || history.user_id,
                              previousLevel: history.previousLevel || history.previous_level,
                              newLevel: history.newLevel || history.new_level,
                              date: history.createdAt || history.created_at,
                              note: history.changeNote || history.change_note
                            }));
                            
                            return (
                              <ActivityFeed 
                                activities={activityItems} 
                                skills={allSkills || []} 
                                showAll={true}
                                isPersonal={false}
                                users={users || []}
                              />
                            );
                          })()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
}