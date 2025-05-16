import { useState } from 'react';
import { useLocation } from 'wouter';
import Header from './header';
import Sidebar from './sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        currentPath={location} 
      />
      <div className="flex flex-col md:pl-64">
        <Header isSidebarOpen={isSidebarOpen} onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}