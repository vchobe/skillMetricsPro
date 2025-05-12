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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  
  // We need both category name (for legacy compatibility) and categoryId
  // But the actual validation will be done on categoryId for consistency
  category: z.string().optional(), // The category name is auto-populated from categoryId
  
  // Make categoryId required - this is the primary identifier
  categoryId: z.number({
    required_error: "Category is required",
    invalid_type_error: "Category ID must be a number"
  }),
  
  // Make subcategoryId optional but validate as number when present
  subcategoryId: z.number({
    invalid_type_error: "Subcategory ID must be a number"
  }).optional().nullable(),
  
  description: z.string().optional().default(""),
  isRecommended: z.boolean().default(false),
  targetLevel: z.enum(["beginner", "intermediate", "expert"]).optional().nullable(),
  targetDate: z.string().optional().nullable()
});

type SkillTemplateValues = z.infer<typeof skillTemplateSchema>;

// Define the form schema for setting skill targets
const skillTargetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  skillIds: z.array(z.number()).min(1, "At least one skill must be selected"),
  targetLevel: z.enum(["beginner", "intermediate", "expert"]),
  targetDate: z.string().default(""),
  targetNumber: z.number().min(1).optional(),
  description: z.string().optional()
});

type SkillTargetValues = z.infer<typeof skillTargetSchema>;

// For the purpose of this prototype, we'll define a skill template/target type
type SkillTemplate = {
  id: number;
  name: string;
  category: string;
  categoryId?: number;
  subcategoryId?: number;
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
  const [deleteTemplateId, setDeleteTemplateId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [showDeleteTemplateDialog, setShowDeleteTemplateDialog] = useState(false);
  const [showDeleteTargetDialog, setShowDeleteTargetDialog] = useState(false);
  const [useSuperAdminDelete, setUseSuperAdminDelete] = useState(false);
  // This state holds the form data for the skill target being viewed/edited
  const [targetFormData, setTargetFormData] = useState<{
    id: number | null;
    name: string;
    skillIds: number[];
    targetLevel: "beginner" | "intermediate" | "expert";
    targetDate: string;
    targetNumber: number | string | undefined;
    description: string;
  }>({
    id: null,
    name: '',
    skillIds: [],
    targetLevel: 'intermediate' as "intermediate", // Match form's default value
    targetDate: "",
    targetNumber: undefined,
    description: ''
  });
  
  // Check if user is admin
  const isAdmin = user?.is_admin;
  
  // State for category and subcategory management
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [templateSubcategories, setTemplateSubcategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedTemplateCategoryId, setSelectedTemplateCategoryId] = useState<number | null>(null);
  
  // Fetch categories
  const { data: categoriesData } = useQuery<any[]>({
    queryKey: ["/api/skill-categories"],
    enabled: !!isAdmin
  });
  
  // Set categories when data is loaded
  useEffect(() => {
    if (categoriesData) {
      setDbCategories(categoriesData);
    }
  }, [categoriesData]);
  
  // Function to handle category change and load subcategories for normal skills
  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    
    // If a category is selected, fetch its subcategories
    if (categoryId) {
      fetch(`/api/skill-categories/${categoryId}/subcategories`)
        .then(response => response.json())
        .then(data => {
          setSubcategories(data);
        })
        .catch(error => {
          console.error('Error fetching subcategories:', error);
          toast({
            title: 'Error',
            description: 'Failed to load subcategories',
            variant: 'destructive'
          });
        });
    } else {
      setSubcategories([]);
    }
  };
  
  // Function to handle category change and load subcategories for templates
  const handleCategoryChangeTemplate = (categoryId: number) => {
    setSelectedTemplateCategoryId(categoryId);
    
    // Set legacy category field from the selected category name
    const selectedCategory = dbCategories.find((cat: any) => cat.id === categoryId);
    if (selectedCategory) {
      templateForm.setValue('category', selectedCategory.name);
    }
    
    // If a category is selected, fetch its subcategories
    if (categoryId) {
      fetch(`/api/skill-categories/${categoryId}/subcategories`)
        .then(response => response.json())
        .then(data => {
          setTemplateSubcategories(data);
        })
        .catch(error => {
          console.error('Error fetching subcategories:', error);
          toast({
            title: 'Error',
            description: 'Failed to load subcategories',
            variant: 'destructive'
          });
        });
    } else {
      setTemplateSubcategories([]);
    }
  };
  
  // Form for skill templates
  const templateForm = useForm<SkillTemplateValues>({
    resolver: zodResolver(skillTemplateSchema),
    defaultValues: {
      name: "",
      category: "", // Legacy field
      categoryId: null as any as number, // Required field, but we'll set it when a category is selected
      subcategoryId: null,
      description: "",
      isRecommended: false,
      targetLevel: null,
      targetDate: null
    }
  });
  
  // Form for skill targets
  const targetForm = useForm<SkillTargetValues>({
    resolver: zodResolver(skillTargetSchema),
    defaultValues: {
      name: "",
      skillIds: [],
      targetLevel: "intermediate" as "beginner" | "intermediate" | "expert",
      targetDate: "",
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
      // Debug logging to trace the issue
      console.log("🔍 UI TRACE: Creating template with form data:", JSON.stringify(data, null, 2));
      console.log("🔍 UI TRACE: Selected category ID:", selectedTemplateCategoryId);
      console.log("🔍 UI TRACE: Available subcategories:", JSON.stringify(templateSubcategories, null, 2));
      
      // Make sure we have valid category data
      if (!data.category && !data.categoryId && !selectedTemplateCategoryId) {
        console.error("❌ UI TRACE: Missing category data");
        throw new Error("A category must be selected");
      }
      
      // Create a clean request object to eliminate any potential issues
      const cleanRequest: any = {
        name: data.name,
        description: data.description || "",
        isRecommended: data.isRecommended || false,
        targetLevel: data.targetLevel || null,
        targetDate: data.targetDate || null
      };
      
      // Set categoryId, either from form or selected value
      if (data.categoryId) {
        cleanRequest.categoryId = data.categoryId;
        console.log(`✅ UI TRACE: Using form categoryId: ${data.categoryId}`);
      } else if (selectedTemplateCategoryId) {
        cleanRequest.categoryId = selectedTemplateCategoryId;
        console.log(`✅ UI TRACE: Using selectedTemplateCategoryId: ${selectedTemplateCategoryId}`);
      } else {
        // Try to look up the category ID from the name if we have it
        const matchedCategory = dbCategories.find(c => 
          c.name.toLowerCase() === data.category?.toLowerCase()
        );
        
        if (matchedCategory) {
          cleanRequest.categoryId = matchedCategory.id;
          console.log(`✅ UI TRACE: Found category ID ${matchedCategory.id} for name "${data.category}"`);
        } else {
          console.error(`❌ UI TRACE: Could not find category ID for name "${data.category}"`);
          throw new Error(`Could not find category ID for name "${data.category}"`);
        }
      }
      
      // Set the category name from the category ID for the legacy API
      const selectedCategory = dbCategories.find(c => c.id === cleanRequest.categoryId);
      if (selectedCategory) {
        cleanRequest.category = selectedCategory.name;
        console.log(`✅ UI TRACE: Set category name to "${cleanRequest.category}" from ID ${cleanRequest.categoryId}`);
      } else {
        console.warn(`⚠️ UI TRACE: Could not find category name for ID ${cleanRequest.categoryId}`);
      }
      
      // Handle subcategory ID if provided
      if (data.subcategoryId) {
        cleanRequest.subcategoryId = data.subcategoryId;
        console.log(`✅ UI TRACE: Using subcategoryId: ${data.subcategoryId}`);
        
        // Validate that the subcategory belongs to the selected category
        const validSubcategory = templateSubcategories.find(sc => sc.id === data.subcategoryId);
        if (!validSubcategory) {
          console.warn(`⚠️ UI TRACE: Selected subcategory ID ${data.subcategoryId} may not belong to category ${cleanRequest.categoryId}`);
        } else {
          console.log(`✅ UI TRACE: Verified subcategory ${validSubcategory.name} (ID: ${validSubcategory.id}) belongs to category ${cleanRequest.categoryId}`);
        }
      }
      
      console.log("🔍 UI TRACE: Final API request payload:", JSON.stringify(cleanRequest, null, 2));
      
      // Additional pre-flight validation
      if (!cleanRequest.name || cleanRequest.name.trim().length < 2) {
        console.error("%c❌ VALIDATION ERROR: Invalid template name", "background: #e74c3c; color: white; font-weight: bold; padding: 3px 5px; border-radius: 2px;");
        throw new Error("Template name must be at least 2 characters");
      }

      if (!cleanRequest.categoryId || typeof cleanRequest.categoryId !== 'number') {
        console.error("%c❌ VALIDATION ERROR: Invalid category ID", "background: #e74c3c; color: white; font-weight: bold; padding: 3px 5px; border-radius: 2px;");
        throw new Error("A valid category must be selected");
      }
      
      // Send the API request
      console.log("%c🔄 SENDING API REQUEST", "background: #3498db; color: white; font-weight: bold; padding: 2px 5px; border-radius: 2px;");
      let res;
      
      try {
        res = await apiRequest("POST", "/api/admin/skill-templates", cleanRequest);
      } catch (networkError) {
        console.error("%c🌐 NETWORK ERROR:", "background: #e74c3c; color: white; font-weight: bold; padding: 3px 5px; border-radius: 2px;", networkError);
        throw new Error(`Network error: ${networkError.message || 'Failed to connect to server'}`);
      }
      
      // Handle errors
      if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.error("%c❌ API ERROR:", "background: #e74c3c; color: white; font-weight: bold; padding: 3px 5px; border-radius: 2px;", errorData);
          
          // Check for specific error types
          if (errorData.error && errorData.error.includes('duplicate')) {
            throw new Error(`A template with name "${cleanRequest.name}" already exists in this category`);
          }
          
          throw new Error(errorData.message || errorData.error || "Failed to create template");
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message.includes("already exists")) {
            throw parseError; // Pass through our custom duplicate error
          }
          
          console.error("%c❌ RESPONSE PARSE ERROR:", "background: #e74c3c; color: white; font-weight: bold; padding: 3px 5px; border-radius: 2px;", errorText);
          throw new Error("Failed to create template: " + (errorText.substring(0, 100) + (errorText.length > 100 ? '...' : '')));
        }
      }
      
      // Parse successful response
      const responseData = await res.json();
      console.log("✅ UI TRACE: Template created successfully:", JSON.stringify(responseData, null, 2));
      
      return responseData;
    },
    onSuccess: (data) => {
      console.log("%c✅ SUCCESS: Template creation successful", "background: #27ae60; color: white; font-weight: bold; padding: 3px 5px; border-radius: 2px;");
      console.log("%c📋 CREATED TEMPLATE:", "background: #8e44ad; color: white; font-weight: bold; padding: 2px 5px; border-radius: 2px;", JSON.stringify(data, null, 2));
      
      // Invalidate queries to refresh data
      console.log("%c🔄 Invalidating template cache", "background: #3498db; color: white; font-weight: bold; padding: 2px 5px; border-radius: 2px;");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skill-templates"] });
      // Also invalidate the admin skills query to refresh the skills section
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skills"] });
      toast({
        title: "Success",
        description: `Skill template "${data.name}" created successfully`,
      });
      setShowTemplateDialog(false);
      templateForm.reset();
    },
    onError: (error: Error) => {
      console.error("❌ UI TRACE: Template creation failed:", error);
      console.error("❌ UI TRACE: Error message:", error.message);
      console.error("❌ UI TRACE: Error stack:", error.stack);
      
      // Show user-friendly error message
      toast({
        title: "Error Creating Template",
        description: error.message || "An unexpected error occurred. Please check the console for details.",
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
        throw new Error(error.message || "Failed to update skill");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skill-templates"] });
      // Also invalidate the admin skills query to refresh the skills section
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skills"] });
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
  
  // Delete skill template mutation (regular admin)
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/skill-templates/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete skill");
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skill-templates"] });
      // Also invalidate the admin skills query to refresh the skills section
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skills"] });
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
  
  // Super admin delete skill template mutation (with cascading delete)
  const superAdminDeleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/super-admin/skill-templates/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete skill and dependencies");
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skill-templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-skills"] });
      toast({
        title: "Super Admin Delete Success",
        description: "Skill template and ALL dependent data successfully deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Super Admin Delete Error",
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
      targetForm.reset({
        name: "",
        skillIds: [],
        targetLevel: "intermediate" as "beginner" | "intermediate" | "expert",
        targetDate: "",
        targetNumber: undefined,
        description: ""
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
  
  // Update skill target mutation
  const updateTargetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: SkillTargetValues }) => {
      // Validate and format the data for a skill target update
      const formattedData = {
        ...data,
        // Ensure targetNumber is properly formatted (as a number or null, not an empty string)
        targetNumber: data.targetNumber !== undefined && data.targetNumber !== null
          ? Number(data.targetNumber) 
          : null,
        // Ensure targetLevel is always a valid string value from the enum
        targetLevel: data.targetLevel as "beginner" | "intermediate" | "expert"
      };
      
      console.log("Updating skill target with formatted data:", id, formattedData);
      const res = await apiRequest("PATCH", `/api/admin/skill-targets/${id}`, formattedData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update skill target");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/skill-targets"] });
      toast({
        title: "Success",
        description: "Skill target updated successfully",
      });
      setShowTargetDialog(false);
      targetForm.reset({
        name: "",
        skillIds: [],
        targetLevel: "intermediate" as "beginner" | "intermediate" | "expert",
        targetDate: "",
        targetNumber: undefined,
        description: ""
      });
    },
    onError: (error: Error) => {
      console.error("Failed to update skill target:", error);
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
    console.log("%c🔍 UI SUBMIT: Template form submitted", "background: #2ecc71; color: white; font-weight: bold; padding: 3px 5px; border-radius: 2px;");
    console.log("%c📋 Form Data:", "background: #f39c12; color: white; font-weight: bold; padding: 2px 5px; border-radius: 2px;", JSON.stringify(data, null, 2));
    
    // Check if form has validation errors
    if (Object.keys(templateForm.formState.errors).length > 0) {
      console.error("%c❌ FORM HAS VALIDATION ERRORS:", "background: #e74c3c; color: white; font-weight: bold; padding: 3px 5px; border-radius: 2px;", templateForm.formState.errors);
      toast({
        title: "Form Error",
        description: "Please fix all validation errors before submitting",
        variant: "destructive",
      });
      return; // Prevent submission
    }
    
    // Ensure categoryId is properly set
    if (!data.categoryId && selectedTemplateCategoryId) {
      data.categoryId = selectedTemplateCategoryId;
      console.log("%c✅ Setting categoryId from selectedTemplateCategoryId:", "background: #27ae60; color: white; font-weight: bold; padding: 2px 5px; border-radius: 2px;", selectedTemplateCategoryId);
    }
    
    // Double-check if categoryId is set - it's required
    if (!data.categoryId) {
      const errorMsg = "CategoryId is missing! Required for skill template creation.";
      console.log("%c❌ ERROR:", "background: #e74c3c; color: white; font-weight: bold; padding: 3px 5px; border-radius: 2px;", errorMsg);
      toast({
        title: "Form Error",
        description: errorMsg,
        variant: "destructive",
      });
      return; // Prevent submission
    }
    
    // Set the category name from the categoryId if it's not already set
    if (!data.category && data.categoryId) {
      const categoryMatch = dbCategories.find((cat: any) => cat.id === data.categoryId);
      if (categoryMatch) {
        data.category = categoryMatch.name;
        console.log("%c✅ Set category name from categoryId:", "background: #27ae60; color: white; font-weight: bold; padding: 2px 5px; border-radius: 2px;", data.category);
      }
    }
    
    // Log final form data after any adjustments
    console.log("%c📋 FINAL FORM DATA:", "background: #8e44ad; color: white; font-weight: bold; padding: 2px 5px; border-radius: 2px;", JSON.stringify(data, null, 2));
    
    try {
      if (editingTemplate) {
        console.log("%c🔄 Updating template:", "background: #3498db; color: white; font-weight: bold; padding: 2px 5px; border-radius: 2px;", editingTemplate.id);
        updateTemplateMutation.mutate({ ...data, id: editingTemplate.id });
      } else {
        console.log("%c➕ Creating new template", "background: #3498db; color: white; font-weight: bold; padding: 2px 5px; border-radius: 2px;");
        createTemplateMutation.mutate(data);
      }
    } catch (error) {
      console.error("%c❌ MUTATION ERROR:", "background: #e74c3c; color: white; font-weight: bold; padding: 3px 5px; border-radius: 2px;", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Handle target form submission
  const onTargetSubmit = (data: SkillTargetValues) => {
    console.log("Target form submitted:", data);
    console.log("Current target form data state:", targetFormData);
    
    if (targetFormData.id) {
      // Handle update case
      console.log(`Updating skill target with ID: ${targetFormData.id}`);
      updateTargetMutation.mutate({ id: targetFormData.id, data });
    } else {
      // Handle create case
      console.log("Creating new skill target");
      createTargetMutation.mutate(data);
    }
  };
  
  // Handle editing template
  const handleEditTemplate = (template: SkillTemplate) => {
    setEditingTemplate(template);
    
    // Look up categoryId by name if possible
    const categoryMatch = dbCategories.find((cat: any) => 
      cat.name.toLowerCase() === template.category.toLowerCase()
    );
    const categoryId = categoryMatch ? categoryMatch.id : undefined;
    
    // If we found a category, fetch its subcategories
    if (categoryId) {
      setSelectedTemplateCategoryId(categoryId);
      fetch(`/api/skill-categories/${categoryId}/subcategories`)
        .then(response => response.json())
        .then(data => {
          setTemplateSubcategories(data);
        })
        .catch(error => {
          console.error('Error fetching subcategories:', error);
        });
    }
    
    templateForm.reset({
      name: template.name,
      category: template.category,
      categoryId: categoryId,
      subcategoryId: template.subcategoryId,
      description: template.description || "",
      isRecommended: template.isRecommended,
      targetLevel: template.targetLevel as "beginner" | "intermediate" | "expert" | undefined,
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
        targetLevel: "intermediate" as "beginner" | "intermediate" | "expert", // Use enum values
        targetDate: "",
        targetNumber: undefined,
        description: ""
      });
      // Reset the target form data state
      setTargetFormData({
        id: null,
        name: '',
        skillIds: [],
        targetLevel: 'intermediate' as "intermediate", // Match form's default value
        targetDate: "",
        targetNumber: undefined,
        description: ''
      });
    }
  }, [showTargetDialog, targetForm]);
  
  // Extract all unique categories from existing templates
  const categorySet = new Set<string>();
  skillTemplates.forEach(t => categorySet.add(t.category));
  const templateCategoryNames = Array.from(categorySet);
  
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
                <p className="opacity-90">Manage all skills and learning targets for your organization.</p>
              </div>
              
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="templates" className="text-center">
                    <Database className="h-4 w-4 mr-2" />
                    Skills
                  </TabsTrigger>
                  <TabsTrigger value="targets" className="text-center">
                    <Target className="h-4 w-4 mr-2" />
                    Skill Targets
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="templates">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Skills</CardTitle>
                        <CardDescription>
                          Define standard skills and categorize them for your organization
                        </CardDescription>
                      </div>
                      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                        <DialogTrigger asChild>
                          <Button 
                            onClick={() => {
                              setEditingTemplate(null);
                              templateForm.reset({
                                name: "",
                                category: "",
                                categoryId: undefined,
                                subcategoryId: undefined,
                                description: "",
                                isRecommended: false,
                                targetLevel: undefined,
                                targetDate: undefined
                              });
                              setSelectedTemplateCategoryId(null);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Skill
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{editingTemplate ? 'Edit Skill' : 'Create Skill'}</DialogTitle>
                            <DialogDescription>
                              {editingTemplate 
                                ? 'Update this skill information.'
                                : 'Add a new skill to your organization catalog with the appropriate category and subcategory.'}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Form {...templateForm}>
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                console.log("Form Submission Event Triggered");
                                console.log("Form Values:", templateForm.getValues());
                                
                                // Manual form submission to bypass potential issues
                                const values = templateForm.getValues();
                                onTemplateSubmit(values);
                              }}
                              className="space-y-4 mt-4"
                            >
                              <FormField
                                control={templateForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g. JavaScript" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              {/* Category Selection - DB-driven dropdown */}
                              <FormField
                                control={templateForm.control}
                                name="categoryId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <FormControl>
                                      <Select 
                                        value={field.value?.toString() || ""}
                                        onValueChange={(value) => {
                                          const categoryId = parseInt(value, 10);
                                          handleCategoryChangeTemplate(categoryId);
                                          field.onChange(categoryId);
                                        }}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {dbCategories.map((category: any) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                              {category.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              {/* Subcategory Selection - Only shown when a category is selected */}
                              {selectedTemplateCategoryId && (
                                <FormField
                                  control={templateForm.control}
                                  name="subcategoryId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Subcategory</FormLabel>
                                      <FormControl>
                                        <Select
                                          value={field.value?.toString() || ""}
                                          onValueChange={(value) => {
                                            const subcategoryId = parseInt(value, 10);
                                            field.onChange(subcategoryId);
                                          }}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a subcategory" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {templateSubcategories.map((subcategory) => (
                                              <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                                                {subcategory.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                              
                              {/* Legacy Category Field - Hidden but maintained for backward compatibility */}
                              <FormField
                                control={templateForm.control}
                                name="category"
                                render={({ field }) => (
                                  <FormItem className="hidden">
                                    <FormControl>
                                      <Input {...field} type="hidden" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={templateForm.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                      <Textarea placeholder="Describe this skill..." {...field} />
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
                                      <FormLabel>Recommended Skill</FormLabel>
                                      <FormDescription>
                                        Mark this skill as recommended for all employees
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
                                    <FormLabel>Target Level (Optional)</FormLabel>
                                    <Select 
                                      onValueChange={field.onChange} 
                                      defaultValue={field.value as "beginner" | "intermediate" | "expert" | undefined}
                                      value={field.value as "beginner" | "intermediate" | "expert" | undefined}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a target level" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="expert">Expert</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={templateForm.control}
                                name="targetDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Target Date (Optional)</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <DialogFooter>
                                <Button type="submit" disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}>
                                  {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  {editingTemplate ? 'Update Skill' : 'Create Skill'}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2 pb-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search skills..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <Button variant="outline" size="icon">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="rounded-md border">
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
                            {filteredTemplates.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                  No skills found.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredTemplates.map((template) => (
                                <TableRow key={template.id}>
                                  <TableCell className="font-medium">{template.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{template.category}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {template.targetLevel ? (
                                      <SkillLevelBadge level={template.targetLevel} />
                                    ) : (
                                      <span className="text-muted-foreground text-sm">Not set</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {template.isRecommended ? (
                                      <Badge className="bg-green-500">Recommended</Badge>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">No</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleEditTemplate(template)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => {
                                          setDeleteTemplateId(template.id);
                                          setShowDeleteTemplateDialog(true);
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
                
                <TabsContent value="targets">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Skill Targets</CardTitle>
                        <CardDescription>
                          Set learning objectives for individuals or teams
                        </CardDescription>
                      </div>
                      <Dialog open={showTargetDialog} onOpenChange={setShowTargetDialog}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Target
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{targetFormData.id ? 'Edit Skill Target' : 'Create Skill Target'}</DialogTitle>
                            <DialogDescription>
                              {targetFormData.id 
                                ? 'Update this skill target.'
                                : 'Define learning objectives for individuals or teams.'}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Form {...targetForm}>
                            <form onSubmit={targetForm.handleSubmit(onTargetSubmit)} className="space-y-4 mt-4">
                              <FormField
                                control={targetForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Target Name (Optional)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g. Backend Developer Path" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={targetForm.control}
                                name="skillIds"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Required Skills</FormLabel>
                                    <div className="border rounded-md p-4 space-y-4">
                                      <FormDescription>
                                        Select skills that should be part of this target
                                      </FormDescription>
                                      {Object.entries(skillsByCategory).map(([category, skills]) => (
                                        <div key={category} className="space-y-2">
                                          <h4 className="text-sm font-semibold">{category}</h4>
                                          <div className="flex flex-wrap gap-2">
                                            {skills.map((skill) => (
                                              <Badge
                                                key={skill.id}
                                                variant={field.value.includes(skill.id) ? "default" : "outline"}
                                                className={`cursor-pointer ${
                                                  field.value.includes(skill.id) 
                                                    ? "bg-primary" 
                                                    : "hover:bg-primary/10"
                                                }`}
                                                onClick={() => {
                                                  const newValue = field.value.includes(skill.id)
                                                    ? field.value.filter(id => id !== skill.id)
                                                    : [...field.value, skill.id];
                                                  field.onChange(newValue);
                                                }}
                                              >
                                                {skill.name}
                                                {field.value.includes(skill.id) && (
                                                  <Check className="ml-1 h-3 w-3" />
                                                )}
                                              </Badge>
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
                                    <Select 
                                      onValueChange={field.onChange} 
                                      defaultValue={field.value as "beginner" | "intermediate" | "expert"}
                                      value={field.value as "beginner" | "intermediate" | "expert"}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a target level" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="expert">Expert</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={targetForm.control}
                                  name="targetDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Target Date (Optional)</FormLabel>
                                      <FormControl>
                                        <Input type="date" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={targetForm.control}
                                  name="targetNumber"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Target Number (Optional)</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          min="1"
                                          placeholder="Minimum skills required" 
                                          {...field}
                                          value={field.value || ""}
                                          onChange={e => {
                                            const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                            field.onChange(value);
                                          }}
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Minimum number of skills required from the selection
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <FormField
                                control={targetForm.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Describe the purpose of this skill target..." 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <DialogFooter>
                                <Button type="submit" disabled={createTargetMutation.isPending || updateTargetMutation.isPending}>
                                  {(createTargetMutation.isPending || updateTargetMutation.isPending) && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  {targetFormData.id ? 'Update Target' : 'Create Target'}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Skills</TableHead>
                              <TableHead>Target Level</TableHead>
                              <TableHead>Target Date</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {skillTargets.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                  No skill targets found.
                                </TableCell>
                              </TableRow>
                            ) : (
                              skillTargets.map((target) => (
                                <TableRow key={target.id}>
                                  <TableCell className="font-medium">
                                    {target.name || `Target #${target.id}`}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {target.skillIds.length > 0 ? (
                                        <>
                                          <Badge variant="outline" className="bg-primary/10">
                                            {target.skillIds.length} skills
                                          </Badge>
                                          {target.targetNumber && (
                                            <Badge variant="outline" className="bg-amber-500/10 text-amber-700">
                                              Min: {target.targetNumber}
                                            </Badge>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-muted-foreground text-sm">None</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <SkillLevelBadge level={target.targetLevel} />
                                  </TableCell>
                                  <TableCell>
                                    {target.targetDate ? (
                                      <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700">
                                        {new Date(target.targetDate).toLocaleDateString()}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">Not set</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          // Format the target date in YYYY-MM-DD format for the date input
                                          const formattedDate = target.targetDate 
                                            ? new Date(target.targetDate).toISOString().split('T')[0]
                                            : "";
                                            
                                          // Ensure valid targetLevel
                                          const validLevel = (target.targetLevel === 'beginner' || target.targetLevel === 'intermediate' || target.targetLevel === 'expert') 
                                            ? (target.targetLevel as "beginner" | "intermediate" | "expert")
                                            : 'intermediate' as "intermediate";
                                            
                                          // Log the target data before editing to help with debugging
                                          console.log("Editing target:", JSON.stringify(target, null, 2));
                                          
                                          // Update the form with the target data
                                          targetForm.reset({
                                            name: target.name || '',
                                            skillIds: target.skillIds || [],
                                            targetLevel: validLevel,
                                            targetDate: formattedDate,
                                            targetNumber: target.targetNumber,
                                            description: target.description || ''
                                          });
                                          
                                          // Update the state's targetFormData
                                          setTargetFormData({
                                            id: target.id,
                                            name: target.name || '',
                                            skillIds: target.skillIds || [],
                                            targetLevel: validLevel,
                                            targetDate: formattedDate,
                                            targetNumber: target.targetNumber,
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
                                          setDeleteTargetId(target.id);
                                          setShowDeleteTargetDialog(true);
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

      {/* Delete Skill Confirmation Dialog */}
      <AlertDialog open={showDeleteTemplateDialog} onOpenChange={setShowDeleteTemplateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {user?.email === "admin@atyeti.com" ? (
                <>
                  <p className="mb-2">This action cannot be undone. Choose how you want to delete this template:</p>
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch 
                      id="super-admin-delete" 
                      checked={useSuperAdminDelete}
                      onCheckedChange={setUseSuperAdminDelete}
                    />
                    <label 
                      htmlFor="super-admin-delete" 
                      className="font-medium cursor-pointer"
                    >
                      Use Super Admin Delete
                    </label>
                  </div>
                  {useSuperAdminDelete ? (
                    <div className="p-2 bg-red-100 border border-red-200 rounded-md text-red-800 text-sm">
                      <strong>WARNING:</strong> Super Admin Delete will permanently remove this template AND all associated:
                      <ul className="list-disc list-inside mt-1">
                        <li>User skills using this template</li>
                        <li>Project skills using this template</li>
                        <li>Pending skill updates</li>
                        <li>Endorsements</li>
                        <li>Related notifications</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="p-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 text-sm">
                      Standard delete will only remove this template if it is not used by any user skills.
                    </div>
                  )}
                </>
              ) : (
                <>
                  This action cannot be undone. This will permanently delete the skill template if it is not in use.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUseSuperAdminDelete(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={`${useSuperAdminDelete ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'}`}
              onClick={() => {
                if (deleteTemplateId) {
                  if (useSuperAdminDelete && user?.email === "admin@atyeti.com") {
                    superAdminDeleteTemplateMutation.mutate(deleteTemplateId);
                  } else {
                    deleteTemplateMutation.mutate(deleteTemplateId);
                  }
                  setDeleteTemplateId(null);
                }
                setShowDeleteTemplateDialog(false);
                setUseSuperAdminDelete(false);
              }}
            >
              {useSuperAdminDelete ? 'Super Delete' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Target Confirmation Dialog */}
      <AlertDialog open={showDeleteTargetDialog} onOpenChange={setShowDeleteTargetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the skill target.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTargetId) {
                  deleteTargetMutation.mutate(deleteTargetId);
                  setDeleteTargetId(null);
                }
                setShowDeleteTargetDialog(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}