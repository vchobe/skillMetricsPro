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

// Define Activity interface for proper typing
interface Activity {
  id: number;
  type: "update" | "add";
  skillId: number;
  userId: number;
  previousLevel: string | null;
  newLevel: string;
  date: Date | string;
  note?: string;
}

// Define Project interfaces
interface Project {
  id: number;
  name: string;
  description?: string;
  clientId?: number | null;
  clientName?: string; // Added when joining with client
  startDate?: string | null;
  endDate?: string | null;
  location?: string;
  confluenceLink?: string;
  leadId?: number | null;
  deliveryLeadId?: number | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface ProjectResource {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  allocation?: number;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  projectName?: string; // Added when joining with project
}

// Combined type for projects list that can include items from project history
interface ExtendedProjectResource {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  allocation?: number;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string;
  createdAt: string;
  projectName?: string;
}

interface ProjectResourceHistory {
  id: number;
  projectId: number;
  userId: number;
  action: string;
  previousRole?: string;
  newRole?: string;
  previousAllocation?: number;
  newAllocation?: number;
  date: string;
  performedById?: number;
  note?: string;
  projectName?: string; // Added when joining with project
}

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
  ArrowLeft,
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
  Brain,
  FolderKanban
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
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${userId}`);
      return await res.json();
    },
    enabled: !!userId
  });
  
  // Get user's skills
  const { data: skills, isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: [`/api/users/${userId}/skills`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${userId}/skills`);
      return await res.json();
    },
    enabled: !!userId
  });
  
  // Get skill history
  const { data: skillHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: [`/api/users/${userId}/skills/history`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${userId}/skills/history`);
      return await res.json();
    },
    enabled: !!userId
  });
  
  // Get user projects
  const { data: userProjects, isLoading: isLoadingProjects } = useQuery<ProjectResource[]>({
    queryKey: [`/api/users/${userId}/projects`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${userId}/projects`);
      return await res.json();
    },
    enabled: !!userId
  });

  // Get user project history
  const { data: projectHistory, isLoading: isLoadingProjectHistory } = useQuery<ProjectResourceHistory[]>({
    queryKey: [`/api/users/${userId}/projects/history`],
    enabled: !!userId && (userId === currentUser?.id?.toString() || currentUser?.is_admin === true)
  });
  
  // Format skill history for activity feed
  const activityItems: Activity[] = skillHistory && Array.isArray(skillHistory) 
    ? skillHistory.map((history: any) => ({
        id: history.id,
        type: history.previousLevel || history.previous_level ? "update" : "add",
        skillId: history.skillId || history.skill_id,
        userId: history.userId || history.user_id || parseInt(userId!),
        previousLevel: history.previousLevel || history.previous_level,
        newLevel: history.newLevel || history.new_level,
        date: history.createdAt || history.created_at,
        note: history.changeNote || history.change_note
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
          {/* Admin Buttons */}
          {isAdmin && (
            <div className="flex justify-between mb-4">
              <Link href="/admin">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Admin Dashboard
                </Button>
              </Link>
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
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Skills</span>
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                <span className="hidden sm:inline">Projects</span>
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
                                  <div key={skill.id} className="bg-muted/30 rounded-lg p-3 flex flex-col space-y-2">
                                    <div className="flex justify-between items-center">
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
                                    
                                    {/* Certification Details */}
                                    {skill.certification && 
                                      skill.certification !== 'true' && 
                                      skill.certification !== 'false' && (
                                      <div className="bg-amber-50 p-2 rounded-md text-sm">
                                        <div className="font-medium text-amber-800">
                                          {skill.certification}
                                        </div>
                                        {skill.credlyLink && (
                                          <a 
                                            href={skill.credlyLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline flex items-center mt-1 text-xs"
                                          >
                                            <Award className="h-3 w-3 mr-1" />
                                            View Credential
                                          </a>
                                        )}
                                        {skill.certificationDate && (
                                          <div className="mt-1 text-xs text-gray-600">
                                            Earned: {formatDate(skill.certificationDate, "MMM yyyy")}
                                          </div>
                                        )}
                                        {skill.expirationDate && (
                                          <div className="text-xs text-gray-600">
                                            Expires: {formatDate(skill.expirationDate, "MMM yyyy")}
                                          </div>
                                        )}
                                      </div>
                                    )}
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

            {/* Projects Tab */}
            <TabsContent value="projects">
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
                {/* Project Stats Summary */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Current Projects</span>
                        <span className="font-bold text-lg">
                          {userProjects ? userProjects.filter(p => !p.endDate || new Date(p.endDate) > new Date()).length : 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Past Projects</span>
                        <span className="font-bold">
                          {(userProjects ? userProjects.filter(p => p.endDate && new Date(p.endDate) <= new Date()).length : 0) + 
                           (projectHistory ? projectHistory.filter(h => h.action === 'removed').length : 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Role Changes</span>
                        <span className="font-bold">
                          {projectHistory ? projectHistory.filter(h => h.action === 'role_changed').length : 0}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total Projects</span>
                          <span className="font-bold">
                            {userProjects ? 
                              (new Set([
                                ...userProjects.map(p => p.projectId),
                                ...(projectHistory ? 
                                  projectHistory
                                    .filter(h => h.action === 'removed')
                                    .map(h => h.projectId) : 
                                  [])
                              ])).size : 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Project List */}
                <div className="lg:col-span-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Projects</CardTitle>
                        <CardDescription>
                          {isOwnProfile 
                            ? "Your current and past project assignments" 
                            : `${user.username || user.email.split('@')[0]}'s current and past project assignments`}
                        </CardDescription>
                      </div>
                      {isLoadingProjects && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    </CardHeader>
                    <CardContent>
                      {isLoadingProjects ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Current Projects */}
                          <div>
                            <h3 className="font-medium text-lg mb-4">Current Projects</h3>
                            {(!userProjects || userProjects.filter(p => !p.endDate || new Date(p.endDate) > new Date()).length === 0) ? (
                              <div className="text-muted-foreground text-sm">No current project assignments.</div>
                            ) : (
                              <div className="grid gap-4 grid-cols-1">
                                {userProjects
                                  .filter(p => !p.endDate || new Date(p.endDate) > new Date())
                                  .map(project => (
                                    <div key={project.id} className="p-4 border rounded-lg shadow-sm transition-all hover:shadow">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h4 className="font-medium">
                                            {project.projectName || `Project #${project.projectId}`}
                                          </h4>
                                          <div className="text-sm text-muted-foreground">
                                            Role: <span className="font-medium">{project.role}</span>
                                          </div>
                                          {project.allocation && (
                                            <div className="text-sm text-muted-foreground">
                                              Allocation: <span className="font-medium">{project.allocation}%</span>
                                            </div>
                                          )}
                                          <div className="flex gap-4 mt-2">
                                            {project.startDate && (
                                              <div className="text-xs text-muted-foreground">
                                                Start: {formatDate(project.startDate, "MMM d, yyyy")}
                                              </div>
                                            )}
                                            {project.endDate && (
                                              <div className="text-xs text-muted-foreground">
                                                End: {formatDate(project.endDate, "MMM d, yyyy")}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <Link to={`/projects/${project.projectId}`}>
                                          <Button variant="outline" size="sm">View Project</Button>
                                        </Link>
                                      </div>
                                      {project.notes && (
                                        <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                                          <p className="text-muted-foreground">{project.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Past Projects */}
                          <div>
                            <h3 className="font-medium text-lg mb-4">Past Projects</h3>
                            {/* Calculate if there are any past projects (including those from history) */}
                            {((!userProjects || userProjects.filter(p => p.endDate && new Date(p.endDate) <= new Date()).length === 0) && 
                              (!projectHistory || projectHistory.filter(h => h.action === 'removed').length === 0)) ? (
                              <div className="text-muted-foreground text-sm">No past project assignments.</div>
                            ) : (
                              <div className="grid gap-4 grid-cols-1">
                                {(() => {
                                  // Create an array to hold all past projects
                                  const pastProjects: ExtendedProjectResource[] = [];
                                  
                                  // Add regular past projects (with end date)
                                  if (userProjects) {
                                    userProjects
                                      .filter(p => p.endDate && new Date(p.endDate) <= new Date())
                                      .forEach(p => {
                                        pastProjects.push({
                                          id: p.id,
                                          projectId: p.projectId,
                                          userId: p.userId,
                                          role: p.role,
                                          allocation: p.allocation,
                                          startDate: p.startDate,
                                          endDate: p.endDate,
                                          notes: p.notes,
                                          createdAt: p.createdAt,
                                          projectName: p.projectName
                                        });
                                      });
                                  }
                                  
                                  // Add projects the user was removed from (based on history)
                                  if (projectHistory) {
                                    projectHistory
                                      .filter(h => h.action === 'removed')
                                      .forEach(h => {
                                        pastProjects.push({
                                          id: h.id,
                                          projectId: h.projectId,
                                          userId: h.userId,
                                          role: h.previousRole || 'Team Member',
                                          allocation: h.previousAllocation,
                                          startDate: null,
                                          endDate: h.date,
                                          notes: h.note || 'Removed from project',
                                          createdAt: h.date,
                                          projectName: h.projectName
                                        });
                                      });
                                  }
                                  
                                  return pastProjects;
                                })().map(project => (
                                    <div key={project.id} className="p-4 border rounded-lg bg-muted/30">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h4 className="font-medium">
                                            {project.projectName || `Project #${project.projectId}`}
                                          </h4>
                                          <div className="text-sm text-muted-foreground">
                                            Role: <span className="font-medium">{project.role}</span>
                                          </div>
                                          {project.allocation && (
                                            <div className="text-sm text-muted-foreground">
                                              Allocation: <span className="font-medium">{project.allocation}%</span>
                                            </div>
                                          )}
                                          <div className="flex gap-4 mt-2">
                                            {project.startDate && (
                                              <div className="text-xs text-muted-foreground">
                                                Start: {formatDate(project.startDate, "MMM d, yyyy")}
                                              </div>
                                            )}
                                            {project.endDate && (
                                              <div className="text-xs text-muted-foreground">
                                                End: {formatDate(project.endDate, "MMM d, yyyy")}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <Link to={`/projects/${project.projectId}`}>
                                          <Button variant="ghost" size="sm">View Project</Button>
                                        </Link>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Project History (Role Changes) */}
                          {projectHistory && projectHistory.length > 0 && (
                            <div className="mt-6 pt-6 border-t">
                              <h3 className="font-medium text-lg mb-4">Project History</h3>
                              <div className="space-y-3">
                                {projectHistory.map(history => (
                                  <div key={history.id} className="flex items-start gap-4 p-3 rounded-md bg-slate-50">
                                    <div className="rounded-full bg-slate-200 p-2">
                                      <Calendar className="h-4 w-4 text-slate-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {history.action === 'added' ? 'Joined ' : 
                                         history.action === 'removed' ? 'Left ' : 
                                         history.action === 'role_changed' ? 'Role changed in ' : 
                                         'Updated role in '}
                                        <Link to={`/projects/${history.projectId}`} className="hover:underline">
                                          <span className="font-semibold">{history.projectName || `Project #${history.projectId}`}</span>
                                        </Link>
                                      </p>
                                      {history.action === 'role_changed' && (
                                        <p className="text-xs text-slate-600">
                                          Changed from {history.previousRole} to {history.newRole}
                                        </p>
                                      )}
                                      <p className="text-xs text-slate-500 mt-1">
                                        {formatDate(history.date, "MMMM d, yyyy")}
                                      </p>
                                      {history.note && (
                                        <p className="text-xs text-slate-600 mt-1 italic">
                                          Note: {history.note}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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