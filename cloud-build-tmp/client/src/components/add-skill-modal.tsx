import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skill, insertSkillSchema, SkillTemplate } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

// Skill schema with validation
const skillSchema = insertSkillSchema.extend({
  changeNote: z.string().optional().default(""),
  // Ensure these fields are properly handled for empty values
  certification: z.string().optional().default(""),
  credlyLink: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  // Ensure level always has a valid value and never empty string
  level: z.enum(["beginner", "intermediate", "expert"]).default("beginner"),
});

type SkillFormValues = z.infer<typeof skillSchema>;

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillId: number | null;
}

export default function AddSkillModal({ isOpen, onClose, skillId }: AddSkillModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [certificationSuggestions, setCertificationSuggestions] = useState<string[]>([]);
  
  // Common skill categories
  const commonCategories = [
    "Programming", "Database", "Cloud", "DevOps", "Design", 
    "Project Management", "Security", "AI/ML", "Mobile Development", "Testing"
  ];
  
  // Common programming skills
  const commonSkills = [
    "JavaScript", "Python", "Java", "C#", "TypeScript", "React", "Angular", "Vue.js",
    "Node.js", "Express.js", "MongoDB", "PostgreSQL", "SQL", "AWS", "Azure", "Docker",
    "Kubernetes", "Git", "CI/CD", "RESTful API", "GraphQL", "TDD", "Agile", "Scrum"
  ];
  
  // Common certifications
  const commonCertifications = [
    "AWS Certified Solutions Architect", "Microsoft Certified: Azure Developer",
    "Google Cloud Professional Cloud Architect", "Certified Kubernetes Administrator",
    "Certified Scrum Master", "MCSA: SQL Database Development", "CompTIA Security+",
    "CISSP", "PMP", "ITIL Foundation", "Cisco CCNA", "Oracle Certified Professional"
  ];
  
  // Get existing skill if editing
  const { data: skill, isLoading: isLoadingSkill } = useQuery<Skill>({
    queryKey: skillId ? [`/api/skills/${skillId}`] : ['no-skill'],
    enabled: !!skillId
  });
  
  // Get all user skills for suggestions
  const { data: skills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  
  // Get skill templates from public endpoint
  const { data: skillTemplates = [] } = useQuery<SkillTemplate[]>({
    queryKey: ["/api/skill-templates"],
  });
  
  // Populate suggestions based on existing skills
  useEffect(() => {
    if (skills && skills.length > 0) {
      const names = Array.from(new Set(skills.map(s => s.name)));
      const categories = Array.from(new Set(skills.map(s => s.category)));
      const certifications = skills
        .filter(s => s.certification)
        .map(s => s.certification as string);
      
      setSkillSuggestions([...commonSkills, ...names].filter((v, i, a) => a.indexOf(v) === i));
      setCategorySuggestions([...commonCategories, ...categories].filter((v, i, a) => a.indexOf(v) === i));
      setCertificationSuggestions([...commonCertifications, ...certifications].filter((v, i, a) => a.indexOf(v) === i));
    } else {
      setSkillSuggestions(commonSkills);
      setCategorySuggestions(commonCategories);
      setCertificationSuggestions(commonCertifications);
    }
  }, [skills]);
  
  // Form setup
  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      userId: user?.id || 0, // Ensure there's always a valid user ID (will be replaced on submit if needed)
      name: "",
      category: "",
      level: "beginner", // Always set a default value
      certification: "",
      credlyLink: "",
      notes: "",
      changeNote: "",
    },
    mode: "onChange" // Validate on change for better UX
  });
  
  // Update form values when editing a skill
  // Form reset logic that ensures we never have undefined or null values
  useEffect(() => {
    // Set a stable default value with proper typing
    const defaultValues: SkillFormValues = {
      userId: user?.id || 0, // Ensure there's always a valid user ID
      name: "",
      category: "",
      level: "beginner", // Default value for new skills
      certification: "",
      credlyLink: "",
      notes: "",
      changeNote: "",
    };

    if (skill && skillId) {
      // When editing an existing skill, overwrite defaults with skill values
      // Ensure we always have a valid level value
      const skillLevel = ["beginner", "intermediate", "expert"].includes(skill.level) 
        ? skill.level as "beginner" | "intermediate" | "expert"
        : "beginner";
        
      form.reset({
        ...defaultValues,
        name: skill.name || "", // Ensure string values are never null/undefined
        category: skill.category || "",
        level: skillLevel,
        certification: skill.certification || "",
        credlyLink: skill.credlyLink || "",
        notes: skill.notes || "",
      });
    } else {
      // When adding a new skill
      form.reset(defaultValues);
    }
  }, [skill, skillId, isOpen, user, form]);
  
  // Add skill mutation - Submit to pending approval
  const addSkillMutation = useMutation({
    mutationFn: async (data: SkillFormValues) => {
      // Changed to use the pending skills endpoint that requires admin approval
      const res = await apiRequest("POST", "/api/skills/pending", {
        ...data,
        status: "pending",
        is_update: false,
        submitted_at: new Date().toISOString()
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/pending-skills"] });
      
      toast({
        title: "Skill Submitted",
        description: `${form.getValues("name")} has been submitted for approval. You'll be notified once it's approved.`,
      });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error Submitting Skill",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update skill mutation
  const updateSkillMutation = useMutation({
    mutationFn: async (data: SkillFormValues) => {
      const { userId, changeNote, ...updateData } = data;
      
      // Submit updates to pending skills endpoint instead of directly updating
      const res = await apiRequest("POST", "/api/skills/pending", {
        ...updateData,
        skillId: skillId, // Reference to existing skill
        status: "pending",
        is_update: true, // Mark as an update, not a new skill
        submitted_at: new Date().toISOString(),
        notes: changeNote || `Updated ${data.name}` // Store change notes in the notes field
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: [`/api/skills/${skillId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/skills/${skillId}/history`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/pending-skills"] });
      
      toast({
        title: "Update Submitted",
        description: `Your changes to ${form.getValues("name")} have been submitted for approval.`,
      });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error Submitting Update",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Form submission
  const onSubmit = (data: SkillFormValues) => {
    if (skillId) {
      updateSkillMutation.mutate(data);
    } else {
      addSkillMutation.mutate(data);
    }
  };
  
  // Filter suggestions based on input
  const filterSuggestions = (input: string, suggestions: string[]) => {
    if (!input) return [];
    const lowerInput = input.toLowerCase();
    return suggestions
      .filter(s => s.toLowerCase().includes(lowerInput))
      .slice(0, 5);
  };
  
  // Handle showing suggestions
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showCertificationSuggestions, setShowCertificationSuggestions] = useState(false);
  
  // Filtered suggestions
  const filteredNameSuggestions = filterSuggestions(form.watch("name"), skillSuggestions);
  const filteredCategorySuggestions = filterSuggestions(form.watch("category"), categorySuggestions);
  const filteredCertificationSuggestions = filterSuggestions(form.watch("certification") || "", certificationSuggestions);
  
  const isLoading = addSkillMutation.isPending || updateSkillMutation.isPending || isLoadingSkill;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg scrollable-dialog">
        <DialogHeader>
          <DialogTitle>{skillId ? "Edit Skill" : "Add New Skill"}</DialogTitle>
        </DialogHeader>
        
        {isLoadingSkill ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Skill Templates - only shown when adding a new skill */}
              {!skillId && (
                <div className="mb-6">
                  <h3 className="text-base font-medium mb-2">Select from Template</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    Choose a recommended skill template or create your own
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {skillTemplates.map((template: SkillTemplate) => (
                      <div 
                        key={template.id}
                        className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          // Pre-fill form with template values
                          form.setValue('name', template.name);
                          form.setValue('category', template.category || '');
                          if (template.targetLevel) {
                            form.setValue('level', 
                              (template.targetLevel as "beginner" | "intermediate" | "expert") || 'beginner');
                          }
                          form.setValue('notes', template.description || '');
                          
                          // Show toast
                          toast({
                            title: "Template Applied",
                            description: `Applied "${template.name}" template to this skill`
                          });
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">{template.name}</span>
                            <p className="text-xs text-gray-500">{template.category}</p>
                          </div>
                          {template.isRecommended && (
                            <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                              Recommended
                            </div>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
                        )}
                        {template.targetLevel && (
                          <div className="mt-2 flex items-center">
                            <span className="text-xs text-gray-500 mr-2">Target Level:</span>
                            <div className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                              template.targetLevel === 'beginner' ? 'bg-blue-100 text-blue-800' :
                              template.targetLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {template.targetLevel.charAt(0).toUpperCase() + template.targetLevel.slice(1)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t my-4 pt-4">
                    <p className="text-sm font-medium">Or create your own skill below</p>
                  </div>
                </div>
              )}
            
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Name</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="e.g. JavaScript, Python, AWS"
                          {...field}
                          onFocus={() => setShowNameSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
                        />
                      </FormControl>
                      
                      {/* Skill name suggestions */}
                      {showNameSuggestions && filteredNameSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full bg-white shadow-lg rounded-md mt-1 border border-gray-200">
                          <ul className="py-1 text-sm text-gray-700 max-h-40 overflow-y-auto">
                            {filteredNameSuggestions.map((suggestion, index) => (
                              <li
                                key={index}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => form.setValue("name", suggestion)}
                              >
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="e.g. Programming, Database"
                            {...field}
                            onFocus={() => setShowCategorySuggestions(true)}
                            onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                          />
                        </FormControl>
                        
                        {/* Category suggestions */}
                        {showCategorySuggestions && filteredCategorySuggestions.length > 0 && (
                          <div className="absolute z-10 w-full bg-white shadow-lg rounded-md mt-1 border border-gray-200">
                            <ul className="py-1 text-sm text-gray-700 max-h-40 overflow-y-auto">
                              {filteredCategorySuggestions.map((suggestion, index) => (
                                <li
                                  key={index}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => form.setValue("category", suggestion)}
                                >
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proficiency Level</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue="beginner"
                        value={field.value}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="certification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification (if any)</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="e.g. AWS Certified Developer"
                          {...field}
                          value={field.value || ""}
                          onFocus={() => setShowCertificationSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowCertificationSuggestions(false), 200)}
                        />
                      </FormControl>
                      
                      {/* Certification suggestions */}
                      {showCertificationSuggestions && filteredCertificationSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full bg-white shadow-lg rounded-md mt-1 border border-gray-200">
                          <ul className="py-1 text-sm text-gray-700 max-h-40 overflow-y-auto">
                            {filteredCertificationSuggestions.map((suggestion, index) => (
                              <li
                                key={index}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => form.setValue("certification", suggestion)}
                              >
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="credlyLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credly Link (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://www.credly.com/badges/..." 
                        {...field}
                        value={field.value || ""} 
                      />
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
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional details about your skill level, experience, etc."
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {skillId && skill && (
                <FormField
                  control={form.control}
                  name="changeNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Change Note (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Reason for updating this skill"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {skillId ? "Update Skill" : "Add Skill"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
