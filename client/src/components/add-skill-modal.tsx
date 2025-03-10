import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skill, insertSkillSchema } from "@shared/schema";
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
      userId: user?.id,
      name: "",
      category: "",
      level: "beginner",
      certification: "",
      credlyLink: "",
      notes: "",
      changeNote: "",
    }
  });
  
  // Update form values when editing a skill
  // Form reset logic that ensures we never have undefined or null values
  useEffect(() => {
    if (skill && skillId) {
      // When editing an existing skill
      form.reset({
        userId: user?.id,
        name: skill.name || "", // Ensure string values are never null/undefined
        category: skill.category || "",
        level: skill.level || "beginner", // Always default to a valid skill level
        certification: skill.certification || "",
        credlyLink: skill.credlyLink || "",
        notes: skill.notes || "",
        changeNote: "",
      });
    } else {
      // When adding a new skill
      form.reset({
        userId: user?.id,
        name: "",
        category: "",
        level: "beginner", // Default value for new skills
        certification: "",
        credlyLink: "",
        notes: "",
        changeNote: "",
      });
    }
  }, [skill, skillId, isOpen, user, form]);
  
  // Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: async (data: SkillFormValues) => {
      const res = await apiRequest("POST", "/api/skills", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills/history"] });
      
      toast({
        title: "Skill Added",
        description: `${form.getValues("name")} has been added to your skills.`,
      });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error Adding Skill",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update skill mutation
  const updateSkillMutation = useMutation({
    mutationFn: async (data: SkillFormValues) => {
      const { userId, changeNote, ...updateData } = data;
      const res = await apiRequest("PATCH", `/api/skills/${skillId}`, {
        ...updateData,
        changeNote: changeNote || `Updated ${data.name}`
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: [`/api/skills/${skillId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/skills/${skillId}/history`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills/history"] });
      
      toast({
        title: "Skill Updated",
        description: `${form.getValues("name")} has been updated successfully.`,
      });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Skill",
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
      <DialogContent className="sm:max-w-lg">
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
                        value={field.value || "beginner"} // Ensure there's always a non-empty value
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
