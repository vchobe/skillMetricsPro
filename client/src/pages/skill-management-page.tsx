import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skill } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import SkillLevelBadge from "@/components/skill-level-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Loader2, 
  Plus, 
  Database, 
  Brain, 
  Target, 
  Trash2, 
  Edit, 
  Search,
  Filter,
  Award,
  Check,
  XCircle
} from "lucide-react";

// Define the form schema for adding/editing skill templates
const skillTemplateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  category: z.string().min(2, "Category must be at least 2 characters"),
  description: z.string().optional(),
  isRecommended: z.boolean().default(false),
  targetLevel: z.enum(["beginner", "intermediate", "expert"]).optional(),
  targetDate: z.string().optional()
});

type SkillTemplateValues = z.infer<typeof skillTemplateSchema>;

// Define the form schema for setting skill targets
const skillTargetSchema = z.object({
  name: z.string().optional(),
  skillIds: z.array(z.number()),
  targetLevel: z.enum(["beginner", "intermediate", "expert"]),
  targetDate: z.string().optional(),
  targetNumber: z.number().min(1).optional(),
  description: z.string().optional()
});

type SkillTargetValues = z.infer<typeof skillTargetSchema>;

// For the purpose of this prototype, we'll define a skill template/target type
type SkillTemplate = {
  id: number;
  name: string;
  category: string;
  description?: string;
  isRecommended: boolean;
  targetLevel?: string;
  targetDate?: string;
};

type SkillTarget = {
  id: number;
  name?: string;
  skillIds: number[];
  targetLevel: string;
  targetDate?: string;
  targetNumber?: number;
  description?: string;
  assignedUsers?: number[];
};

export default function SkillManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<SkillTemplate | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  // This state holds the form data for the skill target being viewed/edited
  const [targetFormData, setTargetFormData] = useState<{
    id: number | null;
    name: string;
    skillIds: number[];
    targetLevel: string;
    targetDate: Date | undefined;
    targetNumber: number | undefined;
    description: string;
  }>({
    id: null,
    name: '',
    skillIds: [],
    targetLevel: 'beginner',
    targetDate: undefined,
    targetNumber: undefined,
    description: ''
  });
  
  // Check if user is admin
  const isAdmin = user?.is_admin;
  
  // Form for skill templates
  const templateForm = useForm<SkillTemplateValues>({
    resolver: zodResolver(skillTemplateSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      isRecommended: false,
      targetLevel: undefined,
      targetDate: undefined
    }
  });
  
  // Form for skill targets
  const targetForm = useForm<SkillTargetValues>({
    resolver: zodResolver(skillTargetSchema),
    defaultValues: {
      name: "",
      skillIds: [],
      targetLevel: "intermediate",
      targetDate: undefined,
      targetNumber: undefined,
      description: ""
    }
  });
  
  // Fetch all skill templates
  const { data: skillTemplates = [], isLoading: isLoadingTemplates } = useQuery<SkillTemplate[]>({
    queryKey: ["/api/admin/skill-templates"],
    enabled: !!isAdmin,
  });
  
  // Fetch all skill targets
  const { data: skillTargets = [], isLoading: isLoadingTargets } = useQuery<SkillTarget[]>({
    queryKey: ["/api/admin/skill-targets"],
    enabled: !!isAdmin,
  });
  
  // Fetch all skills
  const { data: allSkills = [], isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ["/api/admin/skills"],
    enabled: !!isAdmin,
  });
  
  // Filter templates based on search
  const filteredTemplates = skillTemplates.filter(template => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(searchLower) ||
      template.category.toLowerCase().includes(searchLower) ||
      (template.description || "").toLowerCase().includes(searchLower)
    );
  });
  
  // Create skill template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: SkillTemplateValues) => {
      const res = await apiRequest("POST", "/api/admin/skill-templates", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create skill template");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skill-templates"] });
      toast({
        title: "Success",
        description: "Skill template created successfully",
      });
      setShowTemplateDialog(false);
      templateForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update skill template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (data: SkillTemplateValues & { id: number }) => {
      const { id, ...templateData } = data;
      const res = await apiRequest("PATCH", `/api/admin/skill-templates/${id}`, templateData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update skill template");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skill-templates"] });
      toast({
        title: "Success",
        description: "Skill template updated successfully",
      });
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      templateForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete skill template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/skill-templates/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete skill template");
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skill-templates"] });
      toast({
        title: "Success",
        description: "Skill template deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create skill target mutation
  const createTargetMutation = useMutation({
    mutationFn: async (data: SkillTargetValues) => {
      const res = await apiRequest("POST", "/api/admin/skill-targets", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create skill target");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skill-targets"] });
      toast({
        title: "Success",
        description: "Skill target created successfully",
      });
      setShowTargetDialog(false);
      targetForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete skill target mutation
  const deleteTargetMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/skill-targets/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete skill target");
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skill-targets"] });
      toast({
        title: "Success",
        description: "Skill target deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle template form submission
  const onTemplateSubmit = (data: SkillTemplateValues) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ ...data, id: editingTemplate.id });
    } else {
      createTemplateMutation.mutate(data);
    }
  };
  
  // Handle target form submission
  const onTargetSubmit = (data: SkillTargetValues) => {
    createTargetMutation.mutate(data);
  };
  
  // Handle editing template
  const handleEditTemplate = (template: SkillTemplate) => {
    setEditingTemplate(template);
    templateForm.reset({
      name: template.name,
      category: template.category,
      description: template.description || "",
      isRecommended: template.isRecommended,
      targetLevel: template.targetLevel as any,
      targetDate: template.targetDate
    });
    setShowTemplateDialog(true);
  };
  
  // Reset form when dialog is closed
  useEffect(() => {
    if (!showTemplateDialog) {
      if (!editingTemplate) {
        templateForm.reset();
      }
    }
  }, [showTemplateDialog, editingTemplate, templateForm]);
  
  useEffect(() => {
    if (!showTargetDialog) {
      // Reset the form with default values when dialog is closed
      targetForm.reset({
        name: "",
        skillIds: [],
        targetLevel: "intermediate" as const, // Use const assertion to fix type issue
        targetDate: undefined,
        targetNumber: undefined,
        description: ""
      });
      // Reset the target form data state
      setTargetFormData({
        id: null,
        name: '',
        skillIds: [],
        targetLevel: 'beginner',
        targetDate: undefined,
        targetNumber: undefined,
        description: ''
      });
    }
  }, [showTargetDialog, targetForm]);
  
  // Extract all unique categories
  const categorySet = new Set<string>();
  skillTemplates.forEach(t => categorySet.add(t.category));
  const categories = Array.from(categorySet);
  
  // Group skills by category for selection in target form, and deduplicate by name and category
  const skillsByCategory = allSkills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    
    // Check if a skill with the same name already exists in this category
    const existingSkill = acc[category].find(s => 
      s.name.toLowerCase() === skill.name.toLowerCase()
    );
    
    // Only add if this skill name doesn't already exist in this category
    if (!existingSkill) {
      acc[category].push(skill);
    }
    
    return acc;
  }, {} as Record<string, Skill[]>);
  
  const isLoading = isLoadingTemplates || isLoadingTargets || isLoadingSkills;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/admin/skills" />
        
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <Header 
            title="Skill Management" 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
            isSidebarOpen={sidebarOpen} 
          />
          
          <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center h-64">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">
                You do not have permission to access this page. This area is restricted to administrators.
              </p>
              <Link href="/">
                <Button>Return to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/admin/skills" />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header 
          title="Skill Management" 
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
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 rounded-xl text-white mb-6">
                <h2 className="text-2xl font-bold mb-2">Skill Management</h2>
                <p className="opacity-90">
                  Create and manage organizational skills, templates, and targets
                </p>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="templates" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <span>Skill Templates</span>
                  </TabsTrigger>
                  <TabsTrigger value="targets" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Skill Targets</span>
                  </TabsTrigger>
                </TabsList>
                
                {/* Skill Templates Tab */}
                <TabsContent value="templates">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Skill Templates</CardTitle>
                        <CardDescription>
                          Create and manage recommended skills for your organization
                        </CardDescription>
                      </div>
                      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                        <DialogTrigger asChild>
                          <Button onClick={() => setEditingTemplate(null)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Template
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>
                              {editingTemplate ? "Edit Skill Template" : "Add Skill Template"}
                            </DialogTitle>
                            <DialogDescription>
                              {editingTemplate 
                                ? "Update this skill template for your organization" 
                                : "Create a new skill template for your organization"}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Form {...templateForm}>
                            <form onSubmit={templateForm.handleSubmit(onTemplateSubmit)} className="space-y-4">
                              <FormField
                                control={templateForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="React.js" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={templateForm.control}
                                name="category"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <FormControl>
                                      <Select 
                                        value={field.value} 
                                        onValueChange={field.onChange}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {categories.length > 0 ? (
                                            categories.map(category => (
                                              <SelectItem key={category} value={category}>
                                                {category}
                                              </SelectItem>
                                            ))
                                          ) : (
                                            <>
                                              <SelectItem value="Programming">Programming</SelectItem>
                                              <SelectItem value="Database">Database</SelectItem>
                                              <SelectItem value="Cloud">Cloud</SelectItem>
                                              <SelectItem value="DevOps">DevOps</SelectItem>
                                              <SelectItem value="Design">Design</SelectItem>
                                              <SelectItem value="Other">Other</SelectItem>
                                            </>
                                          )}
                                          {field.value && field.value.trim() !== "" && (
                                            <SelectItem value={field.value}>
                                              {field.value || "Custom Category"}
                                            </SelectItem>
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormDescription>
                                      Or type a new category
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={templateForm.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="A JavaScript library for building user interfaces"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={templateForm.control}
                                name="isRecommended"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-base">Recommended Skill</FormLabel>
                                      <FormDescription>
                                        Mark this skill as recommended for employees
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={templateForm.control}
                                name="targetLevel"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Target Level</FormLabel>
                                    <FormControl>
                                      <Select 
                                        value={field.value} 
                                        onValueChange={field.onChange}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select target level (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="beginner">Beginner</SelectItem>
                                          <SelectItem value="intermediate">Intermediate</SelectItem>
                                          <SelectItem value="expert">Expert</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormDescription>
                                      Recommended proficiency level for this skill
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={templateForm.control}
                                name="targetDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Target Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Optional target date for achieving this skill
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <DialogFooter>
                                <Button 
                                  variant="outline" 
                                  type="button" 
                                  onClick={() => setShowTemplateDialog(false)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit" 
                                  disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                                >
                                  {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  {editingTemplate ? "Update" : "Create"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {/* Search */}
                      <div className="mb-6">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Search templates..." 
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      {/* Templates Table */}
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Target Level</TableHead>
                              <TableHead>Target Date</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTemplates.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                  No skill templates found. Create your first template.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredTemplates.map((template) => (
                                <TableRow key={template.id}>
                                  <TableCell className="font-medium">{template.name}</TableCell>
                                  <TableCell>{template.category}</TableCell>
                                  <TableCell>
                                    {template.isRecommended ? (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        <Check className="h-3 w-3 mr-1" />
                                        Recommended
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                        Optional
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {template.targetLevel ? (
                                      <SkillLevelBadge level={template.targetLevel} size="sm" />
                                    ) : (
                                      <span className="text-gray-500">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {template.targetDate ? (
                                      <span>{new Date(template.targetDate).toLocaleDateString()}</span>
                                    ) : (
                                      <span className="text-gray-500">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEditTemplate(template)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => {
                                          if (confirm("Are you sure you want to delete this template?")) {
                                            deleteTemplateMutation.mutate(template.id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
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
                
                {/* Skill Targets Tab */}
                <TabsContent value="targets">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Skill Targets</CardTitle>
                        <CardDescription>
                          Set organization-wide targets for skills and track progress
                        </CardDescription>
                      </div>
                      <Dialog open={showTargetDialog} onOpenChange={setShowTargetDialog}>
                        <DialogTrigger asChild>
                          <Button>
                            <Target className="h-4 w-4 mr-2" />
                            Set Target
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>
                              {targetFormData.id ? 'View Skill Target' : 'Create Skill Target'}
                            </DialogTitle>
                            <DialogDescription>
                              {targetFormData.id 
                                ? 'View details for this skill target' 
                                : 'Set a target level for specific skills across the organization'}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Form {...targetForm}>
                            <form onSubmit={targetForm.handleSubmit(onTargetSubmit)} className="space-y-4">
                              <FormField
                                control={targetForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Target Name</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="Q2 Expert React Target" 
                                        {...field} 
                                        disabled={!!targetFormData.id} 
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Name for this skill target
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={targetForm.control}
                                name="skillIds"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Skills</FormLabel>
                                    <FormDescription>
                                      Select skills to set targets for
                                    </FormDescription>
                                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                                      {Object.entries(skillsByCategory).map(([category, skills]) => (
                                        <div key={category} className="mb-4">
                                          <h4 className="text-sm font-medium mb-2">{category}</h4>
                                          <div className="space-y-2">
                                            {skills.map(skill => (
                                              <div key={skill.id} className="flex items-center">
                                                <input
                                                  type="checkbox"
                                                  id={`skill-${skill.id}`}
                                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                  value={skill.id}
                                                  checked={field.value.includes(skill.id)}
                                                  onChange={(e) => {
                                                    // Only allow changes if not in view mode
                                                    if (!targetFormData.id) {
                                                      const checked = e.target.checked;
                                                      const id = Number(e.target.value);
                                                      if (checked) {
                                                        field.onChange([...field.value, id]);
                                                      } else {
                                                        field.onChange(field.value.filter(v => v !== id));
                                                      }
                                                    }
                                                  }}
                                                  disabled={!!targetFormData.id}
                                                />
                                                <label 
                                                  htmlFor={`skill-${skill.id}`}
                                                  className="ml-2 text-sm text-gray-900"
                                                >
                                                  {skill.name}
                                                </label>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={targetForm.control}
                                name="targetLevel"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Target Level</FormLabel>
                                    <FormControl>
                                      <Select 
                                        value={field.value} 
                                        onValueChange={field.onChange}
                                        disabled={!!targetFormData.id}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select target level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="beginner">Beginner</SelectItem>
                                          <SelectItem value="intermediate">Intermediate</SelectItem>
                                          <SelectItem value="expert">Expert</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormDescription>
                                      Target proficiency level for selected skills
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={targetForm.control}
                                name="targetDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Target Date</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="date" 
                                        {...field} 
                                        disabled={!!targetFormData.id}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Target date for achieving this skill level
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={targetForm.control}
                                name="targetNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Target Number</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="1"
                                        placeholder="Number of employees to reach this level"
                                        {...field}
                                        onChange={(e) => {
                                          const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                                          field.onChange(value);
                                        }}
                                        disabled={!!targetFormData.id}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Number of employees targeted to achieve this skill level
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={targetForm.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Rationale for this skill target"
                                        {...field} 
                                        disabled={!!targetFormData.id}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <DialogFooter>
                                <Button 
                                  variant="outline" 
                                  type="button" 
                                  onClick={() => setShowTargetDialog(false)}
                                >
                                  Cancel
                                </Button>
                                {targetFormData.id ? (
                                  <Button 
                                    type="button" 
                                    onClick={() => setShowTargetDialog(false)}
                                  >
                                    Close
                                  </Button>
                                ) : (
                                  <Button 
                                    type="submit" 
                                    disabled={createTargetMutation.isPending}
                                  >
                                    {createTargetMutation.isPending && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Set Target
                                  </Button>
                                )}
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {/* Targets Table */}
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Target</TableHead>
                              <TableHead>Target Level</TableHead>
                              <TableHead>Target Date</TableHead>
                              <TableHead>Target Number</TableHead>
                              <TableHead>Progress</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {skillTargets.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                  No skill targets set. Create your first target.
                                </TableCell>
                              </TableRow>
                            ) : (
                              skillTargets.map((target) => (
                                <TableRow key={target.id}>
                                  <TableCell>
                                    <div className="font-medium">
                                      {target.name || target.description || `Skills Target #${target.id}`}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {target.skillIds.length} skills included
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <SkillLevelBadge level={target.targetLevel} size="sm" />
                                  </TableCell>
                                  <TableCell>
                                    {target.targetDate ? (
                                      <span>{new Date(target.targetDate).toLocaleDateString()}</span>
                                    ) : (
                                      <span className="text-gray-500">Ongoing</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {target.targetNumber ? (
                                      <span className="font-medium">{target.targetNumber}</span>
                                    ) : (
                                      <span className="text-gray-500">Not specified</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-green-600 h-2.5 rounded-full" 
                                          style={{ width: '25%' }}
                                        ></div>
                                      </div>
                                      <span className="text-sm">25%</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          // Use type assertions to enforce proper skill target type
                                          const skillLevel = (target.targetLevel === "beginner" || 
                                                             target.targetLevel === "intermediate" || 
                                                             target.targetLevel === "expert") 
                                                           ? target.targetLevel 
                                                           : "beginner" as const;
                                          
                                          targetForm.reset({
                                            name: target.name || '',
                                            skillIds: target.skillIds || [],
                                            targetLevel: skillLevel,
                                            targetDate: target.targetDate || undefined,
                                            targetNumber: target.targetNumber || undefined,
                                            description: target.description || ''
                                          });
                                          setTargetFormData({
                                            id: target.id,
                                            name: target.name || '',
                                            skillIds: target.skillIds || [],
                                            targetLevel: target.targetLevel || 'beginner',
                                            targetDate: target.targetDate ? new Date(target.targetDate) : undefined,
                                            targetNumber: target.targetNumber || undefined,
                                            description: target.description || ''
                                          });
                                          setShowTargetDialog(true);
                                        }}
                                      >
                                        View Details
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => {
                                          if (confirm("Are you sure you want to delete this target?")) {
                                            deleteTargetMutation.mutate(target.id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
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