import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Brain, 
  UserCircle, 
  BarChart4,
  UsersRound,
  LogOut,
  Briefcase,
  Building2,
  FolderKanban
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  currentPath: string;
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ currentPath, isOpen, setIsOpen }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className={`bg-gray-800 text-white h-screen w-64 fixed left-0 top-0 transform transition-transform duration-300 ease-in-out z-20 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center">
          <span className="text-white font-bold text-xl">Menu</span>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <Link href="/" className={`flex items-center p-2 rounded ${currentPath === "/" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`}>
              <LayoutDashboard className="w-5 h-5 mr-3" />
              <span>Dashboard</span>
            </Link>
          </li>
          
          <li>
            <Link href="/skills" className={`flex items-center p-2 rounded ${currentPath === "/skills" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`}>
              <Brain className="w-5 h-5 mr-3" />
              <span>My Skills</span>
            </Link>
          </li>
          
          <li>
            <Link href="/projects" className={`flex items-center p-2 rounded ${currentPath === "/projects" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`}>
              <Briefcase className="w-5 h-5 mr-3" />
              <span>My Projects</span>
            </Link>
          </li>
          
          {(user?.is_admin || user?.isAdmin) && (
            <li>
              <Link href="/clients" className={`flex items-center p-2 rounded ${currentPath === "/clients" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`}>
                <Building2 className="w-5 h-5 mr-3" />
                <span>Clients</span>
              </Link>
            </li>
          )}
          
          <li>
            <Link href="/organization" className={`flex items-center p-2 rounded ${currentPath === "/organization" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`}>
              <BarChart4 className="w-5 h-5 mr-3" />
              <span>Organization</span>
            </Link>
          </li>
          
          <li>
            <Link href="/profile" className={`flex items-center p-2 rounded ${currentPath === "/profile" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`}>
              <UserCircle className="w-5 h-5 mr-3" />
              <span>Profile</span>
            </Link>
          </li>
        </ul>
        
        {(user?.is_admin || user?.isAdmin) && (
          <div className="mt-6">
            <h3 className="text-xs uppercase text-gray-400 font-semibold mb-2 px-2">Admin</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    const params = new URLSearchParams(window.location.search);
                    const tab = params.get("tab");
                    const adminUrl = tab && ["users", "skill-history", "certifications"].includes(tab)
                      ? `/admin?tab=${tab}`
                      : "/admin";
                    window.history.pushState({}, "", adminUrl);
                    setLocation(adminUrl);
                  }}
                  className={`flex items-center p-2 rounded ${currentPath === "/admin" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`}
                >
                  <BarChart4 className="w-5 h-5 mr-3" />
                  <span>Admin Dashboard</span>
                </a>
              </li>
              
              <li>
                <Link
                  href="/project-management"
                  className={`flex items-center p-2 rounded ${currentPath === "/project-management" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`}
                >
                  <FolderKanban className="w-5 h-5 mr-3" />
                  <span>Project Management</span>
                </Link>
              </li>
            </ul>
          </div>
        )}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt={`${user?.firstName} ${user?.lastName}`} />
            <AvatarFallback className="bg-indigo-600 text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-white flex items-center mt-1"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
