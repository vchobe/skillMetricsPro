import { useState } from "react";
import { 
  Card,
  CardContent
} from "@/components/ui/card";

interface ChartData {
  name: string;
  value: number;
  percentage: number;
}

interface SkillChartProps {
  data: ChartData[];
}

export default function SkillChart({ data }: SkillChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Chart colors
  const getColor = (name: string) => {
    switch (name.toLowerCase()) {
      case "expert":
        return { bar: "bg-green-500", text: "text-green-600", light: "bg-green-100" };
      case "intermediate":
        return { bar: "bg-blue-500", text: "text-blue-600", light: "bg-blue-100" };
      case "beginner":
        return { bar: "bg-amber-500", text: "text-amber-600", light: "bg-amber-100" };
      default:
        return { bar: "bg-gray-500", text: "text-gray-600", light: "bg-gray-100" };
    }
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-center space-x-4 mb-4">
        {data.map((item, index) => (
          <div className="flex items-center" key={index}>
            <div className={`w-4 h-4 ${getColor(item.name).light} rounded-full mr-2`}></div>
            <span className="text-sm text-gray-600">{item.name}</span>
          </div>
        ))}
      </div>
      
      <div className="flex-1 flex items-end justify-center">
        <div className="flex items-end h-56 space-x-8">
          {data.map((item, index) => (
            <div 
              className="flex flex-col items-center"
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ 
                transition: "transform 0.2s ease-in-out",
                transform: hoveredIndex === index ? "translateY(-5px)" : "translateY(0)"
              }}
            >
              {/* Bar */}
              <div 
                className={`${getColor(item.name).bar} w-16 rounded-t-md relative group`}
                style={{ 
                  height: `${item.percentage * 2}px`,
                  minHeight: "20px",
                  maxHeight: "200px",
                  transition: "height 1s ease-out"
                }}
              >
                {/* Tooltip */}
                {hoveredIndex === index && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-md p-2 z-10 w-32">
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.value} skills</p>
                      <p className={`text-sm font-medium ${getColor(item.name).text}`}>{item.percentage}%</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Labels */}
              <span className="text-xs mt-1 text-gray-600">{item.name}</span>
              <span className="text-sm font-semibold">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
