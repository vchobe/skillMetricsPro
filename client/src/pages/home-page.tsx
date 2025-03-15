import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Skill, SkillHistory } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Brain, Award, Medal, Plus, ChevronRight } from "lucide-react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import SkillChart from "@/components/skill-chart";
import ActivityFeed from "@/components/activity-feed";
import SkillLevelBadge from "@/components/skill-level-badge";
import { formatRelativeTime, parseDate } from "@/lib/date-utils";

export default function HomePage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Get user skills
  const { data: skills, isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  
  // Get user skill history
  const { data: history, isLoading: isLoadingHistory } = useQuery<SkillHistory[]>({
    queryKey: ["/api/user/skills/history"],
  });
  
  // Define the SkillTarget type
  type SkillTarget = {
    id: number;
    name: string;
    description?: string;
    targetLevel: string;
    targetDate?: string;
    dueDate?: string;
    skillIds: number[];
    targetSkills: Skill[];
    progress: number;
    acquiredSkills: number;
    totalTargetSkills: number;
    skillGap: number;
    isCompleted: boolean;
  };
  
  // Get user skill targets for gap analysis
  const { data: skillTargets = [], isLoading: isLoadingTargets } = useQuery<SkillTarget[]>({
    queryKey: ["/api/user/skill-targets"],
  });
  
  // Background gradient style based on skills
  const [backgroundStyle, setBackgroundStyle] = useState<string>("from-indigo-500 via-purple-500 to-pink-500");
  
  useEffect(() => {
    if (skills && skills.length > 0) {
      // Change background based on top skill categories
      const categories = skills.map(skill => skill.category);
      const topCategory = categories.reduce((a, b) => {
        return categories.filter(v => v === a).length >= categories.filter(v => v === b).length ? a : b;
      }, categories[0]);
      
      switch (topCategory.toLowerCase()) {
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
          setBackgroundStyle("from-indigo-500 via-purple-500 to-pink-500");
      }
    }
  }, [skills]);
  
  // Calculate skill distribution
  const skillStats = {
    totalSkills: skills?.length || 0,
    expertSkills: skills?.filter(skill => skill.level === "expert").length || 0,
    intermediateSkills: skills?.filter(skill => skill.level === "intermediate").length || 0,
    beginnerSkills: skills?.filter(skill => skill.level === "beginner").length || 0,
    certifications: skills?.filter(skill => 
      skill.certification && 
      skill.certification !== 'true' && 
      skill.certification !== 'false'
    ).length || 0
  };
  
  // Skill level percentages for chart
  const skillLevelData = [
    { name: "Expert", value: skillStats.expertSkills, percentage: skillStats.totalSkills ? Math.round((skillStats.expertSkills / skillStats.totalSkills) * 100) : 0 },
    { name: "Intermediate", value: skillStats.intermediateSkills, percentage: skillStats.totalSkills ? Math.round((skillStats.intermediateSkills / skillStats.totalSkills) * 100) : 0 },
    { name: "Beginner", value: skillStats.beginnerSkills, percentage: skillStats.totalSkills ? Math.round((skillStats.beginnerSkills / skillStats.totalSkills) * 100) : 0 }
  ];
  
  // Recent activity from skill history
  const recentActivity = history?.slice(0, 3).map(entry => ({
    id: entry.id,
    type: entry.previousLevel ? "update" as const : "add" as const,
    skillId: entry.skillId,
    previousLevel: entry.previousLevel,
    newLevel: entry.newLevel,
    date: entry.createdAt,
    userId: entry.userId
  }));
  
  // Top skills (highest level first, then most recently updated)
  const topSkills = skills ? 
    [...skills].sort((a, b) => {
      // First sort by level
      const levelOrder = { expert: 3, intermediate: 2, beginner: 1 };
      const levelDiff = levelOrder[b.level as keyof typeof levelOrder] - levelOrder[a.level as keyof typeof levelOrder];
      
      if (levelDiff !== 0) return levelDiff;
      
      // Then sort by last updated, handling null or invalid dates
      if (!a.lastUpdated && !b.lastUpdated) return 0;
      if (!a.lastUpdated) return 1; // b comes first
      if (!b.lastUpdated) return -1; // a comes first
      
      try {
        const dateA = parseDate(a.lastUpdated);
        const dateB = parseDate(b.lastUpdated);
        
        if (dateA && dateB) {
          return dateB.getTime() - dateA.getTime();
        }
        return 0;
      } catch (e) {
        console.error("Error comparing dates:", e);
        return 0; // If date parsing fails, consider them equal
      }
    }).slice(0, 3) : [];
  
  const isLoading = isLoadingSkills || isLoadingHistory || isLoadingTargets;
  
  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/" />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header 
          title="Dashboard" 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className={`bg-gradient-to-br ${backgroundStyle} p-6 rounded-xl text-white mb-6`}>
                <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.firstName}!</h2>
                <p className="opacity-90">
                  {history && history.length > 0 
                    ? `You've updated ${history.length} skills recently. Keep it up!` 
                    : "Start by adding your professional skills to your profile."}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                          <Brain className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Skills</dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">{skillStats.totalSkills}</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                      <div className="text-sm">
                        <Link href="/skills" className="font-medium text-indigo-600 hover:text-indigo-500">
                          View all
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                          <Award className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Expert Level Skills</dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">{skillStats.expertSkills}</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                      <div className="text-sm">
                        <Link href="/skills?level=expert" className="font-medium text-green-600 hover:text-green-500">
                          View details
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                          <Medal className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Certifications</dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">{skillStats.certifications}</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                      <div className="text-sm">
                        <Link href="/skills?hasCertification=true" className="font-medium text-purple-600 hover:text-purple-500">
                          View all
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Skill Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                      {skillStats.totalSkills > 0 ? (
                        <SkillChart data={skillLevelData} />
                      ) : (
                        <div className="text-center p-6">
                          <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No skills added yet</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Add your first skill to see your skill distribution
                          </p>
                          <Link href="/skills">
                            <Button>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Skills
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentActivity && recentActivity.length > 0 ? (
                      <ActivityFeed activities={recentActivity} skills={skills || []} showAll={false} />
                    ) : (
                      <div className="text-center p-6 bg-gray-50 rounded-md">
                        <div className="text-center p-6">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No recent activity</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Updates to your skills will appear here
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="mt-6">
                      <Link href="/history">
                        <Button variant="outline" className="w-full">View all activity</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="border-b border-gray-200">
                  <CardTitle>Your Top Skills</CardTitle>
                </CardHeader>
                {topSkills && topSkills.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certifications</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {topSkills.map((skill) => (
                          <tr key={skill.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                                  <Brain className="h-5 w-5" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{skill.name}</div>
                                  <div className="text-sm text-gray-500">{skill.category}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <SkillLevelBadge level={skill.level} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {skill.lastUpdated ? formatRelativeTime(skill.lastUpdated, { addSuffix: true }, 'recently') : 'recently'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {skill.certification ? (
                                <Link href={skill.credlyLink || "#"} className="text-indigo-600 hover:text-indigo-900">
                                  {skill.certification}
                                </Link>
                              ) : (
                                "No certifications"
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link href={`/skills?edit=${skill.id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                Edit
                              </Link>
                              <Link href={`/skills/${skill.id}/history`} className="text-indigo-600 hover:text-indigo-900">
                                History
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No skills added yet</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                      Start building your skill profile by adding skills you've acquired throughout your career
                    </p>
                    <Link href="/skills">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Skill
                      </Button>
                    </Link>
                  </div>
                )}
                {topSkills && topSkills.length > 0 && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <Link href="/skills" className="text-indigo-600 hover:text-indigo-900 font-medium flex items-center">
                      View all skills
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                )}
              </Card>
              
              {skillTargets && skillTargets.length > 0 && (
                <Card className="mt-8">
                  <CardHeader className="border-b border-gray-200">
                    <CardTitle>Skill Gap Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {skillTargets.map((target: SkillTarget) => (
                        <div key={target.id} className="bg-gray-50 rounded-lg p-5">
                          <div className="flex flex-col sm:flex-row justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{target.name || `Skills Target ${target.id}`}</h3>
                              {target.description && (
                                <p className="text-sm text-gray-500 mt-1">{target.description}</p>
                              )}
                            </div>
                            <div className="mt-2 sm:mt-0">
                              {target.dueDate ? (
                                <span className={`text-sm ${new Date(target.dueDate) < new Date() ? 'text-red-600' : 'text-gray-500'}`}>
                                  Due: {new Date(target.dueDate).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-500">Ongoing</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex justify-between mb-2 text-sm">
                              <span>Target Level: <SkillLevelBadge level={target.targetLevel} size="sm" /></span>
                              <span>Progress: <strong>{target.progress}%</strong></span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full">
                              <div 
                                className={`h-2 rounded-full ${
                                  target.progress >= 100 
                                    ? 'bg-green-500' 
                                    : target.progress >= 50 
                                      ? 'bg-amber-500' 
                                      : 'bg-red-500'
                                }`} 
                                style={{ width: `${target.progress}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span className="text-green-600 font-medium">{target.acquiredSkills} skills acquired</span>
                              {target.skillGap > 0 && (
                                <span className="text-red-600 font-medium ml-3">{target.skillGap} skills remaining</span>
                              )}
                            </div>
                            <Link href="/skills">
                              <Button variant="outline" size="sm">
                                {target.isCompleted ? 'View Skills' : 'Fill Skill Gap'}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
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
