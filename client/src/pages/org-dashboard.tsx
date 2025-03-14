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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SkillLevelBadge from "@/components/skill-level-badge";
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
  Filter
} from "lucide-react";

// Type definitions
type SortField = "username" | "email" | "totalSkills" | "expertSkills" | "certifications" | "createdAt";
type SortDirection = "asc" | "desc";
type Filters = {
  skillLevel?: string;
  category?: string;
  hasCertification?: boolean;
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
  
  // Fetch all users and their skills
  const { data: users, isLoading: isLoadingUsers } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ["/api/users"],
  });
  
  // Get all skills across organization
  const { data: allSkills, isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ["/api/all-skills"],
  });
  
  // Extract all unique skill categories
  useEffect(() => {
    if (allSkills) {
      const categoriesSet = new Set<string>();
      allSkills.forEach(skill => categoriesSet.add(skill.category || 'Other'));
      setSkillCategories(Array.from(categoriesSet));
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
  
  // Filter users based on search query
  const filteredUsers = userStats.filter(user => {
    // Search filter
    const searchTerms = searchQuery.toLowerCase().split(" ");
    const userString = `${user.username} ${user.email} ${user.role || ''}`.toLowerCase();
    const matchesSearch = searchTerms.every(term => userString.includes(term));
    
    // Other filters
    const matchesSkillLevel = !filters.skillLevel || (
      filters.skillLevel === 'expert' ? user.expertSkills > 0 :
      filters.skillLevel === 'intermediate' ? user.intermediateSkills > 0 :
      filters.skillLevel === 'beginner' ? user.beginnerSkills > 0 : true
    );
    const matchesCertification = !filters.hasCertification || user.certifications > 0;
    
    return matchesSearch && matchesSkillLevel && matchesCertification;
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
  
  const isLoading = isLoadingUsers || isLoadingSkills;

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
                <TabsList className="grid w-full grid-cols-3 mb-6">
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
                      <div className="overflow-x-auto">
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
                        <div className="flex gap-2">
                          <div className="relative">
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Filter className="h-4 w-4" />
                              <span>Filter</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Search and filter */}
                      <div className="mb-6">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Search users by name, email, or role..." 
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      {/* Filter Pills */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Button 
                          variant={filters.skillLevel === 'expert' ? "default" : "outline"} 
                          size="sm"
                          onClick={() => applyFilter('skillLevel', 'expert')}
                        >
                          Expert Skills
                        </Button>
                        <Button 
                          variant={filters.skillLevel === 'intermediate' ? "default" : "outline"} 
                          size="sm"
                          onClick={() => applyFilter('skillLevel', 'intermediate')}
                        >
                          Intermediate Skills
                        </Button>
                        <Button 
                          variant={filters.hasCertification ? "default" : "outline"} 
                          size="sm"
                          onClick={() => applyFilter('hasCertification', !filters.hasCertification)}
                        >
                          Has Certifications
                        </Button>
                      </div>
                      
                      {/* Users table */}
                      <div className="overflow-x-auto">
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
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
}