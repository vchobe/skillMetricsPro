import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Skill, User, SkillHistory } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
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
  Users,
  Brain,
  Clock,
  Download,
  BarChart2,
  PieChart as PieChartIcon,
  Filter,
  ChevronRight,
  UserCircle,
  Award,
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
  SquareStack
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SkillLevelBadge from "@/components/skill-level-badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  
  // Redirect if not admin
  const { toast } = useToast();
  const csvExportRef = useRef<HTMLAnchorElement>(null);
  
  useEffect(() => {
    if (user && !user.is_admin) {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  // Check for URL tab parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "users" || tab === "skill-history" || tab === "certifications") {
      setActiveTab(tab);
    }
  }, [location]);
  
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
  
  // Calculate stats
  const stats = {
    totalUsers: users?.length || 0,
    totalSkills: skills?.length || 0,
    totalCertifications: skills?.filter(skill => skill.certification).length || 0,
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
  
  // Skill level data
  const skillLevelData = skills ?
    [
      { name: "Expert", value: skills.filter(s => s.level === "expert").length || 0 },
      { name: "Intermediate", value: skills.filter(s => s.level === "intermediate").length || 0 },
      { name: "Beginner", value: skills.filter(s => s.level === "beginner").length || 0 }
    ]
    : [];
  
  // Department data (mock - would be calculated based on user.project or department field)
  const departmentData = [
    { name: "Engineering", value: 45 },
    { name: "Design", value: 20 },
    { name: "Product", value: 15 },
    { name: "Marketing", value: 10 },
    { name: "Other", value: 10 }
  ];
  
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
        `${report.user.firstName || ''} ${report.user.lastName || ''}`.trim(),
        report.user.email,
        cert.name,
        cert.category || 'N/A',
        cert.level || 'N/A',
        new Date(cert.acquired).toISOString().split('T')[0],
        cert.expiration ? new Date(cert.expiration).toISOString().split('T')[0] : 'N/A'
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
  
  // Chart colors
  const COLORS = ['#4f46e5', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  
  return (
    <div className="min-h-screen flex">
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
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart4 className="h-4 w-4" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="skill-history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>Skill History</span>
              </TabsTrigger>
              <TabsTrigger value="certifications" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>Certifications</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>User Management</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
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
                        <Button variant="link" onClick={() => setActiveTab("users")} className="p-0 h-auto font-medium text-purple-600 hover:text-purple-500">
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
                        <Button variant="link" className="p-0 h-auto font-medium text-green-600 hover:text-green-500">
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
                                  {activity.date ? (() => {
                                    try {
                                      return format(new Date(activity.date), "MMM dd, yyyy");
                                    } catch (e) {
                                      return "Invalid date";
                                    }
                                  })() : "N/A"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                      <Button variant="link" className="p-0 h-auto font-medium text-indigo-600 hover:text-indigo-900">
                        View all updates
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Skill Level Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={skillLevelData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {skillLevelData.map((entry, index) => (
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
              </div>
              
              <Card>
                <CardHeader className="flex flex-col md:flex-row justify-between md:items-center">
                  <CardTitle>Skill Gap Analysis</CardTitle>
                  <Button className="mt-4 md:mt-0">
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
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">Cloud Technologies</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: "60%" }}></div>
                            </div>
                            <span className="text-xs text-gray-500">60%</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-indigo-300 h-2.5 rounded-full" style={{ width: "85%" }}></div>
                            </div>
                            <span className="text-xs text-gray-500">85%</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              25%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Training needed for 15 employees
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">Frontend Development</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: "80%" }}></div>
                            </div>
                            <span className="text-xs text-gray-500">80%</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-indigo-300 h-2.5 rounded-full" style={{ width: "85%" }}></div>
                            </div>
                            <span className="text-xs text-gray-500">85%</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              5%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Minor updates to React knowledge
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">Data Analysis</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: "40%" }}></div>
                            </div>
                            <span className="text-xs text-gray-500">40%</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-indigo-300 h-2.5 rounded-full" style={{ width: "75%" }}></div>
                            </div>
                            <span className="text-xs text-gray-500">75%</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              35%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Critical - Need hiring or training program
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="skill-history">
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
                              date: new Date(history.updatedAt).getTime(),
                              formattedDate: (() => {
                                try {
                                  return format(new Date(history.updatedAt), "MMM dd");
                                } catch (e) {
                                  return "Invalid date";
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
                <CardHeader>
                  <CardTitle>Skill History Log</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
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
                          skillHistories.slice(0, 10).map((history, index) => (
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
                                    return format(new Date(history.updatedAt), "MMM dd, yyyy");
                                  } catch (e) {
                                    return "Invalid date";
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
            </TabsContent>
            
            <TabsContent value="certifications">
              <Card className="mb-6">
                <CardHeader className="flex flex-col md:flex-row justify-between md:items-center">
                  <div>
                    <CardTitle>Certification Report</CardTitle>
                    <CardDescription>Overview of certified skills across the organization</CardDescription>
                  </div>
                  <div className="mt-4 md:mt-0 flex gap-2">
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
                <CardContent className="px-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certifications</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acquired</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoadingCertifications ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-4">
                              <div className="flex justify-center py-4">
                                <div className="animate-spin h-6 w-6 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
                              </div>
                            </td>
                          </tr>
                        ) : certificationReport && certificationReport.length > 0 ? (
                          certificationReport.flatMap(report => 
                            report.certifications.map((cert, certIndex) => (
                              <tr key={`${report.user.id}-${cert.skillId}`}>
                                {certIndex === 0 && (
                                  <td className="px-6 py-4 whitespace-nowrap" rowSpan={report.certifications.length}>
                                    <div className="flex items-center">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-indigo-600 text-white">
                                          {report.user.firstName?.[0] || ""}{report.user.lastName?.[0] || ""}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">
                                          {report.user.firstName} {report.user.lastName}
                                        </div>
                                        <div className="text-sm text-gray-500">{report.user.email}</div>
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
                                  {(() => {
                                    try {
                                      return format(new Date(cert.acquired), "MMM dd, yyyy");
                                    } catch (e) {
                                      return "Invalid date";
                                    }
                                  })()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Button size="sm" variant="outline">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                    </svg>
                                    Verify
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
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
            </TabsContent>
            
            <TabsContent value="users">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
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
                        ) : users && users.length > 0 ? (
                          users.map((user) => {
                            // Count user skills
                            const userSkillCount = skills?.filter(s => s.userId === user.id).length || 0;
                            
                            return (
                              <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback className="bg-indigo-600 text-white">
                                        {user.firstName?.[0] || ""}{user.lastName?.[0] || ""}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{user.firstName || ""} {user.lastName || ""}</div>
                                      <div className="text-xs text-gray-500">@{user.username}</div>
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-900">
                                    View Skills
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                              No users found
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
      </div>
    </div>
  );
}
