import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skill } from "@shared/schema";
import { formatRelativeTime } from "@/lib/date-utils";
import SkillLevelBadge from "./skill-level-badge";
import { 
  ArrowUp, 
  Plus, 
  Clock,
  Code, 
  Database, 
  Cloud, 
  PenTool, 
  GitBranch,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Activity {
  id: number;
  type: "update" | "add";
  skillId: number;
  previousLevel: string | null;
  newLevel: string;
  date: Date | string;
  note?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  skills: Skill[];
  showAll: boolean;
  isPersonal?: boolean;
  users?: any[];
}

export default function ActivityFeed({ activities, skills, showAll, isPersonal = true, users = [] }: ActivityFeedProps) {
  // Get skill details by ID
  const getSkill = (skillId: number) => {
    return skills.find(skill => skill.id === skillId);
  };
  
  // Get icon based on skill category
  const getIconForCategory = (category?: string) => {
    if (!category) return <Brain className="text-white" />;
    
    switch (category.toLowerCase()) {
      case "programming":
        return <Code className="text-white" />;
      case "database":
        return <Database className="text-white" />;
      case "cloud":
        return <Cloud className="text-white" />;
      case "design":
        return <PenTool className="text-white" />;
      case "devops":
        return <GitBranch className="text-white" />;
      default:
        return <Brain className="text-white" />;
    }
  };
  
  // Get background color based on activity type and skill category
  const getActivityColor = (activity: Activity) => {
    const skill = getSkill(activity.skillId);
    
    if (activity.type === "add") {
      return "bg-purple-500"; // New skill color
    }
    
    // For updates, base color on skill category
    if (skill && skill.category) {
      switch (skill.category.toLowerCase()) {
        case "programming":
          return "bg-indigo-500";
        case "database":
          return "bg-blue-500";
        case "cloud":
          return "bg-cyan-500";
        case "design":
          return "bg-pink-500";
        case "devops":
          return "bg-amber-500";
        default:
          return "bg-indigo-500";
      }
    }
    
    return "bg-indigo-500"; // Default color
  };
  
  // Displayed activities (all or limited)
  const displayedActivities = showAll ? activities : activities.slice(0, 3);
  
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {displayedActivities.map((activity, activityIdx) => {
          const skill = getSkill(activity.skillId);
          const iconBgColor = getActivityColor(activity);
          
          return (
            <li key={activity.id} className="relative pb-8">
              {/* Show connecting line for all except the last item */}
              {activityIdx !== displayedActivities.length - 1 ? (
                <span
                  className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              
              <div className="relative flex items-start space-x-3">
                {/* Activity icon */}
                <div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white ${iconBgColor}`}>
                    {activity.type === "update" ? (
                      <ArrowUp className="h-5 w-5 text-white" />
                    ) : (
                      <Plus className="h-5 w-5 text-white" />
                    )}
                  </div>
                </div>
                
                {/* Activity content */}
                <div className="flex-1 min-w-0">
                  <div>
                    <p className="text-sm text-gray-500">
                      {(() => {
                        // Get user info if available
                        const user = !isPersonal && users.length > 0 
                          ? users.find(u => u.id === activity.userId) 
                          : null;
                        
                        const userName = user 
                          ? (user.username || user.email?.split('@')[0] || 'User') 
                          : 'You';
                        
                        const isYou = isPersonal || !user;
                        
                        if (activity.type === "update") {
                          return (
                            <>
                              {userName} updated {" "}
                              <Link href={`/skills?edit=${activity.skillId}`} className="font-medium text-gray-900">
                                {skill ? skill.name : `Skill #${activity.skillId}`}
                              </Link> from{" "}
                              <SkillLevelBadge 
                                level={activity.previousLevel || "unknown"} 
                                className="ml-1 mr-1"
                              /> to{" "}
                              <SkillLevelBadge 
                                level={activity.newLevel} 
                                className="ml-1"
                              />
                            </>
                          );
                        } else {
                          return (
                            <>
                              {userName} added a new skill{" "}
                              <Link href={`/skills?edit=${activity.skillId}`} className="font-medium text-gray-900">
                                {skill ? skill.name : `Skill #${activity.skillId}`}
                              </Link>{" "}
                              with level{" "}
                              <SkillLevelBadge level={activity.newLevel} className="ml-1" />
                            </>
                          );
                        }
                      })()}
                    </p>
                    
                    {activity.note && (
                      <p className="mt-1 text-sm text-gray-600 italic">
                        "{activity.note}"
                      </p>
                    )}
                    
                    <div className="mt-1 text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        {formatRelativeTime(activity.date, { addSuffix: true }, 'recently')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      
      {!showAll && activities.length > 3 && (
        <div className="mt-6">
          <Link href="/history">
            <Button variant="outline" className="w-full">
              View all activity
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
