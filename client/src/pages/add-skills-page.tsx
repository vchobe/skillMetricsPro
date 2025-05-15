import { useEffect, useState } from "react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { insertUserSkillSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Check, Info, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MainLayout from "@/components/main-layout";
import { Skill, SkillTemplate } from "@shared/schema";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from 'date-fns';

// Create schema for custom skill
const skillSubmitSchema = insertUserSkillSchema
  .extend({
    // Add additional required fields 
    name: z.string().min(1, "Skill name is required"),
    category: z.string().min(1, "Category is required"),
    changeNote: z.string().optional(), // Note on why the skill was added/updated
    subcategory: z.string().optional(), // Optional subcategory
  })
  .transform(data => {
    return {
      ...data,
      changeNote: data.changeNote || "Initial skill addition",
    };
  });

type SkillEntry = z.infer<typeof skillSubmitSchema>;

// Function to get category icon
function getCategoryIcon(categoryName: string) {
  // Default is code icon
  const defaultIcon = (
    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  );

  // Define icons for specific categories
  const icons: Record<string, JSX.Element> = {
    "Programming Languages": (
      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    ),
    "Frontend": (
      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="3" y1="9" x2="21" y2="9"></line>
        <line x1="9" y1="21" x2="9" y2="9"></line>
      </svg>
    ),
    "Backend": (
      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
        <line x1="6" y1="6" x2="6.01" y2="6"></line>
        <line x1="6" y1="18" x2="6.01" y2="18"></line>
      </svg>
    ),
    "Database": (
      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
      </svg>
    ),
    "DevOps": (
      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
      </svg>
    ),
    "Cloud": (
      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
      </svg>
    ),
    "Mobile": (
      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
        <line x1="12" y1="18" x2="12.01" y2="18"></line>
      </svg>
    ),
    "UI/UX": (
      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
        <path d="M2 2l7.586 7.586"></path>
        <circle cx="11" cy="11" r="2"></circle>
      </svg>
    ),
    "Security": (
      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    ),
    "Soft Skills": (
      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    "Project Management": (
      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    ),
  };

  return icons[categoryName] || defaultIcon;
}

export default function AddSkillsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSkills, setSelectedSkills] = useState<Record<string, boolean>>({});
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customFormOpen, setCustomFormOpen] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({});
  
  // State for custom skill form
  const [customSkill, setCustomSkill] = useState<SkillEntry>({
    userId: user?.id || 0,
    name: "",
    category: "",
    description: "", // Added description field
    level: "beginner",
    certification: "",
    credlyLink: "",
    notes: "",
    changeNote: "Initial skill addition",
    selected: true,
  });

  // Initialize skillsList with empty array
  const [skillsList, setSkillsList] = useState<any[]>([]);

  // Form for custom skill
  const form = useForm<z.infer<typeof skillSubmitSchema>>({
    resolver: zodResolver(skillSubmitSchema),
    defaultValues: {
      userId: user?.id || 0,
      name: "",
      category: "",
      description: "", // Added description field
      level: "beginner",
      certification: "",
      credlyLink: "",
      notes: "",
      changeNote: "Initial skill addition",
    },
  });

  // Fetch all skill templates
  const { data: skillTemplates, isLoading: isLoadingTemplates } = useQuery<any>({
    queryKey: ["/api/skill-templates"],
    refetchOnWindowFocus: false,
  });

  // Fetch existing user skills
  const { data: userSkills, isLoading: isLoadingUserSkills } = useQuery<any>({
    queryKey: ["/api/user/skills"],
    refetchOnWindowFocus: false,
  });

  // Fetch skill categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<any>({
    queryKey: ["/api/skill-categories"],
    refetchOnWindowFocus: false,
  });

  // Mutation for submitting skills
  const submitMutation = useMutation({
    mutationFn: async (skills: any) => {
      const response = await apiRequest("POST", "/api/user/skills", skills);
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      toast({
        title: "Skills added",
        description: "Your skills have been added successfully.",
      });
      
      // Reset states
      setSelectedSkills({});
      setSkillsList([]);
      setShowSubmitButton(false);
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  // Process templates data when it loads
  useEffect(() => {
    if (skillTemplates && skillTemplates.length > 0) {
      const existingSkillIds = userSkills ? userSkills.map((s: any) => s.skillTemplateId) : [];
      
      // Mark skills as disabled if user already has them
      const processedSkills = skillTemplates.map((skill: any) => ({
        ...skill,
        disabled: existingSkillIds.includes(skill.id),
      }));
      
      setSkillsList(processedSkills);
    }
  }, [skillTemplates, userSkills]);

  // Handle checkbox change for selecting skills
  const handleCheckboxChange = (skillName: string, checked: boolean) => {
    const newSelectedSkills = { ...selectedSkills };
    
    if (checked) {
      newSelectedSkills[skillName] = true;
    } else {
      delete newSelectedSkills[skillName];
    }
    
    setSelectedSkills(newSelectedSkills);
    setShowSubmitButton(Object.keys(newSelectedSkills).length > 0);
  };

  // Handle change in skill level
  const handleLevelChange = (skillName: string, level: string) => {
    setSkillsList(prev => 
      prev.map(skill => 
        skill.name === skillName 
          ? { ...skill, level } 
          : skill
      )
    );
  };

  // Handle change in certification
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
      [tab]: true,
    }));
  };

  // Handle custom form change
  const handleCustomFormChange = (field: keyof SkillEntry, value: any) => {
    setCustomSkill(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle custom form submit
  const onSubmitCustom = (data: z.infer<typeof skillSubmitSchema>) => {
    const skillEntry = {
      ...data,
      userId: user?.id || 0,
      skillTemplateId: 0, // Custom skills don't have template IDs
      isCustom: true,
    };

    submitMutation.mutate([skillEntry]);
    setCustomFormOpen(false);
    form.reset();
  };

  // Handle submit button click
  const handleSubmit = () => {
    if (Object.keys(selectedSkills).length === 0) {
      toast({
        title: "No skills selected",
        description: "Please select at least one skill to add to your profile.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Build the array of skills to submit
    const skillsToSubmit = skillsList
      .filter(skill => selectedSkills[skill.name])
      .map(skill => ({
        userId: user?.id,
        skillTemplateId: skill.id,
        level: skill.level || "beginner",
        certification: skill.certification || "",
        credlyLink: skill.credlyLink || "",
        notes: skill.notes || "",
        description: skill.description || "", // Include description field
        changeNote: "Initial skill addition",
      }));

    // Submit the skills
    submitMutation.mutate(skillsToSubmit);
  };

  // Loading state
  if (isLoadingTemplates || isLoadingUserSkills || isLoadingCategories) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading skills...</span>
        </div>
      </MainLayout>
    );
  }

  // Group skills by category type and specific category
  const technicalCategories = categories?.filter((cat: any) => cat.categoryType === "technical") || [];
  const functionalCategories = categories?.filter((cat: any) => cat.categoryType === "functional") || [];

  // Group templates by category for each type
  const groupedTechnicalSkills: Record<string, any[]> = {};
  const groupedFunctionalSkills: Record<string, any[]> = {};

  // Helper function to check if a skill is already in the user's skills
  const isSkillInUserSkills = (skillTemplateId: number) => {
    return userSkills && userSkills.some((userSkill: any) => userSkill.skillTemplateId === skillTemplateId);
  };

  // Process technical skills
  skillsList.forEach((skill: any) => {
    const techCategory = technicalCategories.find((cat: any) => cat.name === skill.category);
    if (techCategory) {
      if (!groupedTechnicalSkills[skill.category]) {
        groupedTechnicalSkills[skill.category] = [];
      }
      groupedTechnicalSkills[skill.category].push({
        ...skill,
        disabled: isSkillInUserSkills(skill.id),
      });
    }
  });

  // Process functional skills
  skillsList.forEach((skill: any) => {
    const funcCategory = functionalCategories.find((cat: any) => cat.name === skill.category);
    if (funcCategory) {
      if (!groupedFunctionalSkills[skill.category]) {
        groupedFunctionalSkills[skill.category] = [];
      }
      groupedFunctionalSkills[skill.category].push({
        ...skill,
        disabled: isSkillInUserSkills(skill.id),
      });
    }
  });

  // Main component render
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Add Skills to Your Profile</h1>
          
          <div className="flex gap-2">
            <Dialog open={customFormOpen} onOpenChange={setCustomFormOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Add Custom Skill</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add a Custom Skill</DialogTitle>
                  <DialogDescription>
                    Enter details about a skill that is not in our catalog.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitCustom)} className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skill Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. React.js, Project Management" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((category: any) => (
                                <SelectItem key={category.id} value={category.name}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skill Level</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your proficiency level" />
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
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your experience with this skill"
                              className="h-20"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="certification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certification (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. AWS Certified Solutions Architect" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="credlyLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certification Link (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.credly.com/badges/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional information about your skill"
                              className="h-20"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setCustomFormOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        Add Skill
                      </Button>
                    </div>
                  </form>
                </Form>
                
              </DialogContent>
            </Dialog>
            
            {showSubmitButton && (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Selected Skills"
                )}
              </Button>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="technical">
          <TabsList className="mb-4">
            <TabsTrigger value="technical">Technical Skills</TabsTrigger>
            <TabsTrigger value="functional">Functional Skills</TabsTrigger>
          </TabsList>
          
          {/* Technical Skills */}
          <TabsContent value="technical">
            <Card>
              <CardHeader>
                <CardTitle>Technical Skills</CardTitle>
                <CardDescription>
                  Select technical skills to add to your profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(groupedTechnicalSkills).length > 0 ? (
                  <Tabs 
                    defaultValue={Object.keys(groupedTechnicalSkills)[0]}
                    onValueChange={(value) => markTabVisited(`technical-${value}`)}
                  >
                    <TabsList className="mb-4 flex h-auto flex-wrap">
                      {Object.keys(groupedTechnicalSkills).map((category) => {
                        const tabId = `technical-${category}`;
                        return (
                          <TabsTrigger 
                            key={category} 
                            value={category}
                            className="flex items-center"
                          >
                            {getCategoryIcon(category)}
                            {category}
                            {/* Use the same tabId for consistency */}
                            {visitedTabs[tabId as keyof typeof visitedTabs] && <Check className="h-3 w-3 ml-1 text-green-500" />}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                    {/* Dynamically generated Technical category tabs */}
                    {Object.keys(groupedTechnicalSkills).map((category) => (
                      <TabsContent key={category} value={category}>
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
                            {groupedTechnicalSkills[category].length > 0 ? (
                              groupedTechnicalSkills[category].map((skill) => {
                                const isDisabled = skill.disabled;
                                
                                return (
                                  <TableRow key={skill.name} className={isDisabled ? "opacity-50" : ""}>
                                    <TableCell>
                                      <Checkbox 
                                        checked={selectedSkills[skill.name] || false}
                                        onCheckedChange={(checked) => {
                                          if (isDisabled) return;
                                          handleCheckboxChange(skill.name, checked as boolean);
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
                                        className="w-full max-w-xs h-24"
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
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                  No skills found in this category
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-center text-muted-foreground">
                      No technical skills available. 
                      <br />
                      Consider adding a custom skill if the skill you're looking for isn't listed.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setCustomFormOpen(true)}
                    >
                      Add Custom Skill
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Functional Skills */}
          <TabsContent value="functional">
            <Card>
              <CardHeader>
                <CardTitle>Functional Skills</CardTitle>
                <CardDescription>
                  Select functional and soft skills to add to your profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(groupedFunctionalSkills).length > 0 ? (
                  <Tabs 
                    defaultValue={Object.keys(groupedFunctionalSkills)[0]}
                    onValueChange={(value) => markTabVisited(`functional-${value}`)}
                  >
                    <TabsList className="mb-4 flex h-auto flex-wrap">
                      {Object.keys(groupedFunctionalSkills).map((category) => {
                        const tabId = `functional-${category}`;
                        return (
                          <TabsTrigger 
                            key={category} 
                            value={category}
                            className="flex items-center"
                          >
                            {getCategoryIcon(category)}
                            {category}
                            {visitedTabs[tabId as keyof typeof visitedTabs] && <Check className="h-3 w-3 ml-1 text-green-500" />}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                    {/* Dynamically generated Functional category tabs */}
                    {Object.keys(groupedFunctionalSkills).map((category) => (
                      <TabsContent key={category} value={category}>
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
                            {groupedFunctionalSkills[category].length > 0 ? (
                              groupedFunctionalSkills[category].map((skill) => {
                                const isDisabled = skill.disabled;
                                
                                return (
                                  <TableRow key={skill.name} className={isDisabled ? "opacity-50" : ""}>
                                    <TableCell>
                                      <Checkbox 
                                        checked={selectedSkills[skill.name] || false}
                                        onCheckedChange={(checked) => {
                                          if (isDisabled) return;
                                          handleCheckboxChange(skill.name, checked as boolean);
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
                                        className="w-full max-w-xs h-24"
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
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                  No skills found in this category
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-center text-muted-foreground">
                      No functional skills available. 
                      <br />
                      Consider adding a custom skill if the skill you're looking for isn't listed.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setCustomFormOpen(true)}
                    >
                      Add Custom Skill
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {showSubmitButton && (
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Skills...
                </>
              ) : (
                "Add Selected Skills"
              )}
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}