import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Skill, insertSkillSchema, PendingSkillUpdate, SkillTemplate } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
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
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Plus, Code, Database, Server, Brain, Cloud, Check, TestTube } from "lucide-react";

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
const TECHNICAL_CATEGORIES = [
  { id: "Programming", label: "Programming Languages", icon: <Code className="h-4 w-4" /> },
  { id: "UI", label: "Front End Technology", icon: <Code className="h-4 w-4" /> },
  { id: "Database", label: "Database", icon: <Database className="h-4 w-4" /> },
  { id: "Data", label: "Data", icon: <Database className="h-4 w-4" /> },
  { id: "AI/ML", label: "AI/ML", icon: <Brain className="h-4 w-4" /> },
  { id: "Cloud", label: "Cloud", icon: <Cloud className="h-4 w-4" /> },
  { id: "Testing", label: "Testing", icon: <TestTube className="h-4 w-4" /> },
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

  // Get all skill templates
  const { data: skillTemplates = [], isLoading: isLoadingTemplates } = useQuery<SkillTemplate[]>({
    queryKey: ["/api/skill-templates"],
  });

  // Get user skills to avoid duplicates
  const { data: userSkills = [], isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });

  // Process skill templates when loaded
  useEffect(() => {
    if (skillTemplates.length > 0) {
      // Debug: Log unique categories to help with mapping
      const categories = new Set(skillTemplates.map(t => t.category));
      console.log("Available categories:", Array.from(categories));
      
      // Convert templates to skill entries
      const entries: SkillEntry[] = skillTemplates.map(template => ({
        userId: user?.id || 0,
        name: template.name,
        category: template.category,
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
  }, [skillTemplates, user]);

  // Submit multiple skills mutation
  const submitSkillsMutation = useMutation({
    mutationFn: async (skills: SkillEntry[]) => {
      const result = await Promise.all(
        skills.map(async (skill) => {
          const res = await apiRequest("POST", "/api/skills/pending", {
            ...skill,
            status: "pending",
            is_update: false,
            submitted_at: new Date().toISOString()
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
    },
    onError: (error) => {
      toast({
        title: "Error submitting skills",
        description: error.message || "There was an error submitting your skills. Please try again.",
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

  // Filter skill templates by category
  const getFilteredSkills = () => {
    if (activeTab === "technical") {
      return skillsList.filter(skill => 
        skill.category === activeTechnicalCategory
      );
    } else if (activeTab === "functional") {
      return skillsList.filter(skill => 
        skill.category === "Functional"
      );
    }
    return [];
  };

  // Handle submission of selected skills
  const handleSubmitSkills = () => {
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
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="technical" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    <span>Technical</span>
                  </TabsTrigger>
                  <TabsTrigger value="functional" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <span>Functional</span>
                  </TabsTrigger>
                  <TabsTrigger value="other" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Other</span>
                  </TabsTrigger>
                </TabsList>
                
                {/* Technical Tab Content */}
                <TabsContent value="technical">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                    {/* Category selection sidebar */}
                    <div className="space-y-2">
                      <h3 className="font-medium mb-2">Categories</h3>
                      {TECHNICAL_CATEGORIES.map(category => (
                        <button 
                          key={category.id}
                          onClick={() => setActiveTechnicalCategory(category.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md w-full text-left transition-colors ${
                            activeTechnicalCategory === category.id 
                              ? 'bg-primary text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {category.icon}
                          <span>{category.label}</span>
                        </button>
                      ))}
                    </div>
                    
                    {/* Skills table */}
                    <div className="md:col-span-3">
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
                            {filteredSkills.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                  No skills found in this category
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredSkills.map((skill, index) => {
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
                    </div>
                  </div>
                </TabsContent>
                
                {/* Functional Tab Content */}
                <TabsContent value="functional">
                  <div className="mt-4">
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
                          {skillsList.filter(skill => 
                            skill.category === "Functional"
                          ).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                No functional skills found
                              </TableCell>
                            </TableRow>
                          ) : (
                            skillsList.filter(skill => 
                              skill.category === "Functional"
                            ).map((skill, index) => {
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
                  </div>
                </TabsContent>
                
                {/* Other Tab Content */}
                <TabsContent value="other">
                  <div className="flex flex-col items-center justify-center py-12 mt-4">
                    <p className="text-muted-foreground mb-4">
                      Need to add a skill that's not listed in the templates?
                    </p>
                    <Link href="/skills">
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>Custom Skill Form</span>
                      </Button>
                    </Link>
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