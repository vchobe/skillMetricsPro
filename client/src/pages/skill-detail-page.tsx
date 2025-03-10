import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skill, Endorsement, User } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import SkillLevelBadge from "@/components/skill-level-badge";
import EndorsementForm from "@/components/endorsement-form";
import EndorsementCard from "@/components/endorsement-card";
import { useAuth } from "@/hooks/use-auth";
import { 
  ChevronLeft, 
  Award, 
  Clock, 
  ThumbsUp, 
  History 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/date-utils";

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: skill, isLoading: isLoadingSkill } = useQuery<Skill>({
    queryKey: ["/api/skills", parseInt(id)],
    queryFn: ({ signal }) => 
      fetch(`/api/skills/${id}`, { signal })
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch skill");
          return res.json();
        }),
  });
  
  const { data: endorsements, isLoading: isLoadingEndorsements } = useQuery<Endorsement[]>({
    queryKey: ["/api/skills", parseInt(id), "endorsements"],
    queryFn: ({ signal }) => 
      fetch(`/api/skills/${id}/endorsements`, { signal })
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch endorsements");
          return res.json();
        }),
    enabled: !!id,
  });
  
  const { data: skillHistory, isLoading: isLoadingHistory } = useQuery<any[]>({
    queryKey: ["/api/skills", parseInt(id), "history"],
    queryFn: ({ signal }) => 
      fetch(`/api/skills/${id}/history`, { signal })
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch skill history");
          return res.json();
        }),
    enabled: !!id,
  });
  
  const { data: users, isLoading: isLoadingUsers } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ["/api/admin/users"],
    queryFn: ({ signal }) => 
      fetch("/api/admin/users", { signal })
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch users");
          return res.json();
        }),
    enabled: !!user?.is_admin,
  });
  
  // Get the endorser information
  const getEndorserInfo = (endorserId: number) => {
    return users?.find((u) => u.id === endorserId);
  };
  
  // Check if the current user can endorse this skill (not their own)
  const canEndorse = user && skill && user.id !== skill.userId;
  
  const isLoading = isLoadingSkill || isLoadingEndorsements || isLoadingHistory;
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  
  if (!skill) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Skill not found</h2>
          <p className="text-muted-foreground mb-6">
            The skill you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/skills">
            <Button>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Skills
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Link href="/skills">
          <Button variant="ghost" size="sm" className="mr-2">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Skills
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{skill.name}</h1>
        <SkillLevelBadge level={skill.level} className="ml-3" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="endorsements">
                Endorsements ({endorsements?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Skill Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
                      <p>{skill.category}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Proficiency Level</h3>
                      <p>
                        <SkillLevelBadge level={skill.level} />
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
                      <p className="flex items-center">
                        <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                        {skill.lastUpdated ? formatDistanceToNow(new Date(skill.lastUpdated), { addSuffix: true }) : "Not available"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Endorsements</h3>
                      <p className="flex items-center">
                        <ThumbsUp className="mr-1 h-4 w-4 text-muted-foreground" />
                        {skill.endorsementCount || 0} endorsements
                      </p>
                    </div>
                  </div>
                  
                  {skill.certification && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Certification</h3>
                        <p className="flex items-center">
                          <Award className="mr-1 h-4 w-4 text-muted-foreground" />
                          {skill.certification}
                        </p>
                        {skill.credlyLink && (
                          <a 
                            href={skill.credlyLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline mt-1 inline-block"
                          >
                            View Certification
                          </a>
                        )}
                      </div>
                    </>
                  )}
                  
                  {skill.notes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
                        <p className="whitespace-pre-wrap">{skill.notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="endorsements">
              <div className="space-y-4">
                {endorsements && endorsements.length > 0 ? (
                  endorsements.map((endorsement) => {
                    const endorser = getEndorserInfo(endorsement.endorserId);
                    return endorser ? (
                      <EndorsementCard 
                        key={endorsement.id} 
                        endorsement={endorsement} 
                        endorser={endorser}
                      />
                    ) : null;
                  })
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <ThumbsUp className="h-10 w-10 text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium mb-1">No endorsements yet</h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        This skill hasn't been endorsed yet. Be the first to recognize this talent!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Skill History</CardTitle>
                </CardHeader>
                <CardContent>
                  {skillHistory && skillHistory.length > 0 ? (
                    <div className="space-y-4">
                      {skillHistory.map((entry) => (
                        <div key={entry.id} className="flex">
                          <div className="mr-4 relative">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <History className="h-4 w-4 text-primary" />
                            </div>
                            {/* vertical line connecting timeline items */}
                            <div className="absolute top-8 bottom-0 left-1/2 w-0.5 -ml-px bg-border" />
                          </div>
                          <div className="pb-8">
                            <p className="font-medium">
                              {entry.previousLevel ? (
                                <>Updated from <SkillLevelBadge level={entry.previousLevel} /> to <SkillLevelBadge level={entry.newLevel} /></>
                              ) : (
                                <>Skill created as <SkillLevelBadge level={entry.newLevel} /></>
                              )}
                            </p>
                            {entry.changeNote && (
                              <p className="text-sm text-muted-foreground mt-1">{entry.changeNote}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {entry.createdAt ? formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true }) : "Not available"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No history available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          {canEndorse ? (
            <EndorsementForm skill={skill} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About Endorsements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Endorsements help recognize and validate skills within your organization.
                  {skill.userId === user?.id 
                    ? " You cannot endorse your own skills."
                    : " Please log in to endorse this skill."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}