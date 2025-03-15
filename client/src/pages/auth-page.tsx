import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema, loginUserSchema, registerSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
// Import the logo directly as a module
import atyetiLogo from "../assets/Atyeti_logo.png";

const loginSchema = loginUserSchema;
// Using the imported registerSchema

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [location, setLocation] = useLocation();
  const { user, loginMutation, registerMutation, resetPasswordMutation, isLoading } = useAuth();
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
    },
  });
  
  const forgotPasswordForm = useForm<{ email: string }>({
    defaultValues: {
      email: "",
    },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    // No need to modify values - we're using the actual password now
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    // Just pass the email, the server will generate a password and send it to the email
    setRegisteredEmail(values.email);
    registerMutation.mutate(values, {
      onSuccess: () => {
        setRegistrationSuccess(true);
        registerForm.reset();
      }
    });
  };
  
  const onForgotPasswordSubmit = (values: { email: string }) => {
    resetPasswordMutation.mutate(values);
  };
  
  // Reset registration success state when changing tabs
  useEffect(() => {
    setRegistrationSuccess(false);
  }, [activeTab]);
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-4xl">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Auth forms */}
          <div className="w-full md:w-1/2 p-8">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">
                {isForgotPassword ? "Reset Your Password" : activeTab === "login" ? "Sign in to your account" : "Create a new account"}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {isForgotPassword ? "Enter your email to receive password reset instructions" : activeTab === "login" ? "Enter your credentials to access your dashboard" : "Fill out the form to join our platform"}
              </p>
            </div>

            {!isForgotPassword ? (
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-sm"
                        >
                          Forgot your password?
                        </Button>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Sign in
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register">
                  {registrationSuccess ? (
                    <div className="space-y-4 p-4 border border-green-200 rounded-md bg-green-50">
                      <div className="flex items-center text-green-700 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <h3 className="text-lg font-semibold">Registration Successful!</h3>
                      </div>
                      <p className="text-gray-700">
                        An email has been sent to <span className="font-medium">{registeredEmail}</span> with your login credentials.
                      </p>
                      <p className="text-gray-700">
                        Please check your inbox (and spam folder) for an email from the Employee Skill Metrics Team.
                      </p>
                      <div className="mt-4">
                        <Button 
                          onClick={() => setActiveTab("login")} 
                          className="w-full"
                        >
                          Go to Login
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john.doe@atyeti.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="text-sm text-gray-600 mb-2">
                          A password will be generated and sent to your email address.
                          <br />
                          <span className="font-semibold">Note:</span> Only @atyeti.com email addresses are allowed.
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Register
                        </Button>
                      </form>
                    </Form>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex flex-col space-y-2">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={resetPasswordMutation.isPending}
                    >
                      {resetPasswordMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Reset Password
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsForgotPassword(false)}
                      className="w-full"
                    >
                      Back to Login
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
          
          {/* Right side - Hero content */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white flex flex-col justify-center items-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Employee Skill Metrics</h1>
              <div className="mb-6 rounded-full bg-white/10 p-4 inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <p className="text-xl mb-6">Track, manage, and showcase your professional skills</p>
              <ul className="text-left space-y-2 mb-8">
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Document your skills and certifications
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Track your progress over time
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Visualize your growth and expertise
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Share achievements with your team
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
