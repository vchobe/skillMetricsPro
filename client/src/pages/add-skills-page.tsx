import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Skill, insertSkillSchema, PendingSkillUpdate, SkillTemplate } from "@shared/schema";
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
import { FormLabel } from "@/components/ui/form";
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
  const [skillsList, setSkillsList] = useState<SkillEntry[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Record<string, boolean>>({});
  
  // Tab visit tracking
  const [visitedTabs, setVisitedTabs] = useState({
    technical: false,
    functional: false,
    other: false,
    // Technical sub-tabs
    programming: false,
    frontend: false,
    // Functional sub-tabs
    marketing: false,
    design: false,
    communication: false, 
    project: false,
    leadership: false,
    database: false,
    data: false, 
    cloud: false,
    devops: false
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

  // Process all skills when loaded
  useEffect(() => {
    if (allSkills.length > 0) {
      // Debug: Log unique categories to help with mapping
      const categories = new Set(allSkills.map(s => s.category));
      console.log("Available categories from all skills:", Array.from(categories));
      
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
        level: "beginner",
        certification: "",
        credlyLink: "",
        notes: "",
        changeNote: "",
        selected: false,
        certificationDate: undefined,
        expirationDate: undefined
      }));
      
      setSkillsList(entries);
    }
  }, [allSkills, user]);
  
  // On component mount, initialize with all tabs NOT visited
  // We're removing the auto-marking of tabs as visited to make users visit each tab
  useEffect(() => {
    console.log("Initializing tab visit state to empty (no tabs visited)");
    // Tabs will start with no visits and users will need to click on each tab
    // The visitedTabs state is already initialized with all values as false
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

  // Technical skill categories
  const technicalCategories = ["Programming", "UI", "Database", "Cloud", "Data Science", "DevOps"];
  
  // Functional skill categories
  const functionalCategories = ["Marketing", "Design", "Communication", "Project Management", "Leadership"];
  
  // Filter skills by category
  const getFilteredSkills = () => {
    if (activeTab === "technical") {
      // Filter for skills in the technical categories
      return skillsList.filter(skill => technicalCategories.includes(skill.category));
    } else if (activeTab === "functional") {
      // Filter for skills in the functional categories
      return skillsList.filter(skill => functionalCategories.includes(skill.category));
    }
    return [];
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
    setVisitedTabs(prev => {
      const newState = {
        ...prev,
        [tab]: true
      };
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
                        defaultValue="programming"
                        onValueChange={(value) => markTabVisited(value)}
                      >
                        <TabsList className="mb-4">
                          <TabsTrigger value="programming">
                            <Code className="h-4 w-4 mr-1" />
                            Programming
                            {visitedTabs.programming && <Check className="h-3 w-3 ml-1 text-green-500" />}
                          </TabsTrigger>
                          <TabsTrigger value="frontend">
                            <LayoutDashboard className="h-4 w-4 mr-1" />
                            UI/Front End
                            {visitedTabs.frontend && <Check className="h-3 w-3 ml-1 text-green-500" />}
                          </TabsTrigger>
                          <TabsTrigger value="database">
                            <Database className="h-4 w-4 mr-1" />
                            Database
                            {visitedTabs.database && <Check className="h-3 w-3 ml-1 text-green-500" />}
                          </TabsTrigger>
                          <TabsTrigger value="data">
                            <BarChart2 className="h-4 w-4 mr-1" />
                            Data
                            {visitedTabs.data && <Check className="h-3 w-3 ml-1 text-green-500" />}
                          </TabsTrigger>
                          <TabsTrigger value="cloud">
                            <Cloud className="h-4 w-4 mr-1" />
                            Cloud
                            {visitedTabs.cloud && <Check className="h-3 w-3 ml-1 text-green-500" />}
                          </TabsTrigger>
                          <TabsTrigger value="devops">
                            <GitBranch className="h-4 w-4 mr-1" />
                            DevOps
                            {visitedTabs.devops && <Check className="h-3 w-3 ml-1 text-green-500" />}
                          </TabsTrigger>
                        </TabsList>
                        
                        {/* Programming Tab */}
                        <TabsContent value="programming">
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
                                {filteredSkills.filter(skill => skill.category === "Programming").length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                      No skills found in this category
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredSkills.filter(skill => skill.category === "Programming").map((skill, index) => {
                                    const isAlreadyAdded = isSkillAlreadyAdded(skill.name);
                                    const isSelected = selectedSkills[skill.name] || false;
                                    
                                    return (
                                      <TableRow key={index}>
                                        <TableCell>
                                          <Checkbox 
                                            checked={isSelected}
                                            disabled={isAlreadyAdded}
                                            onCheckedChange={(checked) => {
                                              handleSkillSelection(skill.name, checked === true);
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {skill.name}
                                          {isAlreadyAdded && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                              <Check className="h-3 w-3" />
                                              <span>Already added</span>
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Select 
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.level}
                                            onValueChange={(value) => handleLevelChange(skill.name, value)}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Select level" />
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
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.certification}
                                            onChange={(e) => handleCertificationChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input 
                                            placeholder="Certification link"
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.credlyLink}
                                            onChange={(e) => handleCertificationLinkChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        
                        {/* Frontend Tab */}
                        <TabsContent value="frontend">
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
                                {filteredSkills.filter(skill => skill.category === "UI").length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                      No skills found in this category
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredSkills.filter(skill => skill.category === "UI").map((skill, index) => {
                                    const isAlreadyAdded = isSkillAlreadyAdded(skill.name);
                                    const isSelected = selectedSkills[skill.name] || false;
                                    
                                    return (
                                      <TableRow key={index}>
                                        <TableCell>
                                          <Checkbox 
                                            checked={isSelected}
                                            disabled={isAlreadyAdded}
                                            onCheckedChange={(checked) => {
                                              handleSkillSelection(skill.name, checked === true);
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {skill.name}
                                          {isAlreadyAdded && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                              <Check className="h-3 w-3" />
                                              <span>Already added</span>
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Select 
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.level}
                                            onValueChange={(value) => handleLevelChange(skill.name, value)}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Select level" />
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
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.certification}
                                            onChange={(e) => handleCertificationChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input 
                                            placeholder="Certification link"
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.credlyLink}
                                            onChange={(e) => handleCertificationLinkChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        
                        {/* Database Tab */}
                        <TabsContent value="database">
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
                                {filteredSkills.filter(skill => skill.category === "Database").length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                      No skills found in this category
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredSkills.filter(skill => skill.category === "Database").map((skill, index) => {
                                    const isAlreadyAdded = isSkillAlreadyAdded(skill.name);
                                    const isSelected = selectedSkills[skill.name] || false;
                                    
                                    return (
                                      <TableRow key={index}>
                                        <TableCell>
                                          <Checkbox 
                                            checked={isSelected}
                                            disabled={isAlreadyAdded}
                                            onCheckedChange={(checked) => {
                                              handleSkillSelection(skill.name, checked === true);
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {skill.name}
                                          {isAlreadyAdded && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                              <Check className="h-3 w-3" />
                                              <span>Already added</span>
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Select 
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.level}
                                            onValueChange={(value) => handleLevelChange(skill.name, value)}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Select level" />
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
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.certification}
                                            onChange={(e) => handleCertificationChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input 
                                            placeholder="Certification link"
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.credlyLink}
                                            onChange={(e) => handleCertificationLinkChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        
                        {/* Data Tab */}
                        <TabsContent value="data">
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
                                {filteredSkills.filter(skill => skill.category === "Data Science").length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                      No skills found in this category
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredSkills.filter(skill => skill.category === "Data Science").map((skill, index) => {
                                    const isAlreadyAdded = isSkillAlreadyAdded(skill.name);
                                    const isSelected = selectedSkills[skill.name] || false;
                                    
                                    return (
                                      <TableRow key={index}>
                                        <TableCell>
                                          <Checkbox 
                                            checked={isSelected}
                                            disabled={isAlreadyAdded}
                                            onCheckedChange={(checked) => {
                                              handleSkillSelection(skill.name, checked === true);
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {skill.name}
                                          {isAlreadyAdded && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                              <Check className="h-3 w-3" />
                                              <span>Already added</span>
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Select 
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.level}
                                            onValueChange={(value) => handleLevelChange(skill.name, value)}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Select level" />
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
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.certification}
                                            onChange={(e) => handleCertificationChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input 
                                            placeholder="Certification link"
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.credlyLink}
                                            onChange={(e) => handleCertificationLinkChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        
                        {/* Cloud Tab */}
                        <TabsContent value="cloud">
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
                                {filteredSkills.filter(skill => skill.category === "Cloud").length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                      No skills found in this category
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredSkills.filter(skill => skill.category === "Cloud").map((skill, index) => {
                                    const isAlreadyAdded = isSkillAlreadyAdded(skill.name);
                                    const isSelected = selectedSkills[skill.name] || false;
                                    
                                    return (
                                      <TableRow key={index}>
                                        <TableCell>
                                          <Checkbox 
                                            checked={isSelected}
                                            disabled={isAlreadyAdded}
                                            onCheckedChange={(checked) => {
                                              handleSkillSelection(skill.name, checked === true);
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {skill.name}
                                          {isAlreadyAdded && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                              <Check className="h-3 w-3" />
                                              <span>Already added</span>
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Select 
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.level}
                                            onValueChange={(value) => handleLevelChange(skill.name, value)}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Select level" />
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
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.certification}
                                            onChange={(e) => handleCertificationChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input 
                                            placeholder="Certification link"
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.credlyLink}
                                            onChange={(e) => handleCertificationLinkChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        
                        {/* DevOps Tab */}
                        <TabsContent value="devops">
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
                                {filteredSkills.filter(skill => skill.category === "DevOps").length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                      No skills found in this category
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredSkills.filter(skill => skill.category === "DevOps").map((skill, index) => {
                                    const isAlreadyAdded = isSkillAlreadyAdded(skill.name);
                                    const isSelected = selectedSkills[skill.name] || false;
                                    
                                    return (
                                      <TableRow key={index}>
                                        <TableCell>
                                          <Checkbox 
                                            checked={isSelected}
                                            disabled={isAlreadyAdded}
                                            onCheckedChange={(checked) => {
                                              handleSkillSelection(skill.name, checked === true);
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {skill.name}
                                          {isAlreadyAdded && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                              <Check className="h-3 w-3" />
                                              <span>Already added</span>
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Select 
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.level}
                                            onValueChange={(value) => handleLevelChange(skill.name, value)}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Select level" />
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
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.certification}
                                            onChange={(e) => handleCertificationChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input 
                                            placeholder="Certification link"
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.credlyLink}
                                            onChange={(e) => handleCertificationLinkChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Functional Tab Content */}
                <TabsContent value="functional">
                  <div className="mt-4">
                    <div className="mb-6">
                      <Tabs 
                        defaultValue="marketing"
                        onValueChange={(value) => markTabVisited(value)}
                      >
                        <TabsList className="mb-4">
                          <TabsTrigger value="marketing">
                            <PieChart className="h-4 w-4 mr-1" />
                            Marketing
                            {visitedTabs.marketing && <Check className="h-3 w-3 ml-1 text-green-500" />}
                          </TabsTrigger>
                          <TabsTrigger value="design">
                            <Paintbrush className="h-4 w-4 mr-1" />
                            Design
                            {visitedTabs.design && <Check className="h-3 w-3 ml-1 text-green-500" />}
                          </TabsTrigger>
                          <TabsTrigger value="communication">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Communication
                            {visitedTabs.communication && <Check className="h-3 w-3 ml-1 text-green-500" />}
                          </TabsTrigger>
                          <TabsTrigger value="project">
                            <Server className="h-4 w-4 mr-1" />
                            Project Management
                            {visitedTabs.project && <Check className="h-3 w-3 ml-1 text-green-500" />}
                          </TabsTrigger>
                          <TabsTrigger value="leadership">
                            <Users className="h-4 w-4 mr-1" />
                            Leadership
                            {visitedTabs.leadership && <Check className="h-3 w-3 ml-1 text-green-500" />}
                          </TabsTrigger>
                        </TabsList>
                        
                        {/* Marketing Tab */}
                        <TabsContent value="marketing">
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
                                {filteredSkills.filter(skill => skill.category === "Marketing").length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                      No skills found in this category
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredSkills.filter(skill => skill.category === "Marketing").map((skill, index) => {
                                    const isAlreadyAdded = isSkillAlreadyAdded(skill.name);
                                    const isSelected = selectedSkills[skill.name] || false;
                                    
                                    return (
                                      <TableRow key={index}>
                                        <TableCell>
                                          <Checkbox 
                                            checked={isSelected}
                                            disabled={isAlreadyAdded}
                                            onCheckedChange={(checked) => {
                                              handleSkillSelection(skill.name, checked === true);
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {skill.name}
                                          {isAlreadyAdded && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                              <Check className="h-3 w-3" />
                                              <span>Already added</span>
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Select 
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.level}
                                            onValueChange={(value) => handleLevelChange(skill.name, value)}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Select level" />
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
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.certification}
                                            onChange={(e) => handleCertificationChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input 
                                            placeholder="Certification link"
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.credlyLink}
                                            onChange={(e) => handleCertificationLinkChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        
                        {/* Design Tab */}
                        <TabsContent value="design">
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
                                {filteredSkills.filter(skill => skill.category === "Design").length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                      No skills found in this category
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredSkills.filter(skill => skill.category === "Design").map((skill, index) => {
                                    const isAlreadyAdded = isSkillAlreadyAdded(skill.name);
                                    const isSelected = selectedSkills[skill.name] || false;
                                    
                                    return (
                                      <TableRow key={index}>
                                        <TableCell>
                                          <Checkbox 
                                            checked={isSelected}
                                            disabled={isAlreadyAdded}
                                            onCheckedChange={(checked) => {
                                              handleSkillSelection(skill.name, checked === true);
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {skill.name}
                                          {isAlreadyAdded && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                              <Check className="h-3 w-3" />
                                              <span>Already added</span>
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Select 
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.level}
                                            onValueChange={(value) => handleLevelChange(skill.name, value)}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Select level" />
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
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.certification}
                                            onChange={(e) => handleCertificationChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input 
                                            placeholder="Certification link"
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.credlyLink}
                                            onChange={(e) => handleCertificationLinkChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        
                        {/* Communication Tab */}
                        <TabsContent value="communication">
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
                                {filteredSkills.filter(skill => skill.category === "Communication").length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                      No skills found in this category
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredSkills.filter(skill => skill.category === "Communication").map((skill, index) => {
                                    const isAlreadyAdded = isSkillAlreadyAdded(skill.name);
                                    const isSelected = selectedSkills[skill.name] || false;
                                    
                                    return (
                                      <TableRow key={index}>
                                        <TableCell>
                                          <Checkbox 
                                            checked={isSelected}
                                            disabled={isAlreadyAdded}
                                            onCheckedChange={(checked) => {
                                              handleSkillSelection(skill.name, checked === true);
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {skill.name}
                                          {isAlreadyAdded && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                              <Check className="h-3 w-3" />
                                              <span>Already added</span>
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Select 
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.level}
                                            onValueChange={(value) => handleLevelChange(skill.name, value)}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Select level" />
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
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.certification}
                                            onChange={(e) => handleCertificationChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input 
                                            placeholder="Certification link"
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.credlyLink}
                                            onChange={(e) => handleCertificationLinkChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        
                        {/* Project Management Tab */}
                        <TabsContent value="project">
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
                                {filteredSkills.filter(skill => skill.category === "Project Management").length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                      No skills found in this category
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredSkills.filter(skill => skill.category === "Project Management").map((skill, index) => {
                                    const isAlreadyAdded = isSkillAlreadyAdded(skill.name);
                                    const isSelected = selectedSkills[skill.name] || false;
                                    
                                    return (
                                      <TableRow key={index}>
                                        <TableCell>
                                          <Checkbox 
                                            checked={isSelected}
                                            disabled={isAlreadyAdded}
                                            onCheckedChange={(checked) => {
                                              handleSkillSelection(skill.name, checked === true);
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {skill.name}
                                          {isAlreadyAdded && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                              <Check className="h-3 w-3" />
                                              <span>Already added</span>
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Select 
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.level}
                                            onValueChange={(value) => handleLevelChange(skill.name, value)}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Select level" />
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
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.certification}
                                            onChange={(e) => handleCertificationChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input 
                                            placeholder="Certification link"
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.credlyLink}
                                            onChange={(e) => handleCertificationLinkChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        
                        {/* Leadership Tab */}
                        <TabsContent value="leadership">
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
                                {filteredSkills.filter(skill => skill.category === "Leadership").length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                      No skills found in this category
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredSkills.filter(skill => skill.category === "Leadership").map((skill, index) => {
                                    const isAlreadyAdded = isSkillAlreadyAdded(skill.name);
                                    const isSelected = selectedSkills[skill.name] || false;
                                    
                                    return (
                                      <TableRow key={index}>
                                        <TableCell>
                                          <Checkbox 
                                            checked={isSelected}
                                            disabled={isAlreadyAdded}
                                            onCheckedChange={(checked) => {
                                              handleSkillSelection(skill.name, checked === true);
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {skill.name}
                                          {isAlreadyAdded && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                              <Check className="h-3 w-3" />
                                              <span>Already added</span>
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Select 
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.level}
                                            onValueChange={(value) => handleLevelChange(skill.name, value)}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Select level" />
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
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.certification}
                                            onChange={(e) => handleCertificationChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input 
                                            placeholder="Certification link"
                                            disabled={!isSelected || isAlreadyAdded}
                                            value={skill.credlyLink}
                                            onChange={(e) => handleCertificationLinkChange(skill.name, e.target.value)}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Other Tab Content */}
                <TabsContent value="other">
                  <div className="mt-4">
                    <Card className="mb-4">
                      <CardHeader>
                        <CardTitle>Custom Skills</CardTitle>
                        <CardDescription>
                          Add skills that are not available in the predefined categories
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-[500px] overflow-y-auto p-4 border rounded-md">
                          <div className="flex flex-col gap-4">
                            {/* Custom skill form fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="customSkillName" className="text-sm font-medium">Skill Name</label>
                                <Input
                                  id="customSkillName"
                                  placeholder="Enter skill name"
                                  className="mt-1"
                                  value={customSkill?.name || ""}
                                  onChange={(e) => setCustomSkill(prev => ({ ...prev, name: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label htmlFor="customSkillCategory" className="text-sm font-medium">Category</label>
                                <Select 
                                  value={customSkill?.category || ""} 
                                  onValueChange={(value) => setCustomSkill(prev => ({ ...prev, category: value }))}
                                >
                                  <SelectTrigger id="customSkillCategory" className="mt-1">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Programming">Programming</SelectItem>
                                    <SelectItem value="UI">UI/Front End</SelectItem>
                                    <SelectItem value="Database">Database</SelectItem>
                                    <SelectItem value="Cloud">Cloud</SelectItem>
                                    <SelectItem value="Data Science">Data Science</SelectItem>
                                    <SelectItem value="DevOps">DevOps</SelectItem>
                                    <SelectItem value="Security">Security</SelectItem>
                                    <SelectItem value="Marketing">Marketing</SelectItem>
                                    <SelectItem value="Design">Design</SelectItem>
                                    <SelectItem value="Communication">Communication</SelectItem>
                                    <SelectItem value="Project Management">Project Management</SelectItem>
                                    <SelectItem value="Leadership">Leadership</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <label htmlFor="customSkillLevel" className="text-sm font-medium">Skill Level</label>
                              <Select 
                                value={customSkill?.level || "beginner"}
                                onValueChange={(value) => setCustomSkill(prev => ({ ...prev, level: value as "beginner" | "intermediate" | "expert" }))}
                              >
                                <SelectTrigger id="customSkillLevel" className="mt-1">
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
                              <label htmlFor="customCertification" className="text-sm font-medium">Certification (Optional)</label>
                              <Input
                                id="customCertification"
                                placeholder="Certification name"
                                className="mt-1"
                                value={customSkill?.certification || ""}
                                onChange={(e) => setCustomSkill(prev => ({ ...prev, certification: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label htmlFor="customCertLink" className="text-sm font-medium">Certification Link (Optional)</label>
                              <Input
                                id="customCertLink"
                                placeholder="https://www.example.com/certification"
                                className="mt-1"
                                value={customSkill?.credlyLink || ""}
                                onChange={(e) => setCustomSkill(prev => ({ ...prev, credlyLink: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label htmlFor="customNotes" className="text-sm font-medium">Notes (Optional)</label>
                              <Textarea
                                id="customNotes"
                                placeholder="Additional notes about this skill"
                                className="mt-1"
                                value={customSkill?.notes || ""}
                                onChange={(e) => setCustomSkill(prev => ({ ...prev, notes: e.target.value }))}
                              />
                            </div>
                            
                            <Button 
                              className="w-full mt-4" 
                              onClick={handleSubmitCustomSkill}
                              disabled={!customSkill?.name || !customSkill?.category || customSubmitMutation.isPending}
                            >
                              {customSubmitMutation.isPending ? (
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-20 border-t-white"></div>
                              ) : (
                                <Plus className="h-4 w-4 mr-2" />
                              )}
                              Submit Custom Skill for Approval
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Submit Button - Only show when Technical or Functional tab is active */}
              {(activeTab === "technical" || activeTab === "functional") && (
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={handleSubmitSkills}
                    disabled={submitSkillsMutation.isPending || Object.keys(selectedSkills).filter(key => selectedSkills[key]).length === 0}
                    className="ml-auto"
                  >
                    {submitSkillsMutation.isPending && (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-20 border-t-white"></div>
                    )}
                    Submit Skills for Approval
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}