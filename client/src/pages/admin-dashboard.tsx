import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Skill, User } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
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
  UserCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SkillLevelBadge from "@/components/skill-level-badge";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  
  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  // Check for URL tab parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "users") {
      setActiveTab("users");
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
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
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
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart4 className="h-4 w-4" />
                <span>Dashboard</span>
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
                                  {format(new Date(activity.date), "MMM dd, yyyy")}
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
                                        {user.firstName[0]}{user.lastName[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
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
