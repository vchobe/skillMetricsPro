import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Notification } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function NotificationDropdown() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: ({ signal }) => 
      fetch("/api/notifications", { signal })
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch notifications");
          return res.json();
        }),
    enabled: !!user,
  });
  
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  
  // Mark a single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("POST", `/api/notifications/${notificationId}/read`);
      // Handle 204 No Content responses appropriately
      return res.status === 204 ? {} : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/read-all");
      // Handle 204 No Content responses appropriately
      return res.status === 204 ? {} : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mark notification as read when clicked
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    setOpen(false);
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsReadMutation.mutate();
  };
  
  // Notification polling
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      }
    }, 60000); // Poll every minute
    
    return () => clearInterval(interval);
  }, [queryClient, user]);

  if (!user) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center p-0"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <DropdownMenuItem key={i} className="py-2 flex flex-col items-start gap-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </DropdownMenuItem>
            ))
          ) : notifications?.length ? (
            notifications.map((notification) => {
              let href = "/";
              
              // Determine link based on notification type
              if (notification.type === "endorsement" && notification.relatedSkillId) {
                href = `/skills/${notification.relatedSkillId}`;
              } else if (notification.type === "level_up" && notification.relatedSkillId) {
                href = `/skills/${notification.relatedSkillId}`;
              }
              
              return (
                <Link key={notification.id} href={href} onClick={() => handleNotificationClick(notification)}>
                  <DropdownMenuItem 
                    className={`cursor-pointer py-2 ${!notification.isRead ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="font-medium">{notification.content}</div>
                      <div className="text-xs text-muted-foreground flex justify-between w-full">
                        <span>
                          {notification.createdAt 
                            ? (() => {
                                try {
                                  const date = new Date(notification.createdAt);
                                  // Verify the date is valid before formatting
                                  return !isNaN(date.getTime())
                                    ? formatDistanceToNow(date, { addSuffix: true })
                                    : "Recently";
                                } catch (error) {
                                  console.error("Invalid date format:", error);
                                  return "Recently";
                                }
                              })()
                            : "Recently"
                          }
                        </span>
                        {!notification.isRead && <span className="text-primary">New</span>}
                      </div>
                    </div>
                  </DropdownMenuItem>
                </Link>
              );
            })
          ) : (
            <DropdownMenuItem disabled className="text-center py-4">
              No notifications
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}