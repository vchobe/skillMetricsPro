import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skill } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  MenuIcon, 
  Search, 
  X,
  FileSearch,
  Brain
} from "lucide-react";
import NotificationDropdown from "./notification-dropdown";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import SkillLevelBadge from "./skill-level-badge";

interface HeaderProps {
  title: string;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function Header({ title, toggleSidebar, isSidebarOpen }: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  // Get skills for search results
  const { data: skills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  
  // Filter skills based on search term
  const searchResults = skills?.filter(skill => {
    if (!searchTerm) return false;
    
    return (
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (skill.certification && skill.certification.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (skill.notes && skill.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }).slice(0, 5);
  
  return (
    <header className="bg-white shadow-sm z-10 sticky top-0">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="lg:hidden mr-2"
          >
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>
        
        <div className="flex space-x-4 items-center">
          <div className="relative hidden md:block">
            <Input
              type="text"
              placeholder="Search..."
              className="rounded-lg pl-10 pr-4 py-2 text-sm w-60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            
            {/* Search results dropdown */}
            {searchTerm && searchResults && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
                {searchResults.length > 0 ? (
                  <ul className="py-1 max-h-60 overflow-auto">
                    {searchResults.map(skill => (
                      <li key={skill.id} className="px-4 py-2 hover:bg-gray-100">
                        <Link href={`/skills/${skill.id}`}>
                          <div className="block">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900">{skill.name}</p>
                                <p className="text-xs text-gray-500">{skill.category}</p>
                              </div>
                              <SkillLevelBadge level={skill.level} />
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                    <li className="px-4 py-2 border-t border-gray-100">
                      <Link href={`/skills?search=${searchTerm}`}>
                        <div className="text-indigo-600 text-sm hover:text-indigo-800 flex items-center cursor-pointer">
                          <FileSearch className="h-4 w-4 mr-1" />
                          See all results
                        </div>
                      </Link>
                    </li>
                  </ul>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-gray-500 text-sm">No skills found matching "{searchTerm}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile search button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setShowSearch(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          {/* Notifications dropdown */}
          <NotificationDropdown />
        </div>
      </div>
      
      {/* Mobile search dialog */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search skills</DialogTitle>
            <DialogDescription>
              Search for skills by name, category, or certification
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {searchTerm && (
            <>
              <Separator />
              <div className="max-h-72 overflow-y-auto">
                {searchResults && searchResults.length > 0 ? (
                  <ul className="space-y-2">
                    {searchResults.map(skill => (
                      <li key={skill.id} className="p-2 hover:bg-gray-100 rounded-md">
                        <Link href={`/skills/${skill.id}`}>
                          <div className="block cursor-pointer" onClick={() => setShowSearch(false)}>
                            <div className="flex items-start">
                              <div className="h-8 w-8 flex items-center justify-center rounded-md bg-indigo-100 text-indigo-600 mr-3">
                                <Brain className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{skill.name}</p>
                                <div className="flex items-center">
                                  <p className="text-xs text-gray-500 mr-2">{skill.category}</p>
                                  <SkillLevelBadge level={skill.level} size="sm" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-8 text-center">
                    <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      No skills found matching "{searchTerm}"
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
          
          <DialogFooter className="sm:justify-start">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setShowSearch(false)}
            >
              Close
            </Button>
            <Link href={`/skills?search=${searchTerm}`}>
              <div>
                <Button 
                  type="button" 
                  disabled={!searchTerm}
                  onClick={() => setShowSearch(false)}
                >
                  View All Results
                </Button>
              </div>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
