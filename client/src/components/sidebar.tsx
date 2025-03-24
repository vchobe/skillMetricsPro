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
        <div className="flex items-center space-x-3">
          <svg className="w-8 h-8 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M14.5 10a4.5 4.5 0 004.5-4.5A4.5 4.5 0 0014.5 1h-9A4.5 4.5 0 001 5.5a4.5 4.5 0 002.859 4.2.75.75 0 01.54.795v3.006c0 .502.5.785.918.528l2.834-1.72a.75.75 0 01.64-.086c.475.1.973.154 1.486.154a7.001 7.001 0 016.516 4.398.75.75 0 01-1.386.577 5.5 5.5 0 00-5.13-3.458c-.389 0-.775.035-1.154.104a2.25 2.25 0 01-1.936-.324l-2.292-1.377A1.75 1.75 0 004 12.216V9.658a1.75 1.75 0 00-1.25-1.678A3 3 0 012.5 5.5 3 3 0 015.5 2.5h9a3 3 0 110 6z" clipRule="evenodd" />
          </svg>
          <span className="text-white font-bold text-xl">Skill Metrics</span>
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
