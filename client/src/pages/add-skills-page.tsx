import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Skill, insertSkillSchema, PendingSkillUpdate, SkillTemplate, SkillCategory, SkillSubcategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

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
  PieChart
} from "lucide-react";

// We're extending the existing insertSkillSchema to include additional fields
const skillSubmitSchema = insertSkillSchema.extend({
  changeNote: z.string().optional().default(""),
  certification: z.string().optional().default(""),
  credlyLink: z.string().optional().default(""),
  notes: z.string().optional().default(""),
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
    level?: "beginner" | "intermediate" | "expert";
    certification?: string;
    credlyLink?: string;
    notes?: string;
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
  
  // On component mount, mark all tabs as visited to remove the navigation requirement
  useEffect(() => {
    console.log("Marking all tabs as visited to simplify workflow");
    
    // Mark all main tabs and all subtabs as visited by default
    setVisitedTabs({
      // Main tabs
      technical: true,
      functional: true,
      other: true,
      
      // All technical sub-tabs
      programming: true,
      frontend: true,
      database: true,
      data: true,
      cloud: true,
      devops: true,
      
      // All functional sub-tabs
      marketing: true,
      design: true,
      communication: true,
      project: true,
      leadership: true
    });
    
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
          const res = await apiRequest("POST", "/api/skills/pending", {
            ...skill,
            status: "pending",
            isUpdate: false,
            submittedAt: new Date().toISOString()
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
      if (!skill.name || !skill.category || !skill.level) {
        throw new Error("Please fill all required fields");
      }
      
      const skillData = {
        userId: user?.id || 0,
        name: skill.name,
        category: skill.category,
        level: skill.level,
        certification: skill.certification || "",
        credlyLink: skill.credlyLink || "",
        notes: skill.notes || "",
        changeNote: "Custom skill addition",
        status: "pending",
        isUpdate: false,
        submittedAt: new Date().toISOString()
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
      // Filter for skills in the functional categories (from database)
      return skillsList.filter(skill => functionalCategoryNames.includes(skill.category));
    } else if (activeTab === "technical") {
      // Fallback to hardcoded technical categories if database categories not yet loaded
      const fallbackTechnicalCategories = ["Programming", "UI", "Database", "Cloud", "Data Science", "DevOps"];
      return skillsList.filter(skill => fallbackTechnicalCategories.includes(skill.category));
    } else if (activeTab === "functional") {
      // Fallback to hardcoded functional categories if database categories not yet loaded
      const fallbackFunctionalCategories = ["Marketing", "Design", "Communication", "Project Management", "Leadership"];
      return skillsList.filter(skill => fallbackFunctionalCategories.includes(skill.category));
    }
    return [];
  };
  
  // Get subcategories for a specific category
  const getSubcategoriesForCategory = (categoryId: number) => {
    return skillSubcategories.filter(subcategory => subcategory.categoryId === categoryId);
  };
  
  // Get skills for a specific subcategory from templates or allSkills
  const getSkillsForSubcategory = (subcategoryId: number) => {
    // First check in templates (preferred source)
    const templatesWithSubcategory = skillTemplates.filter(
      template => template.subcategoryId === subcategoryId
    );
    
    // If we found templates with this subcategory, use those
    if (templatesWithSubcategory.length > 0) {
      console.log(`Found ${templatesWithSubcategory.length} templates for subcategory ${subcategoryId}`);
      return templatesWithSubcategory;
    }
    
    // Fallback to allSkills if no templates found
    const skillsWithSubcategory = allSkills.filter(skill => skill.subcategoryId === subcategoryId);
    console.log(`Found ${skillsWithSubcategory.length} skills for subcategory ${subcategoryId} (fallback)`);
    return skillsWithSubcategory;
  };

  // Check if all required tabs have been visited
  const allTabsVisited = () => {
    // Main tabs
    const mainTabsVisited = visitedTabs.technical && visitedTabs.functional && visitedTabs.other;
    console.log("Main tabs visited:", mainTabsVisited, {
      technical: visitedTabs.technical,
      functional: visitedTabs.functional,
      other: visitedTabs.other
    });
    
    // All technical sub-tabs must be visited
    const techSubTabsVisited = 
      visitedTabs.programming && 
      visitedTabs.frontend && 
      visitedTabs.database && 
      visitedTabs.data && 
      visitedTabs.cloud && 
      visitedTabs.devops;
    
    console.log("Tech sub-tabs visited:", techSubTabsVisited, {
      programming: visitedTabs.programming,
      frontend: visitedTabs.frontend,
      database: visitedTabs.database,
      data: visitedTabs.data,
      cloud: visitedTabs.cloud,
      devops: visitedTabs.devops
    });
    
    // All functional sub-tabs must be visited
    const functionalSubTabsVisited = 
      visitedTabs.marketing && 
      visitedTabs.design && 
      visitedTabs.communication && 
      visitedTabs.project && 
      visitedTabs.leadership;
    
    console.log("Functional sub-tabs visited:", functionalSubTabsVisited, {
      marketing: visitedTabs.marketing,
      design: visitedTabs.design,
      communication: visitedTabs.communication,
      project: visitedTabs.project,
      leadership: visitedTabs.leadership
    });
    
    const result = mainTabsVisited && techSubTabsVisited && functionalSubTabsVisited;
    console.log("All tabs visited check result:", result);
    return result;
  };
  
  // Handle submission of selected skills
  const handleSubmitSkills = () => {
    // Check if user has visited all required tabs
    if (!allTabsVisited()) {
      toast({
        title: "Please review all categories",
        description: "Please visit ALL main tabs, ALL technical sub-tabs, and ALL functional sub-tabs before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    const skillsToSubmit = skillsList.filter(skill => selectedSkills[skill.name]);
    
    if (skillsToSubmit.length === 0) {
      toast({
        title: "No skills selected",
        description: "Please select at least one skill to submit.",
        variant: "destructive",
      });
      return;
    }
    
    submitSkillsMutation.mutate(skillsToSubmit);
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

  // Handle change in certification name
  const handleCertificationChange = (skillName: string, certification: string) => {
    setSkillsList(prev => 
      prev.map(skill => 
        skill.name === skillName 
          ? { ...skill, certification } 
          : skill
      )
    );
  };

  // Handle change in certification link
  const handleCertificationLinkChange = (skillName: string, credlyLink: string) => {
    setSkillsList(prev => 
      prev.map(skill => 
        skill.name === skillName 
          ? { ...skill, credlyLink } 
          : skill
      )
    );
  };
  
  // Function to track tab visits
  const markTabVisited = (tab: string) => {
    console.log(`Marking tab visited: ${tab}`);
    
    // Map category names to their lowercase equivalent used in visitedTabs state
    const tabMappings: Record<string, string> = {
      // Main tabs
      "technical": "technical",
      "functional": "functional",
      "other": "other",
      
      // Technical categories mapped to technical sub-tabs
      "Programming": "programming",
      "Database": "database",
      "Cloud": "cloud",
      "DevOps": "devops",
      "Mobile Development": "frontend",
      "Data Science": "data",
      
      // Functional categories mapped to functional sub-tabs
      "Marketing": "marketing",
      "Design": "design",
      "Communication": "communication",
      "Project Management": "project",
      "Leadership": "leadership"
    };
    
    // Get the correct tab key to update (default to the original tab value)
    const tabKey = tabMappings[tab] || tab;
    
    setVisitedTabs(prev => {
      const newState = {
        ...prev,
        [tabKey]: true
      };
      console.log(`Updating tab state for ${tab} -> ${tabKey}`);
      console.log("Updated visitedTabs state:", newState);
      return newState;
    });
  };

  // Handle submission of custom skill
  const handleSubmitCustomSkill = () => {
    // Check if user has visited all required tabs
    if (!allTabsVisited()) {
      toast({
        title: "Please review all categories",
        description: "Please visit ALL main tabs, ALL technical sub-tabs, and ALL functional sub-tabs before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    if (!customSkill.name || !customSkill.category || !customSkill.level) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields for the custom skill.",
        variant: "destructive",
      });
      return;
    }

    const existingSkill = userSkills.find(
      skill => skill.name.toLowerCase() === customSkill.name?.toLowerCase()
    );

    if (existingSkill) {
      toast({
        title: "Skill already exists",
        description: "You already have this skill in your profile.",
        variant: "destructive",
      });
      return;
    }

    customSubmitMutation.mutate(customSkill);
  };

  // Check if a skill is already added by the user
  const isSkillAlreadyAdded = (skillName: string) => {
    return userSkills.some(skill => skill.name.toLowerCase() === skillName.toLowerCase());
  };

  const filteredSkills = getFilteredSkills();

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/skills/add" />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header 
          title="Add Skills" 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add Skills to Your Profile</CardTitle>
              <CardDescription>
                Select skills from the categories below and submit them for approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs 
                value={activeTab} 
                onValueChange={(value) => {
                  setActiveTab(value);
                  markTabVisited(value);
                  // We've removed the auto-marking of technical subtabs
                  // Users now need to visit each technical subtab individually
                }} 
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="technical" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    <span>Technical</span>
                    {visitedTabs.technical && <Check className="h-3 w-3 ml-1 text-green-500" />}
                  </TabsTrigger>
                  <TabsTrigger value="functional" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <span>Functional</span>
                    {visitedTabs.functional && <Check className="h-3 w-3 ml-1 text-green-500" />}
                  </TabsTrigger>
                  <TabsTrigger value="other" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Other</span>
                    {visitedTabs.other && <Check className="h-3 w-3 ml-1 text-green-500" />}
                  </TabsTrigger>
                </TabsList>
                
                {/* Technical Tab Content */}
                <TabsContent value="technical">
                  <div className="mt-4">
                    <div className="mb-6">
                      <Tabs 
                        value={activeTechnicalCategory}
                        defaultValue="Programming"
                        onValueChange={(value) => {
                          markTabVisited(value);
                          setActiveTechnicalCategory(value);
                        }}
                      >
                        <TabsList className="mb-4">
                          {isLoadingCategories ? (
                            <div className="flex items-center justify-center p-4">
                              <span className="animate-spin mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
                                </svg>
                              </span>
                              Loading categories...
                            </div>
                          ) : (
                            // Use categories from the database if available
                            skillCategories
                              .filter(category => category.categoryType === "technical")
                              .map(category => {
                                const tabId = category.name.toLowerCase().replace(/\s+/g, '');
                                const getCategoryIcon = (name: string) => {
                                  switch(name.toLowerCase()) {
                                    case 'programming': return <Code className="h-4 w-4 mr-1" />;
                                    case 'ui': 
                                    case 'front end': 
                                    case 'frontend': return <LayoutDashboard className="h-4 w-4 mr-1" />;
                                    case 'database': return <Database className="h-4 w-4 mr-1" />;
                                    case 'data science': 
                                    case 'data': return <BarChart2 className="h-4 w-4 mr-1" />;
                                    case 'cloud': return <Cloud className="h-4 w-4 mr-1" />;
                                    case 'devops': return <GitBranch className="h-4 w-4 mr-1" />;
                                    default: return <Code className="h-4 w-4 mr-1" />;
                                  }
                                };
                                
                                return (
                                  <TabsTrigger key={tabId} value={category.name}>
                                    {category.icon ? (
                                      <span className="mr-1">{getCategoryIcon(category.name)}</span>
                                    ) : (
                                      getCategoryIcon(category.name)
                                    )}
                                    {category.name}
                                    {visitedTabs[tabId as keyof typeof visitedTabs] && <Check className="h-3 w-3 ml-1 text-green-500" />}
                                  </TabsTrigger>
                                );
                              })
                          )}
                        </TabsList>
                        {/* Dynamically generated Technical category tabs */}
                        {skillCategories
                          .filter(category => category.categoryType === "technical")
                          .map(category => (
                            <TabsContent key={category.id} value={category.name}>
                              <div className="rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-12">Select</TableHead>
                                      <TableHead>Skill Name</TableHead>
                                      <TableHead>Level</TableHead>
                                      <TableHead>Certification</TableHead>
                                      <TableHead>Certification Link</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filteredSkills.filter(skill => skill.category === category.name).length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                          No skills found in this category.
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      /* Group skills by subcategory */
                                      getSubcategoriesForCategory(category.id).map(subcategory => {
                                        // Get the skills that belong to this subcategory (from templates or fallback to allSkills)
                                        const subcategorySkills = getSkillsForSubcategory(subcategory.id).filter(skill => 
                                          skill.categoryId === category.id
                                        );
                                        
                                        // Skip empty subcategories
                                        if (subcategorySkills.length === 0) {
                                          return null;
                                        }
                                        
                                        // Get unique skill names from this subcategory
                                        const skillNames = new Set(subcategorySkills.map(s => s.name));
                                        
                                        // Find matching skills in our filtered skills list
                                        const matchingSkills = filteredSkills.filter(skill => 
                                          skill.category === category.name && 
                                          skillNames.has(skill.name)
                                        );
                                        
                                        // Skip if no skills in this subcategory match our filtered list
                                        if (matchingSkills.length === 0) {
                                          return null;
                                        }
                                        
                                        return (
                                          <React.Fragment key={subcategory.id}>
                                            {/* Subcategory header */}
                                            <TableRow className="bg-muted/50">
                                              <TableCell colSpan={5} className="py-2">
                                                <div className="flex items-center gap-2 font-medium">
                                                  {subcategory.icon && (
                                                    <span className="text-muted-foreground">
                                                      {/* Use Lucide icon if possible */}
                                                      {subcategory.icon === 'database' ? <Database className="h-4 w-4" /> :
                                                       subcategory.icon === 'server' ? <Server className="h-4 w-4" /> :
                                                       subcategory.icon === 'cloud' ? <Cloud className="h-4 w-4" /> :
                                                       subcategory.icon === 'code' ? <Code className="h-4 w-4" /> :
                                                       subcategory.icon === 'test-tube' ? <TestTube className="h-4 w-4" /> :
                                                      <Database className="h-4 w-4" />}
                                                    </span>
                                                  )}
                                                  <span style={{ color: subcategory.color || undefined }}>{subcategory.name}</span>
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                            
                                            {/* Skills within this subcategory */}
                                            {matchingSkills.map(skill => {
                                              const isDisabled = isSkillAlreadyAdded(skill.name);
                                              
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
                                                    <div className="font-medium">{skill.name}</div>
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
                                                      placeholder="Certification name"
                                                      value={skillsList.find(s => s.name === skill.name)?.certification || ""}
                                                      onChange={(e) => handleCertificationChange(skill.name, e.target.value)}
                                                      disabled={isDisabled || !selectedSkills[skill.name]}
                                                      className="w-full max-w-xs"
                                                    />
                                                  </TableCell>
                                                  <TableCell>
                                                    <Input
                                                      placeholder="Certification link"
                                                      value={skillsList.find(s => s.name === skill.name)?.credlyLink || ""}
                                                      onChange={(e) => handleCertificationLinkChange(skill.name, e.target.value)}
                                                      disabled={isDisabled || !selectedSkills[skill.name]}
                                                      className="w-full max-w-xs"
                                                    />
                                                  </TableCell>
                                                </TableRow>
                                              );
                                            })}
                                          </React.Fragment>
                                        );
                                      })
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </TabsContent>
                          ))}
                      </Tabs>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Functional Tab Content */}
                <TabsContent value="functional">
                  <div className="mt-4">
                    <div className="mb-6">
                      <Tabs 
                        value={activeFunctionalCategory}
                        defaultValue="Design"
                        onValueChange={(value) => {
                          markTabVisited(value);
                          setActiveFunctionalCategory(value);
                        }}
                      >
                        <TabsList className="mb-4">
                          {isLoadingCategories ? (
                            <div className="flex items-center justify-center p-4">
                              <span className="animate-spin mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
                                </svg>
                              </span>
                              Loading categories...
                            </div>
                          ) : (
                            // Use categories from the database if available
                            skillCategories
                              .filter(category => category.categoryType === "functional")
                              .map(category => {
                                const tabId = category.name.toLowerCase().replace(/\s+/g, '');
                                const getCategoryIcon = (name: string) => {
                                  switch(name.toLowerCase()) {
                                    case 'design': return <Paintbrush className="h-4 w-4 mr-1" />;
                                    case 'marketing': return <PieChart className="h-4 w-4 mr-1" />;
                                    case 'communication': return <MessageSquare className="h-4 w-4 mr-1" />;
                                    case 'project management': 
                                    case 'project': return <GitBranch className="h-4 w-4 mr-1" />;
                                    case 'leadership': return <Users className="h-4 w-4 mr-1" />;
                                    default: return <Brain className="h-4 w-4 mr-1" />;
                                  }
                                };
                                
                                return (
                                  <TabsTrigger key={tabId} value={category.name}>
                                    {category.icon ? (
                                      <span className="mr-1">{getCategoryIcon(category.name)}</span>
                                    ) : (
                                      getCategoryIcon(category.name)
                                    )}
                                    {category.name}
                                    {visitedTabs[tabId as keyof typeof visitedTabs] && <Check className="h-3 w-3 ml-1 text-green-500" />}
                                  </TabsTrigger>
                                );
                              })
                          )}
                        </TabsList>
                        
                        {/* Dynamically generated Functional category tabs */}
                        {skillCategories
                          .filter(category => category.categoryType === "functional")
                          .map(category => (
                            <TabsContent key={category.id} value={category.name}>
                              <div className="rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-12">Select</TableHead>
                                      <TableHead>Skill Name</TableHead>
                                      <TableHead>Level</TableHead>
                                      <TableHead>Certification</TableHead>
                                      <TableHead>Certification Link</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filteredSkills.filter(skill => skill.category === category.name).length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                          No skills found in this category.
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      /* Group skills by subcategory */
                                      getSubcategoriesForCategory(category.id).map(subcategory => {
                                        // Get the skills that belong to this subcategory (from templates or fallback to allSkills)
                                        const subcategorySkills = getSkillsForSubcategory(subcategory.id).filter(skill => 
                                          skill.categoryId === category.id
                                        );
                                        
                                        // Skip empty subcategories
                                        if (subcategorySkills.length === 0) {
                                          return null;
                                        }
                                        
                                        // Get unique skill names from this subcategory
                                        const skillNames = new Set(subcategorySkills.map(s => s.name));
                                        
                                        // Find matching skills in our filtered skills list
                                        const matchingSkills = filteredSkills.filter(skill => 
                                          skill.category === category.name && 
                                          skillNames.has(skill.name)
                                        );
                                        
                                        // Skip if no skills in this subcategory match our filtered list
                                        if (matchingSkills.length === 0) {
                                          return null;
                                        }
                                        
                                        return (
                                          <React.Fragment key={subcategory.id}>
                                            {/* Subcategory header */}
                                            <TableRow className="bg-muted/50">
                                              <TableCell colSpan={5} className="py-2">
                                                <div className="flex items-center gap-2 font-medium">
                                                  {subcategory.icon && (
                                                    <span className="text-muted-foreground">
                                                      {/* Use Lucide icon if possible */}
                                                      {subcategory.icon === 'users' ? <Users className="h-4 w-4" /> :
                                                       subcategory.icon === 'message-square' ? <MessageSquare className="h-4 w-4" /> :
                                                       subcategory.icon === 'git-branch' ? <GitBranch className="h-4 w-4" /> :
                                                       subcategory.icon === 'paintbrush' ? <Paintbrush className="h-4 w-4" /> :
                                                       subcategory.icon === 'pie-chart' ? <PieChart className="h-4 w-4" /> :
                                                      <Brain className="h-4 w-4" />}
                                                    </span>
                                                  )}
                                                  <span style={{ color: subcategory.color || undefined }}>{subcategory.name}</span>
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                            
                                            {/* Skills within this subcategory */}
                                            {matchingSkills.map(skill => {
                                              const isDisabled = isSkillAlreadyAdded(skill.name);
                                              
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
                                                    <div className="font-medium">{skill.name}</div>
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
                                                      placeholder="Certification name"
                                                      value={skillsList.find(s => s.name === skill.name)?.certification || ""}
                                                      onChange={(e) => handleCertificationChange(skill.name, e.target.value)}
                                                      disabled={isDisabled || !selectedSkills[skill.name]}
                                                      className="w-full max-w-xs"
                                                    />
                                                  </TableCell>
                                                  <TableCell>
                                                    <Input
                                                      placeholder="Certification link"
                                                      value={skillsList.find(s => s.name === skill.name)?.credlyLink || ""}
                                                      onChange={(e) => handleCertificationLinkChange(skill.name, e.target.value)}
                                                      disabled={isDisabled || !selectedSkills[skill.name]}
                                                      className="w-full max-w-xs"
                                                    />
                                                  </TableCell>
                                                </TableRow>
                                              );
                                            })}
                                          </React.Fragment>
                                        );
                                      })
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </TabsContent>
                          ))}
                      </Tabs>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Custom Skill Tab Content */}
                <TabsContent value="other">
                  <div className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Add Custom Skill</CardTitle>
                        <CardDescription>
                          Can't find a skill you want to add? Create a custom skill here.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Using react-hook-form with shadcn Form components */}
                        {(() => {
                          // Create form inside a closure to avoid React hooks rules violation
                          const form = useForm({
                            defaultValues: {
                              name: "",
                              category: "",
                              level: "beginner" as "beginner" | "intermediate" | "expert",
                              certification: "",
                              credlyLink: "",
                              notes: ""
                            }
                          });
                          
                          const onSubmit = (data: any) => {
                            // Copy form data to customSkill before submitting
                            setCustomSkill(data);
                            handleSubmitCustomSkill();
                          };
                          
                          return (
                            <Form {...form}>
                              <form 
                                className="space-y-4" 
                                onSubmit={form.handleSubmit(onSubmit)}
                              >
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                  <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                      <FormItem className="space-y-2">
                                        <FormLabel>Skill Name *</FormLabel>
                                        <FormControl>
                                          <Input 
                                            placeholder="Enter skill name"
                                            {...field}
                                            required
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                      <FormItem className="space-y-2">
                                        <FormLabel>Category *</FormLabel>
                                        <Select 
                                          onValueChange={field.onChange} 
                                          defaultValue={field.value}
                                          required
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
                                    name="level"
                                    render={({ field }) => (
                                      <FormItem className="space-y-2">
                                        <FormLabel>Skill Level *</FormLabel>
                                        <Select 
                                          onValueChange={field.onChange} 
                                          defaultValue={field.value}
                                          required
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
                                        <FormLabel>Certification Link (Optional)</FormLabel>
                                        <FormControl>
                                          <Input 
                                            placeholder="https://..."
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
                                      <FormItem className="space-y-2 sm:col-span-2">
                                        <FormLabel>Notes (Optional)</FormLabel>
                                        <FormControl>
                                          <Textarea 
                                            placeholder="Add any additional notes about this skill..."
                                            {...field}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                
                                <div className="flex justify-end pt-4">
                                  <Button 
                                    type="submit" 
                                    disabled={customSubmitMutation.isPending}
                                  >
                                    {customSubmitMutation.isPending && (
                                      <span className="animate-spin mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <circle cx="12" cy="12" r="10"></circle>
                                          <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
                                        </svg>
                                      </span>
                                    )}
                                    Submit Custom Skill
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setLocation("/skills")}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitSkills} 
              disabled={submitSkillsMutation.isPending || Object.keys(selectedSkills).filter(name => selectedSkills[name]).length === 0}
            >
              {submitSkillsMutation.isPending && (
                <span className="animate-spin mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
                  </svg>
                </span>
              )}
              Submit Selected Skills
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}