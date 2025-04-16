import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Skill } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp } from "lucide-react";

interface EndorsementFormProps {
  skill: Skill;
  onSuccess?: () => void;
}

export default function EndorsementForm({ skill, onSuccess }: EndorsementFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  
  const createEndorsementMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/skills/${skill.id}/endorse`, { comment });
    },
    onSuccess: () => {
      toast({
        title: "Skill endorsed",
        description: `You've endorsed ${skill.name}`,
      });
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/skills", skill.id, "endorsements"] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error endorsing skill",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEndorsementMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Endorse this skill</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Textarea
            placeholder="Add a comment about this skill (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            type="submit" 
            disabled={createEndorsementMutation.isPending}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            Endorse Skill
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}