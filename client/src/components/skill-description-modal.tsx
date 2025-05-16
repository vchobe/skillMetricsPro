import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface SkillDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillName: string;
  initialDescription?: string;
  onSave: (description: string) => void;
}

export function SkillDescriptionModal({
  isOpen,
  onClose,
  skillName,
  initialDescription = "",
  onSave,
}: SkillDescriptionModalProps) {
  const [description, setDescription] = useState(initialDescription);

  const handleSave = () => {
    onSave(description);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Description for {skillName}</DialogTitle>
          <DialogDescription>
            Provide a detailed description of your experience with this skill.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your experience, projects, or achievements related to this skill..."
            className="min-h-[150px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Description</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}