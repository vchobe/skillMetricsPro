import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { getQueryFn } from "../lib/queryClient";
import { formatDate, DATE_FORMATS } from "../lib/date-utils";

import Header from "../components/header";
import Sidebar from "../components/sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Building2, Mail, Phone, MapPin, Search, Plus, Briefcase } from "lucide-react";

type Client = {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  projectCount?: number;
};

export default function ClientsPage() {
  const [, setLocation] = useLocation();
  // With a fixed sidebar, content needs to have appropriate left margin
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const isAdmin = user?.is_admin || user?.isAdmin;

  // Fetch clients
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: getQueryFn({
      on401: "throw",
      url: "/api/clients",
    }),
    enabled: isAdmin, // Only fetch if user is admin
  });

  // Calculate project counts for each client
  const { data: projectCounts } = useQuery<Record<number, number>>({
    queryKey: ["client-project-counts"],
    queryFn: getQueryFn({
      on401: "throw",
      url: "/api/clients/project-counts",
    }),
    enabled: isAdmin && !!clients,
  });

  // Filter clients by search query
  const filteredClients = clients?.filter((client) => {
    return searchQuery === "" || 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.description.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  // Add project counts to clients
  const clientsWithProjects = filteredClients.map(client => ({
    ...client,
    projectCount: projectCounts?.[client.id] || 0
  }));

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
        <Sidebar currentPath="/clients" />
        
        <div className="flex-1 ml-64 flex flex-col overflow-hidden">
          <Header 
            title="Clients" 
            toggleSidebar={() => {}} 
            isSidebarOpen={false} 
          />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="flex flex-col items-center justify-center h-full">
              <Building2 className="h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
                You need administrator privileges to view the client management section.
              </p>
              <Button onClick={() => setLocation("/")}>
                Return to Dashboard
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      <Sidebar currentPath="/clients" />
      
      <div className="flex-1 ml-64 flex flex-col overflow-hidden">
        <Header 
          title="Clients" 
          toggleSidebar={() => {}} 
          isSidebarOpen={false} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="search"
                placeholder="Search clients by name, email, phone..."
                className="w-full bg-white dark:bg-gray-800 pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={() => setLocation("/project-management?tab=clients")}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Client
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center p-12 border rounded-lg bg-white dark:bg-gray-800">
              <Building2 className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No clients found</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                {searchQuery ? "Try a different search term" : "You haven't added any clients yet"}
              </p>
              <Button 
                onClick={() => setLocation("/project-management?tab=clients")}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientsWithProjects.map((client) => (
                <Card 
                  key={client.id} 
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/clients/${client.id}`)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold truncate">{client.name}</CardTitle>
                    {client.contactPerson && (
                      <CardDescription>
                        Contact: {client.contactPerson}
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <div className="space-y-3">
                      {client.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      
                      {client.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 text-gray-500 mr-2" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      
                      {client.address && (
                        <div className="flex items-start text-sm">
                          <MapPin className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                          <span className="truncate">{client.address}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm">
                        <Briefcase className="h-4 w-4 text-gray-500 mr-2" />
                        <span>{client.projectCount} {client.projectCount === 1 ? "project" : "projects"}</span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-2 border-t">
                    <Button variant="ghost" size="sm" className="text-xs w-full">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}