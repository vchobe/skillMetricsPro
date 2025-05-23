import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  Brain, 
  Clock, 
  UserCircle, 
  ChevronLeft, 
  ChevronRight,
  BarChart4,
  LogOut,
  Trophy,
  Briefcase,
  Building,
  Box,
  Tag
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
// No need for logo import in sidebar

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentPath: string;
}

export default function Sidebar({ isOpen, setIsOpen, currentPath }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if the current user is an approver
  const { data: isApprover = false } = useQuery<boolean>({
    queryKey: ['/api/user/is-approver'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
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
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-24"
        }`}
      >
        <div className="px-4 py-5 flex justify-between items-center border-b border-gray-700">
          <div className={`flex items-center ${!isOpen ? "lg:justify-center lg:w-full" : ""}`}>
            {(isOpen || !isMobile) && (
              <span className={`font-semibold text-xl tracking-tight ${!isOpen && "lg:hidden"}`}>
                Skill Metrics
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
            <div>
              <Link href="/" className={`flex ${!isOpen ? "lg:justify-center" : ""} items-center px-4 py-3 rounded-md ${
                currentPath === "/" 
                  ? "bg-gray-900 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}>
                <LayoutDashboard className="h-5 w-5" />
                {(isOpen || !isMobile) && (
                  <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>Dashboard</span>
                )}
              </Link>
            </div>
            
            <div>
              <Link href="/skills" className={`flex ${!isOpen ? "lg:justify-center" : ""} items-center px-4 py-3 rounded-md ${
                currentPath === "/skills" 
                  ? "bg-gray-900 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}>
                <Brain className="h-5 w-5" />
                {(isOpen || !isMobile) && (
                  <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>My Skills</span>
                )}
              </Link>
            </div>
            
            <div>
              <Link href="/organization" className={`flex ${!isOpen ? "lg:justify-center" : ""} items-center px-4 py-3 rounded-md ${
                currentPath === "/organization" 
                  ? "bg-gray-900 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}>
                <BarChart4 className="h-5 w-5" />
                {(isOpen || !isMobile) && (
                  <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>Organization</span>
                )}
              </Link>
            </div>
            


            
            <div>
              <Link href="/profile" className={`flex ${!isOpen ? "lg:justify-center" : ""} items-center px-4 py-3 rounded-md ${
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
          </div>

          {/* Approver Section - Removed duplicate */}

          {/* Admin Section - Only visible to admins */}
          {(user?.is_admin || user?.isAdmin) && (
            <div className="mt-8">
              {(isOpen || !isMobile) && (
                <h3 className={`px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${!isOpen && "lg:hidden"}`}>
                  Admin
                </h3>
              )}
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
                    className={`flex ${!isOpen ? "lg:justify-center" : ""} items-center px-4 py-3 rounded-md ${
                      currentPath === "/admin" 
                        ? "bg-gray-900 text-white" 
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <BarChart4 className="h-5 w-5" />
                    {(isOpen || !isMobile) && (
                      <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>Admin Dashboard</span>
                    )}
                  </a>
                </div>
                
                <div>
                  <Link href="/projects" className={`flex ${!isOpen ? "lg:justify-center" : ""} items-center px-4 py-3 rounded-md ${
                    currentPath === "/projects" || currentPath.startsWith("/projects/")
                      ? "bg-gray-900 text-white" 
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}>
                    <Briefcase className="h-5 w-5" />
                    {(isOpen || !isMobile) && (
                      <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>Projects</span>
                    )}
                  </Link>
                </div>
                
                <div>
                  <Link href="/clients" className={`flex ${!isOpen ? "lg:justify-center" : ""} items-center px-4 py-3 rounded-md ${
                    currentPath === "/clients" 
                      ? "bg-gray-900 text-white" 
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}>
                    <Building className="h-5 w-5" />
                    {(isOpen || !isMobile) && (
                      <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>Clients</span>
                    )}
                  </Link>
                </div>
                
                <div>
                  <Link href="/category-management" className={`flex ${!isOpen ? "lg:justify-center" : ""} items-center px-4 py-3 rounded-md ${
                    currentPath === "/category-management" 
                      ? "bg-gray-900 text-white" 
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}>
                    <Tag className="h-5 w-5" />
                    {(isOpen || !isMobile) && (
                      <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>Categories</span>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {/* Approver Section - Visible to approvers who are not admins */}
          {isApprover && !(user?.is_admin || user?.isAdmin) && (
            <div className="mt-8">
              {(isOpen || !isMobile) && (
                <h3 className={`px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${!isOpen && "lg:hidden"}`}>
                  Approver
                </h3>
              )}
              <div className="mt-2 space-y-2">
                <div>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      // For non-admin approvers, always navigate to the skill-updates tab
                      const adminUrl = "/admin?tab=approvals";
                      
                      // Update URL and navigate to the proper tab
                      window.history.pushState({}, "", adminUrl);
                      setLocation(adminUrl);
                    }}
                    className={`flex ${!isOpen ? "lg:justify-center" : ""} items-center px-4 py-3 rounded-md ${
                      currentPath === "/admin" && new URLSearchParams(window.location.search).get("tab") === "approvals"
                        ? "bg-gray-900 text-white" 
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <BarChart4 className="h-5 w-5" />
                    {(isOpen || !isMobile) && (
                      <span className={`ml-3 ${!isOpen && "lg:hidden"}`}>Approvals</span>
                    )}
                  </a>
                </div>
                
                {/* Categories link removed for non-admin approvers */}
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
