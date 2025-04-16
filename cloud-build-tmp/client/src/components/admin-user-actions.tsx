import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Trash, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle 
} from "lucide-react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";

export default function AdminUserActions() {
  const [email, setEmail] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const deleteUserMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("DELETE", "/api/admin/users/delete-by-email", { email });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User deleted successfully",
        description: `User ${email} has been removed from the system.`,
        variant: "default",
      });
      setEmail("");
      setIsConfirming(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
      setIsConfirming(false);
    },
  });

  const handleDelete = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter the email address of the user to delete",
        variant: "destructive",
      });
      return;
    }

    deleteUserMutation.mutate(email);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="mb-8 border border-gray-200 transition-all duration-300 hover:border-gray-300 overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          <CollapsibleTrigger className="w-full cursor-pointer">
            <motion.div whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-red-600 flex items-center">
                  <Trash className="mr-2 h-5 w-5" />
                  Delete User
                  <motion.span 
                    className="ml-2.5 flex h-5 items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    Danger Zone
                  </motion.span>
                </CardTitle>
                <motion.div 
                  className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isOpen ? 
                    <ChevronUp className="h-5 w-5" /> : 
                    <ChevronDown className="h-5 w-5" />
                  }
                </motion.div>
              </CardHeader>
            </motion.div>
          </CollapsibleTrigger>
          <AnimatePresence>
            {isOpen && (
              <CollapsibleContent className="transition-all ease-in-out duration-300">
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="pt-0 pb-4">
                    <motion.div 
                      className="p-4 bg-red-50 rounded-md mb-4 flex items-start"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-sm text-red-800">
                        This action permanently removes the user and all associated data from the system. This operation cannot be undone.
                      </p>
                    </motion.div>
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      <Label htmlFor="email" className="text-sm font-medium">
                        User Email Address
                      </Label>
                      <Input 
                        id="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="Enter user email to delete"
                        disabled={deleteUserMutation.isPending}
                        className="focus-visible:ring-red-500"
                      />
                    </motion.div>
                  </CardContent>
                  <CardFooter className="border-t border-gray-100 pt-4 pb-4">
                    <motion.div 
                      className="w-full"
                      whileHover={deleteUserMutation.isPending ? {} : { scale: 1.02 }}
                      whileTap={deleteUserMutation.isPending ? {} : { scale: 0.98 }}
                    >
                      <Button 
                        variant="destructive" 
                        onClick={handleDelete}
                        disabled={deleteUserMutation.isPending}
                        className="w-full transition-all duration-300"
                      >
                        {deleteUserMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting User...
                          </>
                        ) : isConfirming ? (
                          <>
                            <Trash className="mr-2 h-4 w-4" />
                            Confirm Permanent Deletion
                          </>
                        ) : (
                          <>
                            <Trash className="mr-2 h-4 w-4" />
                            Delete User
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </CardFooter>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Collapsible>
      </Card>
    </motion.div>
  );
}