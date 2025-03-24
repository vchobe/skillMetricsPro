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
// No need for logo import in sidebar

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
    <>
      {/* Sidebar */}
      <div 
        className="bg-gray-800 text-white flex flex-col fixed h-full z-10 hover:w-64 transition-all duration-300 ease-in-out"
        style={{ width: '64px' }}
      >
        <div className="px-2 py-5 flex justify-center items-center border-b border-gray-700">
          <div className="flex items-center group">
            <svg className="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M14.5 10a4.5 4.5 0 004.5-4.5A4.5 4.5 0 0014.5 1h-9A4.5 4.5 0 001 5.5a4.5 4.5 0 002.859 4.2.75.75 0 01.54.795v3.006c0 .502.5.785.918.528l2.834-1.72a.75.75 0 01.64-.086c.475.1.973.154 1.486.154a7.001 7.001 0 016.516 4.398.75.75 0 01-1.386.577 5.5 5.5 0 00-5.13-3.458c-.389 0-.775.035-1.154.104a2.25 2.25 0 01-1.936-.324l-2.292-1.377A1.75 1.75 0 004 12.216V9.658a1.75 1.75 0 00-1.25-1.678A3 3 0 012.5 5.5 3 3 0 015.5 2.5h9a3 3 0 110 6z" clipRule="evenodd" />
            </svg>
            <span className="ml-3 font-semibold text-xl tracking-tight hidden group-hover:block whitespace-nowrap overflow-hidden">
              Skill Metrics
            </span>
          </div>
        </div>
        
        <div className="flex flex-col flex-grow p-4 overflow-auto">
          <div className="space-y-2">
            <div>
              <Link href="/" className={`flex items-center px-4 py-3 rounded-md group ${
                currentPath === "/" 
                  ? "bg-gray-900 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}>
                <LayoutDashboard className="h-5 w-5" />
                <span className="ml-3 hidden group-hover:block">Dashboard</span>
              </Link>
            </div>
            
            {/* Skills Section */}
            <h3 className="px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden">
              Skills
            </h3>
            
            <div>
              <Link href="/skills" className={`flex items-center px-4 py-3 rounded-md group ${
                currentPath === "/skills" 
                  ? "bg-gray-900 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}>
                <Brain className="h-5 w-5" />
                <span className="ml-3 hidden group-hover:block">My Skills</span>
              </Link>
            </div>
            
            {/* Projects Section */}
            <h3 className="px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden">
              Projects
            </h3>
            
            <div>
              <Link href="/projects" className={`flex items-center px-4 py-3 rounded-md group ${
                currentPath === "/projects" 
                  ? "bg-gray-900 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}>
                <Briefcase className="h-5 w-5" />
                <span className="ml-3 hidden group-hover:block">My Projects</span>
              </Link>
            </div>
            
            {/* Clients tab - Only visible to admins */}
            {(user?.is_admin || user?.isAdmin) && (
              <div>
                <Link href="/clients" className={`flex items-center px-4 py-3 rounded-md group ${
                  currentPath === "/clients" 
                    ? "bg-gray-900 text-white" 
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}>
                  <Building2 className="h-5 w-5" />
                  <span className="ml-3 hidden group-hover:block">Clients</span>
                </Link>
              </div>
            )}
            
            {/* Organization Section */}
            <h3 className="px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden">
              Organization
            </h3>
            
            <div>
              <Link href="/organization" className={`flex items-center px-4 py-3 rounded-md group ${
                currentPath === "/organization" 
                  ? "bg-gray-900 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}>
                <BarChart4 className="h-5 w-5" />
                <span className="ml-3 hidden group-hover:block">Dashboard</span>
              </Link>
            </div>
            
            <div>
              <Link href="/profile" className={`flex items-center px-4 py-3 rounded-md group ${
                currentPath === "/profile" 
                  ? "bg-gray-900 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}>
                <UserCircle className="h-5 w-5" />
                <span className="ml-3 hidden group-hover:block">Profile</span>
              </Link>
            </div>
          </div>

          {/* Admin Section - Only visible to admins - check both property formats */}
          {(user?.is_admin || user?.isAdmin) && (
            <div className="mt-8">
              <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden">
                Admin
              </h3>
              <div className="mt-2 space-y-2">
                <div>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      // Preserve current tab state in URL, or default to dashboard
                      const params = new URLSearchParams(window.location.search);
                      const tab = params.get("tab");
                      const adminUrl = tab && ["users", "skill-history", "certifications"].includes(tab) 
                        ? `/admin?tab=${tab}` 
                        : "/admin";
                      
                      // Update URL and navigate to the proper tab
                      window.history.pushState({}, "", adminUrl);
                      setLocation(adminUrl);
                    }}
                    className={`flex items-center px-4 py-3 rounded-md group ${
                      currentPath === "/admin" 
                        ? "bg-gray-900 text-white" 
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <BarChart4 className="h-5 w-5" />
                    <span className="ml-3 hidden group-hover:block">Admin Dashboard</span>
                  </a>
                </div>
                
                <div>
                  <Link href="/project-management" className={`flex items-center px-4 py-3 rounded-md group ${
                    currentPath === "/project-management" 
                      ? "bg-gray-900 text-white" 
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}>
                    <FolderKanban className="h-5 w-5" />
                    <span className="ml-3 hidden group-hover:block">Project Management</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center group">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={`${user?.firstName} ${user?.lastName}`} />
              <AvatarFallback className="bg-indigo-600 text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 hidden group-hover:block">
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
    </>
  );
}
