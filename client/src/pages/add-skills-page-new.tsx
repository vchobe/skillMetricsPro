import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Skill, insertSkillSchema, PendingSkillUpdate, SkillTemplate, SkillCategory, SkillSubcategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

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
  PieChart
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
    mobile: false,
    security: false,
    
    // Functional sub-tabs
    design: false,
    marketing: false,
    project: false,
    leadership: false,
    communication: false
  });
  
  // Create a ref to store the form data for custom skill
  const [customSkill, setCustomSkill] = useState<SkillEntry>({
    userId: user?.id || 0,
    name: "",
    category: "Other",
    level: "beginner",
    certification: "",
    credlyLink: "",
    notes: "",
    description: "",
    selected: true
  });
  
  // Get user's existing skills to avoid duplicates
  const { data: existingSkills = [] } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
    enabled: !!user,
  });
  
  // Get all skill categories
  const { data: skillCategories = [] } = useQuery<SkillCategory[]>({
    queryKey: ["/api/skill-categories"],
    select: (data: SkillCategory[]) => {
      // Sort categories by name
      return data.sort((a, b) => a.name.localeCompare(b.name));
    }
  });
  
  // Get all skill subcategories
  const { data: skillSubcategories = [] } = useQuery<SkillSubcategory[]>({
    queryKey: ["/api/skill-subcategories"],
    select: (data: SkillSubcategory[]) => {
      // Sort subcategories by name
      return data.sort((a, b) => a.name.localeCompare(b.name));
    }
  });
  
  // Get all skill templates
  const { data: skillTemplates = [] } = useQuery<SkillTemplate[]>({
    queryKey: ["/api/skill-templates"],
    select: (data: SkillTemplate[]) => {
      // Sort templates by name
      return data.sort((a, b) => a.name.localeCompare(b.name));
    }
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
      console.log("Preparing skill templates for skill selection...");
    }
  }, [skillTemplates]);
  
  // Check if a skill is already added to the user's profile
  const isSkillAlreadyAdded = (skillName: string): boolean => {
    return existingSkills.some(skill => skill.name.toLowerCase() === skillName.toLowerCase());
  };
  
  // Log form submission data
  useEffect(() => {
    console.log("Form data updated:", skillsList);
  }, [skillsList]);
  
  // Filter templates by category and optionally subcategory
  const getFilteredTemplates = (categoryName: string, subcategoryName?: string): SkillTemplate[] => {
    return skillTemplates.filter(template => {
      // Base category match
      const categoryMatch = template.category === categoryName;
      
      // If subcategory is provided, match that too
      if (subcategoryName) {
        return categoryMatch && template.subcategoryName === subcategoryName;
      }
      
      return categoryMatch;
    });
  };
  
  // Get all subcategories for a specific category
  const getSubcategoriesForCategory = (categoryName: string): SkillSubcategory[] => {
    const category = skillCategories.find(c => c.name === categoryName);
    if (!category) return [];
    
    return skillSubcategories.filter(sc => sc.categoryId === category.id);
  };
  
  // Handle changing active tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Mark tab as visited
    markTabVisited(value);
  };
  
  // Handle skill selection
  const handleSkillSelection = (skillName: string, checked: boolean) => {
    const skillTemplate = skillTemplates.find(t => t.name === skillName);
    if (!skillTemplate) return;
    
    // Update selectedSkills state
    setSelectedSkills(prev => ({
      ...prev,
      [skillName]: checked
    }));
    
    // If checked, add to skillsList if not already there
    if (checked) {
      if (!skillsList.find(s => s.name === skillName)) {
        const newSkill: SkillEntry = {
          userId: user?.id || 0,
          name: skillName,
          category: skillTemplate.category,
          level: "beginner",
          certification: "",
          credlyLink: "",
          notes: "",
          description: "",
          selected: true
        };
        setSkillsList(prev => [...prev, newSkill]);
      }
    } else {
      // If unchecked, remove from skillsList
      setSkillsList(prev => prev.filter(s => s.name !== skillName));
    }
  };
  
  // Handle level change
  const handleLevelChange = (skillName: string, level: string) => {
    setSkillsList(prev => 
      prev.map(skill => 
        skill.name === skillName 
          ? { ...skill, level: level as "beginner" | "intermediate" | "expert" } 
          : skill
      )
    );
  };
  
  // Handle certification change
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
  
  // Handle change in description
  const handleDescriptionChange = (skillName: string, description: string) => {
    setSkillsList(prev => 
      prev.map(skill => 
        skill.name === skillName 
          ? { ...skill, description } 
          : skill
      )
    );
  };
  
  // Function to track tab visits
  const markTabVisited = (tab: string) => {
    console.log(`Marking tab visited: ${tab}`);
    setVisitedTabs(prev => ({
      ...prev,
      [tab]: true
    }));
  };
  
  // Get icon for category
  const getCategoryIcon = (categoryName: string) => {
    switch(categoryName.toLowerCase()) {
      case 'programming':
        return <Code className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'cloud':
        return <Cloud className="h-4 w-4" />;
      case 'devops':
        return <Server className="h-4 w-4" />;
      case 'api':
        return <GitBranch className="h-4 w-4" />;
      case 'mobile development':
        return <Smartphone className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'data science':
        return <BarChart2 className="h-4 w-4" />;
      case 'ai':
        return <Brain className="h-4 w-4" />;
      case 'ui':
        return <Layout className="h-4 w-4" />;
      case 'design':
        return <Paintbrush className="h-4 w-4" />;
      case 'marketing':
        return <PieChart className="h-4 w-4" />;
      case 'project management':
        return <LayoutDashboard className="h-4 w-4" />;
      case 'leadership':
        return <Users className="h-4 w-4" />;
      case 'communication':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Plus className="h-4 w-4" />;
    }
  };
  
  // Submit all selected skills
  const submitMutation = useMutation({
    mutationFn: async () => {
      // Filter out any skills that are not selected
      const selectedSkillsList = skillsList.filter(skill => skill.selected);
      
      if (selectedSkillsList.length === 0 && !customSkill.name) {
        throw new Error("No skills selected");
      }
      
      // If custom skill is added, include it
      const allSkills = customSkill.name 
        ? [...selectedSkillsList, customSkill]
        : selectedSkillsList;
      
      // Submit all skills at once
      const response = await apiRequest("POST", "/api/skills/bulk", allSkills);
      
      // Return the response
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Skills added successfully!",
        description: "Your new skills have been added to your profile.",
      });
      
      // Reset the form
      setSkillsList([]);
      setSelectedSkills({});
      setCustomSkill({
        userId: user?.id || 0,
        name: "",
        category: "Other",
        level: "beginner",
        certification: "",
        credlyLink: "",
        notes: "",
        description: "",
        selected: true
      });
      
      // Invalidate the skills query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      
      // Navigate back to skills page
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding skills",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Track all visited tabs
  const allTabsVisited = Object.entries(visitedTabs)
    .filter(([tabName]) => 
      // Only check main tabs
      ["technical", "functional", "other"].includes(tabName)
    )
    .every(([_, visited]) => visited);
  
  // Count selected skills
  const selectedSkillCount = Object.values(selectedSkills).filter(Boolean).length + (customSkill.name ? 1 : 0);

  return (
    <div className="flex h-screen">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto bg-background p-4">
          <div className="container mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Add Skills to Your Profile</h1>
              <p className="text-muted-foreground mt-2">
                Select skills from the database or add your own custom skills.
              </p>
              
              {selectedSkillCount > 0 && (
                <div className="bg-muted rounded-md p-4 mt-4">
                  <p className="font-medium">
                    {selectedSkillCount} skill{selectedSkillCount !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Select Skills from Database</CardTitle>
                  <CardDescription>
                    Browse through categories and select skills to add to your profile.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="technical" onValueChange={handleTabChange}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="technical">Technical Skills</TabsTrigger>
                      <TabsTrigger value="functional">Functional Skills</TabsTrigger>
                      <TabsTrigger value="other">Other / Custom Skills</TabsTrigger>
                    </TabsList>
                    
                    {/* Technical Skills Tab */}
                    <TabsContent value="technical">
                      <Tabs defaultValue={getTabKey(skillCategories.filter(c => c.categoryType === "technical")[0]?.name || "programming")}>
                        <TabsList className="mb-4 flex flex-wrap">
                          {skillCategories
                            .filter(category => category.categoryType === "technical")
                            .map(category => (
                                <TabsTrigger 
                                  key={category.name} 
                                  value={getTabKey(category.name)}
                                  onClick={() => markTabVisited(getTabKey(category.name))}
                                  className="flex items-center gap-1"
                                >
                                  {getCategoryIcon(category.name)}
                                  {category.name}
                                </TabsTrigger>
                              );
                            })
                          }
                        </TabsList>
                        {/* Dynamically generated Technical category tabs */}
                        {skillCategories
                          .filter(category => category.categoryType === "technical")
                          .map(category => (
                            <TabsContent key={category.name} value={getTabKey(category.name)}>
                              <div className="border rounded-md">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-12">Select</TableHead>
                                      <TableHead>Skill Name</TableHead>
                                      <TableHead>Level</TableHead>
                                      <TableHead>Description</TableHead>
                                      <TableHead>Certification</TableHead>
                                      <TableHead>Certification Link</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getSubcategoriesForCategory(category.name).length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4">
                                          No subcategories found for {category.name}
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      getSubcategoriesForCategory(category.name).map(subcategory => {
                                        const matchingSkills = getFilteredTemplates(category.name, subcategory.name);
                                        
                                        return (
                                          <React.Fragment key={subcategory.name}>
                                            {/* Subcategory header */}
                                            <TableRow className="bg-muted/50">
                                              <TableCell colSpan={6}>
                                                <div className="flex items-center">
                                                  {subcategory.icon && (
                                                    <span className="mr-2">
                                                      {getCategoryIcon(subcategory.icon)}
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
                                                    <Textarea
                                                      placeholder="Describe your experience with this skill..."
                                                      value={skillsList.find(s => s.name === skill.name)?.description || ""}
                                                      onChange={(e) => handleDescriptionChange(skill.name, e.target.value)}
                                                      disabled={isDisabled || !selectedSkills[skill.name]}
                                                      className="w-full h-24"
                                                    />
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
                        
                        {/* Fallback message if no categories */}
                        {skillCategories.filter(category => category.categoryType === "technical").length === 0 && (
                          <div className="text-center p-8">
                            <p>No technical skill categories found. Please contact an administrator.</p>
                          </div>
                        )}
                      </Tabs>
                    </TabsContent>
                    
                    {/* Functional Skills Tab */}
                    <TabsContent value="functional">
                      <Tabs defaultValue={getTabKey(skillCategories.filter(c => c.categoryType === "functional")[0]?.name || "design")}>
                        <TabsList className="mb-4 flex flex-wrap">
                          {skillCategories
                            .filter(category => category.categoryType === "functional")
                            .map(category => (
                                <TabsTrigger 
                                  key={category.name} 
                                  value={getTabKey(category.name)}
                                  onClick={() => markTabVisited(getTabKey(category.name))}
                                  className="flex items-center gap-1"
                                >
                                  {getCategoryIcon(category.name)}
                                  {category.name}
                                </TabsTrigger>
                              )
                            )
                          }
                        </TabsList>
                        
                        {/* Functional skill category tabs */}
                        {skillCategories
                          .filter(category => category.categoryType === "functional")
                          .map(category => (
                            <TabsContent key={category.name} value={getTabKey(category.name)}>
                              <div className="border rounded-md">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-12">Select</TableHead>
                                      <TableHead>Skill Name</TableHead>
                                      <TableHead>Level</TableHead>
                                      <TableHead>Description</TableHead>
                                      <TableHead>Certification</TableHead>
                                      <TableHead>Certification Link</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getSubcategoriesForCategory(category.name).length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4">
                                          No subcategories found for {category.name}
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      getSubcategoriesForCategory(category.name).map(subcategory => {
                                        const matchingSkills = getFilteredTemplates(category.name, subcategory.name);
                                        
                                        return (
                                          <React.Fragment key={subcategory.name}>
                                            {/* Subcategory header */}
                                            <TableRow className="bg-muted/50">
                                              <TableCell colSpan={6}>
                                                <div className="flex items-center">
                                                  {subcategory.icon && (
                                                    <span className="mr-2">
                                                      {getCategoryIcon(subcategory.icon)}
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
                                                    <Textarea
                                                      placeholder="Describe your experience with this skill..."
                                                      value={skillsList.find(s => s.name === skill.name)?.description || ""}
                                                      onChange={(e) => handleDescriptionChange(skill.name, e.target.value)}
                                                      disabled={isDisabled || !selectedSkills[skill.name]}
                                                      className="w-full h-24"
                                                    />
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
                        
                        {/* Fallback message if no categories */}
                        {skillCategories.filter(category => category.categoryType === "functional").length === 0 && (
                          <div className="text-center p-8">
                            <p>No functional skill categories found. Please contact an administrator.</p>
                          </div>
                        )}
                      </Tabs>
                    </TabsContent>
                    
                    {/* Other / Custom Skills Tab */}
                    <TabsContent value="other">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Add Custom Skill</CardTitle>
                            <CardDescription>
                              Add a skill that's not in our database
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Skill Name
                                </label>
                                <Input 
                                  placeholder="Enter skill name"
                                  value={customSkill.name}
                                  onChange={(e) => setCustomSkill({...customSkill, name: e.target.value})}
                                />
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Skill Category
                                </label>
                                <Input 
                                  placeholder="Enter category (e.g. Programming, Leadership)"
                                  value={customSkill.category}
                                  onChange={(e) => setCustomSkill({...customSkill, category: e.target.value})}
                                />
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Proficiency Level
                                </label>
                                <Select 
                                  value={customSkill.level}
                                  onValueChange={(value) => 
                                    setCustomSkill({
                                      ...customSkill, 
                                      level: value as "beginner" | "intermediate" | "expert"
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="expert">Expert</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Certification (if any)
                                </label>
                                <Input 
                                  placeholder="Certification name"
                                  value={customSkill.certification}
                                  onChange={(e) => setCustomSkill({...customSkill, certification: e.target.value})}
                                />
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium mb-1 block">
                                  Certification Link
                                </label>
                                <Input 
                                  placeholder="Link to certification"
                                  value={customSkill.credlyLink}
                                  onChange={(e) => setCustomSkill({...customSkill, credlyLink: e.target.value})}
                                />
                              </div>
                              
                              <div className="md:col-span-2">
                                <label className="text-sm font-medium mb-1 block">
                                  Skill Description
                                </label>
                                <Textarea 
                                  placeholder="Describe your experience with this skill..."
                                  value={customSkill.description}
                                  onChange={(e) => setCustomSkill({...customSkill, description: e.target.value})}
                                  className="h-24"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-8 flex justify-end space-x-4">
              <Button variant="outline" asChild>
                <Link to="/">Cancel</Link>
              </Button>
              
              <Button 
                onClick={() => submitMutation.mutate()}
                disabled={
                  submitMutation.isPending || 
                  (selectedSkillCount === 0 && !customSkill.name)
                }
              >
                {submitMutation.isPending ? (
                  <>Submitting...</>
                ) : (
                  <>Save Skills</>
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Missing imports
import { Layout, Shield, Smartphone } from "lucide-react";