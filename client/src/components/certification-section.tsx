import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

// Define AdditionalCertification type
type AdditionalCertification = {
  name: string;
  link: string;
};

// Define props for the CertificationSection component
interface CertificationSectionProps {
  skillName: string;
  certification: string;
  credlyLink: string;
  additionalCertifications?: AdditionalCertification[];
  isDisabled: boolean;
  onCertificationChange: (skillName: string, certification: string) => void;
  onCertificationLinkChange: (skillName: string, credlyLink: string) => void;
  onAddAdditionalCertification: (skillName: string) => void;
  onRemoveAdditionalCertification: (skillName: string, index: number) => void;
  onAdditionalCertificationChange: (skillName: string, index: number, field: 'name' | 'link', value: string) => void;
}

// Component for managing certifications in the add skills page
export function CertificationSection({
  skillName,
  certification,
  credlyLink,
  additionalCertifications = [],
  isDisabled,
  onCertificationChange,
  onCertificationLinkChange,
  onAddAdditionalCertification,
  onRemoveAdditionalCertification,
  onAdditionalCertificationChange
}: CertificationSectionProps) {
  return (
    <div className="space-y-3">
      {/* Primary certification */}
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">Primary Certification</div>
        <Input
          placeholder="Certification name"
          value={certification}
          onChange={(e) => onCertificationChange(skillName, e.target.value)}
          disabled={isDisabled}
          className="w-full max-w-xs text-xs"
        />
        <Input
          placeholder="Certification link"
          value={credlyLink}
          onChange={(e) => onCertificationLinkChange(skillName, e.target.value)}
          disabled={isDisabled}
          className="w-full max-w-xs text-xs mt-1"
        />
      </div>
      
      {/* Additional certifications */}
      {additionalCertifications.map((cert, index) => (
        <div key={index} className="space-y-1 pt-1 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Additional Certification {index + 1}</div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemoveAdditionalCertification(skillName, index)}
              disabled={isDisabled}
              className="h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <Input
            placeholder="Certification name"
            value={cert.name}
            onChange={(e) => onAdditionalCertificationChange(skillName, index, 'name', e.target.value)}
            disabled={isDisabled}
            className="w-full max-w-xs text-xs"
          />
          <Input
            placeholder="Certification link"
            value={cert.link}
            onChange={(e) => onAdditionalCertificationChange(skillName, index, 'link', e.target.value)}
            disabled={isDisabled}
            className="w-full max-w-xs text-xs mt-1"
          />
        </div>
      ))}
      
      {/* Add certification button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onAddAdditionalCertification(skillName)}
        disabled={isDisabled}
        className="text-xs mt-1"
      >
        <Plus className="h-3 w-3 mr-1" /> Add Certification
      </Button>
    </div>
  );
}