import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SkillDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillName: string;
  initialDescription?: string;
  onSave: (description: string) => void;
}

const MAX_DESCRIPTION_LENGTH = 500;

export function SkillDescriptionModal({
  isOpen,
  onClose,
  skillName,
  initialDescription = "",
  onSave,
}: SkillDescriptionModalProps) {
  const [description, setDescription] = useState(initialDescription);
  const { toast } = useToast();
  const charactersRemaining = MAX_DESCRIPTION_LENGTH - description.length;

  const handleSave = () => {
    onSave(description);
    toast({
      title: "Description saved",
      description: "Your skill description has been saved.",
      duration: 3000,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Description for {skillName}</DialogTitle>
          <DialogDescription>
            Describe your experience or context with this skill.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your experience with this skill..."
            className="min-h-[150px]"
            maxLength={MAX_DESCRIPTION_LENGTH}
          />
          <p className={`text-xs mt-2 text-right ${charactersRemaining < 50 ? 'text-red-500' : 'text-gray-500'}`}>
            {charactersRemaining} characters remaining
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SkillDescriptionModal;