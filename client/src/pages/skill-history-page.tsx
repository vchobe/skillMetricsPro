import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Skill, SkillHistory, User } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import ActivityFeed from "@/components/activity-feed";
import SkillLevelBadge from "@/components/skill-level-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Activity, Calendar, Clock, Filter, Search } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

export default function SkillHistoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Check if we're viewing history for a specific skill
  const urlParams = new URLSearchParams(window.location.search);
  const skillId = urlParams.get("skillId") ? parseInt(urlParams.get("skillId")!) : null;
  
  // Get all skills
  const { data: skills, isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  
  // Get user's skill history
  const { data: userHistory, isLoading: isLoadingUserHistory } = useQuery<SkillHistory[]>({
    queryKey: skillId 
      ? [`/api/skills/${skillId}/history`] 
      : ["/api/user/skills/history"],
  });
  
  // Get organization-wide skill history (global activity)
  const { data: orgHistory, isLoading: isLoadingOrgHistory } = useQuery<SkillHistory[]>({
    queryKey: ["/api/org/skills/history"],
  });
  
  // Get all users data for displaying user names in activity feed
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });
  
  // Get the specific skill if skillId is provided
  const currentSkill = skillId && skills 
    ? skills.find(skill => skill.id === skillId) 
    : null;
  
  // Combine user and organization history data
  const combinedHistory = useMemo(() => {
    if (skillId) {
      // For a specific skill, we already have its history from the userHistory query
      return userHistory || [];
    }
    
    // Otherwise, combine user and org-wide history
    const combined = [
      ...(userHistory || []),
      ...(orgHistory || []).filter(entry => entry.userId !== allUsers?.find(u => u.email === window.location.pathname.includes("history") ? u.email : ''))
    ];
    
    // Sort by date (most recent first)
    return combined.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [skillId, userHistory, orgHistory, allUsers]);

  // Filter history by tab and search term
  const filteredHistory = combinedHistory?.filter(entry => {
    const matchesTab = activeTab === "all" || 
                      (activeTab === "updates" && entry.previousLevel) ||
                      (activeTab === "new" && !entry.previousLevel);
                      
    // Find the skill for this history entry
    const skill = skills?.find(s => s.id === entry.skillId);
    
    const matchesSearch = !searchTerm || 
      (skill && skill.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (skill && skill.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.changeNote && entry.changeNote.toLowerCase().includes(searchTerm.toLowerCase()));
      
    return matchesTab && matchesSearch;
  });
  
  const isLoading = isLoadingSkills || isLoadingUserHistory || isLoadingOrgHistory || isLoadingUsers;
  
  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/history" />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-16' : 'ml-0'}`}>
        <Header 
          title={currentSkill ? `${currentSkill.name} History` : "Skill History"} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-amber-500 p-6 rounded-xl text-white mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {currentSkill ? `History for ${currentSkill.name}` : "Your Skill History"}
                </h2>
                <p className="opacity-90">
                  {currentSkill 
                    ? `Track your progress and improvements in ${currentSkill.name}` 
                    : "View all changes and updates to your skills over time"}
                </p>
              </div>
              {currentSkill && (
                <div className="mt-4 md:mt-0">
                  <Link href="/skills">
                    <Button className="bg-white text-purple-600 hover:bg-purple-50">
                      Back to Skills
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row justify-between md:items-center">
                <CardTitle>Activity Log</CardTitle>
                <div className="mt-4 md:mt-0 relative">
                  <Input
                    type="text"
                    placeholder="Search history..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-64 pl-9"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all" className="flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    All Activity
                  </TabsTrigger>
                  <TabsTrigger value="updates" className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Skill Updates
                  </TabsTrigger>
                  <TabsTrigger value="new" className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    New Skills
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-border" />
                    </div>
                  ) : filteredHistory && filteredHistory.length > 0 ? (
                    <ActivityFeed 
                      activities={filteredHistory.map(entry => ({
                        id: entry.id,
                        type: entry.previousLevel ? "update" : "add",
                        skillId: entry.skillId,
                        userId: entry.userId,
                        previousLevel: entry.previousLevel,
                        newLevel: entry.newLevel,
                        date: entry.createdAt || entry.updatedAt,
                        note: entry.changeNote
                      }))} 
                      skills={skills || []}
                      showAll={true}
                      isPersonal={false}
                      users={allUsers || []}
                    />
                  ) : (
                    <div className="text-center p-12 bg-gray-50 rounded-md">
                      <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No activity found</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {searchTerm 
                          ? "No history matches your search criteria" 
                          : currentSkill 
                            ? `No history for ${currentSkill.name} yet` 
                            : "You haven't made any skill changes yet"}
                      </p>
                      {searchTerm && (
                        <Button 
                          variant="outline" 
                          onClick={() => setSearchTerm("")}
                        >
                          Clear Search
                        </Button>
                      )}
                      {!searchTerm && !currentSkill && (
                        <Link href="/skills">
                          <Button>Add or Update Skills</Button>
                        </Link>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="updates" className="mt-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-border" />
                    </div>
                  ) : filteredHistory && filteredHistory.length > 0 ? (
                    <ActivityFeed 
                      activities={filteredHistory.map(entry => ({
                        id: entry.id,
                        type: "update",
                        skillId: entry.skillId,
                        userId: entry.userId,
                        previousLevel: entry.previousLevel,
                        newLevel: entry.newLevel,
                        date: entry.createdAt || entry.updatedAt,
                        note: entry.changeNote
                      }))} 
                      skills={skills || []}
                      showAll={true}
                      isPersonal={false}
                      users={allUsers || []}
                    />
                  ) : (
                    <div className="text-center p-12 bg-gray-50 rounded-md">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No skill updates found</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {searchTerm 
                          ? "No skill updates match your search criteria" 
                          : currentSkill 
                            ? `${currentSkill.name} hasn't been updated yet` 
                            : "You haven't updated any skills yet"}
                      </p>
                      {searchTerm && (
                        <Button 
                          variant="outline" 
                          onClick={() => setSearchTerm("")}
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="new" className="mt-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-border" />
                    </div>
                  ) : filteredHistory && filteredHistory.length > 0 ? (
                    <ActivityFeed 
                      activities={filteredHistory.map(entry => ({
                        id: entry.id,
                        type: "add",
                        skillId: entry.skillId,
                        userId: entry.userId,
                        previousLevel: null,
                        newLevel: entry.newLevel,
                        date: entry.createdAt || entry.updatedAt,
                        note: entry.changeNote
                      }))} 
                      skills={skills || []}
                      showAll={true}
                      isPersonal={false}
                      users={allUsers || []}
                    />
                  ) : (
                    <div className="text-center p-12 bg-gray-50 rounded-md">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No new skills found</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {searchTerm 
                          ? "No new skills match your search criteria" 
                          : currentSkill 
                            ? `This is showing history for an existing skill` 
                            : "You haven't added any new skills recently"}
                      </p>
                      {searchTerm && (
                        <Button 
                          variant="outline" 
                          onClick={() => setSearchTerm("")}
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {currentSkill && (
            <Card>
              <CardHeader>
                <CardTitle>Skill Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Skill Information</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <span className="text-sm text-gray-500">Name:</span>
                        <p className="text-lg font-medium">{currentSkill.name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Category:</span>
                        <p>{currentSkill.category}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Current Level:</span>
                        <div className="mt-1">
                          <SkillLevelBadge level={currentSkill.level} />
                        </div>
                      </div>
                      {currentSkill.certification && (
                        <div>
                          <span className="text-sm text-gray-500">Certification:</span>
                          <p>{currentSkill.certification}</p>
                          {currentSkill.credlyLink && (
                            <a 
                              href={currentSkill.credlyLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-500"
                            >
                              View on Credly
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Timeline</h3>
                    <div className="mt-4">
                      <div className="flex items-center mb-4">
                        <div className="flex-1">
                          <span className="text-sm text-gray-500">Last Updated:</span>
                          <p>{format(new Date(currentSkill.lastUpdated), "MMM dd, yyyy 'at' h:mm a")}</p>
                        </div>
                        <div>
                          <Link href={`/skills?edit=${currentSkill.id}`}>
                            <Button variant="outline" size="sm">Edit Skill</Button>
                          </Link>
                        </div>
                      </div>
                      
                      {filteredHistory && filteredHistory.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                          <span className="text-sm font-medium text-gray-500">History Summary:</span>
                          <ul className="mt-2 space-y-2">
                            {filteredHistory.slice(0, 3).map((entry) => (
                              <li key={entry.id} className="text-sm">
                                <span className="text-gray-700">
                                  {format(new Date(entry.createdAt || entry.updatedAt), "MMM dd, yyyy")}:
                                </span> {" "}
                                {entry.previousLevel ? (
                                  <span>
                                    Updated from <SkillLevelBadge level={entry.previousLevel} className="mx-1" /> to <SkillLevelBadge level={entry.newLevel} className="mx-1" />
                                  </span>
                                ) : (
                                  <span>
                                    Added with level <SkillLevelBadge level={entry.newLevel} className="mx-1" />
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
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
