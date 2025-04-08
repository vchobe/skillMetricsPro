import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Skill } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import SkillCard from "@/components/skill-card";
import AddSkillModal from "@/components/add-skill-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain, Search, Plus, Filter, SlidersHorizontal, 
  Loader2, Database, Cloud, PenTool, GitBranch, Code 
} from "lucide-react";

export default function SkillsPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Background gradient based on skills
  const [backgroundStyle, setBackgroundStyle] = useState<string>("from-blue-500 via-indigo-500 to-purple-600");
  
  // Get user skills
  const { data: skills, isLoading } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  
  // Check for edit param in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const editId = searchParams.get("edit");
    if (editId) {
      setEditingSkillId(parseInt(editId));
      setIsAddModalOpen(true);
    }
  }, [location]);
  
  // Delete skill mutation
  const deleteSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      await apiRequest("DELETE", `/api/skills/${skillId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      toast({
        title: "Skill deleted",
        description: "The skill has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting skill",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle skill deletion
  const handleDeleteSkill = (skillId: number) => {
    if (confirm("Are you sure you want to delete this skill?")) {
      deleteSkillMutation.mutate(skillId);
    }
  };
  
  // Handle edit skill
  const handleEditSkill = (skillId: number) => {
    setEditingSkillId(skillId);
    setIsAddModalOpen(true);
  };
  
  // Filter and search skills
  const filteredSkills = skills?.filter(skill => {
    const matchesSearch = searchTerm === "" || 
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (skill.certification && 
       skill.certification !== 'true' && 
       skill.certification !== 'false' && 
       skill.certification.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLevel = levelFilter === "all" || skill.level === levelFilter;
    const matchesCategory = categoryFilter === "all" || skill.category === categoryFilter;
    
    return matchesSearch && matchesLevel && matchesCategory;
  });
  
  // Get unique categories for filter
  const categories = skills 
    ? Array.from(new Set(skills.map(skill => skill.category || ''))).filter(category => !!category)
    : [];
  
  // Update background style based on selected category
  useEffect(() => {
    if (categoryFilter) {
      switch (categoryFilter.toLowerCase()) {
        case "programming":
          setBackgroundStyle("from-blue-500 via-indigo-500 to-purple-600");
          break;
        case "design":
          setBackgroundStyle("from-pink-500 via-red-500 to-yellow-500");
          break;
        case "cloud":
          setBackgroundStyle("from-cyan-500 via-blue-500 to-indigo-500");
          break;
        case "database":
          setBackgroundStyle("from-green-500 via-emerald-500 to-teal-500");
          break;
        case "devops":
          setBackgroundStyle("from-amber-500 via-orange-500 to-red-500");
          break;
        default:
          setBackgroundStyle("from-blue-500 via-indigo-500 to-purple-600");
      }
    } else {
      setBackgroundStyle("from-blue-500 via-indigo-500 to-purple-600");
    }
  }, [categoryFilter]);
  
  // Get skill icon based on category
  const getSkillIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "programming":
        return <Code className="text-xl" />;
      case "database":
        return <Database className="text-xl" />;
      case "cloud":
        return <Cloud className="text-xl" />;
      case "design":
        return <PenTool className="text-xl" />;
      case "devops":
        return <GitBranch className="text-xl" />;
      default:
        return <Brain className="text-xl" />;
    }
  };
  
  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/skills" />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header 
          title="My Skills" 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`bg-gradient-to-br ${backgroundStyle} p-6 rounded-xl text-white mb-6`}>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Skills</h2>
              <div className="flex gap-3">
                <Link href="/skills/add">
                  <Button className="bg-white text-indigo-600 hover:bg-indigo-50">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skills
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search for skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  More Filters
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredSkills && filteredSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredSkills.map((skill) => (
                <SkillCard 
                  key={skill.id}
                  skill={skill}
                  onEdit={() => handleEditSkill(skill.id)}
                  onDelete={() => handleDeleteSkill(skill.id)}
                  icon={getSkillIcon(skill.category)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || levelFilter !== "all" || categoryFilter !== "all" 
                  ? "No skills found matching your filters" 
                  : "No skills added yet"}
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                {searchTerm || levelFilter !== "all" || categoryFilter !== "all" 
                  ? "Try adjusting your search criteria or clear the filters" 
                  : "Start building your skill profile by adding skills you've acquired"}
              </p>
              {!(searchTerm || levelFilter !== "all" || categoryFilter !== "all") && (
                <Link href="/skills/add">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Skill
                  </Button>
                </Link>
              )}
              {(searchTerm || levelFilter || categoryFilter) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setLevelFilter("all");
                    setCategoryFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
          
          {filteredSkills && filteredSkills.length > 0 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" className="bg-indigo-50 text-indigo-600">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <AddSkillModal 
          isOpen={isAddModalOpen} 
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingSkillId(null);
            
            // Remove edit param from URL if present
            const url = new URL(window.location.href);
            url.searchParams.delete("edit");
            window.history.replaceState({}, document.title, url.pathname);
          }}
          skillId={editingSkillId}
        />
        
        <footer className="bg-white border-t border-gray-200 mt-8">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex justify-center md:justify-start">
                <span className="text-sm text-gray-500">&copy; 2023 SkillMetrics. All rights reserved.</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
