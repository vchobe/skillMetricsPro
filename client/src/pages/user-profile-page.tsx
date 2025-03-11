import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/date-utils";
import { Skill, User } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import SkillLevelBadge from "@/components/skill-level-badge";
import ActivityFeed from "@/components/activity-feed";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Download,
  Loader2,
  UserCircle,
  Mail,
  Briefcase,
  MapPin,
  Building,
  Calendar,
  Award,
  ListFilter,
  AlertCircle,
  Code,
  Database,
  Cloud,
  PenTool,
  GitBranch,
  Brain
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function UserProfilePage() {
  const { userId } = useParams();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Get user details
  const { data: user, isLoading: isLoadingUser, error: userError } = useQuery<Omit<User, 'password'>>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId
  });
  
  // Get user's skills
  const { data: skills, isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: [`/api/users/${userId}/skills`],
    enabled: !!userId
  });
  
  // Get skill history
  const { data: skillHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: [`/api/user/skills/history`],
    enabled: !!userId && userId === currentUser?.id?.toString()
  });
  
  // Format skill history for activity feed
  const activityItems = skillHistory && Array.isArray(skillHistory) 
    ? skillHistory.map((history: any) => ({
        id: history.id,
        type: history.previousLevel ? "update" : "add",
        skillId: history.skillId,
        previousLevel: history.previousLevel,
        newLevel: history.newLevel,
        date: history.createdAt,
        note: history.changeNote
      })) 
    : [];
  
  // Export user data (admin only)
  const handleExport = async () => {
    try {
      if (!currentUser?.is_admin) {
        toast({
          title: "Permission Denied",
          description: "Only administrators can export user data",
          variant: "destructive"
        });
        return;
      }
      
      // Fetch data for export
      const response = await apiRequest("GET", "/api/admin/export-data");
      const data = await response.json();
      
      // Convert to JSON string
      const jsonString = JSON.stringify(data, null, 2);
      
      // Create a blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employee-skills-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "User data has been exported successfully",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data",
        variant: "destructive"
      });
    }
  };
  
  // Group skills by category
  const skillsByCategory = skills ? skills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>) : {} as Record<string, Skill[]>;
  
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'programming':
        return <Code className="h-5 w-5" />;
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'cloud':
        return <Cloud className="h-5 w-5" />;
      case 'design':
        return <PenTool className="h-5 w-5" />;
      case 'devops':
        return <GitBranch className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };
  
  // Calculated total skills by level
  const skillCounts = {
    beginner: skills ? skills.filter(s => s.level === 'beginner').length : 0,
    intermediate: skills ? skills.filter(s => s.level === 'intermediate').length : 0,
    expert: skills ? skills.filter(s => s.level === 'expert').length : 0,
    total: skills ? skills.length : 0
  };
  
  // Certificate count
  const certificationCount = skills ? skills.filter(s => 
    s.certification && 
    s.certification !== 'true' && 
    s.certification !== 'false'
  ).length : 0;
  
  // Show error if user not found
  if (userError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
        <p className="text-gray-600 mb-6">The user profile you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link href="/">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  // Show loading state
  if (isLoadingUser || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const isOwnProfile = currentUser?.id === parseInt(userId!);
  const isAdmin = currentUser?.is_admin === true;
  
  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath={`/users/${userId}`} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header 
          title={isOwnProfile ? "My Profile" : `${user.username || user.email}'s Profile`}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Admin Export Button */}
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                Export All Data
              </Button>
            </div>
          )}
          
          {/* Profile Header Card */}
          <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-6 rounded-xl text-white mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <Avatar className="h-16 w-16 border-2 border-white">
                  <AvatarImage src="" alt={user.username || user.email} />
                  <AvatarFallback className="text-xl bg-indigo-300 text-indigo-800">
                    {user.username?.[0] || user.email?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <h2 className="text-2xl font-bold">
                    {user.username || user.email.split('@')[0]}
                  </h2>
                  <p className="opacity-90">
                    {user.role || "Employee"} {user.project ? `• ${user.project}` : ""}
                  </p>
                </div>
              </div>
              {isAdmin && !isOwnProfile && (
                <div className="bg-white/10 text-white px-3 py-1 rounded-full text-sm">
                  Read-only View
                </div>
              )}
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Skills</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    {isOwnProfile 
                      ? "Your personal and professional information" 
                      : `${user.username || user.email.split('@')[0]}'s profile information`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start space-x-3">
                      <UserCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Name</div>
                        <div className="text-sm font-medium">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : (user.username || user.email.split('@')[0])}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Email</div>
                        <div className="text-sm font-medium">{user.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Role</div>
                        <div className="text-sm font-medium">
                          {user.role || "Not specified"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Project</div>
                        <div className="text-sm font-medium">
                          {user.project || "Not assigned"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Location</div>
                        <div className="text-sm font-medium">
                          {user.location || "Not specified"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Joined</div>
                        <div className="text-sm font-medium">
                          {user.createdAt ? formatDate(user.createdAt, "MMMM dd, yyyy") : "Not available"}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isOwnProfile && (
                    <div className="pt-4 border-t border-gray-200">
                      <Link href="/profile">
                        <Button variant="outline" className="w-full sm:w-auto">
                          Edit Profile
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Skills Tab */}
            <TabsContent value="skills">
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
                {/* Skill Stats */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Skill Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Skills</span>
                        <span className="font-bold text-lg">{skillCounts.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">Beginner</span>
                          <SkillLevelBadge level="beginner" className="ml-2" />
                        </div>
                        <span>{skillCounts.beginner}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">Intermediate</span>
                          <SkillLevelBadge level="intermediate" className="ml-2" />
                        </div>
                        <span>{skillCounts.intermediate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">Expert</span>
                          <SkillLevelBadge level="expert" className="ml-2" />
                        </div>
                        <span>{skillCounts.expert}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Certifications</span>
                          <span className="font-bold">{certificationCount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Skill List */}
                <div className="lg:col-span-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Skills</CardTitle>
                        <CardDescription>
                          {isOwnProfile 
                            ? "Your skills and competencies" 
                            : `${user.username || user.email.split('@')[0]}'s skills and competencies`}
                        </CardDescription>
                      </div>
                      {isLoadingSkills && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    </CardHeader>
                    <CardContent>
                      {Object.entries(skillsByCategory).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No skills added yet.
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                            <div key={category} className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-700`}>
                                  {getCategoryIcon(category)}
                                </div>
                                <h3 className="text-lg font-medium">{category}</h3>
                              </div>
                              
                              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                                {categorySkills.map(skill => (
                                  <div key={skill.id} className="bg-muted/30 rounded-lg p-3 flex justify-between items-center">
                                    <div>
                                      <div className="font-medium">{skill.name}</div>
                                      <div className="flex mt-1">
                                        <SkillLevelBadge level={skill.level} />
                                        {skill.certification && 
                                          skill.certification !== 'true' && 
                                          skill.certification !== 'false' && (
                                          <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                            Certified
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <Link href={`/skills/${skill.id}`}>
                                      <Button variant="ghost" size="sm">View</Button>
                                    </Link>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    {isOwnProfile 
                      ? "Your recent skill updates and additions" 
                      : `${user.username || user.email.split('@')[0]}'s recent skill updates and additions`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingHistory ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : activityItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activity.
                    </div>
                  ) : (
                    <ActivityFeed 
                      activities={activityItems} 
                      skills={skills || []} 
                      showAll={true} 
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}