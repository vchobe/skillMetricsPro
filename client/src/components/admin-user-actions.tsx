import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
    <Card className="mb-8 border border-gray-200 transition-all duration-300 hover:border-gray-300">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger className="w-full cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-red-600 flex items-center">
              <Trash className="mr-2 h-5 w-5" />
              Delete User
              <span className="ml-2.5 flex h-5 items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                Danger Zone
              </span>
            </CardTitle>
            <div className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100 transition-colors">
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent className="transition-all ease-in-out duration-300">
          <CardContent className="pt-0 pb-4">
            <div className="p-4 bg-red-50 rounded-md mb-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-800">
                This action permanently removes the user and all associated data from the system. This operation cannot be undone.
              </p>
            </div>
            <div className="space-y-3">
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
            </div>
          </CardContent>
          <CardFooter className="border-t border-gray-100 pt-4 pb-4">
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
          </CardFooter>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}