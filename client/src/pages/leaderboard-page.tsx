import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skill, User } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import SkillLevelBadge from "@/components/skill-level-badge";
import {
  Loader2,
  Search,
  Trophy,
  Award,
  Medal,
  Brain,
  Filter
} from "lucide-react";

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
  updatedAt?: string | null;
};

export default function LeaderboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overall");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  // Fetch all users
  const { data: users, isLoading: isLoadingUsers } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ["/api/users"],
  });
  
  // Get all skills across organization
  const { data: allSkills, isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ["/api/all-skills"],
  });
  
  // Extract skill categories
  const [skillCategories, setSkillCategories] = useState<string[]>([]);
  
  useEffect(() => {
    if (allSkills) {
      // Create a set and then convert to array to avoid iteration type error
      const categorySet = new Set<string>();
      allSkills.forEach(skill => categorySet.add(skill.category || 'Other'));
      const categories = Array.from(categorySet);
      setSkillCategories(categories);
    }
  }, [allSkills]);
  
  // Calculate user statistics
  const userStats: UserStats[] = users && allSkills ? users.map(user => {
    const userSkills = allSkills.filter(skill => skill.userId === user.id);
    return {
      id: user.id,
      username: user.username || user.email.split('@')[0],
      email: user.email,
      role: user.role,
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
      updatedAt: undefined // User type doesn't have updatedAt
    };
  }) : [];
  
  // Filter users by search query
  const filteredUserStats = userStats.filter(user => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.role || '').toLowerCase().includes(searchLower)
    );
  });
  
  // Different leaderboards
  const getLeaderboard = (tab: string) => {
    let sortedUsers = [...filteredUserStats];
    
    switch (tab) {
      case 'overall':
        // Sort by expert skills, then certifications, then total skills
        return sortedUsers.sort((a, b) => {
          const expertDiff = b.expertSkills - a.expertSkills;
          if (expertDiff !== 0) return expertDiff;
          
          const certDiff = b.certifications - a.certifications;
          if (certDiff !== 0) return certDiff;
          
          return b.totalSkills - a.totalSkills;
        });
      
      case 'expert':
        // Most expert level skills
        return sortedUsers.sort((a, b) => b.expertSkills - a.expertSkills);
      
      case 'certifications':
        // Most certifications
        return sortedUsers.sort((a, b) => b.certifications - a.certifications);
      
      case 'total':
        // Most total skills
        return sortedUsers.sort((a, b) => b.totalSkills - a.totalSkills);
        
      default:
        return sortedUsers;
    }
  };
  
  const currentLeaderboard = getLeaderboard(activeTab);
  
  // Calculate category-specific skill leaders
  const getCategoryLeaders = (category: string) => {
    if (!allSkills || !users) return [];
    
    // Count skills in this category for each user
    const userCategorySkills = users.map(user => {
      const categorySkills = allSkills.filter(skill => 
        skill.userId === user.id && 
        (skill.category || 'Other') === category
      );
      
      return {
        id: user.id,
        username: user.username || user.email.split('@')[0],
        email: user.email,
        role: user.role,
        totalSkills: categorySkills.length,
        expertSkills: categorySkills.filter(s => s.level === 'expert').length,
        certifications: categorySkills.filter(s => 
          s.certification && 
          s.certification !== 'true' && 
          s.certification !== 'false'
        ).length,
      };
    });
    
    // Sort by expert skills in this category
    return userCategorySkills
      .filter(user => user.totalSkills > 0) // Only include users with skills in this category
      .sort((a, b) => {
        if (b.expertSkills !== a.expertSkills) return b.expertSkills - a.expertSkills;
        if (b.certifications !== a.certifications) return b.certifications - a.certifications;
        return b.totalSkills - a.totalSkills;
      })
      .slice(0, 5); // Top 5 per category
  };
  
  const isLoading = isLoadingUsers || isLoadingSkills;
  
  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/leaderboard" />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-16' : 'ml-0'}`}>
        <Header 
          title="Skill Leaderboard" 
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
              <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500 p-6 rounded-xl text-white mb-6">
                <h2 className="text-2xl font-bold mb-2">Skills Leaderboard</h2>
                <p className="opacity-90">
                  Celebrating expertise and achievement across our organization
                </p>
              </div>
              
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search users..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overall" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    <span>Overall</span>
                  </TabsTrigger>
                  <TabsTrigger value="expert" className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span>Expert Skills</span>
                  </TabsTrigger>
                  <TabsTrigger value="certifications" className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span>Certifications</span>
                  </TabsTrigger>
                  <TabsTrigger value="total" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <span>Total Skills</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab}>
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {activeTab === 'overall' && 'Overall Leaders'}
                        {activeTab === 'expert' && 'Expert Skill Leaders'}
                        {activeTab === 'certifications' && 'Most Certified'}
                        {activeTab === 'total' && 'Most Skills'}
                      </CardTitle>
                      <CardDescription>
                        {activeTab === 'overall' && 'Users with the highest combination of expert skills and certifications'}
                        {activeTab === 'expert' && 'Users with the most expert-level skills'}
                        {activeTab === 'certifications' && 'Users with the most professional certifications'}
                        {activeTab === 'total' && 'Users with the highest total number of skills'}
                      </CardDescription>
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
                            {currentLeaderboard.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                  No users found matching your search criteria.
                                </TableCell>
                              </TableRow>
                            ) : (
                              currentLeaderboard.map((user, index) => (
                                <TableRow key={user.id} className={index < 3 ? "bg-amber-50" : ""}>
                                  <TableCell>
                                    {index === 0 ? (
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-white font-bold">
                                        <Trophy className="h-4 w-4" />
                                      </div>
                                    ) : index === 1 ? (
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 text-gray-800 font-bold">
                                        <Medal className="h-4 w-4" />
                                      </div>
                                    ) : index === 2 ? (
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700 text-white font-bold">
                                        <Medal className="h-4 w-4" />
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 font-bold">
                                        {index + 1}
                                      </div>
                                    )}
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
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              {/* Category-specific leaderboards */}
              <div className="space-y-8">
                <h2 className="text-xl font-bold">Category Leaders</h2>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    variant={categoryFilter === null ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setCategoryFilter(null)}
                  >
                    All Categories
                  </Button>
                  
                  {skillCategories.map(category => (
                    <Button 
                      key={category}
                      variant={categoryFilter === category ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setCategoryFilter(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
                
                {(categoryFilter ? [categoryFilter] : skillCategories).map(category => {
                  const categoryLeaders = getCategoryLeaders(category);
                  
                  if (categoryLeaders.length === 0) return null;
                  
                  return (
                    <Card key={category} className="mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <span>Top {category} Experts</span>
                        </CardTitle>
                        <CardDescription>Employees with the most expertise in {category}</CardDescription>
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
                              {categoryLeaders.map((user, index) => (
                                <TableRow key={user.id} className={index < 3 ? "bg-amber-50" : ""}>
                                  <TableCell>
                                    {index === 0 ? (
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-white font-bold">
                                        <Trophy className="h-4 w-4" />
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 font-bold">
                                        {index + 1}
                                      </div>
                                    )}
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
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}