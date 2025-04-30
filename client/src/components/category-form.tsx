import { useState } from "react";
import { SkillCategory } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Code, Database, Server, Cpu, Activity, BarChart, Shield, Globe, Zap, Cloud, Box, Terminal } from "lucide-react";

// Available icons for category selection
const availableIcons = [
  { name: "code", component: <Code size={16} /> },
  { name: "database", component: <Database size={16} /> },
  { name: "server", component: <Server size={16} /> },
  { name: "cpu", component: <Cpu size={16} /> },
  { name: "activity", component: <Activity size={16} /> },
  { name: "barChart", component: <BarChart size={16} /> },
  { name: "shield", component: <Shield size={16} /> },
  { name: "globe", component: <Globe size={16} /> },
  { name: "zap", component: <Zap size={16} /> },
  { name: "cloud", component: <Cloud size={16} /> },
  { name: "box", component: <Box size={16} /> },
  { name: "terminal", component: <Terminal size={16} /> },
];

// Helper function to get icon component by name
function getIconByName(name: string) {
  const icon = availableIcons.find(i => i.name === name);
  return icon ? icon.component : <Code size={16} />;
}

// Category Edit Form Component
interface CategoryFormProps {
  category?: SkillCategory;
  onSave: (category: Partial<SkillCategory>) => void;
  onCancel: () => void;
}

export function CategoryForm({ category, onSave, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [tabOrder, setTabOrder] = useState(category?.tabOrder?.toString() || "0");
  const [visibility, setVisibility] = useState<"visible" | "hidden">(category?.visibility || "visible");
  const [color, setColor] = useState(category?.color || "#3B82F6");
  const [icon, setIcon] = useState(category?.icon || "code");
  const [categoryType, setCategoryType] = useState<"technical" | "functional">(category?.categoryType || "technical");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      tabOrder: parseInt(tabOrder),
      visibility,
      color,
      icon,
      categoryType
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Category Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Frontend Development"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Skills related to frontend web development"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tabOrder">Tab Order</Label>
            <Input
              id="tabOrder"
              type="number"
              value={tabOrder}
              onChange={(e) => setTabOrder(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={(value: "visible" | "hidden") => setVisibility(value)}>
              <SelectTrigger id="visibility">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex space-x-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3B82F6"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Select value={icon} onValueChange={(value) => setIcon(value)}>
              <SelectTrigger id="icon" className="flex items-center">
                <div className="mr-2">
                  {getIconByName(icon)}
                </div>
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                {availableIcons.map((icon) => (
                  <SelectItem key={icon.name} value={icon.name} className="flex items-center">
                    <div className="mr-2">{icon.component}</div>
                    <span className="capitalize">{icon.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="categoryType">Category Type</Label>
          <Select value={categoryType} onValueChange={(value: "technical" | "functional") => setCategoryType(value)}>
            <SelectTrigger id="categoryType">
              <SelectValue placeholder="Select category type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="functional">Functional</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Technical categories appear in the Technical Skills tab, Functional categories in the Functional Skills tab.
          </p>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X size={16} className="mr-2" /> Cancel
        </Button>
        <Button type="submit">
          <Save size={16} className="mr-2" /> Save Category
        </Button>
      </div>
    </form>
  );
}