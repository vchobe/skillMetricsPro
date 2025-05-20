import React from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type AdditionalCertification = {
  name: string;
  link: string;
};

export type CertificationData = {
  mainCertification: {
    name: string;
    link: string;
  };
  additionalCertifications: AdditionalCertification[];
};

interface CertificationSectionProps {
  skillName: string;
  certification: string;
  credlyLink: string;
  additionalCertifications: AdditionalCertification[];
  onMainCertificationChange: (skillName: string, value: string) => void;
  onMainCertificationLinkChange: (skillName: string, value: string) => void;
  onAddCertification: (skillName: string) => void;
  onRemoveCertification: (skillName: string, index: number) => void;
  onCertificationFieldChange: (skillName: string, index: number, field: 'name' | 'link', value: string) => void;
  disabled: boolean;
}

export default function CertificationSection({
  skillName,
  certification,
  credlyLink,
  additionalCertifications,
  onMainCertificationChange,
  onMainCertificationLinkChange,
  onAddCertification,
  onRemoveCertification,
  onCertificationFieldChange,
  disabled
}: CertificationSectionProps) {
  return (
    <div className="space-y-3">
      {/* Primary certification */}
      <div className="space-y-1">
        <Input
          placeholder="Certification name"
          value={certification}
          onChange={(e) => onMainCertificationChange(skillName, e.target.value)}
          disabled={disabled}
          className="w-full max-w-xs text-xs"
        />
        <Input
          placeholder="Certification link"
          value={credlyLink}
          onChange={(e) => onMainCertificationLinkChange(skillName, e.target.value)}
          disabled={disabled}
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
              onClick={() => onRemoveCertification(skillName, index)}
              disabled={disabled}
              className="h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <Input
            placeholder="Certification name"
            value={cert.name}
            onChange={(e) => onCertificationFieldChange(skillName, index, 'name', e.target.value)}
            disabled={disabled}
            className="w-full max-w-xs text-xs"
          />
          <Input
            placeholder="Certification link"
            value={cert.link}
            onChange={(e) => onCertificationFieldChange(skillName, index, 'link', e.target.value)}
            disabled={disabled}
            className="w-full max-w-xs text-xs mt-1"
          />
        </div>
      ))}
      
      {/* Add certification button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onAddCertification(skillName)}
        disabled={disabled}
        className="text-xs mt-1"
      >
        <Plus className="h-3 w-3 mr-1" /> Add Certification
      </Button>
    </div>
  );
}