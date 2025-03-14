import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Brain, 
  Clock, 
  UserCircle, 
  ChevronLeft, 
  ChevronRight,
  BarChart4,
  UsersRound,
  LogOut,
  Trophy
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
// Import the logo directly as a module
import atyetiLogo from "../assets/Atyeti_logo.png";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentPath: string;
}

export default function Sidebar({ isOpen, setIsOpen, currentPath }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  // Check if on mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`w-64 bg-gray-800 text-white flex flex-col fixed h-full z-50 transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-20"
        }`}
      >
        <div className="px-4 py-5 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center">
            <img src={atyetiLogo} alt="Atyeti Logo" className="h-8 w-auto object-contain bg-white rounded-sm p-1" />
            {(isOpen || !isMobile) && (
              <span className={`font-semibold text-xl tracking-tight ml-2 ${!isOpen && "lg:hidden"}`}>
                SkillMetrics
              </span>
            )}
          </div>
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-white"
            >
              {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </Button>
          )}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white lg:hidden"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <div className="flex flex-col flex-grow p-4 overflow-auto">
          <div className="space-y-2">
            <Link href="/" className={`flex items-center px-4 py-3 rounded-md ${
              currentPath === "/" 
                ? "bg-gray-900 text-white" 
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}>
              <LayoutDashboard className="h-5 w-5" />
              {(isOpen || !isMobile) && (
                <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>Dashboard</span>
              )}
            </Link>
            
            <Link href="/skills" className={`flex items-center px-4 py-3 rounded-md ${
              currentPath === "/skills" 
                ? "bg-gray-900 text-white" 
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}>
              <Brain className="h-5 w-5" />
              {(isOpen || !isMobile) && (
                <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>My Skills</span>
              )}
            </Link>
            
            <Link href="/organization" className={`flex items-center px-4 py-3 rounded-md ${
              currentPath === "/organization" 
                ? "bg-gray-900 text-white" 
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}>
              <BarChart4 className="h-5 w-5" />
              {(isOpen || !isMobile) && (
                <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>Organization</span>
              )}
            </Link>
            
            <Link href="/leaderboard" className={`flex items-center px-4 py-3 rounded-md ${
              currentPath === "/leaderboard" 
                ? "bg-gray-900 text-white" 
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}>
              <Trophy className="h-5 w-5" />
              {(isOpen || !isMobile) && (
                <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>Leaderboard</span>
              )}
            </Link>
            
            <Link href="/users" className={`flex items-center px-4 py-3 rounded-md ${
              currentPath === "/users" 
                ? "bg-gray-900 text-white" 
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}>
              <UsersRound className="h-5 w-5" />
              {(isOpen || !isMobile) && (
                <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>Users</span>
              )}
            </Link>
            
            <Link href="/history" className={`flex items-center px-4 py-3 rounded-md ${
              currentPath === "/history" 
                ? "bg-gray-900 text-white" 
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}>
              <Clock className="h-5 w-5" />
              {(isOpen || !isMobile) && (
                <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>Skill History</span>
              )}
            </Link>
            
            <Link href="/profile" className={`flex items-center px-4 py-3 rounded-md ${
              currentPath === "/profile" 
                ? "bg-gray-900 text-white" 
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}>
              <UserCircle className="h-5 w-5" />
              {(isOpen || !isMobile) && (
                <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>Profile</span>
              )}
            </Link>
          </div>

          {/* Admin Section - Only visible to admins - check both property formats */}
          {(user?.is_admin || user?.isAdmin) && (
            <div className="mt-8">
              {(isOpen || !isMobile) && (
                <h3 className={`px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${!isOpen && "lg:hidden"}`}>
                  Admin
                </h3>
              )}
              <div className="mt-2 space-y-2">
                <Link href="/admin" className={`flex items-center px-4 py-3 rounded-md ${
                  currentPath === "/admin" 
                    ? "bg-gray-900 text-white" 
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}>
                  <BarChart4 className="h-5 w-5" />
                  {(isOpen || !isMobile) && (
                    <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>Admin Dashboard</span>
                  )}
                </Link>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-700">
          {(isOpen || !isMobile) ? (
            <div className="flex items-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={`${user?.firstName} ${user?.lastName}`} />
                <AvatarFallback className="bg-indigo-600 text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className={`ml-3 ${!isOpen && "lg:hidden"}`}>
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
          ) : (
            <div className="flex flex-col items-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={`${user?.firstName} ${user?.lastName}`} />
                <AvatarFallback className="bg-indigo-600 text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-white flex items-center mt-2"
              >
                <LogOut className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
