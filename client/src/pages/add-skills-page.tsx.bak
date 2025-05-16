import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Skill, insertSkillSchema, PendingSkillUpdate, SkillTemplate, SkillCategory, SkillSubcategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { SkillDescriptionModal } from "@/components/skill-description-modal";

// Utility function to generate consistent tab IDs
const getTabKey = (tabName: string): string => {
  // For fixed main tabs, use exact lowercase name
  const mainTabs = ["technical", "functional", "other"];
  if (mainTabs.includes(tabName.toLowerCase())) {
    return tabName.toLowerCase();
  }
  
  // For all other tabs, standardize format (lowercase, no spaces)
  return tabName.toLowerCase().replace(/\s+/g, '');
};

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { 
  Plus, 
  Code, 
  Database, 
  Server, 
  Brain, 
  Cloud, 
  Check, 
  TestTube, 
  LayoutDashboard, 
  BarChart2, 
  GitBranch,
  Users,
  MessageSquare,
  Paintbrush,
  PieChart,
  FileText,
  BookOpen,
  Info
} from "lucide-react";

// We're extending the existing insertSkillSchema to include additional fields
const skillSubmitSchema = insertSkillSchema.extend({
  changeNote: z.string().optional().default(""),
  certification: z.string().optional().default(""),
  credlyLink: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  description: z.string().optional().default(""),
  level: z.enum(["beginner", "intermediate", "expert"]).default("beginner"),
  selected: z.boolean().default(false),
});

// Categories displayed in each tab
// Based on database logs, currently there is only Programming category available
const TECHNICAL_CATEGORIES = [
  { id: "Programming", label: "Programming Languages", icon: <Code className="h-4 w-4" /> },
];

type SkillEntry = z.infer<typeof skillSubmitSchema>;

export default function AddSkillsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("technical");
  const [activeTechnicalCategory, setActiveTechnicalCategory] = useState<string>("Programming");
  const [activeFunctionalCategory, setActiveFunctionalCategory] = useState<string>("Design");
  const [skillsList, setSkillsList] = useState<SkillEntry[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Record<string, boolean>>({});
  const [skillDescriptions, setSkillDescriptions] = useState<Record<string, string>>({});
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [currentSkill, setCurrentSkill] = useState<string | null>(null);
  
  // Tab visit tracking
  const [visitedTabs, setVisitedTabs] = useState({
    // Main tabs
    technical: false,
    functional: false,
    other: false,
    
    // Technical sub-tabs
    programming: false,
    frontend: false,
    database: false,
    data: false, 
    cloud: false,
    devops: false,
    
    // Functional sub-tabs
    marketing: false,
    design: false,
    communication: false, 
    project: false,
    leadership: false
  });
  
  const [customSkill, setCustomSkill] = useState<{
    name?: string;
    category?: string;
    subcategory?: string;  // Added subcategory field
    level?: "beginner" | "intermediate" | "expert";
    certification?: string;
    credlyLink?: string;
    notes?: string;
    skillTemplateId?: number; // Add skill template ID for direct reference
  }>({ level: "beginner" });

  // Get all skills (including those from other users)
  const { data: allSkills = [], isLoading: isLoadingAllSkills } = useQuery<Skill[]>({
    queryKey: ["/api/all-skills"],
  });

  // Get user skills to avoid duplicates
  const { data: userSkills = [], isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  
  // Get categories to dynamically generate tabs
  const { data: skillCategories = [], isLoading: isLoadingCategories } = useQuery<SkillCategory[]>({
    queryKey: ["/api/skill-categories"],
  });
  
  // Get subcategories to organize skills hierarchically
  const { data: skillSubcategories = [], isLoading: isLoadingSubcategories } = useQuery<SkillSubcategory[]>({
    queryKey: ["/api/skill-subcategories"],
  });
  
  // Get skill templates to populate available skills
  const { data: skillTemplates = [], isLoading: isLoadingTemplates } = useQuery<SkillTemplate[]>({
    queryKey: ["/api/skill-templates"],
  });
  
  // Log skill templates for debugging
  useEffect(() => {
    if (skillTemplates.length > 0) {
      console.log("Skill templates loaded:", skillTemplates.length);
      
      // Log some sample templates
      console.log("Sample skill template:", skillTemplates[0]);
      
      // Check subcategory associations
      const templatesWithSubcategories = skillTemplates.filter(t => t.subcategoryId);
      console.log(`Templates with subcategories: ${templatesWithSubcategories.length}/${skillTemplates.length}`);
      
      if (templatesWithSubcategories.length > 0) {
        console.log("Sample template with subcategory:", templatesWithSubcategories[0]);
      }
    }
  }, [skillTemplates]);

  // Log subcategories for debugging
  useEffect(() => {
    if (skillSubcategories.length > 0) {
      console.log("Subcategories loaded:", skillSubcategories.length);
      console.log("Sample subcategory:", skillSubcategories[0]);
      
      // Check if we have SQL Database subcategory
      const sqlSubcategory = skillSubcategories.find(sc => sc.name === "SQL Databases");
      console.log("SQL Database subcategory:", sqlSubcategory);
    }
  }, [skillSubcategories]);

  // Process skill templates when loaded
  useEffect(() => {
    if (skillTemplates.length > 0) {
      console.log("Skill templates loaded:", skillTemplates.length);
      
      // Create a unique set of skills by name from templates
      const uniqueSkillNames = new Set();
      const uniqueSkills = skillTemplates.filter(template => {
        if (!uniqueSkillNames.has(template.name)) {
          uniqueSkillNames.add(template.name);
          return true;
        }
        return false;
      });
      
      // Convert to skill entries
      const entries: SkillEntry[] = uniqueSkills.map(template => ({
        userId: user?.id || 0,
        name: template.name,
        category: template.category,
        categoryId: template.categoryId,
        subcategoryId: template.subcategoryId,
        level: "beginner",
        certification: "",
        credlyLink: "",
        notes: "",
        description: "",
        changeNote: "",
        selected: false,
        certificationDate: undefined,
        expirationDate: undefined
      }));
      
      console.log(`Created ${entries.length} skill entries from templates`);
      setSkillsList(entries);
    }
  }, [skillTemplates, user]);
  
  // Fallback to all skills if templates aren't available
  useEffect(() => {
    if (skillTemplates.length === 0 && allSkills.length > 0) {
      // Debug: Log unique categories to help with mapping
      const categories = new Set(allSkills.map(s => s.category));
      console.log("Available categories from all skills:", Array.from(categories));
      
      // Debug: Check for database skills with subcategories
      const dbSkills = allSkills.filter(s => s.category === "Database" && s.subcategoryId);
      console.log("Database skills with subcategories:", dbSkills);
      
      // Create a unique set of skills by name
      const uniqueSkillNames = new Set();
      const uniqueSkills = allSkills.filter(skill => {
        if (!uniqueSkillNames.has(skill.name)) {
          uniqueSkillNames.add(skill.name);
          return true;
        }
        return false;
      });
      
      // Convert to skill entries
      const entries: SkillEntry[] = uniqueSkills.map(skill => ({
        userId: user?.id || 0,
        name: skill.name,
        category: skill.category,
        categoryId: skill.categoryId,
        subcategoryId: skill.subcategoryId,
        level: "beginner",
        description: "",
        certification: "",
        credlyLink: "",
        notes: "",
        changeNote: "",
        selected: false,
        certificationDate: undefined,
        expirationDate: undefined
      }));
      
      console.log(`Created ${entries.length} skill entries from all skills (fallback)`);
      setSkillsList(entries);
    }
  }, [allSkills, skillTemplates, user]);
  
  // On component mount, initialize with only the first subtab marked as visited
  useEffect(() => {
    console.log("Initializing with first subtabs as visited");
    
    // Only mark the technical tab and programming subtab as visited by default
    setVisitedTabs(prev => ({
      ...prev,
      technical: true,
      programming: true,
      functional: true,
      design: true
    }));
    
    // Update these state variables to ensure the relevant tab is selected in the UI
    setActiveTab("technical");
    setActiveTechnicalCategory("Programming");
  }, []);

  // For navigation
  const [, setLocation] = useLocation();

  // Submit multiple skills mutation
  const submitSkillsMutation = useMutation({
    mutationFn: async (skills: SkillEntry[]) => {
      const result = await Promise.all(
        skills.map(async (skill) => {
          // Get the matching skill template for this skill
          const matchingTemplate = skillTemplates.find(t => t.name === skill.name);
          
          const res = await apiRequest("POST", "/api/skills/pending", {
            ...skill,
            status: "pending",
            isUpdate: false,
            submittedAt: new Date().toISOString(),
            // Include skill template ID if available
            skillTemplateId: matchingTemplate?.id,
            skill_template_id: matchingTemplate?.id // Also include snake_case version for compatibility
          });
          return await res.json();
        })
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/pending-skills"] });
      
      toast({
        title: "Skills submitted for approval",
        description: "Your skills have been submitted and are pending approval.",
        variant: "default",
      });
      
      // Reset selections
      setSelectedSkills({});
      
      // Navigate back to skills page
      setLocation("/skills");
    },
    onError: (error) => {
      toast({
        title: "Error submitting skills",
        description: error.message || "There was an error submitting your skills. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Submit custom skill mutation
  const customSubmitMutation = useMutation({
    mutationFn: async (skill: typeof customSkill) => {
      if (!skill.name || !skill.category || !skill.subcategory || !skill.level) {
        throw new Error("Please fill all required fields");
      }
      
      console.log("Preparing custom skill submission with data:", { 
        name: skill.name, 
        category: skill.category,
        subcategory: skill.subcategory,
        level: skill.level
      });
      
      // Find the category ID for the selected category
      const categoryObj = skillCategories.find(c => c.name === skill.category);
      
      // Find the subcategory ID for the selected subcategory
      const subcategoryObj = skillSubcategories.find(sc => 
        sc.name === skill.subcategory && 
        sc.categoryId === categoryObj?.id
      );
      
      // Log the custom skill data for debugging
      console.log("Custom skill submission data before processing:", skill);
      
      // Don't add redundant metadata to notes since we're now storing it in dedicated fields
      // This avoids the "too long for type character varying(255)" error
      const trimmedNotes = skill.notes ? skill.notes.substring(0, 250) : '';
      
      // Find subcategory information is handled below - no need to duplicate here
      
      // Mark this as a custom skill
      const isCustomSkill = true;
      
      // Use the original pending_skill_updates table, with snake_case field names
      // Make sure all required fields are properly set to avoid null values
      const skillData = {
        user_id: user?.id || 0,
        name: skill.name || "", // Ensure name is never null
        category: skill.category || "",
        subcategory: skill.subcategory || "", // Include subcategory name
        level: skill.level || "beginner",
        certification: skill.certification || "",
        credly_link: skill.credlyLink || "",
        notes: trimmedNotes,
        is_custom_skill: isCustomSkill, // Add flag to mark as custom skill
        status: "pending",
        is_update: false,
        submitted_at: new Date().toISOString(),
        // Include category and subcategory IDs if available
        category_id: categoryObj?.id || null,
        subcategory_id: skillSubcategories.find(sc => 
          sc.name === skill.subcategory && 
          sc.categoryId === categoryObj?.id
        )?.id || null
      };
      
      const res = await apiRequest("POST", "/api/skills/pending", skillData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/pending-skills"] });
      
      toast({
        title: "Custom skill submitted",
        description: "Your custom skill has been submitted and is pending approval.",
        variant: "default",
      });
      
      // Reset custom skill form
      setCustomSkill({ level: "beginner" });
      
      // Navigate back to skills page
      setLocation("/skills");
    },
    onError: (error) => {
      toast({
        title: "Error submitting custom skill",
        description: error.message || "There was an error submitting your custom skill. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle selection of a skill
  const handleSkillSelection = (skillName: string, isSelected: boolean) => {
    setSelectedSkills(prev => ({
      ...prev,
      [skillName]: isSelected
    }));
  };
  
  // Function to open the description modal for a skill
  const openDescriptionModal = (skillName: string) => {
    setCurrentSkill(skillName);
    setDescriptionModalOpen(true);
  };

  // Create derived category lists based on the database values
  const technicalCategoryNames = skillCategories
    .filter(cat => cat.categoryType === "technical")
    .map(cat => cat.name);
  
  const functionalCategoryNames = skillCategories
    .filter(cat => cat.categoryType === "functional")
    .map(cat => cat.name);
  
  // Log the derived category names for debugging
  useEffect(() => {
    if (skillCategories.length > 0) {
      console.log("Technical categories from database:", technicalCategoryNames);
      console.log("Functional categories from database:", functionalCategoryNames);
    }
  }, [skillCategories]);
  
  // Filter skills by category
  const getFilteredSkills = () => {
    if (activeTab === "technical" && technicalCategoryNames.length > 0) {
      // Filter for skills in the technical categories (from database)
      return skillsList.filter(skill => technicalCategoryNames.includes(skill.category));
    } else if (activeTab === "functional" && functionalCategoryNames.length > 0) {
      // Filter for skills in the functional categories
      return skillsList.filter(skill => functionalCategoryNames.includes(skill.category));
    } else if (activeTab === "other") {
      // Filter for other skills
      return skillsList.filter(skill => 
        !technicalCategoryNames.includes(skill.category) && 
        !functionalCategoryNames.includes(skill.category)
      );
    } else {
      // If no database categories available, fall back to hardcoded categories
      if (activeTab === "technical") {
        return skillsList.filter(skill => 
          ["Programming", "Frontend", "Backend", "Database", "Data Science", "Cloud", "DevOps"].includes(skill.category)
        );
      } else if (activeTab === "functional") {
        return skillsList.filter(skill => 
          ["Design", "Marketing", "Communication", "Project Management", "Leadership"].includes(skill.category)
        );
      } else {
        return skillsList.filter(skill => 
          !["Programming", "Frontend", "Backend", "Database", "Data Science", "Cloud", "DevOps",
            "Design", "Marketing", "Communication", "Project Management", "Leadership"].includes(skill.category)
        );
      }
    }
  };
  
  // Further filter by subcategory 
  const getFilteredSkillsBySubcategory = (subcategoryId: number | null) => {
    // First get all skills for the current main tab
    const tabSkills = getFilteredSkills();
    
    // Then filter by subcategory if specified
    if (subcategoryId) {
      return tabSkills.filter(skill => skill.subcategoryId === subcategoryId);
    }
    
    // Otherwise return all skills for the category
    return tabSkills;
  };
  
  // Further filter by a specific category
  const getFilteredSkillsByCategory = (categoryName: string) => {
    // First get all skills for the current main tab
    const tabSkills = getFilteredSkills();
    
    // Then filter by category name
    return tabSkills.filter(skill => skill.category === categoryName);
  };
  
  // Get subcategories for a specific category
  const getSubcategoriesForCategory = (categoryName: string) => {
    // Find the category ID first
    const category = skillCategories.find(cat => cat.name === categoryName);
    
    if (category) {
      // Then find all subcategories for this category ID
      return skillSubcategories.filter(sub => sub.categoryId === category.id);
    }
    
    return [];
  };
  
  // Check if a skill is already in the user's skill list
  const isUserSkill = (skillName: string) => {
    return userSkills.some(skill => skill.name === skillName);
  };
  
  // Handle change in skill level
  const handleLevelChange = (skillName: string, level: string) => {
    setSkillsList(prev => 
      prev.map(skill => 
        skill.name === skillName 
          ? { ...skill, level: level as "beginner" | "intermediate" | "expert" } 
          : skill
      )
    );
  };
  
  // Handle change in skill certification
  const handleCertificationChange = (skillName: string, certification: string) => {
    setSkillsList(prev => 
      prev.map(skill => 
        skill.name === skillName 
          ? { ...skill, certification } 
          : skill
      )
    );
  };
  
  // Handle change in Credly link
  const handleCredlyLinkChange = (skillName: string, credlyLink: string) => {
    setSkillsList(prev => 
      prev.map(skill => 
        skill.name === skillName 
          ? { ...skill, credlyLink } 
          : skill
      )
    );
  };
  
  // Handle change in notes
  const handleNotesChange = (skillName: string, notes: string) => {
    setSkillsList(prev => 
      prev.map(skill => 
        skill.name === skillName 
          ? { ...skill, notes } 
          : skill
      )
    );
  };
  

  
  // Get selected skills for submission
  const getSelectedSkills = () => {
    return skillsList.filter(skill => selectedSkills[skill.name]);
  };
  
  // Submit selected skills
  const handleSubmit = () => {
    const selectedSkillsList = getSelectedSkills();
    
    if (selectedSkillsList.length === 0) {
      toast({
        title: "No skills selected",
        description: "Please select at least one skill to submit.",
        variant: "destructive",
      });
      return;
    }
    
    submitSkillsMutation.mutate(selectedSkillsList);
  };
  
  // Create Zod schema for the custom skill form
  const customSkillSchema = z.object({
    name: z.string().min(1, "Name is required"),
    category: z.string().min(1, "Category is required"),
    subcategory: z.string().min(1, "Subcategory is required"),
    level: z.enum(["beginner", "intermediate", "expert"]),
    certification: z.string().optional(),
    credlyLink: z.string().optional(),
    notes: z.string().optional(),
    description: z.string().optional()
  });
  
  // Initialize form for custom skill
  const form = useForm({
    defaultValues: {
      name: "",
      category: "",
      subcategory: "",
      level: "beginner" as const,
      certification: "",
      credlyLink: "",
      notes: "",
      description: ""
    },
  });
  
  // Handle custom skill form submission
  const onSubmitCustomSkill = (data: any) => {
    customSubmitMutation.mutate(data);
  };
  
  // Track visited tabs
  const handleTabClick = (tabId: string) => {
    // Mark this tab as visited
    setVisitedTabs(prev => ({
      ...prev,
      [tabId]: true
    }));
  };
  
  // Logic for determining if a skill is already added/disabled
  const isSkillDisabled = (skillName: string) => {
    return isUserSkill(skillName);
  };
  
  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/skills" />
        
        <div className="flex-1 overflow-auto">
          <Header title="Add Skills" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />
          
          <div className="container mx-auto pb-6 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Add Skills to Your Profile</h1>
                <p className="text-muted-foreground mt-1">Select skills to add to your profile or create a custom skill.</p>
              </div>
              <Link href="/skills">
                <Button variant="outline">
                  Return to Skills
                </Button>
              </Link>
            </div>
            
            {/* Tabs for main categories */}
            <Tabs 
              defaultValue="technical" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="mt-6"
            >
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger 
                  value="technical" 
                  onClick={() => handleTabClick("technical")}
                  className={!visitedTabs.technical ? "bg-blue-50 dark:bg-blue-950" : ""}
                >
                  Technical Skills
                </TabsTrigger>
                <TabsTrigger 
                  value="functional"
                  onClick={() => handleTabClick("functional")}
                  className={!visitedTabs.functional ? "bg-blue-50 dark:bg-blue-950" : ""}
                >
                  Functional Skills
                </TabsTrigger>
                <TabsTrigger 
                  value="other"
                  onClick={() => handleTabClick("other")}
                  className={!visitedTabs.other ? "bg-blue-50 dark:bg-blue-950" : ""}
                >
                  Other Skills
                </TabsTrigger>
              </TabsList>
              
              {/* Technical Skills Tab Content */}
              <TabsContent value="technical">
                <div className="grid gap-6 md:grid-cols-6">
                  {/* Subcategory navigation - left sidebar */}
                  <div className="md:col-span-1">
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-medium">Categories</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 py-0">
                        <div className="space-y-1">
                          {technicalCategoryNames.length > 0 ? (
                            // Use database categories if available
                            technicalCategoryNames.map(categoryName => (
                              <Button
                                key={categoryName}
                                variant={activeTechnicalCategory === categoryName ? "default" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => setActiveTechnicalCategory(categoryName)}
                              >
                                {categoryName}
                              </Button>
                            ))
                          ) : (
                            // Fallback to hardcoded values
                            TECHNICAL_CATEGORIES.map(category => (
                              <Button
                                key={category.id}
                                variant={activeTechnicalCategory === category.id ? "default" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => setActiveTechnicalCategory(category.id)}
                              >
                                <span className="mr-2">{category.icon}</span>
                                {category.label}
                              </Button>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Main content area - skill selection table */}
                  <div className="md:col-span-5 space-y-6">
                    {/* Subcategories section */}
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-medium">
                          {activeTechnicalCategory} Subcategories
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          {getSubcategoriesForCategory(activeTechnicalCategory).map(subcategory => (
                            <Button
                              key={subcategory.id}
                              variant="outline"
                              size="sm"
                              className="mb-2"
                              onClick={() => {
                                // Mark this subcategory tab as visited
                                handleTabClick(getTabKey(subcategory.name));
                                
                                // TODO: Filter by subcategory when clicked
                              }}
                              style={{
                                borderColor: subcategory.color || undefined,
                                color: subcategory.color || undefined,
                              }}
                            >
                              {subcategory.icon && (
                                <span className="mr-1">
                                  {/* Dynamically render icon based on name */}
                                  {subcategory.icon === "code" && <Code className="h-4 w-4" />}
                                  {subcategory.icon === "database" && <Database className="h-4 w-4" />}
                                  {subcategory.icon === "server" && <Server className="h-4 w-4" />}
                                  {subcategory.icon === "brain" && <Brain className="h-4 w-4" />}
                                  {subcategory.icon === "cloud" && <Cloud className="h-4 w-4" />}
                                  {subcategory.icon === "layout" && <LayoutDashboard className="h-4 w-4" />}
                                  {subcategory.icon === "git-branch" && <GitBranch className="h-4 w-4" />}
                                </span>
                              )}
                              {subcategory.name}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Skills selection table */}
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-medium">Select Skills</CardTitle>
                        <CardDescription>
                          Check the skills you want to add to your profile
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 py-3">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead>Skill Name</TableHead>
                              <TableHead>Level</TableHead>
                              <TableHead>Certification</TableHead>
                              <TableHead>Credly Link</TableHead>
                              <TableHead className="hidden md:table-cell">Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getFilteredSkillsByCategory(activeTechnicalCategory).map(skill => {
                              const isDisabled = isSkillDisabled(skill.name);
                              
                              return (
                                <TableRow key={skill.name} className={isDisabled ? "opacity-50" : ""}>
                                  <TableCell>
                                    <Checkbox 
                                      checked={selectedSkills[skill.name] || false}
                                      onCheckedChange={(checked) => {
                                        if (!isDisabled) {
                                          handleSkillSelection(skill.name, !!checked);
                                        }
                                      }}
                                      disabled={isDisabled}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="font-medium">{skill.name}</div>
                                      {!isDisabled && selectedSkills[skill.name] && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            openDescriptionModal(skill.name);
                                          }}
                                        >
                                          <FileText className="h-4 w-4" />
                                        </Button>
                                      )}
                                      {skillDescriptions[skill.name] && (
                                        <Check className="h-4 w-4 text-green-500" />
                                      )}
                                    </div>
                                    {isDisabled && <span className="text-xs text-muted-foreground">(Already added)</span>}
                                  </TableCell>
                                  <TableCell>
                                    <Select 
                                      value={skillsList.find(s => s.name === skill.name)?.level || "beginner"}
                                      onValueChange={(value) => handleLevelChange(skill.name, value)}
                                      disabled={isDisabled || !selectedSkills[skill.name]}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Level" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="expert">Expert</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Input 
                                      placeholder="Optional"
                                      value={skillsList.find(s => s.name === skill.name)?.certification || ""}
                                      onChange={(e) => handleCertificationChange(skill.name, e.target.value)}
                                      disabled={isDisabled || !selectedSkills[skill.name]}
                                      className="w-full"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input 
                                      placeholder="Credly URL"
                                      value={skillsList.find(s => s.name === skill.name)?.credlyLink || ""}
                                      onChange={(e) => handleCredlyLinkChange(skill.name, e.target.value)}
                                      disabled={isDisabled || !selectedSkills[skill.name]}
                                      className="w-full"
                                    />
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <Textarea
                                      placeholder="Additional notes"
                                      value={skillsList.find(s => s.name === skill.name)?.notes || ""}
                                      onChange={(e) => handleNotesChange(skill.name, e.target.value)}
                                      disabled={isDisabled || !selectedSkills[skill.name]}
                                      className="min-h-[60px] w-full"
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* Functional Skills Tab Content */}
              <TabsContent value="functional">
                <div className="grid gap-6 md:grid-cols-6">
                  {/* Subcategory navigation - left sidebar */}
                  <div className="md:col-span-1">
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-medium">Categories</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 py-0">
                        <div className="space-y-1">
                          {functionalCategoryNames.length > 0 ? (
                            // Use database categories if available
                            functionalCategoryNames.map(categoryName => (
                              <Button
                                key={categoryName}
                                variant={activeFunctionalCategory === categoryName ? "default" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => setActiveFunctionalCategory(categoryName)}
                              >
                                {categoryName}
                              </Button>
                            ))
                          ) : (
                            // Fallback to hardcoded values
                            <>
                              <Button
                                variant={activeFunctionalCategory === "Design" ? "default" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => setActiveFunctionalCategory("Design")}
                              >
                                <Paintbrush className="mr-2 h-4 w-4" />
                                Design
                              </Button>
                              <Button
                                variant={activeFunctionalCategory === "Marketing" ? "default" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => setActiveFunctionalCategory("Marketing")}
                              >
                                <PieChart className="mr-2 h-4 w-4" />
                                Marketing
                              </Button>
                              <Button
                                variant={activeFunctionalCategory === "Communication" ? "default" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => setActiveFunctionalCategory("Communication")}
                              >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Communication
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Main content area - skill selection table */}
                  <div className="md:col-span-5 space-y-6">
                    {/* Subcategories section */}
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-medium">
                          {activeFunctionalCategory} Subcategories
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          {getSubcategoriesForCategory(activeFunctionalCategory).map(subcategory => (
                            <Button
                              key={subcategory.id}
                              variant="outline"
                              size="sm"
                              className="mb-2"
                              onClick={() => {
                                // Mark this subcategory tab as visited
                                handleTabClick(getTabKey(subcategory.name));
                                
                                // TODO: Filter by subcategory when clicked
                              }}
                              style={{
                                borderColor: subcategory.color || undefined,
                                color: subcategory.color || undefined,
                              }}
                            >
                              {subcategory.icon && (
                                <span className="mr-1">
                                  {/* Dynamically render icon based on name */}
                                  {subcategory.icon === "paintbrush" && <Paintbrush className="h-4 w-4" />}
                                  {subcategory.icon === "pieChart" && <PieChart className="h-4 w-4" />}
                                  {subcategory.icon === "messageSquare" && <MessageSquare className="h-4 w-4" />}
                                  {subcategory.icon === "users" && <Users className="h-4 w-4" />}
                                  {subcategory.icon === "book-open" && <BookOpen className="h-4 w-4" />}
                                </span>
                              )}
                              {subcategory.name}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Skills selection table */}
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-medium">Select Skills</CardTitle>
                        <CardDescription>
                          Check the skills you want to add to your profile
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 py-3">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead>Skill Name</TableHead>
                              <TableHead>Level</TableHead>
                              <TableHead>Certification</TableHead>
                              <TableHead>Credly Link</TableHead>
                              <TableHead className="hidden md:table-cell">Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getFilteredSkillsByCategory(activeFunctionalCategory).map(skill => {
                              const isDisabled = isSkillDisabled(skill.name);
                              
                              return (
                                <TableRow key={skill.name} className={isDisabled ? "opacity-50" : ""}>
                                  <TableCell>
                                    <Checkbox 
                                      checked={selectedSkills[skill.name] || false}
                                      onCheckedChange={(checked) => {
                                        if (!isDisabled) {
                                          handleSkillSelection(skill.name, !!checked);
                                        }
                                      }}
                                      disabled={isDisabled}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="font-medium">{skill.name}</div>
                                      {!isDisabled && selectedSkills[skill.name] && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            openDescriptionModal(skill.name);
                                          }}
                                        >
                                          <FileText className="h-4 w-4" />
                                        </Button>
                                      )}
                                      {skillDescriptions[skill.name] && (
                                        <Check className="h-4 w-4 text-green-500" />
                                      )}
                                    </div>
                                    {isDisabled && <span className="text-xs text-muted-foreground">(Already added)</span>}
                                  </TableCell>
                                  <TableCell>
                                    <Select 
                                      value={skillsList.find(s => s.name === skill.name)?.level || "beginner"}
                                      onValueChange={(value) => handleLevelChange(skill.name, value)}
                                      disabled={isDisabled || !selectedSkills[skill.name]}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Level" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="expert">Expert</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Input 
                                      placeholder="Optional"
                                      value={skillsList.find(s => s.name === skill.name)?.certification || ""}
                                      onChange={(e) => handleCertificationChange(skill.name, e.target.value)}
                                      disabled={isDisabled || !selectedSkills[skill.name]}
                                      className="w-full"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input 
                                      placeholder="Credly URL"
                                      value={skillsList.find(s => s.name === skill.name)?.credlyLink || ""}
                                      onChange={(e) => handleCredlyLinkChange(skill.name, e.target.value)}
                                      disabled={isDisabled || !selectedSkills[skill.name]}
                                      className="w-full"
                                    />
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <Textarea
                                      placeholder="Additional notes"
                                      value={skillsList.find(s => s.name === skill.name)?.notes || ""}
                                      onChange={(e) => handleNotesChange(skill.name, e.target.value)}
                                      disabled={isDisabled || !selectedSkills[skill.name]}
                                      className="min-h-[60px] w-full"
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* Other Skills Tab Content */}
              <TabsContent value="other">
                <div className="grid gap-6 md:grid-cols-1">
                  {/* Create Custom Skill Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Create Custom Skill</CardTitle>
                      <CardDescription>
                        Can't find the skill you're looking for? Create a custom skill to add to your profile.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmitCustomSkill)} className="space-y-4 max-w-2xl">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel>Skill Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter skill name"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="level"
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel>Skill Level</FormLabel>
                                  <Select 
                                    value={field.value} 
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select level" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="beginner">Beginner</SelectItem>
                                      <SelectItem value="intermediate">Intermediate</SelectItem>
                                      <SelectItem value="expert">Expert</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel>Category</FormLabel>
                                  <Select 
                                    value={field.value} 
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      // Reset subcategory when category changes
                                      form.setValue("subcategory", "");
                                    }}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {skillCategories.map(category => (
                                        <SelectItem key={category.id} value={category.name}>
                                          {category.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="subcategory"
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel>Subcategory</FormLabel>
                                  <Select 
                                    value={field.value} 
                                    onValueChange={field.onChange}
                                    disabled={!form.watch("category")}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select subcategory" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {getSubcategoriesForCategory(form.watch("category")).map(subcategory => (
                                        <SelectItem key={subcategory.id} value={subcategory.name}>
                                          {subcategory.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel>Skill Description</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Describe your experience with this skill"
                                      className="min-h-[100px]"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel>Additional Notes</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Any additional notes or context"
                                      className="min-h-[80px]"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="certification"
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel>Certification (Optional)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Certification name"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="credlyLink"
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel>Credly Link (Optional)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Credly verification URL"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="flex justify-end mt-6">
                            <Button 
                              type="submit" 
                              disabled={customSubmitMutation.isPending}
                            >
                              {customSubmitMutation.isPending ? "Submitting..." : "Submit Custom Skill"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Submit Selected Skills Button - Fixed at bottom */}
            <Button 
              onClick={handleSubmit}
              className="fixed bottom-6 right-6 z-10 px-6 py-6 text-lg shadow-lg"
              disabled={submitSkillsMutation.isPending || Object.keys(selectedSkills).filter(key => selectedSkills[key]).length === 0}
            >
              {submitSkillsMutation.isPending ? "Submitting..." : "Submit Selected Skills"}
            </Button>
          </div>
        </div>
      </div>
    
      {/* Skill Description Modal */}
      <SkillDescriptionModal
        isOpen={descriptionModalOpen}
        onClose={() => setDescriptionModalOpen(false)} 
        skillName={currentSkill || ""}
        initialDescription={currentSkill && skillDescriptions[currentSkill] ? skillDescriptions[currentSkill] : ""}
        onSave={(description) => {
          if (currentSkill) {
            // Save the description
            setSkillDescriptions(prev => ({
              ...prev,
              [currentSkill]: description
            }));
            
            // Update the skill in the list
            setSkillsList(prev => prev.map(skill => 
              skill.name === currentSkill 
                ? { ...skill, description } 
                : skill
            ));
            
            // Show confirmation
            toast({
              title: "Description saved",
              description: `Your description for ${currentSkill} has been saved`,
              variant: "default"
            });
          }
        }}
      />
    </>
  );
}