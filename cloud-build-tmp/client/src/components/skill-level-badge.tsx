import { cn } from "@/lib/utils";

type SkillLevel = "beginner" | "intermediate" | "expert";

interface SkillLevelBadgeProps {
  level: string;
  size?: "sm" | "md";
  className?: string;
}

export default function SkillLevelBadge({ level, size = "md", className }: SkillLevelBadgeProps) {
  // Handle null or undefined levels
  const safeLevel = level || "unknown";
  
  const getColorClasses = (level: string) => {
    try {
      switch (level.toLowerCase()) {
        case "beginner":
          return "bg-amber-100 text-amber-800";
        case "intermediate":
          return "bg-blue-100 text-blue-800";
        case "expert":
          return "bg-green-100 text-green-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    } catch (e) {
      return "bg-gray-100 text-gray-800";
    }
  };
  
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-0.5 text-xs"
  };

  return (
    <span 
      className={cn(
        "inline-flex leading-5 font-semibold rounded-full",
        getColorClasses(safeLevel),
        sizeClasses[size],
        className
      )}
    >
      {safeLevel && typeof safeLevel === 'string' ? 
        safeLevel.charAt(0).toUpperCase() + safeLevel.slice(1) : 
        "Unknown"}
    </span>
  );
}
