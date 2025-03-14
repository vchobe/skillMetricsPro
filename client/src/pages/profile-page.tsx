import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ProfileHistory } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from "@/components/ui/form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, 
  UserCircle, 
  Mail, 
  Briefcase, 
  MapPin, 
  Clock, 
  FileEdit 
} from "lucide-react";
import { format } from "date-fns";

// Profile schema
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  project: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

// Password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Get profile history
  const { data: profileHistory, isLoading: isLoadingHistory } = useQuery<ProfileHistory[]>({
    queryKey: ["/api/user/profile/history"],
  });
  
  // Profile form
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      project: user?.project || "",
      role: user?.role || "",
      location: user?.location || "",
    }
  });
  
  // Password form
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });
  
  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      console.log("User data for profile form:", user);
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        project: user.project || "",
        role: user.role || "",
        location: user.location || "",
      });
    }
  }, [user, profileForm]);
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileValues) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile/history"] });
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Profile",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Password change mutation (simplified, would need server implementation)
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordValues) => {
      // This would need a corresponding API endpoint in the server
      // For now, we're just mocking the API call for demo purposes
      console.log("Would change password with:", data);
      
      // Simulate API call
      return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Changing Password",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Form submissions
  const onProfileSubmit = (data: ProfileValues) => {
    updateProfileMutation.mutate(data);
  };
  
  const onPasswordSubmit = (data: PasswordValues) => {
    changePasswordMutation.mutate(data);
  };
  
  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPath="/profile" />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header 
          title="Profile" 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-6 rounded-xl text-white mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <Avatar className="h-16 w-16 border-2 border-white">
                  <AvatarImage src="" alt={`${user?.firstName} ${user?.lastName}`} />
                  <AvatarFallback className="text-xl bg-indigo-300 text-indigo-800">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <h2 className="text-2xl font-bold">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="opacity-90">
                    {user?.role} {user?.project ? `• ${user.project}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="text-right">
                  <p className="text-sm opacity-90">Username</p>
                  <p className="font-medium">{user?.username}</p>
                </div>
              </div>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Profile Information</span>
                <span className="inline sm:hidden">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <FileEdit className="h-4 w-4" />
                <span className="hidden sm:inline">Security Settings</span>
                <span className="inline sm:hidden">Security</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Profile History</span>
                <span className="inline sm:hidden">History</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={profileForm.control}
                          name="project"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input placeholder="Project name" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input placeholder="Developer" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input placeholder="New York" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="border-t border-gray-200 pt-6">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500">
                            Email: <span className="font-medium text-gray-900">{user?.email}</span>
                          </p>
                          <Button 
                            type="submit" 
                            disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}
                          >
                            {updateProfileMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your password and account security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="border-t border-gray-200 pt-6">
                        <ul className="text-sm text-gray-600 space-y-1 mb-6">
                          <li className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-gray-300 mr-2"></div>
                            Password must be at least 8 characters
                          </li>
                          <li className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-gray-300 mr-2"></div>
                            Include at least one uppercase letter
                          </li>
                          <li className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-gray-300 mr-2"></div>
                            Include at least one lowercase letter
                          </li>
                          <li className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-gray-300 mr-2"></div>
                            Include at least one number
                          </li>
                        </ul>
                        
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={changePasswordMutation.isPending || !passwordForm.formState.isDirty}
                          >
                            {changePasswordMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Change Password
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Profile History</CardTitle>
                  <CardDescription>
                    View the history of changes to your profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingHistory ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : profileHistory && profileHistory.length > 0 ? (
                    <div className="space-y-6">
                      {profileHistory.map(entry => (
                        <div key={entry.id} className="border-b border-gray-200 pb-4 last:border-0">
                          <div className="flex items-start">
                            <div className="bg-indigo-100 rounded-full p-2 mr-3">
                              <FileEdit className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <div className="flex items-center">
                                <p className="font-medium text-gray-900 mr-2">
                                  Updated {entry.field}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(entry.updatedAt), "MMM dd, yyyy 'at' h:mm a")}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-500 mr-1">From:</span>
                                  <span className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                                    {entry.oldValue || '(empty)'}
                                  </span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hidden sm:block" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-500 mr-1">To:</span>
                                  <span className="text-sm bg-green-100 px-2 py-0.5 rounded text-green-800">
                                    {entry.newValue}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No profile changes yet</h3>
                      <p className="text-sm text-gray-500">
                        Your profile change history will appear here once you make updates
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <footer className="bg-white border-t border-gray-200 mt-8">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex justify-center md:justify-start">
                <span className="text-sm text-gray-500">&copy; 2023 SkillMetrics. All rights reserved.</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
