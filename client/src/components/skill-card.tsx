import { ReactNode } from "react";
import { Link } from "wouter";
import { Skill } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PencilIcon,
  Trash2Icon,
  ClockIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { format } from "date-fns";
import SkillLevelBadge from "./skill-level-badge";

interface SkillCardProps {
  skill: Skill;
  onEdit: () => void;
  onDelete: () => void;
  icon: ReactNode;
}

export default function SkillCard({ skill, onEdit, onDelete, icon }: SkillCardProps) {
  // Determine background color based on skill category
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'programming':
        return 'bg-indigo-100 text-indigo-600';
      case 'database':
        return 'bg-blue-100 text-blue-600';
      case 'cloud':
        return 'bg-purple-100 text-purple-600';
      case 'design':
        return 'bg-pink-100 text-pink-600';
      case 'devops':
        return 'bg-amber-100 text-amber-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  return (
    <Card className="overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <CardTitle className="text-lg font-semibold">{skill.name}</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 text-gray-400 hover:text-gray-500"
          >
            <PencilIcon className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-gray-400 hover:text-red-500"
          >
            <Trash2Icon className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 py-4">
        <div className="flex items-center mb-4">
          <div className={`flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-md ${getCategoryColor(skill.category)}`}>
            {icon}
          </div>
          <div className="ml-4">
            <SkillLevelBadge level={skill.level} />
            <p className="text-sm text-gray-500 mt-1">{skill.category}</p>
          </div>
        </div>
        
        {skill.notes && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">{skill.notes}</p>
          </div>
        )}
        
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 flex items-center">
              <ClockIcon className="h-3 w-3 mr-1" />
              Last updated:
            </span>
            <span className="text-xs text-gray-700">
              {format(new Date(skill.lastUpdated), "MMM dd, yyyy")}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Certifications:</span>
            <div className="flex items-center">
              {skill.certification ? (
                <div className="flex items-center">
                  {skill.credlyLink ? (
                    <a 
                      href={skill.credlyLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-indigo-600 hover:text-indigo-900 flex items-center"
                    >
                      {skill.certification.length > 20 
                        ? `${skill.certification.substring(0, 20)}...` 
                        : skill.certification}
                      <ExternalLinkIcon className="h-3 w-3 ml-1" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-700">{skill.certification}</span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-500">None</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 py-3 bg-gray-50 flex justify-between items-center">
        <Link href={`/history?skillId=${skill.id}`}>
          <a className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center">
            <ClockIcon className="h-3 w-3 mr-1" /> History
          </a>
        </Link>
        
        <Link href={`/skills?edit=${skill.id}`}>
          <a className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center">
            Details <ExternalLinkIcon className="h-3 w-3 ml-1" />
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
}
