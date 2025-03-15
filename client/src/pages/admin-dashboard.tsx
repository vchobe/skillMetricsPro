import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Skill, User, SkillHistory } from "@shared/schema";
import { formatDate, DATE_FORMATS } from "@/lib/date-utils";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import UserProfileDialog from "@/components/user-profile-dialog";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Area,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Scatter,
  ScatterChart,
  ZAxis,
  Treemap
} from "recharts";
import {
  BarChart4,
  ArrowUpDown,
  Users,
  Brain,
  Clock,
  Download,
  BarChart2,
  PieChart as PieChartIcon,
  Filter,
  ChevronRight,
  Award,
  UserCircle,
  History,
  Activity,
  FileDown,
  AreaChart,
  LineChart as LineChartIcon,
  LayoutDashboard,
  TrendingUp,
  BrainCircuit,
  Hexagon,
  RadarIcon,
  DownloadCloud,
  Calendar,
  Search,
  SquareStack,
  User as UserIcon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SkillLevelBadge from "@/components/skill-level-badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "@/components/ui/alert-circle";
import AdminUserActions from "@/components/admin-user-actions";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [skillCategoryFilter, setSkillCategoryFilter] = useState("all");
  // This was removed as there's already another useEffect for the same purpose below
  
  // User profile dialog state
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // User Management tab - sorting and filtering state
  const [sortField, setSortField] = useState<string>("username");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  // Skill History tab - sorting and filtering state
  const [skillHistorySortField, setSkillHistorySortField] = useState<string>("date");
  const [skillHistorySortDirection, setSkillHistorySortDirection] = useState<"asc" | "desc">("desc");
  const [skillHistorySearchQuery, setSkillHistorySearchQuery] = useState("");
  const [skillHistoryLevelFilter, setSkillHistoryLevelFilter] = useState("all");
  
  // Certifications tab - sorting and filtering state
  const [certSortField, setCertSortField] = useState<string>("name");
  const [certSortDirection, setCertSortDirection] = useState<"asc" | "desc">("asc");
  const [certSearchQuery, setCertSearchQuery] = useState("");
  const [certCategoryFilter, setCertCategoryFilter] = useState("all");
  
  // Redirect if not admin
  const { toast } = useToast();
  const csvExportRef = useRef<HTMLAnchorElement>(null);
  const skillGapExportRef = useRef<HTMLAnchorElement>(null);
  
  useEffect(() => {
    if (user && !user.is_admin) {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  // Check for URL tab parameter and set active tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    
    // Only update tab from URL, don't modify URL here
    if (tab === "users" || tab === "skill-history" || tab === "certifications") {
      setActiveTab(tab);
    } else if (window.location.pathname === "/admin") {
      // Default to dashboard if no valid tab is specified
      setActiveTab("dashboard");
    }
  }, [location]); // Only listen for location changes
  
  // Get all users
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  
  // Get all skills
  const { data: skills, isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ["/api/admin/skills"],
  });

  // Get all skill histories for admin
  const { data: skillHistories, isLoading: isLoadingHistories } = useQuery<(SkillHistory & { skill_name: string, user_email: string })[]>({
    queryKey: ["/api/admin/skill-history"],
  });
  
  // Get certification report
  const { data: certificationReport, isLoading: isLoadingCertifications } = useQuery<{ user: User, certifications: any[] }[]>({
    queryKey: ["/api/admin/certification-report"],
  });
  
  // Get advanced analytics data
  const { data: advancedAnalytics, isLoading: isLoadingAnalytics } = useQuery<{
    monthlyData: { month: string; count: number }[];
    skillLevelTrends: { month: string; beginner: number; intermediate: number; expert: number }[];
    categoryData: { name: string; value: number }[];
    departmentData: { name: string; value: number }[];
    userSkillData: { userId: number; name: string; skillCount: number }[];
    certifiedUsers: { userId: number; name: string; certCount: number }[];
  }>({
    queryKey: ["/api/admin/advanced-analytics"],
  });
  
  // Get skill targets
  const { data: skillTargets = [], isLoading: isLoadingTargets } = useQuery<{
    id: number;
    name?: string;
    skillIds: number[];
    targetLevel: string;
    targetDate?: string;
    targetNumber?: number;
    description?: string;
    assignedUsers?: number[];
  }[]>({
    queryKey: ["/api/admin/skill-targets"],
  });
  
  // Calculate stats
  const stats = {
    totalUsers: users?.length || 0,
    totalSkills: skills?.length || 0,
    totalCertifications: skills?.filter(skill => 
      skill.certification && 
      skill.certification !== 'true' && 
      skill.certification !== 'false'
    ).length || 0,
    updatesThisMonth: skills?.filter(skill => {
      const now = new Date();
      const skillDate = new Date(skill.lastUpdated);
      return skillDate.getMonth() === now.getMonth() && skillDate.getFullYear() === now.getFullYear();
    }).length || 0
  };
  
  // Prepare chart data
  const categoryData = skills ? 
    Array.from(
      skills.reduce((acc, skill) => {
        const category = skill.category || "Other";
        acc.set(category, (acc.get(category) || 0) + 1);
        return acc;
      }, new Map<string, number>())
    ).map(([name, value]) => ({ name, value }))
    : [];
  
  // Get unique categories for filter
  const skillCategories = skills ? 
    Array.from(new Set(skills.map(skill => skill.category || "Other")))
    : [];
    
  // Skill distribution by name with optional category filter
  const skillNameData = skills ? 
    Array.from(
      skills
        .filter(skill => skillCategoryFilter === "all" || skill.category === skillCategoryFilter)
        .reduce((acc, skill) => {
          const name = skill.name || "Unnamed";
          acc.set(name, (acc.get(name) || 0) + 1);
          return acc;
        }, new Map<string, number>())
    )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value) // Sort by frequency, highest first
    .slice(0, 10) // Take top 10 skills only
    : [];
  
  // Department data (mock - would be calculated based on user.project or department field)
  const departmentData = [
    { name: "Engineering", value: 45 },
    { name: "Design", value: 20 },
    { name: "Product", value: 15 },
    { name: "Marketing", value: 10 },
    { name: "Other", value: 10 }
  ];
  
  // Calculate skill gap metrics
  const skillGapAnalysis = useMemo(() => {
    if (!skills || !skillTargets) return [];
    
    // Helper function to convert skill level to numeric value
    const levelToValue = (level: string): number => {
      switch(level.toLowerCase()) {
        case 'beginner': return 33;
        case 'intermediate': return 66;
        case 'expert': return 100;
        default: return 0;
      }
    };
    
    // Create gap analysis data structure based on skill targets
    return skillTargets.map(target => {
      // Skip if target has no assigned skills
      if (!target.skillIds || target.skillIds.length === 0) return null;
      
      // Find the skills referenced by this target
      const targetSkills = skills.filter(skill => 
        target.skillIds.includes(skill.id)
      );
      
      // Skip if no matching skills are found
      if (targetSkills.length === 0) return null;
      
      // Calculate current level (average of all targeted skills)
      const currentLevelValue = targetSkills.reduce((sum, skill) => 
        sum + levelToValue(skill.level), 0) / targetSkills.length;
      
      // Get target level
      const targetLevelValue = levelToValue(target.targetLevel);
      
      // Calculate gap
      const gap = Math.max(0, targetLevelValue - currentLevelValue);
      
      // Count employees needing skill improvement
      const employeesNeedingImprovement = users?.filter(user => {
        // Get the user's skills that match this target
        const userTargetSkills = skills.filter(s => 
          (s.userId === user.id || (s as any).user_id === user.id) && 
          target.skillIds.includes(s.id)
        );
        
        // If user has no relevant skills, they need improvement
        if (userTargetSkills.length === 0) return true;
        
        // Calculate user's average level for target skills
        const userAvgLevel = userTargetSkills.reduce((sum, skill) => 
          sum + levelToValue(skill.level), 0) / userTargetSkills.length;
          
        // If user's level is below target, they need improvement
        return userAvgLevel < targetLevelValue;
      }).length || 0;
      
      return {
        name: target.name || `Target ${target.id}`,
        targetSkillCount: targetSkills.length,
        currentLevel: Math.round(currentLevelValue),
        targetLevel: Math.round(targetLevelValue),
        gap: Math.round(gap),
        employeesNeedingImprovement
      };
    }).filter(Boolean); // Remove null entries
  }, [skills, skillTargets, users]);
  
  // Department skills data (mock)
  const departmentSkillsData = [
    { department: "Engineering", skill: "JavaScript", proficiency: 85, level: "expert" },
    { department: "Engineering", skill: "Python", proficiency: 78, level: "expert" },
    { department: "Design", skill: "UI/UX Design", proficiency: 60, level: "intermediate" },
    { department: "DevOps", skill: "Kubernetes", proficiency: 65, level: "intermediate" }
  ];
  
  // Recent activity (mock)
  const recentActivity = skills ? 
    skills
      .filter(skill => skill.lastUpdated && typeof skill.lastUpdated === 'string')
      .sort((a, b) => {
        try {
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        } catch (e) {
          return 0;
        }
      })
      .slice(0, 5)
      .map(skill => ({
        skillId: skill.id,
        userId: skill.userId,
        skillName: skill.name,
        level: skill.level,
        date: skill.lastUpdated
      }))
    : [];
  
  // Get user by ID
  const getUserById = (userId: number) => {
    return users?.find(u => u.id === userId);
  };
  
  // Apply filters and sorting to users
  const filteredSortedUsers = useMemo(() => {
    if (!users) return [];
    
    // Step 1: Filter users by search query
    let filtered = users.filter(user => {
      if (searchQuery === "") return true;
      
      const searchLower = searchQuery.toLowerCase();
      return (
        (user.username?.toLowerCase().includes(searchLower) || false) ||
        (user.email?.toLowerCase().includes(searchLower) || false) ||
        (user.firstName?.toLowerCase().includes(searchLower) || false) ||
        (user.lastName?.toLowerCase().includes(searchLower) || false) ||
        (user.role?.toLowerCase().includes(searchLower) || false) ||
        (user.project?.toLowerCase().includes(searchLower) || false)
      );
    });
    
    // Step 2: Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => 
        user.role?.toLowerCase() === roleFilter.toLowerCase()
      );
    }
    
    // Step 3: Sort users
    return filtered.sort((a, b) => {
      // Get comparable values based on sort field
      let aValue: any, bValue: any;
      
      if (sortField === "username") {
        aValue = a.username || a.email?.split('@')[0] || "";
        bValue = b.username || b.email?.split('@')[0] || "";
      } 
      else if (sortField === "email") {
        aValue = a.email || "";
        bValue = b.email || "";
      }
      else if (sortField === "role") {
        aValue = a.role || "";
        bValue = b.role || "";
      }
      else if (sortField === "project") {
        aValue = a.project || "";
        bValue = b.project || "";
      }
      else if (sortField === "skills") {
        // Count skills for each user
        aValue = skills?.filter(s => s.userId === a.id || (s as any).user_id === a.id).length || 0;
        bValue = skills?.filter(s => s.userId === b.id || (s as any).user_id === b.id).length || 0;
      }
      else {
        aValue = a[sortField as keyof User] || "";
        bValue = b[sortField as keyof User] || "";
      }
      
      // Compare the values
      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [users, searchQuery, roleFilter, sortField, sortDirection, skills]);
  
  // CSV Export function for certifications
  const exportCertificationsCSV = () => {
    if (!certificationReport || certificationReport.length === 0) {
      toast({
        title: "Export failed",
        description: "No certification data available to export",
        variant: "destructive"
      });
      return;
    }
    
    // Create CSV content
    const headers = ["Employee Name", "Employee Email", "Certification Name", "Category", "Level", "Acquisition Date", "Expiration Date"];
    const rows = certificationReport.flatMap(report => 
      report.certifications.map(cert => [
        report.user.username || report.user.email?.split('@')[0] || `User ${report.user.id}`,
        report.user.email,
        cert.name,
        cert.category || 'N/A',
        cert.level || 'N/A',
        cert.acquired ? format(new Date(cert.acquired), "yyyy-MM-dd") : 'N/A',
        cert.expirationDate ? format(new Date(cert.expirationDate), "yyyy-MM-dd") : 'N/A'
      ])
    );
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Set up hidden link for download
    if (csvExportRef.current) {
      csvExportRef.current.href = url;
      csvExportRef.current.download = `employee_certifications_${new Date().toISOString().split('T')[0]}.csv`;
      csvExportRef.current.click();
    }
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    toast({
      title: "Export successful",
      description: "Certification data has been exported to CSV",
      variant: "default"
    });
  };
  
  // CSV Export function for skill gap analysis
  const exportSkillGapCSV = () => {
    if (!skillGapAnalysis || skillGapAnalysis.length === 0) {
      toast({
        title: "Export failed",
        description: "No skill gap data available to export",
        variant: "destructive"
      });
      return;
    }
    
    // Create CSV content
    const headers = ["Skill Target", "Skills Count", "Current Level (%)", "Target Level (%)", "Gap (%)", "Employees Needing Improvement"];
    const rows = skillGapAnalysis.map(gap => [
      gap?.name || 'Unknown',
      gap?.targetSkillCount || 0,
      gap?.currentLevel || 0,
      gap?.targetLevel || 0,
      gap?.gap || 0,
      gap?.employeesNeedingImprovement || 0
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Set up hidden link for download
    if (skillGapExportRef.current) {
      skillGapExportRef.current.href = url;
      skillGapExportRef.current.download = `skill_gap_analysis_${new Date().toISOString().split('T')[0]}.csv`;
      skillGapExportRef.current.click();
    }
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    toast({
      title: "Export successful",
      description: "Skill gap analysis data has been exported to CSV",
      variant: "default"
    });
  };
  
  // Chart colors
  const COLORS = ['#4f46e5', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  
  return (
    <div className="min-h-screen flex">
      {/* Hidden links for CSV exports */}
      <a ref={csvExportRef} className="hidden"></a>
      <a ref={skillGapExportRef} className="hidden"></a>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/admin" />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header 
          title="Admin Dashboard" 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-6 rounded-xl text-white mb-6">
            <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
            <p className="opacity-90">Manage skills data and user certifications across the organization.</p>
          </div>
          
          <Tabs 
            defaultValue="dashboard"
            value={activeTab} 
            onValueChange={(value) => {
              // Update active tab first
              setActiveTab(value);
              
              // Use a setTimeout to avoid race condition with state updates
              setTimeout(() => {
                // Update URL to reflect selected tab (this allows for bookmarking and sharing specific tabs)
                const newUrl = value === "dashboard" ? "/admin" : `/admin?tab=${value}`;
                // Use replace:true to avoid adding to browser history and prevent navigation issues
                setLocation(newUrl, { replace: true });
              }, 0);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <TabsTrigger 
                    value="dashboard" 
                    className="flex items-center gap-2 w-full"
                  >
                    <BarChart4 className="h-4 w-4" />
                    <span>Dashboard</span>
                  </TabsTrigger>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <TabsTrigger 
                    value="skill-history" 
                    className="flex items-center gap-2 w-full"
                  >
                    <History className="h-4 w-4" />
                    <span>Skill History</span>
                  </TabsTrigger>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <TabsTrigger 
                    value="certifications" 
                    className="flex items-center gap-2 w-full"
                  >
                    <Award className="h-4 w-4" />
                    <span>Certifications</span>
                  </TabsTrigger>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <TabsTrigger 
                    value="users" 
                    className="flex items-center gap-2 w-full"
                  >
                    <Users className="h-4 w-4" />
                    <span>User Management</span>
                  </TabsTrigger>
                </motion.div>
              </TabsList>
            </motion.div>
            
            <TabsContent value="dashboard">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5,
                  delay: 0.1,
                  ease: "easeOut"
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card>
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">{stats.totalUsers}</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                      <div className="text-sm">
                        <Button 
                          variant="link" 
                          onClick={() => {
                            setActiveTab("users");
                            setTimeout(() => setLocation("/admin?tab=users", { replace: true }), 0);
                          }} 
                          className="p-0 h-auto font-medium text-purple-600 hover:text-purple-500"
                        >
                          View all
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                          <Brain className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Skills</dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">{stats.totalSkills}</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                      <div className="text-sm">
                        <Button variant="link" className="p-0 h-auto font-medium text-indigo-600 hover:text-indigo-500">
                          View details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path>
                            <path d="m9 12 2 2 4-4"></path>
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Certifications</dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">{stats.totalCertifications}</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                      <div className="text-sm">
                        <Button 
                          variant="link" 
                          onClick={() => {
                            setActiveTab("certifications");
                            setTimeout(() => setLocation("/admin?tab=certifications", { replace: true }), 0);
                          }}
                          className="p-0 h-auto font-medium text-green-600 hover:text-green-500"
                        >
                          View all
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Updates This Month</dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">{stats.updatesThisMonth}</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                      <div className="text-sm">
                        <Button variant="link" className="p-0 h-auto font-medium text-red-600 hover:text-red-500">
                          View logs
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="mb-8">
                <CardHeader className="flex flex-col md:flex-row justify-between md:items-center pb-6">
                  <CardTitle>Organization Skill Distribution</CardTitle>
                  <div className="mt-4 md:mt-0">
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6 h-96 bg-gray-50">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Skills" fill="#4f46e5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Skill Updates</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {recentActivity.map((activity, index) => {
                            const activityUser = getUserById(activity.userId);
                            return (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-indigo-600 text-white">
                                        {activityUser?.firstName?.[0]}{activityUser?.lastName?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {activityUser?.firstName} {activityUser?.lastName}
                                      </div>
                                      <div className="text-sm text-gray-500">{activityUser?.role || "Employee"}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{activity.skillName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <SkillLevelBadge level={activity.level} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {activity.date ? format(new Date(activity.date), "MMM dd, yyyy") : "N/A"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                      <Button 
                        variant="link" 
                        onClick={() => {
                          setActiveTab("skill-history");
                          setTimeout(() => setLocation("/admin?tab=skill-history", { replace: true }), 0);
                        }}
                        className="p-0 h-auto font-medium text-indigo-600 hover:text-indigo-900"
                      >
                        View all updates
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-col md:flex-row justify-between md:items-center pb-6">
                    <div>
                      <CardTitle>Top Skills Distribution</CardTitle>
                      <CardDescription>Shows the most frequently added skills across organization</CardDescription>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <Select value={skillCategoryFilter} onValueChange={setSkillCategoryFilter}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {skillCategories.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-8">
                    <div className="h-[420px] overflow-visible">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart 
                          margin={{ top: 10, right: 10, bottom: 100, left: 10 }}
                        >
                          <Pie
                            data={skillNameData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }: { name: string; percent: number }) => 
                              name.length > 8 
                                ? `${name.substring(0, 8)}...: ${(percent * 100).toFixed(0)}%` 
                                : `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {skillNameData.map((entry: { name: string; value: number }, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value} users`, name]} />
                          <Legend 
                            layout="horizontal" 
                            verticalAlign="bottom" 
                            align="center"
                            wrapperStyle={{ 
                              paddingTop: 20,
                              width: '100%',
                              bottom: 10,
                              left: 0,
                              right: 0
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="flex flex-col md:flex-row justify-between md:items-center">
                  <CardTitle>Skill Gap Analysis</CardTitle>
                  <Button className="mt-4 md:mt-0" onClick={exportSkillGapCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill Category</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Level</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Level</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gap</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Required</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoadingSkills || isLoadingTargets ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center">
                              <div className="flex justify-center items-center">
                                <svg className="animate-spin h-5 w-5 mr-3 text-indigo-500" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Loading skill gap data...</span>
                              </div>
                            </td>
                          </tr>
                        ) : skillGapAnalysis.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <AlertCircle className="h-12 w-12 text-gray-400 mb-2" />
                                <p>No skill targets have been defined that match existing skills.</p>
                                <p className="text-sm mt-1">Set up skill targets to see the gap analysis.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          skillGapAnalysis.map((gap, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{gap?.name}</div>
                                {gap?.targetSkillCount && gap.targetSkillCount > 0 && (
                                  <div className="text-xs text-gray-500">{gap.targetSkillCount} skill{gap.targetSkillCount !== 1 ? 's' : ''}</div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div 
                                    className={`h-2.5 rounded-full ${
                                      (gap?.currentLevel || 0) > 66 ? 'bg-green-500' : 
                                      (gap?.currentLevel || 0) > 33 ? 'bg-blue-500' : 'bg-orange-400'
                                    }`} 
                                    style={{ width: `${gap?.currentLevel || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">{gap?.currentLevel || 0}%</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div className="bg-indigo-300 h-2.5 rounded-full" style={{ width: `${gap?.targetLevel || 0}%` }}></div>
                                </div>
                                <span className="text-xs text-gray-500">{gap?.targetLevel || 0}%</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {(gap?.gap || 0) === 0 ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    On Target
                                  </span>
                                ) : (gap?.gap || 0) > 15 ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                    {gap?.gap || 0}%
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    {gap?.gap || 0}%
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {(gap?.gap || 0) === 0 ? (
                                  'No action needed'
                                ) : (
                                  `Training needed for ${gap?.employeesNeedingImprovement || 0} employee${(gap?.employeesNeedingImprovement || 0) !== 1 ? 's' : ''}`
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="skill-history">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5,
                  delay: 0.1,
                  ease: "easeOut"
                }}
              >
              <Card className="mb-6">
                <CardHeader className="flex flex-col md:flex-row justify-between md:items-center">
                  <div>
                    <CardTitle>Skill History Timeline</CardTitle>
                    <CardDescription>Track changes in skill levels across the organization</CardDescription>
                  </div>
                  <Button className="mt-4 md:mt-0">
                    <Download className="h-4 w-4 mr-2" />
                    Export History
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingHistories ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
                    </div>
                  ) : skillHistories && skillHistories.length > 0 ? (
                    <div className="p-6">
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={skillHistories.slice(0, 50).map(history => ({
                              id: history.id,
                              date: (() => {
                                try {
                                  // Parse the date using proper ISO format
                                  const date = new Date(history.createdAt);
                                  return isNaN(date.getTime()) ? Date.now() : date.getTime();
                                } catch (e) {
                                  return Date.now(); // Fallback to current time if invalid
                                }
                              })(),
                              formattedDate: (() => {
                                try {
                                  // Parse the date using proper ISO format
                                  const date = new Date(history.createdAt);
                                  return isNaN(date.getTime()) ? 
                                    format(new Date(), "MMM dd") : // Use current date as fallback but formatted
                                    format(date, "MMM dd");
                                } catch (e) {
                                  return format(new Date(), "MMM dd"); // Consistent fallback
                                }
                              })(),
                              skill: history.skill_name,
                              user: history.user_email,
                              level: history.newLevel === 'beginner' ? 1 : history.newLevel === 'intermediate' ? 2 : 3,
                              change: history.changeNote
                            }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="formattedDate" 
                              type="category"
                              padding={{ left: 30, right: 30 }}
                            />
                            <YAxis
                              label={{ value: 'Skill Level', angle: -90, position: 'insideLeft' }}
                              ticks={[1, 2, 3]}
                              tickFormatter={(tick) => tick === 1 ? 'Beginner' : tick === 2 ? 'Intermediate' : 'Expert'}
                            />
                            <Tooltip 
                              labelFormatter={(value) => 'Date: ' + value}
                              formatter={(value, name, props) => {
                                if (name === 'level') {
                                  return [value === 1 ? 'Beginner' : value === 2 ? 'Intermediate' : 'Expert', 'Level'];
                                }
                                return [value, name];
                              }}
                              contentStyle={{ backgroundColor: '#fff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '0.75rem' }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="level"
                              stroke="#8884d8"
                              strokeWidth={2}
                              activeDot={{ r: 8 }}
                              name="Skill Level"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-500">
                      <History className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No skill history</h3>
                      <p className="mt-1 text-sm text-gray-500">There are no skill updates recorded yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-col md:flex-row justify-between md:items-center">
                  <div>
                    <CardTitle>Skill History Log</CardTitle>
                    <CardDescription>View all skill level changes</CardDescription>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        placeholder="Search by skill or user..."
                        className="pl-8 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={skillHistorySearchQuery}
                        onChange={(e) => setSkillHistorySearchQuery(e.target.value)}
                      />
                    </div>
                    <Select 
                      value={skillHistoryLevelFilter} 
                      onValueChange={setSkillHistoryLevelFilter}
                    >
                      <SelectTrigger className="w-full md:w-[180px] h-10">
                        <SelectValue placeholder="Filter by level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => {
                              if (skillHistorySortField === "user_email") {
                                setSkillHistorySortDirection(skillHistorySortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setSkillHistorySortField("user_email");
                                setSkillHistorySortDirection("asc");
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <span>User</span>
                              {skillHistorySortField === "user_email" && (
                                <ArrowUpDown className={`ml-1 h-4 w-4 ${skillHistorySortDirection === "asc" ? "text-gray-500" : "text-gray-900"}`} />
                              )}
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => {
                              if (skillHistorySortField === "skill_name") {
                                setSkillHistorySortDirection(skillHistorySortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setSkillHistorySortField("skill_name");
                                setSkillHistorySortDirection("asc");
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <span>Skill</span>
                              {skillHistorySortField === "skill_name" && (
                                <ArrowUpDown className={`ml-1 h-4 w-4 ${skillHistorySortDirection === "asc" ? "text-gray-500" : "text-gray-900"}`} />
                              )}
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => {
                              if (skillHistorySortField === "newLevel") {
                                setSkillHistorySortDirection(skillHistorySortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setSkillHistorySortField("newLevel");
                                setSkillHistorySortDirection("asc");
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <span>To</span>
                              {skillHistorySortField === "newLevel" && (
                                <ArrowUpDown className={`ml-1 h-4 w-4 ${skillHistorySortDirection === "asc" ? "text-gray-500" : "text-gray-900"}`} />
                              )}
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => {
                              if (skillHistorySortField === "date") {
                                setSkillHistorySortDirection(skillHistorySortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setSkillHistorySortField("date");
                                setSkillHistorySortDirection("asc");
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <span>Date</span>
                              {skillHistorySortField === "date" && (
                                <ArrowUpDown className={`ml-1 h-4 w-4 ${skillHistorySortDirection === "asc" ? "text-gray-500" : "text-gray-900"}`} />
                              )}
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoadingHistories ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-4">
                              <div className="flex justify-center py-4">
                                <div className="animate-spin h-6 w-6 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
                              </div>
                            </td>
                          </tr>
                        ) : skillHistories && skillHistories.length > 0 ? (
                          // Filter and sort skill histories
                          skillHistories
                            .filter(history => {
                              // Apply level filter
                              if (skillHistoryLevelFilter !== 'all' && history.newLevel !== skillHistoryLevelFilter) {
                                return false;
                              }
                              
                              // Apply search filter
                              if (skillHistorySearchQuery) {
                                const searchLower = skillHistorySearchQuery.toLowerCase();
                                return (
                                  (history.skill_name?.toLowerCase().includes(searchLower) || false) ||
                                  (history.user_email?.toLowerCase().includes(searchLower) || false) ||
                                  (history.changeNote?.toLowerCase().includes(searchLower) || false)
                                );
                              }
                              return true;
                            })
                            .sort((a, b) => {
                              // Apply sort
                              if (skillHistorySortField === "user_email") {
                                const aValue = a.user_email || "";
                                const bValue = b.user_email || "";
                                return skillHistorySortDirection === "asc" 
                                  ? aValue.localeCompare(bValue)
                                  : bValue.localeCompare(aValue);
                              }
                              else if (skillHistorySortField === "skill_name") {
                                const aValue = a.skill_name || "";
                                const bValue = b.skill_name || "";
                                return skillHistorySortDirection === "asc" 
                                  ? aValue.localeCompare(bValue)
                                  : bValue.localeCompare(aValue);
                              }
                              else if (skillHistorySortField === "newLevel") {
                                const levelValue = {
                                  "beginner": 1,
                                  "intermediate": 2,
                                  "expert": 3
                                };
                                const aValue = levelValue[a.newLevel as keyof typeof levelValue] || 0;
                                const bValue = levelValue[b.newLevel as keyof typeof levelValue] || 0;
                                return skillHistorySortDirection === "asc" 
                                  ? aValue - bValue
                                  : bValue - aValue;
                              }
                              else if (skillHistorySortField === "date") {
                                const aDate = new Date(a.createdAt).getTime();
                                const bDate = new Date(b.createdAt).getTime();
                                return skillHistorySortDirection === "asc" 
                                  ? aDate - bDate
                                  : bDate - aDate;
                              }
                              // Default sort by date desc
                              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                            })
                            .slice(0, 20)
                            .map((history, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{history.user_email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{history.skill_name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {history.previousLevel ? (
                                  <SkillLevelBadge level={history.previousLevel} size="sm" />
                                ) : (
                                  <span className="text-xs text-gray-500">New</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <SkillLevelBadge level={history.newLevel} size="sm" />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {(() => {
                                  try {
                                    const date = new Date(history.createdAt);
                                    return isNaN(date.getTime()) ? 
                                      format(new Date(), "MMM dd, yyyy") : // Use current date as fallback
                                      format(date, "MMM dd, yyyy");
                                  } catch (e) {
                                    return format(new Date(), "MMM dd, yyyy"); // Consistent fallback
                                  }
                                })()}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {history.changeNote}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                              No skill history records found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="certifications">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5,
                  delay: 0.1,
                  ease: "easeOut"
                }}
              >
              <Card className="mb-6">
                <CardHeader className="flex flex-col md:flex-row justify-between md:items-center">
                  <div>
                    <CardTitle>Certification Report</CardTitle>
                    <CardDescription>Overview of certified skills across the organization</CardDescription>
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                    <Button 
                      variant="outline"
                      onClick={exportCertificationsCSV}
                      className="flex items-center gap-2"
                    >
                      <DownloadCloud className="h-4 w-4" />
                      <span>Export CSV</span>
                    </Button>
                    <Button className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span>Export PDF</span>
                    </Button>
                    <a ref={csvExportRef} className="hidden"></a>
                  </div>
                </CardHeader>
                
                <div className="px-6 py-4 border-b">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        placeholder="Search certifications..."
                        className="pl-8 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={certSearchQuery}
                        onChange={(e) => setCertSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select 
                      value={certCategoryFilter} 
                      onValueChange={setCertCategoryFilter}
                    >
                      <SelectTrigger className="w-full md:w-[180px] h-10">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {/* Generate category items from certification data */}
                        {certificationReport && Array.from(
                          new Set(
                            certificationReport.flatMap(report => 
                              report.certifications.map(cert => cert.category)
                            ).filter(Boolean)
                          )
                        ).map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <CardContent className="px-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => {
                              if (certSortField === "username") {
                                setCertSortDirection(certSortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setCertSortField("username");
                                setCertSortDirection("asc");
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <span>User</span>
                              {certSortField === "username" && (
                                <ArrowUpDown className={`ml-1 h-4 w-4 ${certSortDirection === "asc" ? "text-gray-500" : "text-gray-900"}`} />
                              )}
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => {
                              if (certSortField === "name") {
                                setCertSortDirection(certSortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setCertSortField("name");
                                setCertSortDirection("asc");
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <span>Certifications</span>
                              {certSortField === "name" && (
                                <ArrowUpDown className={`ml-1 h-4 w-4 ${certSortDirection === "asc" ? "text-gray-500" : "text-gray-900"}`} />
                              )}
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => {
                              if (certSortField === "category") {
                                setCertSortDirection(certSortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setCertSortField("category");
                                setCertSortDirection("asc");
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <span>Category</span>
                              {certSortField === "category" && (
                                <ArrowUpDown className={`ml-1 h-4 w-4 ${certSortDirection === "asc" ? "text-gray-500" : "text-gray-900"}`} />
                              )}
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => {
                              if (certSortField === "level") {
                                setCertSortDirection(certSortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setCertSortField("level");
                                setCertSortDirection("asc");
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <span>Level</span>
                              {certSortField === "level" && (
                                <ArrowUpDown className={`ml-1 h-4 w-4 ${certSortDirection === "asc" ? "text-gray-500" : "text-gray-900"}`} />
                              )}
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => {
                              if (certSortField === "acquired") {
                                setCertSortDirection(certSortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setCertSortField("acquired");
                                setCertSortDirection("asc");
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <span>Acquired</span>
                              {certSortField === "acquired" && (
                                <ArrowUpDown className={`ml-1 h-4 w-4 ${certSortDirection === "asc" ? "text-gray-500" : "text-gray-900"}`} />
                              )}
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => {
                              if (certSortField === "expires") {
                                setCertSortDirection(certSortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setCertSortField("expires");
                                setCertSortDirection("asc");
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <span>Expires</span>
                              {certSortField === "expires" && (
                                <ArrowUpDown className={`ml-1 h-4 w-4 ${certSortDirection === "asc" ? "text-gray-500" : "text-gray-900"}`} />
                              )}
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoadingCertifications ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-4">
                              <div className="flex justify-center py-4">
                                <div className="animate-spin h-6 w-6 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
                              </div>
                            </td>
                          </tr>
                        ) : certificationReport && certificationReport.length > 0 ? (
                          (() => {
                            // Process the certification data
                            const processedRows: React.ReactNode[] = [];
                            
                            // Flatten certifications with user information
                            const flatCertifications = certificationReport.flatMap(report => 
                              report.certifications.map(cert => ({
                                user: report.user,
                                cert
                              }))
                            );
                            
                            // Filter certifications
                            const filteredCerts = flatCertifications.filter(item => {
                              // Category filter
                              if (certCategoryFilter !== 'all' && item.cert.category !== certCategoryFilter) {
                                return false;
                              }
                              
                              // Search filter
                              if (certSearchQuery) {
                                const searchLower = certSearchQuery.toLowerCase();
                                return (
                                  (item.cert.name?.toLowerCase().includes(searchLower) || false) ||
                                  (item.cert.category?.toLowerCase().includes(searchLower) || false) ||
                                  (item.user.username?.toLowerCase().includes(searchLower) || false) ||
                                  (item.user.email?.toLowerCase().includes(searchLower) || false)
                                );
                              }
                              return true;
                            });
                            
                            // Sort the filtered certifications
                            const sortedCerts = [...filteredCerts].sort((a, b) => {
                              if (certSortField === "username") {
                                const aValue = a.user.username || a.user.email || "";
                                const bValue = b.user.username || b.user.email || "";
                                return certSortDirection === "asc" 
                                  ? aValue.localeCompare(bValue)
                                  : bValue.localeCompare(aValue);
                              }
                              else if (certSortField === "name") {
                                const aValue = a.cert.name || "";
                                const bValue = b.cert.name || "";
                                return certSortDirection === "asc" 
                                  ? aValue.localeCompare(bValue)
                                  : bValue.localeCompare(aValue);
                              }
                              else if (certSortField === "category") {
                                const aValue = a.cert.category || "";
                                const bValue = b.cert.category || "";
                                return certSortDirection === "asc" 
                                  ? aValue.localeCompare(bValue)
                                  : bValue.localeCompare(aValue);
                              }
                              else if (certSortField === "level") {
                                const levelValue = {
                                  "beginner": 1,
                                  "intermediate": 2,
                                  "expert": 3
                                };
                                const aValue = levelValue[a.cert.level as keyof typeof levelValue] || 0;
                                const bValue = levelValue[b.cert.level as keyof typeof levelValue] || 0;
                                return certSortDirection === "asc" 
                                  ? aValue - bValue
                                  : bValue - aValue;
                              }
                              else if (certSortField === "acquired") {
                                const aDate = a.cert.acquiredFormatted ? new Date(a.cert.acquiredFormatted).getTime() : 0;
                                const bDate = b.cert.acquiredFormatted ? new Date(b.cert.acquiredFormatted).getTime() : 0;
                                return certSortDirection === "asc" 
                                  ? aDate - bDate
                                  : bDate - aDate;
                              }
                              else if (certSortField === "expires") {
                                const aDate = a.cert.expirationFormatted ? new Date(a.cert.expirationFormatted).getTime() : Infinity;
                                const bDate = b.cert.expirationFormatted ? new Date(b.cert.expirationFormatted).getTime() : Infinity;
                                return certSortDirection === "asc" 
                                  ? aDate - bDate
                                  : bDate - aDate;
                              }
                              // Default sort by name asc
                              return (a.cert.name || "").localeCompare(b.cert.name || "");
                            });
                            
                            // Group by user for row spanning
                            const userGroups = new Map<number, {
                              user: User,
                              certifications: any[]
                            }>();
                            
                            sortedCerts.forEach(item => {
                              const userId = item.user.id;
                              if (!userGroups.has(userId)) {
                                userGroups.set(userId, {
                                  user: item.user,
                                  certifications: []
                                });
                              }
                              userGroups.get(userId)!.certifications.push(item.cert);
                            });
                            
                            // Create table rows
                            Array.from(userGroups.values()).forEach(group => {
                              group.certifications.forEach((cert, certIndex) => {
                                processedRows.push(
                                  <tr key={`${group.user.id}-${cert.skillId || certIndex}`}>
                                    {certIndex === 0 && (
                                      <td className="px-6 py-4 whitespace-nowrap" rowSpan={group.certifications.length}>
                                        <div className="flex items-center">
                                          <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-indigo-600 text-white">
                                              {group.user.username?.[0]?.toUpperCase() || "U"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                              {group.user.username || group.user.email?.split('@')[0] || `User ${group.user.id}`}
                                            </div>
                                            <div className="text-sm text-gray-500">{group.user.email}</div>
                                          </div>
                                        </div>
                                      </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{cert.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-500">{cert.category}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <SkillLevelBadge level={cert.level} size="sm" />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {cert.acquiredFormatted ? 
                                        format(new Date(cert.acquiredFormatted), "MMM dd, yyyy") : 
                                        "Not specified"
                                      }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {!cert.expirationFormatted ? (
                                        "No expiration"
                                      ) : (
                                        <span className={cert.isExpired ? "text-red-500 font-medium" : ""}>
                                          {format(new Date(cert.expirationFormatted), "MMM dd, yyyy")}
                                          {cert.isExpired && " (Expired)"}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      {cert.credlyLink ? (
                                        <a 
                                          href={cert.credlyLink} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                                        >
                                          <Award className="h-4 w-4 mr-1" />
                                          <span>View Badge</span>
                                        </a>
                                      ) : (
                                        <span className="text-gray-400 inline-flex items-center">
                                          <Award className="h-4 w-4 mr-1" />
                                          <span>No Badge</span>
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              });
                            });
                            
                            // Return the processed rows
                            return processedRows.length > 0 ? processedRows : (
                              <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                  No matching certifications found
                                </td>
                              </tr>
                            );
                          })()
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                              No certifications found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Certification Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Total Certifications</h3>
                      <div className="flex items-center">
                        <div className="text-3xl font-bold text-indigo-600">{stats.totalCertifications}</div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Certified Employees</h3>
                      <div className="flex items-center">
                        <div className="text-3xl font-bold text-indigo-600">
                          {certificationReport ? certificationReport.length : 0}
                        </div>
                        <div className="ml-2 text-sm text-gray-500">
                          {certificationReport && users ? 
                            `(${Math.round((certificationReport.length / users.length) * 100)}% of workforce)` : 
                            ''
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Avg. Certifications per Employee</h3>
                      <div className="text-3xl font-bold text-indigo-600">
                        {certificationReport && certificationReport.length > 0 ? 
                          (certificationReport.reduce((sum, report) => sum + report.certifications.length, 0) / certificationReport.length).toFixed(1) : 
                          '0'
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="users">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5,
                  delay: 0.1,
                  ease: "easeOut"
                }}
              >
              <Card className="mb-6">
                <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center">
                  <div>
                    <CardTitle>User Management</CardTitle>
                  </div>
                  <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="pl-8 h-9 w-full sm:w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                            <div className="flex items-center" onClick={() => {
                              setSortField("username");
                              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                            }}>
                              User
                              <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === "username" ? "opacity-100" : "opacity-50"}`} />
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                            <div className="flex items-center" onClick={() => {
                              setSortField("email");
                              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                            }}>
                              Email
                              <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === "email" ? "opacity-100" : "opacity-50"}`} />
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                            <div className="flex items-center" onClick={() => {
                              setSortField("role");
                              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                            }}>
                              Role
                              <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === "role" ? "opacity-100" : "opacity-50"}`} />
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                            <div className="flex items-center" onClick={() => {
                              setSortField("project");
                              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                            }}>
                              Project
                              <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === "project" ? "opacity-100" : "opacity-50"}`} />
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                            <div className="flex items-center" onClick={() => {
                              setSortField("skills");
                              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                            }}>
                              Skills
                              <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === "skills" ? "opacity-100" : "opacity-50"}`} />
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoadingUsers ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center">
                              <div className="flex justify-center items-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                              </div>
                            </td>
                          </tr>
                        ) : filteredSortedUsers && filteredSortedUsers.length > 0 ? (
                          filteredSortedUsers.map((user) => {
                            // Count user skills
                            // In the database, userId is stored as snake_case (user_id)
                            const userSkillCount = skills?.filter(s => 
                              s.userId === user.id || 
                              (s as any).user_id === user.id
                            ).length || 0;
                            
                            return (
                              <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback className="bg-indigo-600 text-white">
                                        {user.username?.[0]?.toUpperCase() || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{user.username || user.email?.split('@')[0] || `User ${user.id}`}</div>
                                      <div className="text-xs text-gray-500">{user.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{user.role || "—"}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{user.project || "—"}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{userSkillCount}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-indigo-600 hover:text-indigo-900"
                                    onClick={() => {
                                      // Get the user's skills, checking both camelCase and snake_case
                                      const userSkills = skills?.filter(s => 
                                        s.userId === user.id || 
                                        (s as any).user_id === user.id
                                      ) || [];
                                      
                                      // Show skills in a dialog or modal
                                      toast({
                                        title: `${user.firstName || user.username || user.email}'s Skills`,
                                        description: (
                                          <div className="mt-2 space-y-2">
                                            {userSkills.length > 0 ? (
                                              userSkills.map(skill => (
                                                <div key={skill.id} className="flex items-center justify-between">
                                                  <span>{skill.name}</span>
                                                  <SkillLevelBadge level={skill.level} size="sm" />
                                                </div>
                                              ))
                                            ) : (
                                              <p>No skills found for this user.</p>
                                            )}
                                          </div>
                                        ),
                                        duration: 5000,
                                      });
                                    }}
                                  >
                                    View Skills
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-primary hover:text-primary-foreground"
                                    onClick={() => {
                                      // Open the profile dialog
                                      setSelectedUserId(user.id);
                                      setProfileDialogOpen(true);
                                    }}
                                  >
                                    <UserIcon className="h-4 w-4 mr-1" />
                                    View Profile
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                              {searchQuery ? `No users found matching "${searchQuery}"` : "No users found"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>User by Role</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={departmentData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {departmentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-900">Overall Activity</div>
                          <div className="text-sm text-gray-500">{isLoadingUsers ? "..." : users?.length} users</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: "85%" }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-900">Active Users (Last 7 days)</div>
                          <div className="text-sm text-gray-500">78%</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: "78%" }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-900">Users who updated skills (Last 30 days)</div>
                          <div className="text-sm text-gray-500">62%</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: "62%" }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-900">Users with certifications</div>
                          <div className="text-sm text-gray-500">45%</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: "45%" }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Danger Zone - Moved to bottom of Users section and made collapsible */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4 px-1">Danger Zone</h3>
                <AdminUserActions />
              </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
        
        <footer className="bg-white border-t border-gray-200 mt-8">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex justify-center md:justify-start">
                <span className="text-sm text-gray-500">&copy; 2023 SkillMetrics. All rights reserved.</span>
              </div>
            </div>
          </div>
        </footer>
        
        {/* User Profile Dialog */}
        <UserProfileDialog 
          userId={selectedUserId}
          isOpen={profileDialogOpen}
          onClose={() => setProfileDialogOpen(false)}
        />
      </div>
    </div>
  );
}
