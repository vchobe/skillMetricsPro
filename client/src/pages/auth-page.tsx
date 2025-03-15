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
import { motion } from "framer-motion";

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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-4xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left side - Auth forms */}
            <motion.div 
              className="w-full md:w-1/2 p-8"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="mb-6 text-center">
                <motion.h2 
                  className="text-3xl font-extrabold text-gray-900"
                  key={isForgotPassword ? "forgot" : activeTab}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isForgotPassword ? "Reset Your Password" : activeTab === "login" ? "Sign in to your account" : "Create a new account"}
                </motion.h2>
                <motion.p 
                  className="mt-2 text-sm text-gray-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {isForgotPassword ? "Enter your email to receive password reset instructions" : activeTab === "login" ? "Enter your credentials to access your dashboard" : "Fill out the form to join our platform"}
                </motion.p>
              </div>

              {!isForgotPassword ? (
                <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
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
                          
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
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
                          </motion.div>
                        </form>
                      </Form>
                    </motion.div>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    {registrationSuccess ? (
                      <motion.div 
                        className="space-y-4 p-4 border border-green-200 rounded-md bg-green-50"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
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
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              onClick={() => setActiveTab("login")} 
                              className="w-full"
                            >
                              Go to Login
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
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
                            
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                            </motion.div>
                          </form>
                        </Form>
                      </motion.div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
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
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                        </motion.div>
                        
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsForgotPassword(false)}
                            className="w-full"
                          >
                            Back to Login
                          </Button>
                        </motion.div>
                      </div>
                    </form>
                  </Form>
                </motion.div>
              )}
            </motion.div>
            
            {/* Right side - Hero content */}
            <motion.div 
              className="w-full md:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white flex flex-col justify-center items-center"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="text-center">
                <motion.h1 
                  className="text-4xl font-bold mb-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-transparent bg-clip-text"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  Atyeti Skill Metrics
                </motion.h1>
                <motion.p 
                  className="text-xl mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  Track, manage, and showcase your professional skills
                </motion.p>
                <ul className="text-left space-y-2 mb-8">
                  {[
                    "Document your skills and certifications",
                    "Track your progress over time",
                    "Visualize your growth and expertise",
                    "Share achievements with your team"
                  ].map((text, index) => (
                    <motion.li 
                      key={index}
                      className="flex items-center"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      {text}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
