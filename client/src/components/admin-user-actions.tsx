import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash } from "lucide-react";

export default function AdminUserActions() {
  const [email, setEmail] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
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
        variant: "success",
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
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-red-600 flex items-center">
          <Trash className="mr-2 h-5 w-5" />
          Delete User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="email">User Email</Label>
          <Input 
            id="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="Enter user email to delete"
            disabled={deleteUserMutation.isPending}
          />
          <p className="text-sm text-gray-500">
            Warning: This action cannot be undone. All user data, skills, and progress will be permanently deleted.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="destructive" 
          onClick={handleDelete}
          disabled={deleteUserMutation.isPending}
          className="w-full"
        >
          {deleteUserMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : isConfirming ? (
            "Confirm Deletion"
          ) : (
            "Delete User"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}