import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Trash2, Edit2, Plus, Save, X, Eye, EyeOff, 
  Check, AlertTriangle, ChevronUp, ChevronDown,
  Code, Database, Server, Cpu, Activity, BarChart, 
  Shield, Globe, Zap, Cloud, Box, Terminal,
  Layers, ChevronRight
} from "lucide-react";
import { SkillCategory, SkillApprover, User, SkillSubcategory, Skill } from "@shared/schema";

// Available icons for category selection
const availableIcons = [
  { name: "code", component: <Code size={16} /> },
  { name: "database", component: <Database size={16} /> },
  { name: "server", component: <Server size={16} /> },
  { name: "cpu", component: <Cpu size={16} /> },
  { name: "activity", component: <Activity size={16} /> },
  { name: "barChart", component: <BarChart size={16} /> },
  { name: "shield", component: <Shield size={16} /> },
  { name: "globe", component: <Globe size={16} /> },
  { name: "zap", component: <Zap size={16} /> },
  { name: "cloud", component: <Cloud size={16} /> },
  { name: "box", component: <Box size={16} /> },
  { name: "terminal", component: <Terminal size={16} /> },
];

// Helper function to get icon component by name
function getIconByName(name: string) {
  const icon = availableIcons.find(i => i.name === name);
  return icon ? icon.component : <Code size={16} />;
}

// Category Edit Form Component
interface CategoryFormProps {
  category?: SkillCategory;
  onSave: (category: Partial<SkillCategory>) => void;
  onCancel: () => void;
}

function CategoryForm({ category, onSave, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [tabOrder, setTabOrder] = useState(category?.tabOrder?.toString() || "0");
  const [visibility, setVisibility] = useState<"visible" | "hidden">(category?.visibility || "visible");
  const [color, setColor] = useState(category?.color || "#3B82F6");
  const [icon, setIcon] = useState(category?.icon || "code");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      tabOrder: parseInt(tabOrder),
      visibility,
      color,
      icon
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Category Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Frontend Development"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Skills related to frontend web development"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tabOrder">Tab Order</Label>
            <Input
              id="tabOrder"
              type="number"
              value={tabOrder}
              onChange={(e) => setTabOrder(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={(value: "visible" | "hidden") => setVisibility(value)}>
              <SelectTrigger id="visibility">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex space-x-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3B82F6"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Select value={icon} onValueChange={(value) => setIcon(value)}>
              <SelectTrigger id="icon" className="flex items-center">
                <div className="mr-2">
                  {getIconByName(icon)}
                </div>
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                {availableIcons.map((icon) => (
                  <SelectItem key={icon.name} value={icon.name} className="flex items-center">
                    <div className="mr-2">{icon.component}</div>
                    <span className="capitalize">{icon.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X size={16} className="mr-2" /> Cancel
        </Button>
        <Button type="submit">
          <Save size={16} className="mr-2" /> Save Category
        </Button>
      </div>
    </form>
  );
}

// Subcategory Name Display Component
interface SubcategoryDisplayNameProps {
  subcategoryId: number;
}

function SubcategoryDisplayName({ subcategoryId }: SubcategoryDisplayNameProps) {
  const { data: subcategory, isLoading } = useQuery<SkillSubcategory>({
    queryKey: ['/api/skill-subcategories/get', subcategoryId],
    queryFn: async () => {
      const response = await fetch(`/api/skill-subcategories/${subcategoryId}`);
      if (!response.ok) return { id: subcategoryId, name: `ID: ${subcategoryId}` } as SkillSubcategory;
      return response.json();
    }
  });
  
  if (isLoading) return <>Loading...</>;
  return <>{subcategory?.name || `ID: ${subcategoryId}`}</>;
}

// Skill Name Display Component
interface SkillDisplayNameProps {
  skillId: number;
}

function SkillDisplayName({ skillId }: SkillDisplayNameProps) {
  const { data: skill, isLoading } = useQuery<Skill>({
    queryKey: ['/api/skills/get', skillId],
    queryFn: async () => {
      const response = await fetch(`/api/skills/${skillId}`);
      if (!response.ok) return { id: skillId, name: `ID: ${skillId}` } as Skill;
      return response.json();
    }
  });
  
  if (isLoading) return <>Loading...</>;
  return <>{skill?.name || `ID: ${skillId}`}</>;
}

// Subcategory Edit Form Component
interface SubcategoryFormProps {
  subcategory?: SkillSubcategory;
  onSave: (subcategory: Partial<SkillSubcategory>) => void;
  onCancel: () => void;
  categories: SkillCategory[];
  parentCategoryId?: number;
}

function SubcategoryForm({ subcategory, onSave, onCancel, categories, parentCategoryId }: SubcategoryFormProps) {
  const [name, setName] = useState(subcategory?.name || "");
  const [description, setDescription] = useState(subcategory?.description || "");
  const [categoryId, setCategoryId] = useState<number>(subcategory?.categoryId || parentCategoryId || 0);
  const [color, setColor] = useState(subcategory?.color || "#3B82F6");
  const [icon, setIcon] = useState(subcategory?.icon || "code");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      categoryId, 
      color,
      icon
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Subcategory Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="React.js"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="React.js library and ecosystem"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="categoryId">Parent Category</Label>
          <Select 
            value={categoryId.toString()} 
            onValueChange={(value) => setCategoryId(Number(value))}
            disabled={!!parentCategoryId}
          >
            <SelectTrigger id="categoryId">
              <SelectValue placeholder="Select parent category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  <div className="flex items-center">
                    <div className="mr-2">{getIconByName(category.icon || 'code')}</div>
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex space-x-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3B82F6"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Select value={icon} onValueChange={(value) => setIcon(value)}>
              <SelectTrigger id="icon" className="flex items-center">
                <div className="mr-2">
                  {getIconByName(icon)}
                </div>
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                {availableIcons.map((icon) => (
                  <SelectItem key={icon.name} value={icon.name} className="flex items-center">
                    <div className="mr-2">{icon.component}</div>
                    <span className="capitalize">{icon.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X size={16} className="mr-2" /> Cancel
        </Button>
        <Button type="submit">
          <Save size={16} className="mr-2" /> {subcategory ? 'Update' : 'Create'} Subcategory
        </Button>
      </div>
    </form>
  );
}

// Approver Form Component
interface ApproverFormProps {
  onSave: (approver: { userId: number, categoryId?: number, subcategoryId?: number, skillId?: number, canApproveAll: boolean }) => void;
  onCancel: () => void;
  categories: SkillCategory[];
}

function ApproverForm({ onSave, onCancel, categories }: ApproverFormProps) {
  const [userId, setUserId] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | 'all'>('all');
  const [subcategoryId, setSubcategoryId] = useState<number | 'all'>('all');
  const [skillId, setSkillId] = useState<number | 'all'>('all');
  const [canApproveAll, setCanApproveAll] = useState(false);
  const [approvalType, setApprovalType] = useState<'global' | 'category' | 'subcategory' | 'skill'>('global');
  
  // Fetch users for dropdown
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Fetch subcategories for the selected category
  const { 
    data: subcategories = [], 
    isLoading: isLoadingSubcategories 
  } = useQuery<SkillSubcategory[]>({
    queryKey: ['/api/skill-subcategories', categoryId],
    enabled: categoryId !== 'all' && (approvalType === 'subcategory' || approvalType === 'category'),
    queryFn: async () => {
      if (categoryId === 'all') return [];
      const response = await fetch(`/api/skill-categories/${categoryId}/subcategories`);
      if (!response.ok) throw new Error('Failed to fetch subcategories');
      return response.json();
    }
  });
  
  // Fetch all skills for skill selection
  const { 
    data: skills = [], 
    isLoading: isLoadingSkills 
  } = useQuery<Skill[]>({
    queryKey: ['/api/all-skills'],
    enabled: approvalType === 'skill'
  });
  
  // When category changes, reset subcategory
  useEffect(() => {
    setSubcategoryId('all');
  }, [categoryId]);
  
  // When approval type changes, reset form values
  useEffect(() => {
    if (approvalType === 'global') {
      setCategoryId('all');
      setSubcategoryId('all');
      setSkillId('all');
      setCanApproveAll(true);
    } else if (approvalType === 'category') {
      setSubcategoryId('all');
      setSkillId('all');
    } else if (approvalType === 'subcategory') {
      setSkillId('all');
    } else if (approvalType === 'skill') {
      setCategoryId('all');
      setSubcategoryId('all');
    }
  }, [approvalType]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId === '') return;
    
    onSave({
      userId: Number(userId),
      categoryId: (approvalType === 'category' || approvalType === 'subcategory') && categoryId !== 'all' ? Number(categoryId) : undefined,
      subcategoryId: approvalType === 'subcategory' && subcategoryId !== 'all' ? Number(subcategoryId) : undefined,
      skillId: approvalType === 'skill' && skillId !== 'all' ? Number(skillId) : undefined,
      canApproveAll: approvalType === 'global' || canApproveAll
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userId">User</Label>
          <Select onValueChange={(value) => setUserId(Number(value))}>
            <SelectTrigger id="userId">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingUsers ? (
                <SelectItem value="loading" disabled>Loading users...</SelectItem>
              ) : (
                users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.username || user.email || `User #${user.id}`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="approvalType">Approval Scope</Label>
          <Select 
            value={approvalType} 
            onValueChange={(value: 'global' | 'category' | 'subcategory' | 'skill') => setApprovalType(value)}
          >
            <SelectTrigger id="approvalType">
              <SelectValue placeholder="Select approval scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">All Categories (Global)</SelectItem>
              <SelectItem value="category">Specific Category</SelectItem>
              <SelectItem value="subcategory">Specific Subcategory</SelectItem>
              <SelectItem value="skill">Specific Skill</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Show category dropdown for category or subcategory approval */}
        {(approvalType === 'category' || approvalType === 'subcategory') && (
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select onValueChange={(value) => setCategoryId(value === 'all' ? 'all' : Number(value))}>
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center">
                      <div className="mr-2">{getIconByName(category.icon || 'code')}</div>
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Show subcategory dropdown for subcategory approval */}
        {approvalType === 'subcategory' && categoryId !== 'all' && (
          <div className="space-y-2">
            <Label htmlFor="subcategoryId">Subcategory</Label>
            <Select 
              value={subcategoryId?.toString() || 'all'} 
              onValueChange={(value) => setSubcategoryId(value === 'all' ? 'all' : Number(value))}
            >
              <SelectTrigger id="subcategoryId">
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {isLoadingSubcategories ? (
                  <SelectItem value="loading" disabled>Loading subcategories...</SelectItem>
                ) : subcategories.length === 0 ? (
                  <SelectItem value="no_subcategories" disabled>No subcategories found</SelectItem>
                ) : (
                  subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                      <div className="flex items-center">
                        <div className="mr-2">{getIconByName(subcategory.icon || 'code')}</div>
                        {subcategory.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Show skill dropdown for skill approval */}
        {approvalType === 'skill' && (
          <div className="space-y-2">
            <Label htmlFor="skillId">Skill</Label>
            <Select 
              value={skillId?.toString() || 'all'} 
              onValueChange={(value) => setSkillId(value === 'all' ? 'all' : Number(value))}
            >
              <SelectTrigger id="skillId">
                <SelectValue placeholder="Select skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {isLoadingSkills ? (
                  <SelectItem value="loading" disabled>Loading skills...</SelectItem>
                ) : skills.length === 0 ? (
                  <SelectItem value="no_skills" disabled>No skills found</SelectItem>
                ) : (
                  skills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id.toString()}>
                      {skill.name} - {skill.category} ({skill.level})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {(approvalType === 'category' || approvalType === 'subcategory') && (
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="canApproveAll"
              checked={canApproveAll}
              onChange={(e) => setCanApproveAll(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="canApproveAll" className="text-sm font-normal">
              Can also approve all other categories
            </Label>
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X size={16} className="mr-2" /> Cancel
        </Button>
        <Button type="submit" disabled={userId === ''}>
          <Save size={16} className="mr-2" /> Add Approver
        </Button>
      </div>
    </form>
  );
}

// Main Category Management Page Component
export default function CategoryManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("categories");
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingApprover, setIsAddingApprover] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [isAddingSubcategory, setIsAddingSubcategory] = useState<number | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<SkillSubcategory | null>(null);
  
  // Fetch categories
  const { 
    data: categories = [], 
    isLoading: isLoadingCategories,
    error: categoriesError 
  } = useQuery<SkillCategory[]>({
    queryKey: ['/api/skill-categories'],
  });
  
  // Fetch approvers
  const { 
    data: approvers = [], 
    isLoading: isLoadingApprovers,
    error: approversError 
  } = useQuery<SkillApprover[]>({
    queryKey: ['/api/skill-approvers'],
  });
  
  // Fetch users for user lookup in approver cards
  const { 
    data: users = [], 
    isLoading: isLoadingUsers 
  } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // We'll instead use the SubcategoryDisplayName component which already has logic to fetch subcategories

  // Fetch subcategories for each category when expanded
  const {
    data: subcategories = [],
    isLoading: isLoadingSubcategories,
    error: subcategoriesError
  } = useQuery<SkillSubcategory[]>({
    queryKey: ['/api/skill-subcategories', expandedCategory],
    enabled: expandedCategory !== null,
    queryFn: async () => {
      if (expandedCategory === null) return [];
      const response = await fetch(`/api/skill-categories/${expandedCategory}/subcategories`);
      if (!response.ok) throw new Error('Failed to fetch subcategories');
      return response.json();
    }
  });
  
  // Category mutations
  const createCategory = useMutation({
    mutationFn: (newCategory: Partial<SkillCategory>) => 
      apiRequest('POST', '/api/skill-categories', newCategory)
        .then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-categories'] });
      setIsAddingCategory(false);
      toast({
        title: "Category created",
        description: "The skill category has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create category",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<SkillCategory> }) => 
      apiRequest('PATCH', `/api/skill-categories/${id}`, data)
        .then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-categories'] });
      setEditingCategory(null);
      toast({
        title: "Category updated",
        description: "The skill category has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update category",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const deleteCategory = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/skill-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-categories'] });
      toast({
        title: "Category deleted",
        description: "The skill category has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete category",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Approver mutations
  const createApprover = useMutation({
    mutationFn: (approver: { userId: number, categoryId?: number, subcategoryId?: number, skillId?: number, canApproveAll: boolean }) => 
      apiRequest('POST', '/api/skill-approvers', approver)
        .then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-approvers'] });
      setIsAddingApprover(false);
      toast({
        title: "Approver added",
        description: "The skill approver has been successfully added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add approver",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const deleteApprover = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/skill-approvers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-approvers'] });
      toast({
        title: "Approver removed",
        description: "The skill approver has been successfully removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove approver",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSaveCategory = (categoryData: Partial<SkillCategory>) => {
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, data: categoryData });
    } else {
      createCategory.mutate(categoryData);
    }
  };
  
  const handleDeleteCategory = (id: number) => {
    if (confirm("Are you sure you want to delete this category? Any skills in this category will be moved to 'uncategorized'.")) {
      deleteCategory.mutate(id);
    }
  };
  
  const handleSaveApprover = (approverData: { userId: number, categoryId?: number, subcategoryId?: number, skillId?: number, canApproveAll: boolean }) => {
    createApprover.mutate(approverData);
  };
  
  const handleDeleteApprover = (id: number) => {
    if (confirm("Are you sure you want to remove this approver?")) {
      deleteApprover.mutate(id);
    }
  };
  
  // Subcategory mutations
  const createSubcategory = useMutation({
    mutationFn: (newSubcategory: Partial<SkillSubcategory>) => 
      apiRequest('POST', '/api/skill-subcategories', newSubcategory)
        .then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-subcategories', expandedCategory] });
      setIsAddingSubcategory(null);
      toast({
        title: "Subcategory created",
        description: "The skill subcategory has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create subcategory",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updateSubcategory = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<SkillSubcategory> }) => 
      apiRequest('PATCH', `/api/skill-subcategories/${id}`, data)
        .then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-subcategories', expandedCategory] });
      setEditingSubcategory(null);
      toast({
        title: "Subcategory updated",
        description: "The skill subcategory has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update subcategory",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const deleteSubcategory = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/skill-subcategories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-subcategories', expandedCategory] });
      toast({
        title: "Subcategory deleted",
        description: "The skill subcategory has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete subcategory",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSaveSubcategory = (subcategoryData: Partial<SkillSubcategory>) => {
    if (editingSubcategory) {
      updateSubcategory.mutate({ id: editingSubcategory.id, data: subcategoryData });
    } else {
      createSubcategory.mutate(subcategoryData);
    }
  };
  
  const handleDeleteSubcategory = (id: number) => {
    if (confirm("Are you sure you want to delete this subcategory? Any skills in this subcategory will be moved to the parent category.")) {
      deleteSubcategory.mutate(id);
    }
  };
  
  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Skill Category Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage skill categories and assign approvers for different skill domains.
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="approvers">Approvers</TabsTrigger>
          </TabsList>
          
          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            {categoriesError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load categories: {categoriesError instanceof Error ? categoriesError.message : 'Unknown error'}
                </AlertDescription>
              </Alert>
            ) : null}
            
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Skill Categories</h2>
              <Button onClick={() => setIsAddingCategory(true)} disabled={isAddingCategory}>
                <Plus size={16} className="mr-2" /> Add Category
              </Button>
            </div>
            
            {isAddingCategory && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Category</CardTitle>
                  <CardDescription>
                    Create a new skill category to organize skills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryForm 
                    onSave={handleSaveCategory} 
                    onCancel={() => setIsAddingCategory(false)} 
                  />
                </CardContent>
              </Card>
            )}
            
            {editingCategory && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Category</CardTitle>
                  <CardDescription>
                    Update the skill category details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryForm 
                    category={editingCategory} 
                    onSave={handleSaveCategory} 
                    onCancel={() => setEditingCategory(null)} 
                  />
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 gap-4">
              {isLoadingCategories ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="animate-pulse h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-1/4"></div>
                  </CardContent>
                </Card>
              ) : categories.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      No categories found. Create your first category to get started.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                categories
                  .sort((a, b) => (a.tabOrder || 0) - (b.tabOrder || 0))
                  .map((category) => (
                    <Card key={category.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="p-2 rounded-md" 
                              style={{ backgroundColor: category.color || '#3B82F6', color: 'white' }}
                            >
                              {getIconByName(category.icon || 'code')}
                            </div>
                            <CardTitle className="text-xl">{category.name}</CardTitle>
                          </div>
                          <div className="flex items-center space-x-2">
                            {category.visibility === 'hidden' && (
                              <Badge variant="outline" className="gap-1 text-muted-foreground">
                                <EyeOff size={12} /> Hidden
                              </Badge>
                            )}
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setEditingCategory(category)}
                                disabled={!!editingCategory}
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {category.description || 'No description provided'}
                        </p>
                        <div className="flex items-center mt-2 text-sm text-muted-foreground">
                          <span className="mr-4">Tab Order: {category.tabOrder || 0}</span>
                        </div>
                        
                        {/* Subcategories section */}
                        <div className="mt-4">
                          <div className="flex justify-between items-center">
                            <div 
                              className="flex items-center cursor-pointer" 
                              onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                            >
                              <h3 className="text-sm font-medium mr-1">Subcategories</h3>
                              {expandedCategory === category.id ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </div>
                            
                            {expandedCategory === category.id && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setIsAddingSubcategory(category.id)}
                                disabled={isAddingSubcategory !== null}
                              >
                                <Plus size={14} className="mr-1" />
                                Add Subcategory
                              </Button>
                            )}
                          </div>
                          
                          {/* Subcategory form */}
                          {isAddingSubcategory === category.id && (
                            <div className="border rounded-md p-4 mt-2">
                              <h4 className="text-sm font-medium mb-2">Add New Subcategory</h4>
                              <SubcategoryForm
                                onSave={handleSaveSubcategory}
                                onCancel={() => setIsAddingSubcategory(null)}
                                categories={categories}
                                parentCategoryId={category.id}
                              />
                            </div>
                          )}
                          
                          {editingSubcategory && editingSubcategory.categoryId === category.id && (
                            <div className="border rounded-md p-4 mt-2">
                              <h4 className="text-sm font-medium mb-2">Edit Subcategory</h4>
                              <SubcategoryForm
                                subcategory={editingSubcategory}
                                onSave={handleSaveSubcategory}
                                onCancel={() => setEditingSubcategory(null)}
                                categories={categories}
                                parentCategoryId={category.id}
                              />
                            </div>
                          )}
                          
                          {/* Subcategories list */}
                          {expandedCategory === category.id && (
                            <div className="mt-2 border rounded-md">
                              {isLoadingSubcategories ? (
                                <div className="p-4">
                                  <div className="animate-pulse h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                  <div className="animate-pulse h-4 bg-gray-200 rounded w-1/4"></div>
                                </div>
                              ) : subcategories.length === 0 ? (
                                <div className="p-4 text-center">
                                  <p className="text-muted-foreground text-sm">
                                    No subcategories found. Add your first subcategory.
                                  </p>
                                </div>
                              ) : (
                                <div className="divide-y">
                                  {subcategories.map((subcategory) => (
                                    <div key={subcategory.id} className="p-3">
                                      <div className="flex justify-between items-start">
                                        <div className="flex items-center">
                                          <div 
                                            className="p-1 rounded-md mr-2"
                                            style={{ backgroundColor: subcategory.color || category.color || '#3B82F6', color: 'white' }}
                                          >
                                            {getIconByName(subcategory.icon || 'code')}
                                          </div>
                                          <div>
                                            <h4 className="text-sm font-medium">{subcategory.name}</h4>
                                            <p className="text-xs text-muted-foreground">
                                              {subcategory.description || 'No description provided'}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex space-x-1">
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setEditingSubcategory(subcategory)}
                                            className="h-7 w-7"
                                            disabled={!!editingSubcategory}
                                          >
                                            <Edit2 size={14} />
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => handleDeleteSubcategory(subcategory.id)}
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                          >
                                            <Trash2 size={14} />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
          
          {/* Approvers Tab */}
          <TabsContent value="approvers" className="space-y-6">
            {approversError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load approvers: {approversError instanceof Error ? approversError.message : 'Unknown error'}
                </AlertDescription>
              </Alert>
            ) : null}
            
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Skill Approvers</h2>
              <Button onClick={() => setIsAddingApprover(true)} disabled={isAddingApprover}>
                <Plus size={16} className="mr-2" /> Add Approver
              </Button>
            </div>
            
            {isAddingApprover && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Approver</CardTitle>
                  <CardDescription>
                    Assign a user as an approver for skill updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ApproverForm 
                    onSave={handleSaveApprover} 
                    onCancel={() => setIsAddingApprover(false)}
                    categories={categories}
                  />
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 gap-4">
              {isLoadingApprovers ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="animate-pulse h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ) : approvers.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      No approvers found. Add approvers to enable the skill review process.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                approvers.map((approver) => {
                  const category = approver.categoryId
                    ? categories.find(c => c.id === approver.categoryId)
                    : null;
                  
                  // SubcategoryDisplayName component handles the subcategory display
                    
                  // Find the associated user from our users query data
                  const approverUser = users.find(u => u.id === approver.userId);
                    
                  return (
                    <Card key={approver.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <CardTitle className="text-lg">
                              {approverUser?.username || approverUser?.email || `User #${approver.userId}`}
                            </CardTitle>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteApprover(approver.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {approver.canApproveAll ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            <Check size={12} className="mr-1" /> Can approve all categories
                          </Badge>
                        ) : approver.skillId ? (
                          <div className="flex items-center flex-wrap gap-2">
                            {category && (
                              <Badge 
                                className="gap-1" 
                                style={{ 
                                  backgroundColor: `${category.color || '#3B82F6'}20`, 
                                  color: category.color || '#3B82F6',
                                  borderColor: category.color || '#3B82F6' 
                                }}
                              >
                                {getIconByName(category.icon || 'code')}
                                {category.name}
                              </Badge>
                            )}
                            
                            {approver.subcategoryId && (
                              <>
                                <ChevronRight size={14} className="text-muted-foreground" />
                                <Badge className="gap-1" variant="outline">
                                  <span className="font-medium">Subcategory:</span>
                                  <SubcategoryDisplayName subcategoryId={approver.subcategoryId} />
                                </Badge>
                              </>
                            )}
                            
                            <ChevronRight size={14} className="text-muted-foreground" />
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                              <span className="font-medium">Specific Skill:</span> 
                              {approver.skillId && <SkillDisplayName skillId={approver.skillId} />}
                            </Badge>
                          </div>
                        ) : category ? (
                          <div className="flex items-center flex-wrap gap-2">
                            <Badge 
                              className="gap-1" 
                              style={{ 
                                backgroundColor: `${category.color || '#3B82F6'}20`, 
                                color: category.color || '#3B82F6',
                                borderColor: category.color || '#3B82F6' 
                              }}
                            >
                              {getIconByName(category.icon || 'code')}
                              {category.name}
                            </Badge>
                            
                            {approver.subcategoryId && (
                              <>
                                <ChevronRight size={14} className="text-muted-foreground" />
                                {/* Display subcategory */}
                                <Badge 
                                  className="gap-1" 
                                  variant="outline"
                                >
                                  <span className="font-medium">Subcategory:</span>
                                  <SubcategoryDisplayName subcategoryId={approver.subcategoryId} />
                                </Badge>
                              </>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            No specific category
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}