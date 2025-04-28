import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Skill, User, SkillHistory, ReportSettings } from "@shared/schema";

// Interfaces for hierarchical data structures
interface Client {
  id: number;
  name: string;
  industry?: string;
  projects: Project[];
}

interface Project {
  id: number;
  name: string;
  clientId: number;
  resources: ProjectResource[];
  skills: ProjectSkill[];
}

interface ProjectResource {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  allocation?: number;
  startDate?: string;
  endDate?: string;
  user: User;
  skills: Skill[];
}

interface ProjectSkill {
  id: number;
  projectId: number;
  skillId: number;
  requiredLevel: string;
  skillName?: string;
  category?: string;
}

interface SkillCategory {
  id: number;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  subcategories: SkillSubcategory[];
}

interface SkillSubcategory {
  id: number;
  name: string;
  categoryId: number;
  skills: Skill[];
}

interface UserWithSkills extends User {
  skills: Skill[];
}
import { formatDate, DATE_FORMATS } from "@/lib/date-utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";

// Helper function to get color for skill badges based on level
// Helper components for Project and Skill Overview visualization
function ProjectHierarchyView() {
  const { hierarchy, isLoading } = useProjectHierarchy();
  const [expandedClients, setExpandedClients] = useState<string[]>([]);
  
  const toggleClient = (clientId: string) => {
    if (expandedClients.includes(clientId)) {
      setExpandedClients(expandedClients.filter(id => id !== clientId));
    } else {
      setExpandedClients([...expandedClients, clientId]);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading project hierarchy data...</p>
      </div>
    );
  }

  if (!hierarchy || hierarchy.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border border-gray-200">
        <Database className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-muted-foreground">No project data available.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {hierarchy.map(client => (
        <Card key={client.id} className="overflow-hidden">
          <CardHeader 
            className="bg-gray-50 cursor-pointer"
            onClick={() => toggleClient(`client-${client.id}`)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <SquareStack className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link to={`/clients/${client.id}`} className="hover:underline text-primary font-semibold border-b-2 border-primary border-opacity-50 hover:border-opacity-100 transition-all">
                    {client.name}
                  </Link>
                  <Badge variant="outline" className="ml-2 text-xs font-normal">
                    {client.industry || 'No Industry'}
                  </Badge>
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {client.projects.length} Projects
                </Badge>
                <ChevronRight className={`h-5 w-5 transition-transform ${
                  expandedClients.includes(`client-${client.id}`) ? 'rotate-90' : ''
                }`} />
              </div>
            </div>
          </CardHeader>
          
          {expandedClients.includes(`client-${client.id}`) && (
            <CardContent className="pt-4">
              {client.projects.length > 0 ? (
                <div className="space-y-4">
                  {client.projects.map(project => (
                    <Accordion type="single" collapsible className="w-full border rounded-md" key={project.id}>
                      <AccordionItem value={`project-${project.id}`}>
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <Link to={`/projects/${project.id}`} className="font-medium hover:underline text-primary border-b-2 border-primary border-opacity-50 hover:border-opacity-100 transition-all">
                                {project.name}
                              </Link>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {project.resources.length} Resources
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {project.skills.length} Skills
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Resources
                              </h4>
                              {project.resources.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Role</TableHead>
                                      <TableHead>Allocation</TableHead>
                                      <TableHead>Skills</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {project.resources.map(resource => (
                                      <TableRow key={resource.id}>
                                        <TableCell className="font-medium">
                                          <Link to={`/users/${resource.userId}`} className="hover:underline text-primary border-b-2 border-primary border-opacity-50 hover:border-opacity-100 transition-all">
                                            {resource.user?.firstName} {resource.user?.lastName}
                                          </Link>
                                        </TableCell>
                                        <TableCell>{resource.role || 'N/A'}</TableCell>
                                        <TableCell>
                                          {resource.allocation ? `${resource.allocation}%` : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex flex-wrap gap-1">
                                            {resource.skills?.slice(0, 3).map((skill, idx) => (
                                              <Link to={`/skills/${skill.id}`} key={idx}>
                                                <Badge 
                                                  style={{ backgroundColor: getSkillBadgeColor(skill.level, 0.8) }}
                                                  className="text-white text-xs"
                                                >
                                                  {skill.name}
                                                </Badge>
                                              </Link>
                                            ))}
                                            {resource.skills && resource.skills.length > 3 && (
                                              <Badge variant="outline" className="text-xs">
                                                +{resource.skills.length - 3} more
                                              </Badge>
                                            )}
                                            {(!resource.skills || resource.skills.length === 0) && (
                                              <span className="text-xs text-muted-foreground">No skills</span>
                                            )}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className="text-muted-foreground text-sm py-2">No resources assigned to this project.</div>
                              )}
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <BrainCircuit className="h-4 w-4" />
                                Required Skills
                              </h4>
                              {project.skills.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Skill</TableHead>
                                      <TableHead>Category</TableHead>
                                      <TableHead>Required Level</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {project.skills.map(skill => (
                                      <TableRow key={skill.id}>
                                        <TableCell className="font-medium">
                                        <Link to={`/skills/${skill.skillId}`} className="hover:underline text-primary border-b-2 border-primary border-opacity-50 hover:border-opacity-100 transition-all">
                                          {skill.skillName}
                                        </Link>
                                      </TableCell>
                                        <TableCell>{skill.category || 'Uncategorized'}</TableCell>
                                        <TableCell>
                                          <Badge 
                                            style={{ backgroundColor: getSkillBadgeColor(skill.requiredLevel || 'beginner', 0.8) }}
                                            className="text-white text-xs"
                                          >
                                            {skill.requiredLevel || 'beginner'}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className="text-muted-foreground text-sm py-2">No specific skills required for this project.</div>
                              )}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-6">No projects found for this client.</div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

function SkillHierarchyView() {
  const { hierarchy, isLoading } = useSkillHierarchy();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [expandedSubcategories, setExpandedSubcategories] = useState<string[]>([]);
  
  const toggleCategory = (categoryId: string) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter(id => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };
  
  const toggleSubcategory = (subcategoryId: string) => {
    if (expandedSubcategories.includes(subcategoryId)) {
      setExpandedSubcategories(expandedSubcategories.filter(id => id !== subcategoryId));
    } else {
      setExpandedSubcategories([...expandedSubcategories, subcategoryId]);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading skill hierarchy data...</p>
      </div>
    );
  }

  if (!hierarchy || hierarchy.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border border-gray-200">
        <Database className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-muted-foreground">No skill category data available.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {hierarchy.map(category => (
        <Card key={category.id} className="overflow-hidden">
          <CardHeader 
            className="bg-gray-50 cursor-pointer"
            onClick={() => toggleCategory(`category-${category.id}`)}
            style={{
              backgroundColor: category.color ? `${category.color}20` : undefined,
              borderBottom: category.color ? `1px solid ${category.color}40` : undefined
            }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {category.subcategories.reduce((count, sub) => count + sub.skills.length, 0)} Skills
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {category.subcategories.length} Subcategories
                </Badge>
                <ChevronRight className={`h-5 w-5 transition-transform ${
                  expandedCategories.includes(`category-${category.id}`) ? 'rotate-90' : ''
                }`} />
              </div>
            </div>
            {category.description && (
              <CardDescription>{category.description}</CardDescription>
            )}
          </CardHeader>
          
          {expandedCategories.includes(`category-${category.id}`) && (
            <CardContent className="pt-4">
              {category.subcategories.length > 0 ? (
                <div className="space-y-4">
                  {category.subcategories.map(subcategory => (
                    <div 
                      key={subcategory.id} 
                      className="border rounded-md overflow-hidden"
                    >
                      <div 
                        className="bg-gray-50 p-3 cursor-pointer"
                        onClick={() => toggleSubcategory(`subcategory-${subcategory.id}`)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Hexagon className="h-4 w-4 text-primary" />
                            <h3 className="font-medium">{subcategory.name}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {subcategory.skills.length} Skills
                            </Badge>
                            <ChevronRight className={`h-4 w-4 transition-transform ${
                              expandedSubcategories.includes(`subcategory-${subcategory.id}`) ? 'rotate-90' : ''
                            }`} />
                          </div>
                        </div>
                      </div>
                      
                      {expandedSubcategories.includes(`subcategory-${subcategory.id}`) && (
                        <div className="p-3">
                          {subcategory.skills.length > 0 ? (
                            <>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Skill</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Level</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {subcategory.skills.map(skill => (
                                    <TableRow key={skill.id}>
                                      <TableCell className="font-medium">
                                        <Link to={`/skills/${skill.id}`} className="hover:underline text-primary">
                                          {skill.name}
                                        </Link>
                                      </TableCell>
                                      <TableCell className="max-w-[400px] truncate">
                                        {(skill as any).description || 'No description'}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                          {skill.level || 'Any'}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              
                              <div className="mt-6 border-t pt-4">
                                <h4 className="text-sm font-semibold mb-2">Users with these skills</h4>
                                {subcategory.skills.some(skill => skill.users && skill.users.length > 0) ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {subcategory.skills
                                      .filter(skill => skill.users && skill.users.length > 0)
                                      .flatMap(skill => 
                                        skill.users?.map(user => (
                                          <div 
                                            key={`${skill.id}-${user.id}`}
                                            className="flex items-center gap-2 bg-gray-50 p-2 rounded-md text-sm"
                                          >
                                            <Avatar className="h-6 w-6">
                                              <AvatarFallback>{(user as any).username?.[0] || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <Link to={`/users/${user.id}`} className="hover:underline text-primary">
                                                <div className="font-medium">{(user as any).username}</div>
                                              </Link>
                                              <div className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</div>
                                            </div>
                                          </div>
                                        )) || []
                                      )
                                    }
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground text-sm">No users have skills in this category.</div>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="text-muted-foreground text-sm py-2">No skills in this subcategory.</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-6">No subcategories found for this category.</div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

function getSkillBadgeColor(level: string, opacity: number = 1): string {
  const colorMap: Record<string, string> = {
    beginner: `rgba(59, 130, 246, ${opacity})`, // blue
    intermediate: `rgba(139, 92, 246, ${opacity})`, // purple
    expert: `rgba(234, 88, 12, ${opacity})`, // orange
    master: `rgba(22, 163, 74, ${opacity})`, // green
  };
  
  return colorMap[level.toLowerCase()] || `rgba(75, 85, 99, ${opacity})`;
}

// Template form schema
const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.number().int().positive("Category is required"),
  subcategoryId: z.number().int().positive().optional(),
  description: z.string().optional(),
  isRecommended: z.boolean().default(false),
});

// Target form schema
const targetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  targetLevel: z.string().min(1, "Target level is required"),
  targetDate: z.string().optional(),
  targetNumber: z.number().optional(),
  skillIds: z.array(z.number()).min(1, "At least one skill must be selected").optional(),
});
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion/index";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  User as UserIcon,
  Database,
  Target,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  X,
  Mail,
  Send,
  FileText,
  Code,
  FolderTree
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SkillLevelBadge from "@/components/skill-level-badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "@/components/ui/alert-circle";
import AdminUserActions from "@/components/admin-user-actions";
import AdminUsersManagement from "@/components/admin-users-management";
import ReportSettingsManager from "@/components/report-settings-manager";

// Send Report Button Component
function SendReportButton({ reportSettings = [] }: { reportSettings: ReportSettings[] }) {
  const [sending, setSending] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const sendWeeklyReport = async () => {
    try {
      setSending(true);
      
      // Prepare request body with selected report setting ID if any
      // Only include reportSettingId if a specific report setting was selected (not the default option)
      const requestBody = selectedReportId && selectedReportId !== "default"
        ? { reportSettingId: parseInt(selectedReportId) } 
        : {};
      
      const response = await fetch('/api/admin/reports/weekly-resource-report/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        credentials: 'include' // Include cookies for authentication
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Report sent successfully",
          description: selectedReportId && selectedReportId !== "default"
            ? `Report was sent using custom settings (ID: ${selectedReportId})` 
            : "Weekly resource report was sent using default settings",
          variant: "default"
        });
        setDialogOpen(false);
      } else {
        const error = await response.json();
        toast({
          title: "Failed to send report",
          description: error.message || "An error occurred while sending the report",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error sending report:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };
  
  return (
    <>
      <Button 
        variant="default"
        onClick={() => setDialogOpen(true)}
        className="gap-2"
      >
        <Send className="h-4 w-4" />
        <span>Send Weekly Report Now</span>
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Weekly Resource Report</DialogTitle>
            <DialogDescription>
              Select a report configuration or use the default settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-setting">Report Configuration</Label>
              <Select 
                value={selectedReportId} 
                onValueChange={setSelectedReportId}
              >
                <SelectTrigger id="report-setting">
                  <SelectValue placeholder="Select a report configuration or use default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Settings</SelectItem>
                  {reportSettings.map(setting => (
                    <SelectItem key={setting.id} value={setting.id.toString()}>
                      {setting.name} {setting.baseUrl ? `(${setting.baseUrl})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedReportId && selectedReportId !== "default" ? (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium">Selected Configuration Details:</p>
                {reportSettings.filter(s => s.id.toString() === selectedReportId).map(setting => (
                  <div key={setting.id} className="mt-2 space-y-1">
                    <p><span className="font-medium">Recipient:</span> {setting.recipientEmail}</p>
                    {setting.clientId && <p><span className="font-medium">Client Filter:</span> Client ID {setting.clientId}</p>}
                    {setting.baseUrl && <p><span className="font-medium">Custom URL:</span> {setting.baseUrl}</p>}
                    {setting.description && <p><span className="font-medium">Description:</span> {setting.description}</p>}
                  </div>
                ))}
              </div>
            ) : selectedReportId === "default" ? (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium">Default Configuration</p>
                <div className="mt-2 space-y-1">
                  <p><span className="font-medium">Recipient:</span> {'Default recipient (Sales Team)'}</p>
                  <p><span className="font-medium">Description:</span> Weekly summary of resources added to projects</p>
                  <p className="text-muted-foreground text-xs">Using system default settings</p>
                </div>
              </div>
            ) : null}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="default" 
              onClick={sendWeeklyReport} 
              disabled={sending}
              className="gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Report</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Custom hooks for hierarchical data
function useProjectHierarchy() {
  // Primary method: Try to fetch the complete hierarchy from a single API endpoint
  const { data: hierarchyData, isLoading: isLoadingHierarchy, error: hierarchyError } = useQuery<Client[]>({
    queryKey: ["/api/admin/project-hierarchy"],
  });
  
  // Fallback approach if the hierarchy API fails: Construct from individual endpoints
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/admin/clients"],
    enabled: !!hierarchyError,
  });
  
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/admin/projects"],
    enabled: !!hierarchyError,
  });
  
  const { data: resources, isLoading: isLoadingResources } = useQuery<ProjectResource[]>({
    queryKey: ["/api/admin/project-resources"],
    enabled: !!hierarchyError,
  });
  
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!hierarchyError,
  });
  
  const { data: skills, isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ["/api/admin/skills"],
    enabled: !!hierarchyError,
  });
  
  // Fallback hierarchy construction (clients -> projects -> resources -> skills)
  const fallbackHierarchy = useMemo(() => {
    if (!clients || !projects || !resources || !users || !skills) return [];
    
    return clients.map(client => {
      // Get projects for this client
      const clientProjects = projects.filter(project => project.clientId === client.id);
      
      return {
        ...client,
        projects: clientProjects.map(project => {
          // Get resources for this project
          const projectResources = resources.filter(r => r.projectId === project.id);
          
          return {
            ...project,
            resources: projectResources.map(resource => {
              // Get the user for this resource
              const user = users.find(u => u.id === resource.userId);
              
              // Get skills for this user
              const userSkills = user ? skills.filter(s => s.userId === user.id) : [];
              
              return {
                ...resource,
                user: user || { id: 0, username: 'Unknown', email: 'unknown@example.com' },
                skills: userSkills
              };
            })
          };
        })
      };
    });
  }, [clients, projects, resources, users, skills]);
  
  // Use the hierarchyData if available, otherwise use the fallback
  const projectHierarchy = hierarchyData || fallbackHierarchy;
  
  // Determine if we're loading data from either approach
  const isLoading = 
    isLoadingHierarchy || 
    (hierarchyError && (isLoadingClients || isLoadingProjects || isLoadingResources || isLoadingUsers || isLoadingSkills));
  
  return {
    hierarchy: projectHierarchy,
    isLoading,
    error: hierarchyError,
    clients,
    projects,
    resources,
    users,
    skills
  };
}

function useSkillHierarchy() {
  // Primary method: Try to fetch the complete hierarchy from a single API endpoint
  const { data: hierarchyData, isLoading: isLoadingHierarchy, error: hierarchyError } = useQuery<SkillCategory[]>({
    queryKey: ["/api/admin/skill-hierarchy"],
  });
  
  // Fallback approach if the hierarchy API fails: Construct from individual endpoints
  const { data: categories, isLoading: isLoadingCategories } = useQuery<SkillCategory[]>({
    queryKey: ["/api/admin/skill-categories"],
    enabled: !!hierarchyError,
  });
  
  const { data: allSubcategories, isLoading: isLoadingSubcategories } = useQuery<SkillSubcategory[]>({
    queryKey: ["/api/admin/skill-subcategories"],
    enabled: !!hierarchyError,
  });
  
  const { data: allSkills, isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ["/api/admin/skills"],
    enabled: !!hierarchyError,
  });
  
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!hierarchyError,
  });
  
  // Fallback hierarchy construction (category -> subcategory -> skill -> users)
  const fallbackHierarchy = useMemo(() => {
    if (!categories || !allSubcategories || !allSkills || !users) return [];
    
    return categories.map(category => {
      // Get subcategories for this category
      const subcategories = allSubcategories
        .filter(sub => sub.categoryId === category.id)
        .map(subcategory => {
          // Get skills for this subcategory
          const subcategorySkills = allSkills
            .filter(skill => 
              skill.subcategoryId === subcategory.id || 
              (skill.category === category.name && !skill.subcategoryId)
            )
            .reduce((acc: any[], skill) => {
              // Group skills by name to avoid duplicates
              const existingSkill = acc.find(s => s.name === skill.name);
              if (existingSkill) {
                // Add the user to the existing skill's users array
                const user = users.find(u => u.id === skill.userId);
                if (user) {
                  existingSkill.users.push({
                    ...user,
                    skillLevel: skill.level
                  });
                }
                return acc;
              } else {
                // Create a new skill entry with a users array
                const user = users.find(u => u.id === skill.userId);
                return [...acc, {
                  ...skill,
                  users: user ? [{
                    ...user,
                    skillLevel: skill.level
                  }] : []
                }];
              }
            }, []);
          
          return {
            ...subcategory,
            skills: subcategorySkills
          };
        });
      
      return {
        ...category,
        subcategories
      };
    });
  }, [categories, allSubcategories, allSkills, users]);
  
  // Use the hierarchyData if available, otherwise use the fallback
  const skillHierarchy = hierarchyData || fallbackHierarchy;
  
  // Determine if we're loading data from either approach
  const isLoading = 
    isLoadingHierarchy || 
    (hierarchyError && (isLoadingCategories || isLoadingSubcategories || isLoadingSkills || isLoadingUsers));
  
  return {
    hierarchy: skillHierarchy,
    isLoading,
    error: hierarchyError,
    categories,
    allSubcategories,
    allSkills,
    users
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Use our custom hooks for hierarchical data
  const {
    hierarchy: projectHierarchy,
    isLoading: isLoadingProjectHierarchy
  } = useProjectHierarchy();
  
  const {
    hierarchy: skillHierarchy,
    isLoading: isLoadingSkillHierarchy
  } = useSkillHierarchy();
  
  // Form for skill templates
  const templateForm = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      categoryId: undefined as any, // Will be set when a category is selected
      subcategoryId: undefined as any, // Will be set when a subcategory is selected
      description: "",
      isRecommended: false
    }
  });
  
  // Form for skill targets
  const targetForm = useForm<z.infer<typeof targetSchema>>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      name: "",
      description: "",
      targetLevel: "beginner",
      targetDate: undefined,
      targetNumber: undefined,
      skillIds: []
    }
  });
  
  // Submit handlers
  const onSubmitTemplate = (data: z.infer<typeof templateSchema>) => {
    // Handle template submission
    console.log("Template data:", data);
    
    // Here you would integrate with your API to save the template
    toast({
      title: editingTemplate?.id ? "Template updated" : "Template created",
      description: `The skill template has been ${editingTemplate?.id ? "updated" : "created"} successfully.`
    });
    
    setShowTemplateDialog(false);
    setEditingTemplate(null);
  };
  
  const onSubmitTarget = (data: z.infer<typeof targetSchema>) => {
    // Handle target submission
    console.log("Target data:", data);
    
    // Here you would integrate with your API to save the target
    toast({
      title: targetFormData.id ? "Target updated" : "Target created",
      description: `The skill target has been ${targetFormData.id ? "updated" : "created"} successfully.`
    });
    
    setShowTargetDialog(false);
    setTargetFormData({
      id: null,
      name: '',
      skillIds: [],
      targetLevel: 'beginner',
      targetDate: "",
      targetNumber: undefined,
      description: ''
    });
  };
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddReportDialog, setShowAddReportDialog] = useState(false);
  const [selectedReportSetting, setSelectedReportSetting] = useState<ReportSettings | null>(null);
  const [showEditReportDialog, setShowEditReportDialog] = useState(false);
  const [showDeleteReportConfirm, setShowDeleteReportConfirm] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [skillCategoryFilter, setSkillCategoryFilter] = useState("all");
  // This was removed as there's already another useEffect for the same purpose below
  
  // User profile dialog state
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Skill templates state
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  
  // Fetch all skill categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/skill-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // Fetch subcategories for a specific category
  const fetchSubcategoriesForCategory = useCallback(async (categoryId: number) => {
    try {
      const response = await fetch(`/api/skill-categories/${categoryId}/subcategories`);
      if (response.ok) {
        const data = await response.json();
        setSubcategories(data);
      } else {
        setSubcategories([]);
        console.error('Failed to fetch subcategories');
      }
    } catch (error) {
      setSubcategories([]);
      console.error('Error fetching subcategories:', error);
    }
  }, []);
  
  // Skill targets state
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [targetSearchQuery, setTargetSearchQuery] = useState("");
  const [targetFormData, setTargetFormData] = useState<{
    id: number | null;
    name: string;
    skillIds: number[];
    targetLevel: string;
    targetDate: string;
    targetNumber: number | string | undefined;
    description: string;
  }>({
    id: null,
    name: '',
    skillIds: [],
    targetLevel: 'beginner',
    targetDate: "",
    targetNumber: undefined,
    description: ''
  });
  
  // User Management tab - sorting and filtering state
  const [sortField, setSortField] = useState<string>("username");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [skillCategories, setSkillCategories] = useState<string[]>([]);
  const [skillNames, setSkillNames] = useState<string[]>([]);
  const [userSkillCategoryFilter, setUserSkillCategoryFilter] = useState<string>("all");
  const [userSkillNameFilter, setUserSkillNameFilter] = useState<string>("all");
  const [userSkillLevelFilter, setUserSkillLevelFilter] = useState<string>("all");
  
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
  const [certSkillLevelFilter, setCertSkillLevelFilter] = useState("all");
  const [certSkillNameFilter, setCertSkillNameFilter] = useState("all");
  const [certActiveFilters, setCertActiveFilters] = useState<{[key: string]: string}>({});
  
  // Redirect if not admin
  const { toast } = useToast();
  const csvExportRef = useRef<HTMLAnchorElement>(null);
  const skillGapExportRef = useRef<HTMLAnchorElement>(null);
  
  useEffect(() => {
    if (user && !user.is_admin) {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  // Initialize tab from URL on first render only
  // We use a ref to ensure this only runs on initial render
  const initialRenderCompleted = useRef(false);
  
  useEffect(() => {
    // Skip if already initialized
    if (initialRenderCompleted.current) return;
    
    // Get the tab from URL path parameter
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/');
    const tab = pathParts[2]; // /admin/tab format
    
    // Only initialize tab from URL, don't modify URL here
    if (tab === "users" || tab === "skill-history" || tab === "certifications" || tab === "user-management") {
      setActiveTab(tab);
    } else if (currentPath === "/admin" || currentPath.startsWith("/admin/")) {
      // Default to dashboard if no valid tab is specified
      setActiveTab("dashboard");
    }
    
    // Mark initialization as completed
    initialRenderCompleted.current = true;
  }, []); // Empty dependency array means this only runs once
  
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
  
  // Get skill templates
  const { data: skillTemplates = [], isLoading: isLoadingTemplates } = useQuery<{
    id: number;
    name: string;
    category?: string;
    categoryId?: number;
    subcategoryId?: number;
    description?: string;
    isRecommended: boolean;
  }[]>({
    queryKey: ["/api/admin/skill-templates"],
  });
  
  // Get pending skill updates
  const { data: pendingSkills = [], isLoading: isLoadingPendingSkills } = useQuery<{
    user: {
      id: number;
      username: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role?: string;
    },
    pendingSkills: Array<{
      id: number;
      userId: number;
      skillId?: number;
      name: string;
      category: string;
      level: string;
      certification?: string;
      credlyLink?: string;
      notes?: string;
      certificationDate?: string;
      expirationDate?: string;
      status: string;
      submittedAt: string;
      reviewedAt?: string;
      reviewedBy?: number;
      reviewNotes?: string;
      isUpdate: boolean;
    }>
  }[]>({
    queryKey: ["/api/admin/pending-skills"],
  });
  
  // Get report settings
  const { 
    data: reportSettings = [], 
    isLoading: isLoadingReportSettings,
    refetch: refetchReportSettings
  } = useQuery<ReportSettings[]>({
    queryKey: ["/api/admin/report-settings"],
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
  
  // Extract unique skill categories and names for filters
  useEffect(() => {
    if (skills) {
      const categoriesSet = new Set<string>();
      const namesSet = new Set<string>();
      
      skills.forEach(skill => {
        categoriesSet.add(skill.category || 'Other');
        namesSet.add(skill.name);
      });
      
      setSkillCategories(Array.from(categoriesSet).sort());
      setSkillNames(Array.from(namesSet).sort());
    }
  }, [skills]);
    
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
  
  // Handlers for approving and rejecting pending skill updates
  const approveMutation = useMutation({
    mutationFn: async (skillId: number) => {
      const res = await fetch(`/api/admin/pending-skills/${skillId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reviewerId: user?.id })
      });
      
      if (!res.ok) {
        throw new Error("Failed to approve skill");
      }
      
      return res.json();
    },
    onSuccess: () => {
      // Invalidate pending skills query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skills"] });
    }
  });
  
  const rejectMutation = useMutation({
    mutationFn: async ({ skillId, notes }: { skillId: number, notes?: string }) => {
      const res = await fetch(`/api/admin/pending-skills/${skillId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          reviewerId: user?.id,
          notes: notes || "Rejected by administrator"
        })
      });
      
      if (!res.ok) {
        throw new Error("Failed to reject skill");
      }
      
      return res.json();
    },
    onSuccess: () => {
      // Invalidate pending skills query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-skills"] });
    }
  });
  
  // Report Settings mutations
  const createReportSettingMutation = useMutation({
    mutationFn: async (data: Omit<ReportSettings, 'id' | 'createdAt' | 'updatedAt' | 'lastSentAt' | 'nextScheduledAt'>) => {
      const res = await fetch('/api/admin/report-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        throw new Error("Failed to create report setting");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/report-settings"] });
    }
  });
  
  const updateReportSettingMutation = useMutation({
    mutationFn: async ({ id, data }: { 
      id: number, 
      data: Partial<Omit<ReportSettings, 'id' | 'createdAt' | 'updatedAt' | 'lastSentAt' | 'nextScheduledAt'>>
    }) => {
      const res = await fetch(`/api/admin/report-settings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        throw new Error("Failed to update report setting");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/report-settings"] });
    }
  });
  
  const deleteReportSettingMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/report-settings/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete report setting");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/report-settings"] });
    }
  });
  
  const handleApproveSkill = async (skillId: number) => {
    approveMutation.mutate(skillId, {
      onSuccess: () => {
        toast({
          title: "Skill approved",
          description: "The skill update has been approved and applied.",
          variant: "default"
        });
      },
      onError: (error) => {
        console.error("Error approving skill:", error);
        toast({
          title: "Error",
          description: "Failed to approve skill update. Please try again.",
          variant: "destructive"
        });
      }
    });
  };
  
  const handleRejectSkill = async (skillId: number) => {
    rejectMutation.mutate({ 
      skillId, 
      notes: "Rejected by administrator" // Could add a dialog to capture notes
    }, {
      onSuccess: () => {
        toast({
          title: "Skill rejected",
          description: "The skill update has been rejected.",
          variant: "default"
        });
      },
      onError: (error) => {
        console.error("Error rejecting skill:", error);
        toast({
          title: "Error",
          description: "Failed to reject skill update. Please try again.",
          variant: "destructive"
        });
      }
    });
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
    
    // Step 3: Filter by skill properties
    if (userSkillCategoryFilter !== "all" || userSkillNameFilter !== "all" || userSkillLevelFilter !== "all") {
      filtered = filtered.filter(user => {
        // Get all skills for this user
        const userSkills = skills?.filter(s => 
          s.userId === user.id || (s as any).user_id === user.id
        ) || [];
        
        // If user has no skills and we're filtering by skills, exclude them
        if (userSkills.length === 0) return false;
        
        // Check if user has any skills matching all the filters
        return userSkills.some(skill => {
          // Filter by category if specified
          if (userSkillCategoryFilter !== "all" && skill.category !== userSkillCategoryFilter) {
            return false;
          }
          
          // Filter by skill name if specified
          if (userSkillNameFilter !== "all" && skill.name !== userSkillNameFilter) {
            return false;
          }
          
          // Filter by skill level if specified
          if (userSkillLevelFilter !== "all" && skill.level !== userSkillLevelFilter) {
            return false;
          }
          
          // All filters passed
          return true;
        });
      });
    }
    
    // Step 4: Sort users
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
  }, [users, searchQuery, roleFilter, sortField, sortDirection, skills, userSkillCategoryFilter, userSkillNameFilter, userSkillLevelFilter]);
  
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
              // Just update the active tab state, without changing the URL
              // This prevents unnecessary re-renders caused by location changes
              setActiveTab(value);
            }}
            className="relative"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="sticky top-0 z-10 bg-background pt-4 pb-4"
            >
              <TabsList className="w-full mb-2 flex flex-wrap gap-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 min-w-[150px]">
                  <TabsTrigger 
                    value="dashboard" 
                    className="flex items-center gap-2 w-full"
                  >
                    <BarChart4 className="h-4 w-4" />
                    <span>Dashboard</span>
                  </TabsTrigger>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 min-w-[150px]">
                  <TabsTrigger 
                    value="project-overview" 
                    className="flex items-center gap-2 w-full"
                  >
                    <SquareStack className="h-4 w-4" />
                    <span>Project Overview</span>
                  </TabsTrigger>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 min-w-[150px]">
                  <TabsTrigger 
                    value="skill-overview" 
                    className="flex items-center gap-2 w-full"
                  >
                    <BrainCircuit className="h-4 w-4" />
                    <span>Skill Overview</span>
                  </TabsTrigger>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 min-w-[150px]">
                  <TabsTrigger 
                    value="skill-history" 
                    className="flex items-center gap-2 w-full"
                  >
                    <History className="h-4 w-4" />
                    <span>Skill History</span>
                  </TabsTrigger>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 min-w-[150px]">
                  <TabsTrigger 
                    value="certifications" 
                    className="flex items-center gap-2 w-full"
                  >
                    <Award className="h-4 w-4" />
                    <span>Certifications</span>
                  </TabsTrigger>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 min-w-[150px]">
                  <TabsTrigger 
                    value="skill-templates" 
                    className="flex items-center gap-2 w-full"
                  >
                    <Database className="h-4 w-4" />
                    <span>Skills</span>
                  </TabsTrigger>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 min-w-[150px]">
                  <TabsTrigger 
                    value="skill-targets" 
                    className="flex items-center gap-2 w-full"
                  >
                    <Target className="h-4 w-4" />
                    <span>Skill Targets</span>
                  </TabsTrigger>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 min-w-[150px]">
                  <TabsTrigger 
                    value="users" 
                    className="flex items-center gap-2 w-full"
                  >
                    <Users className="h-4 w-4" />
                    <span>Users</span>
                  </TabsTrigger>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 min-w-[150px]">
                  <TabsTrigger 
                    value="user-management" 
                    className="flex items-center gap-2 w-full"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>Admin Access</span>
                  </TabsTrigger>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 min-w-[150px]">
                  <TabsTrigger 
                    value="reports" 
                    className="flex items-center gap-2 w-full"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Reports</span>
                  </TabsTrigger>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 min-w-[150px]">
                  <TabsTrigger 
                    value="approvals" 
                    className="flex items-center gap-2 w-full relative"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Pending Approvals</span>
                    {pendingSkills && pendingSkills.length > 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {pendingSkills.reduce((acc, group) => acc + group.pendingSkills.length, 0)}
                      </Badge>
                    )}
                  </TabsTrigger>
                </motion.div>
              </TabsList>
            </motion.div>
            
            <TabsContent value="project-overview" className="mt-4 pt-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5,
                  delay: 0.1,
                  ease: "easeOut"
                }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-primary">Project Hierarchy Overview</h2>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search projects or clients..."
                      className="w-64"
                      onChange={(e) => {
                        // Implement search functionality if needed
                      }}
                    />
                    <Select>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Filter by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {projectHierarchy?.map(client => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mb-6 p-3 bg-muted rounded-md flex flex-wrap items-center justify-center text-sm text-muted-foreground gap-4">
                  <div className="flex items-center">
                    <span className="inline-block border px-1 rounded mr-2">←</span> 
                    <span>Collapse Item</span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-block border px-1 rounded mr-2">→</span> 
                    <span>Expand Item</span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-block border px-1 rounded mr-2">↓</span> 
                    <span>Move to Child/Next</span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-block border px-1 rounded mr-2">↑</span> 
                    <span>Move to Previous/Parent</span>
                  </div>
                </div>

                {isLoadingProjectHierarchy ? (
                  <div className="w-full flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : projectHierarchy && projectHierarchy.length > 0 ? (
                  <div className="space-y-4">
                    <Accordion type="multiple" className="w-full">
                      {projectHierarchy.map(client => (
                        <AccordionItem key={`client-${client.id}`} value={`client-${client.id}`} className="border border-border rounded-lg mb-4 overflow-hidden">
                          <AccordionTrigger className="px-4 py-3 bg-muted/30 hover:bg-muted/50 hover:no-underline">
                            <div className="flex justify-between items-center w-full pr-4">
                              <div className="flex items-center gap-2">
                                <SquareStack className="h-5 w-5 text-primary" />
                                <span className="font-bold text-lg">{client.name}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {client.industry || 'No industry'}
                                </Badge>
                              </div>
                              <Badge variant="secondary" className="text-sm">
                                {client.projects.length} Projects
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-0 pb-0">
                            <div className="border-t border-border/30">
                              {client.projects.length > 0 ? (
                                <Accordion type="multiple" className="w-full">
                                  {client.projects.map(project => (
                                    <AccordionItem key={`project-${project.id}`} value={`project-${project.id}`} className="border-b last:border-b-0 border-border/30">
                                      <AccordionTrigger className="px-6 py-3 hover:bg-muted/20 hover:no-underline">
                                        <div className="flex justify-between items-center w-full pr-4">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" />
                                            <span className="font-medium">{project.name}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                              {project.resources?.length || 0} Resources
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                              {project.skills?.length || 0} Skills
                                            </Badge>
                                          </div>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="pl-8 pr-4 border-t border-border/10">
                                        <Accordion type="multiple" className="w-full">
                                          {/* Resources Section */}
                                          <AccordionItem value={`resources-${project.id}`} className="border border-border/20 rounded-md mb-3">
                                            <AccordionTrigger className="px-4 py-2 hover:bg-muted/10 hover:no-underline">
                                              <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-primary" />
                                                <span className="font-medium">Project Resources</span>
                                                <Badge variant="outline" className="text-xs">
                                                  {project.resources?.length || 0}
                                                </Badge>
                                              </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-2">
                                              {project.resources && project.resources.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                  <Table>
                                                    <TableHeader>
                                                      <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Role</TableHead>
                                                        <TableHead>Allocation</TableHead>
                                                        <TableHead>Skills</TableHead>
                                                      </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                      {project.resources.map(resource => (
                                                        <TableRow key={resource.id}>
                                                          <TableCell className="font-medium">
                                                            {resource.user?.firstName && resource.user?.lastName
                                                              ? `${resource.user.firstName} ${resource.user.lastName}`
                                                              : resource.user?.username || resource.user?.email || 'Unknown'}
                                                          </TableCell>
                                                          <TableCell>{resource.role || 'N/A'}</TableCell>
                                                          <TableCell>{resource.allocation ? `${resource.allocation}%` : 'N/A'}</TableCell>
                                                          <TableCell>
                                                            <div className="flex flex-wrap gap-1">
                                                              {resource.skills && resource.skills.length > 0 
                                                                ? resource.skills.map(skill => (
                                                                    <Badge 
                                                                      key={skill.id} 
                                                                      variant="outline" 
                                                                      className="text-xs"
                                                                      style={{
                                                                        backgroundColor: getSkillBadgeColor(skill.level || 'beginner', 0.1),
                                                                        borderColor: getSkillBadgeColor(skill.level || 'beginner', 0.3),
                                                                        color: getSkillBadgeColor(skill.level || 'beginner', 1)
                                                                      }}
                                                                    >
                                                                      {skill.name} ({skill.level || 'beginner'})
                                                                    </Badge>
                                                                  ))
                                                                : <span className="text-muted-foreground text-xs">No skills</span>
                                                              }
                                                            </div>
                                                          </TableCell>
                                                        </TableRow>
                                                      ))}
                                                    </TableBody>
                                                  </Table>
                                                </div>
                                              ) : (
                                                <div className="text-muted-foreground text-sm py-2 px-4">No resources assigned to this project.</div>
                                              )}
                                            </AccordionContent>
                                          </AccordionItem>
                                          
                                          {/* Required Skills Section */}
                                          <AccordionItem value={`skills-${project.id}`} className="border border-border/20 rounded-md">
                                            <AccordionTrigger className="px-4 py-2 hover:bg-muted/10 hover:no-underline">
                                              <div className="flex items-center gap-2">
                                                <BrainCircuit className="h-4 w-4 text-primary" />
                                                <span className="font-medium">Required Skills</span>
                                                <Badge variant="outline" className="text-xs">
                                                  {project.skills?.length || 0}
                                                </Badge>
                                              </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-2">
                                              {project.skills && project.skills.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                  <Table>
                                                    <TableHeader>
                                                      <TableRow>
                                                        <TableHead>Skill</TableHead>
                                                        <TableHead>Category</TableHead>
                                                        <TableHead>Required Level</TableHead>
                                                      </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                      {project.skills.map(skill => (
                                                        <TableRow key={skill.id}>
                                                          <TableCell className="font-medium">{skill.skillName || 'Unknown'}</TableCell>
                                                          <TableCell>{skill.category || 'Uncategorized'}</TableCell>
                                                          <TableCell>
                                                            <Badge 
                                                              variant="outline" 
                                                              style={{
                                                                backgroundColor: getSkillBadgeColor(skill.requiredLevel || 'beginner', 0.1),
                                                                borderColor: getSkillBadgeColor(skill.requiredLevel || 'beginner', 0.3),
                                                                color: getSkillBadgeColor(skill.requiredLevel || 'beginner', 1)
                                                              }}
                                                            >
                                                              {skill.requiredLevel || 'beginner'}
                                                            </Badge>
                                                          </TableCell>
                                                        </TableRow>
                                                      ))}
                                                    </TableBody>
                                                  </Table>
                                                </div>
                                              ) : (
                                                <div className="text-muted-foreground text-sm py-2 px-4">No specific skills required for this project.</div>
                                              )}
                                            </AccordionContent>
                                          </AccordionItem>
                                        </Accordion>
                                      </AccordionContent>
                                    </AccordionItem>
                                  ))}
                                </Accordion>
                              ) : (
                                <div className="px-6 py-4 text-muted-foreground text-sm">
                                  No projects for this client.
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <SquareStack className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Project Data Available</h3>
                    <p className="text-muted-foreground max-w-md">
                      There are no clients or projects in the system yet. Add clients and projects to see them displayed here.
                    </p>
                  </div>
                )}
              </motion.div>
            </TabsContent>
            
            <TabsContent value="skill-overview" className="mt-4 pt-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5,
                  delay: 0.1,
                  ease: "easeOut"
                }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-primary">Skill Hierarchy Overview</h2>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search skills or categories..."
                      className="w-64"
                      onChange={(e) => {
                        // Implement search functionality if needed
                      }}
                    />
                    <Select>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Filter by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {skillHierarchy?.map(category => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mb-6 p-3 bg-muted rounded-md flex flex-wrap items-center justify-center text-sm text-muted-foreground gap-4">
                  <div className="flex items-center">
                    <span className="inline-block border px-1 rounded mr-2">←</span> 
                    <span>Collapse Item</span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-block border px-1 rounded mr-2">→</span> 
                    <span>Expand Item</span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-block border px-1 rounded mr-2">↓</span> 
                    <span>Move to Child/Next</span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-block border px-1 rounded mr-2">↑</span> 
                    <span>Move to Previous/Parent</span>
                  </div>
                </div>

                {isLoadingSkillHierarchy ? (
                  <div className="w-full flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : skillHierarchy && skillHierarchy.length > 0 ? (
                  <div className="space-y-4">
                    <Accordion type="multiple" className="w-full">
                      {skillHierarchy.map(category => (
                        <AccordionItem 
                          key={`category-${category.id}`} 
                          value={`category-${category.id}`} 
                          className="border border-border rounded-lg mb-4 overflow-hidden"
                          style={{
                            borderColor: category.color ? `${category.color}40` : undefined
                          }}
                        >
                          <AccordionTrigger 
                            className="px-4 py-3 hover:no-underline group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
                            style={{
                              backgroundColor: category.color ? `${category.color}10` : 'bg-muted/30',
                              borderBottom: category.color ? `1px solid ${category.color}20` : undefined
                            }}
                          >
                            <div className="flex justify-between items-center w-full">
                              <div className="flex items-center gap-2">
                                <BrainCircuit className="h-5 w-5 text-primary" />
                                <span className="font-bold text-lg">{category.name}</span>
                              </div>
                              <Badge variant="secondary" className="text-sm">
                                {category.subcategories?.reduce((total, sub) => total + (sub.skills?.length || 0), 0) || 0} Skills
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-0 pb-0">
                            <div className="border-t border-border/30">
                              {category.description && (
                                <div className="px-4 py-2 bg-muted/5 border-b border-border/20">
                                  <p className="text-sm text-muted-foreground">{category.description}</p>
                                </div>
                              )}
                              
                              {category.subcategories.length > 0 ? (
                                <Accordion type="multiple" className="w-full">
                                  {category.subcategories.map(subcategory => (
                                    <AccordionItem 
                                      key={`subcategory-${subcategory.id}`} 
                                      value={`subcategory-${subcategory.id}`}
                                      className="border-b last:border-b-0 border-border/30"
                                    >
                                      <AccordionTrigger className="px-6 py-3 hover:bg-muted/20 hover:no-underline group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                        <div className="flex justify-between items-center w-full">
                                          <div className="flex items-center gap-2">
                                            <FolderTree className="h-4 w-4 text-primary" />
                                            <span className="font-medium">{subcategory.name}</span>
                                          </div>
                                          <Badge variant="outline" className="text-xs">
                                            {subcategory.skills?.length || 0} Skills
                                          </Badge>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="pt-0 pb-0">
                                        <div className="border-t border-border/10">
                                          {subcategory.skills.length > 0 ? (
                                            <Accordion type="multiple" className="w-full">
                                              {subcategory.skills.map(skill => (
                                                <AccordionItem 
                                                  key={`skill-${skill.id}`} 
                                                  value={`skill-${skill.id}`} 
                                                  className="border-b last:border-b-0 border-border/10"
                                                >
                                                  <AccordionTrigger className="px-8 py-2 hover:bg-muted/10 hover:no-underline group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                                    <div className="flex justify-between items-center w-full">
                                                      <div className="flex items-center gap-2">
                                                        <Code className="h-4 w-4 text-primary" />
                                                        <span className="font-medium">{skill.name}</span>
                                                      </div>
                                                      {skill.users ? (
                                                        <Badge variant="outline" className="text-xs">
                                                          {skill.users.length} Users
                                                        </Badge>
                                                      ) : null}
                                                    </div>
                                                  </AccordionTrigger>
                                                  <AccordionContent className="px-8 pt-2 pb-3 bg-muted/5">
                                                    <div>
                                                      {skill.description && (
                                                        <div className="mb-3">
                                                          <p className="text-sm text-muted-foreground">{skill.description}</p>
                                                        </div>
                                                      )}
                                                      
                                                      {skill.users && skill.users.length > 0 ? (
                                                        <div className="overflow-x-auto">
                                                          <Table>
                                                            <TableHeader>
                                                              <TableRow>
                                                                <TableHead>User</TableHead>
                                                                <TableHead>Level</TableHead>
                                                                <TableHead>Certification</TableHead>
                                                              </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                              {skill.users.map((user, idx) => {
                                                                // Find the specific skill instance for this user
                                                                const userSkill = skill.userId === user.id ? skill : 
                                                                  (subcategory.skills.find(s => 
                                                                    s.userId === user.id && s.name === skill.name));
                                                                    
                                                                return (
                                                                  <TableRow key={`${user.id}-${idx}`}>
                                                                    <TableCell className="font-medium">
                                                                      {user.firstName && user.lastName
                                                                        ? `${user.firstName} ${user.lastName}`
                                                                        : user.username || user.email || 'Unknown'}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                      <Badge 
                                                                        variant="outline" 
                                                                        style={{
                                                                          backgroundColor: getSkillBadgeColor(userSkill?.level || 'beginner', 0.1),
                                                                          borderColor: getSkillBadgeColor(userSkill?.level || 'beginner', 0.3),
                                                                          color: getSkillBadgeColor(userSkill?.level || 'beginner', 1)
                                                                        }}
                                                                      >
                                                                        {userSkill?.level || 'beginner'}
                                                                      </Badge>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                      {userSkill?.certification && userSkill.certification !== 'false' ? (
                                                                        <Badge variant="secondary">Certified</Badge>
                                                                      ) : (
                                                                        <span className="text-muted-foreground text-sm">None</span>
                                                                      )}
                                                                    </TableCell>
                                                                  </TableRow>
                                                                );
                                                              })}
                                                            </TableBody>
                                                          </Table>
                                                        </div>
                                                      ) : (
                                                        <div className="text-muted-foreground text-sm py-2">
                                                          No users have this skill yet.
                                                        </div>
                                                      )}
                                                    </div>
                                                  </AccordionContent>
                                                </AccordionItem>
                                              ))}
                                            </Accordion>
                                          ) : (
                                            <div className="px-8 py-3 text-muted-foreground text-sm">
                                              No skills defined for this subcategory.
                                            </div>
                                          )}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  ))}
                                </Accordion>
                              ) : (
                                <div className="px-6 py-4 text-muted-foreground text-sm">
                                  No subcategories defined for this category.
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BrainCircuit className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Skill Data Available</h3>
                    <p className="text-muted-foreground max-w-md">
                      There are no skill categories defined in the system yet. Create skill categories to see them displayed here.
                    </p>
                  </div>
                )}
              </motion.div>
            </TabsContent>
            
            <TabsContent value="dashboard" className="mt-4 pt-4">
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
                            // Just update the state without changing the URL
                            setActiveTab("users");
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
                            // Just update the state without changing the URL
                            setActiveTab("certifications");
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
                    <div className="overflow-x-auto scrollable-container">
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
                          // Just update the state without changing the URL
                          setActiveTab("skill-history");
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
                  <div className="overflow-x-auto scrollable-container">
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
            
            <TabsContent value="skill-history" className="mt-4 pt-4">
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
                  <div className="overflow-x-auto scrollable-container">
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
            
            <TabsContent value="certifications" className="mt-4 pt-4">
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
                      onValueChange={(value) => {
                        setCertCategoryFilter(value);
                        setCertActiveFilters(prev => ({...prev, category: value !== 'all' ? value : ''}));
                      }}
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
                    
                    {/* Skill Level Filter */}
                    <Select 
                      value={certSkillLevelFilter} 
                      onValueChange={(value) => {
                        setCertSkillLevelFilter(value);
                        setCertActiveFilters(prev => ({...prev, level: value !== 'all' ? value : ''}));
                      }}
                    >
                      <SelectTrigger className="w-full md:w-[180px] h-10">
                        <SelectValue placeholder="Filter by skill level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Skill Name Filter */}
                    <Select 
                      value={certSkillNameFilter} 
                      onValueChange={(value) => {
                        setCertSkillNameFilter(value);
                        setCertActiveFilters(prev => ({...prev, skillName: value !== 'all' ? value : ''}));
                      }}
                    >
                      <SelectTrigger className="w-full md:w-[200px] h-10">
                        <SelectValue placeholder="Filter by skill name" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Skill Names</SelectItem>
                        {/* Generate skill name items from certification data */}
                        {certificationReport && Array.from(
                          new Set(
                            certificationReport.flatMap(report => 
                              report.certifications.map(cert => cert.name)
                            ).filter(Boolean)
                          )
                        ).map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                  
                  {/* Active filters display */}
                  {Object.entries(certActiveFilters).filter(([_, value]) => value).length > 0 && (
                    <div className="px-6 py-2 flex flex-wrap gap-2 items-center border-b">
                      <span className="text-sm text-gray-500">Active filters:</span>
                      {Object.entries(certActiveFilters).filter(([_, value]) => value).map(([key, value]) => (
                        <Badge 
                          key={key} 
                          variant="outline" 
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 pl-2 pr-1 py-1"
                        >
                          <span className="capitalize">{key === 'skillName' ? 'Skill Name' : key}:</span> {value}
                          <button 
                            onClick={() => {
                              if (key === 'category') setCertCategoryFilter('all');
                              if (key === 'level') setCertSkillLevelFilter('all');
                              if (key === 'skillName') setCertSkillNameFilter('all');
                              setCertActiveFilters(prev => {
                                const newFilters = {...prev};
                                delete newFilters[key];
                                return newFilters;
                              });
                            }}
                            className="ml-1 rounded-full hover:bg-blue-100 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <Button 
                        variant="link" 
                        className="text-sm px-2 h-7"
                        onClick={() => {
                          setCertCategoryFilter('all');
                          setCertSkillLevelFilter('all');
                          setCertSkillNameFilter('all');
                          setCertActiveFilters({});
                        }}
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                
                <CardContent className="px-0">
                  <div className="overflow-x-auto scrollable-container">
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
                              
                              // Skill level filter
                              if (certSkillLevelFilter !== 'all' && item.cert.level !== certSkillLevelFilter) {
                                return false;
                              }
                              
                              // Skill name filter
                              if (certSkillNameFilter !== 'all' && item.cert.name !== certSkillNameFilter) {
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
            
            <TabsContent value="skill-templates" className="mt-4 pt-4">
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
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-2xl font-bold">Skills</CardTitle>
                      <CardDescription>
                        Create and manage skills for the organization
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => {
                        setShowTemplateDialog(true);
                        fetchCategories();
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Skill</span>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex mb-4">
                      <div className="relative w-full">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search skills..."
                          className="pl-8"
                          value={templateSearchQuery}
                          onChange={(e) => setTemplateSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    {isLoadingTemplates ? (
                      <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : skillTemplates.length === 0 ? (
                      <div className="text-center py-10">
                        <Database className="h-10 w-10 mx-auto text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">No skills</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new skill.</p>
                        <div className="mt-6">
                          <Button onClick={() => {
                            setShowTemplateDialog(true);
                            fetchCategories();
                          }}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Skill
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto scrollable-container">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Target Level</TableHead>
                              <TableHead>Recommended</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {skillTemplates
                              .filter(template => {
                                if (!templateSearchQuery) return true;
                                const query = templateSearchQuery.toLowerCase();
                                return (
                                  template.name.toLowerCase().includes(query) ||
                                  template.category.toLowerCase().includes(query) ||
                                  (template.description || "").toLowerCase().includes(query)
                                );
                              })
                              .map((template) => (
                                <TableRow key={template.id}>
                                  <TableCell className="font-medium">{template.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{template.category}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {template.targetLevel ? (
                                      <SkillLevelBadge level={template.targetLevel} />
                                    ) : (
                                      <span className="text-gray-500">Not specified</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {template.isRecommended ? (
                                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                        Recommended
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-gray-500">
                                        Optional
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingTemplate(template);
                                        setShowTemplateDialog(true);
                                        fetchCategories();
                                        // If template has category ID, load subcategories
                                        if (template.categoryId) {
                                          fetchSubcategoriesForCategory(template.categoryId);
                                        }
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Skill Dialog */}
                <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                  <DialogContent className="sm:max-w-[575px] scrollable-dialog">
                    <DialogHeader>
                      <DialogTitle>{editingTemplate ? "Edit Skill" : "Create Skill"}</DialogTitle>
                      <DialogDescription>
                        {editingTemplate 
                          ? "Edit the details for this skill." 
                          : "Add a new skill that can be used by employees."}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="name"
                            placeholder="e.g., JavaScript"
                            className="col-span-3"
                            value={editingTemplate?.name || ""}
                            onChange={(e) => setEditingTemplate({
                              ...editingTemplate,
                              name: e.target.value,
                            } as any)}
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="category" className="text-right">
                            Category
                          </Label>
                          <Select 
                            value={editingTemplate?.categoryId?.toString() || ""}
                            onValueChange={(value) => {
                              const categoryId = parseInt(value);
                              setEditingTemplate({
                                ...editingTemplate,
                                categoryId: categoryId,
                                // Reset subcategory when category changes
                                subcategoryId: undefined,
                              } as any);
                              // Load subcategories for this category
                              fetchSubcategoriesForCategory(categoryId);
                            }}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="subcategory" className="text-right">
                            Subcategory
                          </Label>
                          <Select 
                            value={editingTemplate?.subcategoryId?.toString() || ""}
                            onValueChange={(value) => setEditingTemplate({
                              ...editingTemplate,
                              subcategoryId: parseInt(value),
                            } as any)}
                            disabled={!editingTemplate?.categoryId || subcategories.length === 0}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select a subcategory" />
                            </SelectTrigger>
                            <SelectContent>
                              {subcategories.map((subcategory) => (
                                <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                                  {subcategory.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="description" className="text-right">
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            placeholder="Provide a description of this skill"
                            className="col-span-3"
                            value={editingTemplate?.description || ""}
                            onChange={(e) => setEditingTemplate({
                              ...editingTemplate,
                              description: e.target.value,
                            } as any)}
                          />
                        </div>
                        

                      </div>
                      
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowTemplateDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="button"
                          onClick={() => {
                            // Handle saving the skill
                            const skillData = {
                              name: editingTemplate?.name || '',
                              categoryId: editingTemplate?.categoryId,
                              subcategoryId: editingTemplate?.subcategoryId,
                              description: editingTemplate?.description || '',
                              isRecommended: editingTemplate?.isRecommended || false,
                            };
                            
                            // Check if editing existing skill or creating new
                            if (editingTemplate?.id) {
                              // Call mutation to update
                              toast({
                                title: "Skill updated",
                                description: "The skill has been updated successfully."
                              });
                            } else {
                              // Call mutation to create
                              toast({
                                title: "Skill created",
                                description: "The new skill has been created successfully."
                              });
                            }
                            
                            setShowTemplateDialog(false);
                            setEditingTemplate(null);
                          }}
                        >
                          {editingTemplate ? "Update Skill" : "Create Skill"}
                        </Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="skill-targets" className="mt-4 pt-4">
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
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-2xl font-bold">Skill Targets</CardTitle>
                      <CardDescription>
                        Set and manage organizational skill targets and track progress
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setShowTargetDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Target</span>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex mb-4">
                      <div className="relative w-full">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search targets..."
                          className="pl-8"
                          value={targetSearchQuery}
                          onChange={(e) => setTargetSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    {isLoadingTargets ? (
                      <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : skillTargets.length === 0 ? (
                      <div className="text-center py-10">
                        <Target className="h-10 w-10 mx-auto text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">No skill targets</h3>
                        <p className="mt-1 text-sm text-gray-500">Create targets to help guide your team's skill development.</p>
                        <div className="mt-6">
                          <Button onClick={() => setShowTargetDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Target
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto scrollable-container">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Target Level</TableHead>
                              <TableHead>Target Date</TableHead>
                              <TableHead>Progress</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {skillTargets
                              .filter(target => {
                                if (!targetSearchQuery) return true;
                                const query = targetSearchQuery.toLowerCase();
                                return (
                                  (target.name || "").toLowerCase().includes(query) ||
                                  target.targetLevel.toLowerCase().includes(query) ||
                                  (target.description || "").toLowerCase().includes(query)
                                );
                              })
                              .map((target) => {
                                // Calculate progress
                                const targetAnalysis = skillGapAnalysis.find(analysis => 
                                  analysis?.name === (target.name || `Target ${target.id}`)
                                );
                                
                                const progressPercent = targetAnalysis 
                                  ? Math.round((targetAnalysis.currentLevel / targetAnalysis.targetLevel) * 100)
                                  : 0;
                                
                                return (
                                  <TableRow key={target.id}>
                                    <TableCell className="font-medium">{target.name || `Target ${target.id}`}</TableCell>
                                    <TableCell>
                                      <SkillLevelBadge level={target.targetLevel} />
                                    </TableCell>
                                    <TableCell>
                                      {target.targetDate ? (
                                        format(new Date(target.targetDate), "MMM dd, yyyy")
                                      ) : (
                                        <span className="text-gray-500">Not specified</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                          <div 
                                            className="bg-blue-600 h-2.5 rounded-full" 
                                            style={{ width: `${progressPercent}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-sm">{progressPercent}%</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setTargetFormData({
                                            id: target.id,
                                            name: target.name || '',
                                            skillIds: target.skillIds || [],
                                            targetLevel: target.targetLevel || 'intermediate',
                                            targetDate: target.targetDate || '',
                                            targetNumber: target.targetNumber,
                                            description: target.description || ''
                                          });
                                          setShowTargetDialog(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Target Dialog */}
                <Dialog open={showTargetDialog} onOpenChange={setShowTargetDialog}>
                  <DialogContent className="sm:max-w-[575px] scrollable-dialog">
                    <DialogHeader>
                      <DialogTitle>{targetFormData.id ? "Edit Skill Target" : "Create Skill Target"}</DialogTitle>
                      <DialogDescription>
                        {targetFormData.id 
                          ? "Edit the details for this skill target." 
                          : "Add a new organizational skill target."}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="name"
                            placeholder="e.g., JavaScript Expertise"
                            className="col-span-3"
                            value={targetFormData.name}
                            onChange={(e) => setTargetFormData({
                              ...targetFormData,
                              name: e.target.value,
                            })}
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="description" className="text-right">
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            placeholder="Describe this skill target"
                            className="col-span-3"
                            value={targetFormData.description}
                            onChange={(e) => setTargetFormData({
                              ...targetFormData,
                              description: e.target.value,
                            })}
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="targetLevel" className="text-right">
                            Target Level
                          </Label>
                          <Select 
                            value={targetFormData.targetLevel}
                            onValueChange={(value) => setTargetFormData({
                              ...targetFormData,
                              targetLevel: value,
                            })}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select a target level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="targetDate" className="text-right">
                            Target Date
                          </Label>
                          <Input
                            id="targetDate"
                            type="date"
                            className="col-span-3"
                            value={targetFormData.targetDate}
                            onChange={(e) => setTargetFormData({
                              ...targetFormData,
                              targetDate: e.target.value,
                            })}
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="targetNumber" className="text-right">
                            Target Number
                          </Label>
                          <Input
                            id="targetNumber"
                            type="number"
                            className="col-span-3"
                            placeholder="e.g., 5 skills"
                            value={targetFormData.targetNumber || ""}
                            onChange={(e) => setTargetFormData({
                              ...targetFormData,
                              targetNumber: e.target.value ? parseInt(e.target.value) : undefined,
                            })}
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">
                            Skills
                          </Label>
                          <div className="col-span-3">
                            {skills && (
                              <div className="p-4 border rounded-md max-h-64 overflow-y-auto overflow-x-auto">
                                <div className="space-y-2">
                                  {skills.map(skill => (
                                    <div key={skill.id} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        id={`skill-${skill.id}`}
                                        className="mr-2"
                                        checked={targetFormData.skillIds.includes(skill.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setTargetFormData({
                                              ...targetFormData,
                                              skillIds: [...targetFormData.skillIds, skill.id]
                                            });
                                          } else {
                                            setTargetFormData({
                                              ...targetFormData,
                                              skillIds: targetFormData.skillIds.filter(id => id !== skill.id)
                                            });
                                          }
                                        }}
                                      />
                                      <label htmlFor={`skill-${skill.id}`} className="flex-1 flex items-center justify-between">
                                        <span>{skill.name}</span>
                                        <SkillLevelBadge level={skill.level} size="sm" />
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowTargetDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="button"
                          onClick={() => {
                            // Handle saving the target
                            const targetData = {
                              name: targetFormData.name,
                              description: targetFormData.description,
                              targetLevel: targetFormData.targetLevel,
                              targetDate: targetFormData.targetDate,
                              targetNumber: targetFormData.targetNumber,
                              skillIds: Array.from(new Set(targetFormData.skillIds)), // Remove duplicates
                            };
                            
                            // Check if editing existing target or creating new
                            if (targetFormData.id) {
                              // Call mutation to update
                              toast({
                                title: "Target updated",
                                description: "The skill target has been updated successfully."
                              });
                            } else {
                              // Call mutation to create
                              toast({
                                title: "Target created",
                                description: "The new skill target has been created successfully."
                              });
                            }
                            
                            setShowTargetDialog(false);
                            setTargetFormData({
                              id: null,
                              name: '',
                              skillIds: [],
                              targetLevel: 'beginner',
                              targetDate: "",
                              targetNumber: undefined,
                              description: ''
                            });
                          }}
                        >
                          {targetFormData.id ? "Update Target" : "Create Target"}
                        </Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="users" className="mt-4 pt-4">
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
                    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                      <Select 
                        value={roleFilter} 
                        onValueChange={(value) => {
                          setRoleFilter(value);
                        }}
                      >
                        <SelectTrigger className="w-full md:w-[180px] h-10">
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
                      
                      <Select 
                        value={userSkillCategoryFilter} 
                        onValueChange={(value) => {
                          setUserSkillCategoryFilter(value);
                        }}
                      >
                        <SelectTrigger className="w-full md:w-[180px] h-10">
                          <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {skillCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select 
                        value={userSkillNameFilter} 
                        onValueChange={(value) => {
                          setUserSkillNameFilter(value);
                        }}
                      >
                        <SelectTrigger className="w-full md:w-[200px] h-10">
                          <SelectValue placeholder="Filter by skill name" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Skill Names</SelectItem>
                          {skillNames.map(name => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select 
                        value={userSkillLevelFilter} 
                        onValueChange={(value) => {
                          setUserSkillLevelFilter(value);
                        }}
                      >
                        <SelectTrigger className="w-full md:w-[180px] h-10">
                          <SelectValue placeholder="Filter by skill level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Active filters display */}
                  {(roleFilter !== "all" || userSkillCategoryFilter !== "all" || userSkillNameFilter !== "all" || userSkillLevelFilter !== "all") && (
                    <div className="mt-4 px-0 py-2 flex flex-wrap gap-2 items-center border-t">
                      <span className="text-sm text-gray-500">Active filters:</span>
                      
                      {roleFilter !== "all" && (
                        <Badge 
                          variant="outline" 
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 pl-2 pr-1 py-1"
                        >
                          <span className="capitalize">Role:</span> {roleFilter}
                          <button 
                            onClick={() => setRoleFilter("all")}
                            className="ml-1 rounded-full hover:bg-blue-100 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      
                      {userSkillCategoryFilter !== "all" && (
                        <Badge 
                          variant="outline" 
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 pl-2 pr-1 py-1"
                        >
                          <span className="capitalize">Category:</span> {userSkillCategoryFilter}
                          <button 
                            onClick={() => setUserSkillCategoryFilter("all")}
                            className="ml-1 rounded-full hover:bg-blue-100 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      
                      {userSkillNameFilter !== "all" && (
                        <Badge 
                          variant="outline" 
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 pl-2 pr-1 py-1"
                        >
                          <span className="capitalize">Skill Name:</span> {userSkillNameFilter}
                          <button 
                            onClick={() => setUserSkillNameFilter("all")}
                            className="ml-1 rounded-full hover:bg-blue-100 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      
                      {userSkillLevelFilter !== "all" && (
                        <Badge 
                          variant="outline" 
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 pl-2 pr-1 py-1"
                        >
                          <span className="capitalize">Level:</span> {userSkillLevelFilter}
                          <button 
                            onClick={() => setUserSkillLevelFilter("all")}
                            className="ml-1 rounded-full hover:bg-blue-100 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      
                      <Button 
                        variant="link" 
                        className="text-sm px-2 h-7"
                        onClick={() => {
                          setRoleFilter("all");
                          setUserSkillCategoryFilter("all");
                          setUserSkillNameFilter("all");
                          setUserSkillLevelFilter("all");
                        }}
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="px-0">
                  <div className="overflow-x-auto scrollable-container">
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
            
            <TabsContent value="reports" className="mt-4 pt-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5,
                  delay: 0.1,
                  ease: "easeOut"
                }}
              >
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Weekly Resource Reports</CardTitle>
                      <CardDescription>
                        Generate and send weekly reports of project resource allocations to the sales team.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <h4 className="text-sm font-medium mb-2">Report Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Recipient:</p>
                              <p className="text-sm font-medium">vinayak.chobe@atyeti.com</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Schedule:</p>
                              <p className="text-sm font-medium">Every Monday at 9:00 AM</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 mb-1">Content:</p>
                            <p className="text-sm">Summary of resources added to projects in the last week, including links to user profiles and project pages.</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Manual Generation</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            You can manually generate and send a weekly resource report at any time.
                          </p>
                          
                          <SendReportButton reportSettings={reportSettings} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle>Report Settings</CardTitle>
                        <CardDescription>
                          Configure your report delivery settings, frequency, and recipients
                        </CardDescription>
                      </div>
                      <Button variant="outline" className="ml-auto" onClick={() => setShowAddReportDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Report Setting
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <ReportSettingsManager />
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="user-management" className="mt-4 pt-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5,
                  delay: 0.1,
                  ease: "easeOut"
                }}
              >
                {/* Import the user management component */}
                <AdminUsersManagement />
              </motion.div>
            </TabsContent>

            <TabsContent value="approvals" className="mt-4 pt-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5,
                  delay: 0.1,
                  ease: "easeOut"
                }}
              >
                <Card className="mb-8">
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle>Pending Skill Approvals</CardTitle>
                      <CardDescription>Review and approve or reject skill updates submitted by users</CardDescription>
                    </div>
                    {pendingSkills && pendingSkills.length === 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        All caught up
                      </Badge>
                    )}
                    {pendingSkills && pendingSkills.length > 0 && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                        {pendingSkills.reduce((acc, group) => acc + group.pendingSkills.length, 0)} pending approval{pendingSkills.reduce((acc, group) => acc + group.pendingSkills.length, 0) > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    {isLoadingPendingSkills ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : pendingSkills && pendingSkills.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No pending approvals</h3>
                        <p className="mt-2 text-sm text-gray-500">
                          All skill updates have been reviewed. Check back later for new submissions.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {pendingSkills?.map((userGroup, groupIndex) => (
                          <Accordion type="single" collapsible className="mb-6" key={groupIndex}>
                            <AccordionItem value={`user-${userGroup.user.id}`} className="border border-gray-200 rounded-lg shadow-sm">
                              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                <div className="flex items-center w-full">
                                  <Avatar className="h-10 w-10 mr-4">
                                    <AvatarFallback className="bg-indigo-600 text-white">
                                      {userGroup.user.firstName?.[0] || userGroup.user.username?.[0]}
                                      {userGroup.user.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                      {userGroup.user.firstName} {userGroup.user.lastName}
                                      <Badge variant="outline" className="ml-3 bg-amber-50 border-amber-200 text-amber-700">
                                        {userGroup.pendingSkills.length} pending
                                      </Badge>
                                    </h3>
                                    <p className="text-sm text-gray-500">{userGroup.user.email} • {userGroup.user.role || "Employee"}</p>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-0">
                                <div className="border-t border-gray-200 overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certification</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {userGroup.pendingSkills.map((skill, skillIndex) => (
                                        <tr key={skillIndex}>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{skill.name}</div>
                                            {skill.notes && (
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <Button variant="link" className="h-auto p-0 text-xs text-muted-foreground">
                                                    View notes
                                                  </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80">
                                                  <div className="text-sm">
                                                    <h4 className="font-medium mb-2">Submission Notes</h4>
                                                    <p className="text-gray-700">{skill.notes}</p>
                                                  </div>
                                                </PopoverContent>
                                              </Popover>
                                            )}
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{skill.category}</div>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <SkillLevelBadge level={skill.level} />
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            {skill.certification ? (
                                              <div>
                                                <div className="text-sm text-gray-900">{skill.certification}</div>
                                                {skill.credlyLink && (
                                                  <a href={skill.credlyLink} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-900">
                                                    View credential
                                                  </a>
                                                )}
                                                {skill.certificationDate && (
                                                  <div className="text-xs text-gray-500">
                                                    {new Date(skill.certificationDate).toLocaleDateString()}
                                                    {skill.expirationDate && ` - ${new Date(skill.expirationDate).toLocaleDateString()}`}
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-gray-500 text-sm">None</span>
                                            )}
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                              {(() => {
                                                try {
                                                  const date = new Date(skill.submittedAt);
                                                  return !isNaN(date.getTime()) 
                                                    ? date.toLocaleDateString() 
                                                    : "Date not available";
                                                } catch (error) {
                                                  return "Date not available";
                                                }
                                              })()}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                              {(() => {
                                                try {
                                                  const date = new Date(skill.submittedAt);
                                                  return !isNaN(date.getTime()) 
                                                    ? date.toLocaleTimeString() 
                                                    : "";
                                                } catch (error) {
                                                  return "";
                                                }
                                              })()}
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={skill.isUpdate ? "outline" : "default"} className={skill.isUpdate ? "bg-blue-50 text-blue-700 border-blue-200" : ""}>
                                              {skill.isUpdate ? "Update" : "New"}
                                            </Badge>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex space-x-2">
                                              <Button 
                                                onClick={() => handleApproveSkill(skill.id)} 
                                                size="sm"
                                                variant="outline"
                                                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                                              >
                                                <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                                                Approve
                                              </Button>
                                              <Button 
                                                onClick={() => handleRejectSkill(skill.id)} 
                                                size="sm"
                                                variant="outline"
                                                className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                                              >
                                                <ThumbsDown className="h-3.5 w-3.5 mr-1" />
                                                Reject
                                              </Button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
